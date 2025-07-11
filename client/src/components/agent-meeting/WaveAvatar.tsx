
import React, { useEffect, useState, useRef } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";

interface WaveAvatarProps {
  participantId?: string;
  isConnected: boolean;
  className?: string;
}

export const WaveAvatar: React.FC<WaveAvatarProps> = ({
  participantId,
  isConnected,
  className = "",
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isActiveSpeaker, setIsActiveSpeaker] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Always call useParticipant to avoid hook order violations
  const participant = useParticipant(participantId || "");

  useEffect(() => {
    // Only proceed if we have a valid participant and participantId
    if (!participantId || !participant?.micStream) {
      setAudioLevel(0);
      setIsActiveSpeaker(false);
      return;
    }

    const stream = participant.micStream;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(new MediaStream([stream.track]));
    
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateAudioLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        
        setAudioLevel(normalizedLevel);
        setIsActiveSpeaker(normalizedLevel > 0.1);
      }
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [participantId, participant?.micStream]);

  const waveIntensity = isActiveSpeaker ? audioLevel * 100 : 0;

  return (
    <div className={`relative w-32 h-32 ${className}`}>
      {/* Animated wave rings - constrained to avatar size */}
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          className="absolute inset-2 rounded-full border-[3px] border-white animate-ping pointer-events-none"
          style={{
            backgroundColor: '#93DCEC',
            animationDelay: `${ring * 0.5}s`,
            animationDuration: "2s",
            transform: `scale(${0.8 + (waveIntensity * 0.005 * ring)})`,
            opacity: isActiveSpeaker ? 0.6 - (ring * 0.15) : 0.2,
            transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
          }}
        />
      ))}
      
      {/* Pulsing glow effect - constrained to avatar size */}
      <div
        className="absolute inset-1 rounded-full blur-md pointer-events-none"
        style={{
          background: `linear-gradient(to bottom right, #93DCEC40, #6BB6FF40)`,
          transform: `scale(${1 + (waveIntensity * 0.01)})`,
          opacity: isActiveSpeaker ? 0.8 : 0.3,
          transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
        }}
      />

      {/* Main avatar */}
      <div
        className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 border-[3px] border-white ${
          isConnected
            ? ""
            : ""
        }`}
        style={{
          background: `linear-gradient(to bottom right, #93DCEC, #6BB6FF)`,
          transform: `scale(${1 + (waveIntensity * 0.002)})`,
          transition: "transform 0.1s ease-out",
        }}
      >
        <div
          className={`w-28 h-28 rounded-full transition-all duration-300`}
          style={{
            background: `linear-gradient(to bottom right, #7FD4E6, #5AA8E6)`,
            boxShadow: isActiveSpeaker 
              ? `0 0 ${20 + waveIntensity * 2}px #93DCEC99` 
              : "0 0 10px #93DCEC66",
            transition: "box-shadow 0.1s ease-out",
          }}
        />
      </div>
    </div>
  );
};
