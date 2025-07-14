import React, { useEffect, useState, useRef } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";

interface ThreeJSAvatarProps {
  participantId?: string;
  isConnected: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

// CSS-based fluid avatar that mimics the Three.js shader animation
export const ThreeJSAvatar: React.FC<ThreeJSAvatarProps> = ({
  participantId,
  isConnected,
  className = "",
  size = "xl",
}) => {
  // State to hold the Web Audio API's AnalyserNode.
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [hasAgentJoined, setHasAgentJoined] = useState(false);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Always call useParticipant to avoid hook order violations
  const participant = useParticipant(participantId || "");

  // Size mapping for the avatar
  const sizeMap = {
    sm: { width: 80, height: 80 },
    md: { width: 120, height: 120 },
    lg: { width: 160, height: 160 },
    xl: { width: 200, height: 200 },
  };

  const avatarSize = sizeMap[size];

  // Check if agent has actually joined
  useEffect(() => {
    if (participantId && participant?.micStream) {
      setHasAgentJoined(true);
    } else {
      setHasAgentJoined(false);
    }
  }, [participantId, participant?.micStream]);

  // This function initializes the audio context and gets AI agent audio input.
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Only proceed if we have a valid participant and participantId AND the agent is connected
        if (
          !participantId ||
          !participant?.micStream ||
          !isConnected ||
          !hasAgentJoined
        ) {
          setAnalyser(null);
          setAudioLevel(0);
          setIsAgentSpeaking(false);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          return;
        }

        // Use the AI agent's audio stream instead of microphone
        const stream = new MediaStream([participant.micStream.track]);
        const context = new (window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext)();

        audioContextRef.current = context;
        const source = context.createMediaStreamSource(stream);
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;
        source.connect(analyserNode);
        setAnalyser(analyserNode);

        // Audio analysis loop
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        const updateAudioLevel = () => {
          if (analyserNode && isConnected && hasAgentJoined) {
            analyserNode.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            const normalizedLevel = average / 255;
            setAudioLevel(normalizedLevel);
            setIsAgentSpeaking(normalizedLevel > 0.02); // Lower threshold for AI voice detection
          }
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      } catch (err) {
        console.error("Error accessing AI agent audio:", err);
        setAnalyser(null);
        setAudioLevel(0);
        setIsAgentSpeaking(false);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [participantId, participant?.micStream, isConnected, hasAgentJoined]);

  // Calculate scale based on audio (same formula as Three.js version)
  const scale =
    isConnected && hasAgentJoined && isAgentSpeaking ? 1 + audioLevel * 0.5 : 1;

  // Determine the actual state for visual rendering
  const isAgentConnected = isConnected && hasAgentJoined;

  // Different animation speeds based on connection status - but always blue
  const animationSpeed = isAgentConnected ? (isAgentSpeaking ? 4 : 8) : 12;
  const rotationSpeed = isAgentConnected ? (isAgentSpeaking ? 15 : 25) : 35;

  return (
    <div
      className={className}
      style={{
        width: `${avatarSize.width}px`,
        height: `${avatarSize.height}px`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Main fluid orb with CSS animations that mimic the GLSL shader */}
      <div
        className="fluid-orb"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          position: "relative",
          transform: `scale(${scale})`,
          transition: "transform 0.1s ease-out",
          // Always show blue colors - never grey
          background: `
            radial-gradient(ellipse at 30% 20%, #5AC2EE 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, #21418E 0%, transparent 50%),
            radial-gradient(ellipse at 60% 40%, #5AC2EE 0%, transparent 40%),
            radial-gradient(ellipse at 20% 70%, #21418E 0%, transparent 50%),
            linear-gradient(45deg, #21418E, #5AC2EE)
          `,
          backgroundSize:
            "120% 120%, 130% 130%, 110% 110%, 140% 140%, 100% 100%",
          animation: `fluidMotion ${animationSpeed}s ease-in-out infinite, rotate ${rotationSpeed}s linear infinite`,
          filter: isAgentConnected
            ? isAgentSpeaking
              ? "blur(1px) brightness(1.3) contrast(1.4)"
              : "blur(1px) brightness(1.1) contrast(1.2)"
            : "blur(1px) brightness(0.9) contrast(1.0)", // Slightly dimmed but still blue when not connected
          boxShadow: isAgentConnected
            ? `
            0 0 ${
              isAgentSpeaking ? 30 + audioLevel * 20 : 20
            }px rgba(33, 65, 142, ${isAgentSpeaking ? 0.5 : 0.3}),
            0 0 ${
              isAgentSpeaking ? 60 + audioLevel * 30 : 40
            }px rgba(90, 194, 238, ${isAgentSpeaking ? 0.4 : 0.2}),
            inset 0 0 30px rgba(90, 194, 238, ${isAgentSpeaking ? 0.2 : 0.1})
          `
            : `
            0 0 15px rgba(33, 65, 142, 0.4),
            0 0 30px rgba(90, 194, 238, 0.3),
            inset 0 0 20px rgba(90, 194, 238, 0.1)
          `,
        }}
      >
        {/* Animated noise overlay layers - always show, just vary intensity */}
        <div
          className="noise-layer-1"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `
              radial-gradient(ellipse at 40% 30%, rgba(90, 194, 238, ${
                isAgentConnected ? (isAgentSpeaking ? 0.6 : 0.4) : 0.3
              }) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 60%, rgba(33, 65, 142, ${
                isAgentConnected ? (isAgentSpeaking ? 0.5 : 0.3) : 0.2
              }) 0%, transparent 50%)
            `,
            animation: `noiseMotion1 ${
              animationSpeed * 0.75
            }s ease-in-out infinite reverse`,
            opacity: isAgentConnected ? (isAgentSpeaking ? 0.9 : 0.6) : 0.4,
          }}
        />

        <div
          className="noise-layer-2"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `
              radial-gradient(ellipse at 60% 70%, rgba(90, 194, 238, ${
                isAgentConnected ? (isAgentSpeaking ? 0.5 : 0.3) : 0.2
              }) 0%, transparent 40%),
              radial-gradient(ellipse at 20% 30%, rgba(33, 65, 142, ${
                isAgentConnected ? (isAgentSpeaking ? 0.6 : 0.4) : 0.3
              }) 0%, transparent 60%)
            `,
            animation: `noiseMotion2 ${
              animationSpeed * 0.5
            }s ease-in-out infinite`,
            opacity: isAgentConnected ? (isAgentSpeaking ? 0.8 : 0.4) : 0.3,
          }}
        />

        {/* Bloom effect overlay - always show */}
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(90, 194, 238, ${
              isAgentConnected ? (isAgentSpeaking ? 0.4 : 0.2) : 0.15
            }) 0%, transparent 70%)`,
            filter: "blur(8px)",
            animation: `bloom ${
              isAgentConnected ? (isAgentSpeaking ? 2 : 4) : 6
            }s ease-in-out infinite alternate`,
          }}
        />
      </div>

      {/* CSS Keyframes for animations */}
      <style>{`
        @keyframes fluidMotion {
          0%, 100% {
            background-position: 0% 50%, 100% 50%, 50% 0%, 50% 100%, 0% 0%;
          }
          25% {
            background-position: 30% 20%, 70% 80%, 80% 30%, 20% 70%, 25% 25%;
          }
          50% {
            background-position: 60% 40%, 40% 60%, 20% 70%, 80% 30%, 50% 50%;
          }
          75% {
            background-position: 80% 70%, 20% 30%, 60% 90%, 40% 10%, 75% 75%;
          }
        }

        @keyframes noiseMotion1 {
          0%, 100% {
            background-position: 0% 0%, 100% 100%;
          }
          33% {
            background-position: 50% 30%, 20% 80%;
          }
          66% {
            background-position: 80% 60%, 70% 20%;
          }
        }

        @keyframes noiseMotion2 {
          0%, 100% {
            background-position: 100% 0%, 0% 100%;
          }
          50% {
            background-position: 30% 70%, 90% 30%;
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bloom {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          100% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        .fluid-orb {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
