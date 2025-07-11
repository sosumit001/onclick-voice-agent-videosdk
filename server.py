from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from videosdk.agents import Agent, AgentSession, CascadingPipeline, RealTimePipeline, MCPServerHTTP, function_tool, ConversationFlow, ChatRole
from videosdk.plugins.openai import OpenAIRealtime, OpenAIRealtimeConfig, OpenAILLM, OpenAISTT, OpenAITTS
from openai.types.beta.realtime.session import TurnDetection
from videosdk.plugins.google import GeminiRealtime, GeminiLiveConfig, GoogleTTS,GoogleLLM, GoogleSTT
from videosdk.plugins.aws import NovaSonicRealtime, NovaSonicConfig
from videosdk.plugins.sarvamai import SarvamAITTS, SarvamAILLM,SarvamAISTT
from videosdk.plugins.elevenlabs import ElevenLabsTTS
from videosdk.plugins.deepgram import DeepgramSTT
from videosdk.plugins.silero import SileroVAD
from videosdk.plugins.turn_detector import TurnDetector, pre_download_model
import os
import uvicorn
from dotenv import load_dotenv
import asyncio
from typing import Dict, Optional, AsyncIterator
import traceback
import json 

load_dotenv()
pre_download_model()

port = int(os.getenv("PORT", 8000))
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# We'll map meeting_id to a dictionary containing the session and a cancel event
active_sessions: Dict[str, Dict[str, any]] = {}

# MODIFIED MyVoiceAgent class
class MyVoiceAgent(Agent):
    def __init__(self, system_prompt: str, personality: str, mcp_url: Optional[str] = None):
        init_kwargs = {
            "instructions": system_prompt
        }
        
        # --- NEW, MORE EXPLICIT LOGGING ---
        # Conditionally add mcp_servers if a URL is provided
        if mcp_url:
            print(f"[AGENT] MCP URL provided. Initializing MCPServerHTTP with URL: {mcp_url}")
            init_kwargs["mcp_servers"] = [
                MCPServerHTTP(
                    url=mcp_url,
                    client_session_timeout_seconds=30
                )
            ]
        else:
            print("[AGENT] No MCP URL provided. Skipping MCP server initialization.")
        # --- END OF NEW LOGGING ---

        super().__init__(**init_kwargs)
        self.personality = personality
        print(f"[AGENT] Initialized with personality: {personality}")

    async def on_enter(self) -> None:
        await self.session.say(f"Hey, How can I help you today?")

    async def on_exit(self) -> None:
        await self.session.say("Goodbye!")

    @function_tool
    async def end_call(self) -> None:
        """End the call upon request by the user"""
        print("[AGENT] end_call function triggered.")
        
        # IMPORTANT: Add a defensive check here.
        # If the session is already being torn down, self.session might be None.
        if self.session:
            print("[AGENT] Session is valid. Proceeding to say goodbye and leave.")
            await self.session.say("Goodbye!")
            await asyncio.sleep(1)
            await self.session.leave()
        else:
            # If the session is already gone, just log it and do nothing.
            print("[AGENT] end_call invoked on an already terminated session. Ignoring.")

class MyConversationFlow(ConversationFlow):
    def __init__(self, agent, stt=None, llm=None, tts=None):
        super().__init__(agent, stt, llm, tts)
        print("[FLOW] ConversationFlow initialized")

    async def run(self, transcript: str) -> AsyncIterator[str]:
        await self.on_turn_start(transcript)
        processed_transcript = transcript.lower().strip()
        self.agent.chat_context.add_message(role=ChatRole.USER, content=processed_transcript)
        async for response_chunk in self.process_with_llm():
            yield response_chunk
        await self.on_turn_end()

    async def on_turn_start(self, transcript: str) -> None:
        self.is_turn_active = True

    async def on_turn_end(self) -> None:
        self.is_turn_active = False

class MeetingReqConfig(BaseModel):
    meeting_id: str
    token: str
    pipeline_type: str
    stt: Optional[str] = None
    tts: Optional[str] = None
    llm: Optional[str] = None
    personality: str
    system_prompt: str
    detection: Optional[bool] = True  
    mcp_url: Optional[str] = None


def get_pipeline(req: MeetingReqConfig):
    print(f"[PIPELINE] Creating {req.pipeline_type} pipeline")

    if req.pipeline_type == "openai":
        print("[PIPELINE] Using OpenAI Realtime")
        model = OpenAIRealtime(model="gpt-4o-realtime-preview", config=OpenAIRealtimeConfig(modalities=["text", "audio"], turn_detection=TurnDetection(type="server_vad", threshold=0.5, prefix_padding_ms=300, silence_duration_ms=200), tool_choice="auto"))
        return RealTimePipeline(model=model)
    elif req.pipeline_type == "google":
        print("[PIPELINE] Using Google Gemini Realtime")
        model = GeminiRealtime(model="gemini-2.0-flash-live-001", config=GeminiLiveConfig(response_modalities=["AUDIO"]))
        return RealTimePipeline(model=model)
    elif req.pipeline_type == "aws":
        print("[PIPELINE] Using AWS Nova Sonic Realtime")
        model = NovaSonicRealtime(model="amazon.nova-sonic-v1:0", config=NovaSonicConfig(voice="tiffany", temperature=0.7, top_p=0.9, max_tokens=1024))
        return RealTimePipeline(model=model)
    elif req.pipeline_type == "cascading":
        print(f"[PIPELINE] Using Cascading pipeline with STT: {req.stt}, LLM: {req.llm}, TTS: {req.tts}")
        stt_map = {"deepgram": DeepgramSTT(api_key=os.getenv("DEEPGRAM_API_KEY")), "openai": OpenAISTT(api_key=os.getenv("OPENAI_API_KEY")), "google": GoogleSTT(model="latest_long"), "sarvam": SarvamAISTT(api_key=os.getenv("SARVAMAI_API_KEY"))}
        stt = stt_map.get(req.stt)
        if not stt: raise ValueError(f"Unknown STT provider: {req.stt}")
        print(f"[PIPELINE] STT configured: {req.stt}")
        llm_map = {"openai": OpenAILLM(api_key=os.getenv("OPENAI_API_KEY")), "google": GoogleLLM(api_key=os.getenv("GOOGLE_API_KEY")), "sarvam": SarvamAILLM(api_key=os.getenv("SARVAM_API_KEY"))}
        llm = llm_map.get(req.llm)
        if not llm: raise ValueError(f"Unknown LLM provider: {req.llm}")
        print(f"[PIPELINE] LLM configured: {req.llm}")
        tts_map = {"openai": OpenAITTS(api_key=os.getenv("OPENAI_API_KEY")), "elevenlabs": ElevenLabsTTS(api_key=os.getenv("ELEVENLABS_API_KEY")), "google": GoogleTTS(api_key=os.getenv("GOOGLE_API_KEY")), "sarvam": SarvamAITTS(api_key=os.getenv("SARVAMAI_API_KEY"))}
        tts = tts_map.get(req.tts)
        if not tts: raise ValueError(f"Unknown TTS provider: {req.tts}")
        print(f"[PIPELINE] TTS configured: {req.tts}")
        if req.detection:
            print("[PIPELINE] Adding VAD and Turn Detection")
            vad = SileroVAD()
            turn_detector = TurnDetector(threshold=0.8)
            return CascadingPipeline(stt=stt, llm=llm, tts=tts, vad=vad, turn_detector=turn_detector)
        else:
            print("[PIPELINE] No VAD/Turn Detection")
            return CascadingPipeline(stt=stt, llm=llm, tts=tts)
    else:
        raise ValueError(f"Unknown pipeline_type: {req.pipeline_type}")

class LeaveAgentReqConfig(BaseModel):
    meeting_id: str

async def server_operations(req: MeetingReqConfig):
    meeting_id = req.meeting_id
    print(f"[{meeting_id}] Initializing agent operations...")
    print(f"req body : {req}")
    
    # --- NEW, EXPLICIT LOGGING ---
    print(f"[{meeting_id}] Checking for MCP URL in request: '{req.mcp_url}'")
    # --- END OF NEW LOGGING ---

    cancel_event = asyncio.Event()

    try:
        print(f"[{meeting_id}] Creating agent...")
        agent = MyVoiceAgent(
            system_prompt=req.system_prompt,
            personality=req.personality,
            mcp_url=req.mcp_url
        )
        print(f"[{meeting_id}] Creating pipeline...")
        pipeline = get_pipeline(req)
        print(f"[{meeting_id}] Creating conversation flow...")
        conversation_flow = MyConversationFlow(agent)
        session = AgentSession(agent=agent, pipeline=pipeline, conversation_flow=conversation_flow, context={"meetingId": meeting_id, "name": "VideoSDK Agent"})
        active_sessions[meeting_id] = {"session": session, "cancel_event": cancel_event}
        print(f"[{meeting_id}] Agent session stored. Current active sessions: {list(active_sessions.keys())}")
        start_task = asyncio.create_task(session.start())
        cancel_task = asyncio.create_task(cancel_event.wait())
        done, pending = await asyncio.wait({start_task, cancel_task}, return_when=asyncio.FIRST_COMPLETED)
        if start_task in pending:
            start_task.cancel()
            print(f"[{meeting_id}] Startup cancelled by leave request.")
            return
        cancel_task.cancel()
        start_task.result() 
        print(f"[{meeting_id}] Agent session.start() completed normally.")
    except Exception as ex:
        print(f"[{meeting_id}] [ERROR] in agent session startup: {ex}")
        traceback.print_exc()
    finally:
        if active_sessions.pop(meeting_id, None):
             print(f"[{meeting_id}] Cleaned up session from active list.")
        print(f"[{meeting_id}] Server operations background task finished.")

@app.post("/join-agent")
async def join_agent(req: MeetingReqConfig, bg_tasks: BackgroundTasks):
    if req.meeting_id in active_sessions:
        print(f"Agent joining meeting {req.meeting_id} which might already have an active agent. A new one will be started.")
    bg_tasks.add_task(server_operations, req)
    return {"message": f"AI agent joining process initiated for meeting {req.meeting_id}"}

@app.post("/leave-agent")
async def leave_agent(req: LeaveAgentReqConfig):
    meeting_id = req.meeting_id
    print(f"[{meeting_id}] Received /leave-agent request.")
    session_info = active_sessions.pop(meeting_id, None)
    if session_info:
        session = session_info["session"]
        cancel_event = session_info["cancel_event"]
        print(f"[{meeting_id}] Found active session. Signaling for termination...")
        cancel_event.set()
        try:
            if (session.pipeline and hasattr(session.pipeline, 'room') and session.pipeline.room is not None):
                print(f"[{meeting_id}] Session is fully initialized. Instructing agent to leave...")
                await session.leave()
                print(f"[{meeting_id}] Agent successfully left the meeting.")
            else:
                print(f"[{meeting_id}] Session was not fully initialized. Cancellation signal sent; no explicit leave call needed.")
            return {"status": "success", "meeting_id": meeting_id, "message": f"Agent termination process initiated for meeting {meeting_id}."}
        except Exception as e:
            print(f"[{meeting_id}] [ERROR] An error occurred during the leave process: {e}")
            traceback.print_exc()
            return {"status": "error", "meeting_id": meeting_id, "message": f"An error occurred during agent leave process: {e}"}
    else:
        print(f"[{meeting_id}] No active session found for this meeting.")
        return {"status": "not_found", "meeting_id": meeting_id, "message": f"No active session found for meeting {meeting_id}."}