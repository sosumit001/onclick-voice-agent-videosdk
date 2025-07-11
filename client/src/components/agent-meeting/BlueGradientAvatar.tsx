import React, { useEffect, useState, useRef } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";

interface BlueGradientAvatarProps {
  participantId?: string;
  isConnected: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const BlueGradientAvatar: React.FC<BlueGradientAvatarProps> = ({
  participantId,
  isConnected,
  className = "",
  size = "lg",
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isActiveSpeaker, setIsActiveSpeaker] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  const participant = useParticipant(participantId || "");

  useEffect(() => {
    if (!participantId || !participant?.micStream) {
      setAudioLevel(0);
      setIsActiveSpeaker(false);
      return;
    }

    const stream = participant.micStream;
    const AudioContextClass =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      console.error("AudioContext is not supported in this browser.");
      return;
    }

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(
      new MediaStream([stream.track])
    );

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateAudioLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
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
      if (audioContext.state !== "closed") {
        audioContext.close();
      }
    };
  }, [participantId, participant?.micStream]);

  const sizeConfig = {
    sm: { container: "w-16 h-16" },
    md: { container: "w-24 h-24" },
    lg: { container: "w-40 h-40" },
    xl: { container: "w-48 h-48" },
  };

  const currentSize = sizeConfig[size];
  const waveIntensity = isActiveSpeaker ? audioLevel : 0;

  return (
    <div
      className={`relative flex items-center justify-center ${currentSize.container} ${className}`}
    >
      {/* Dynamic outer glow rings */}
      {[0.8, 1.2, 1.6].map((ring, index) => (
        <div
          key={ring}
          className="absolute rounded-full pointer-events-none transition-all duration-700 ease-out"
          style={{
            inset: `-${ring * 8}px`,
            opacity: isActiveSpeaker ? 0.4 - index * 0.1 : 0.1,
            background: `conic-gradient(from ${index * 120}deg,
              rgba(66, 147, 204, 0.3) 0%,
              rgba(135, 185, 230, 0.2) 25%,
              rgba(255, 255, 255, 0.1) 50%,
              rgba(135, 185, 230, 0.2) 75%,
              rgba(66, 147, 204, 0.3) 100%)`,
            borderRadius: "50%",
            filter: "blur(4px)",
            transform: `scale(${1 + waveIntensity * 0.1}) rotate(${
              isActiveSpeaker ? "var(--rotation)" : "0deg"
            })`,
            animation: isActiveSpeaker
              ? `spin ${3 + index}s linear infinite`
              : "none",
          }}
        />
      ))}

      {/* Enhanced breathing rings when speaking */}
      {isActiveSpeaker &&
        [0.5, 1, 1.5].map((ring) => (
          <div
            key={ring}
            className="absolute rounded-full border border-white/40 animate-ping pointer-events-none"
            style={{
              inset: `-${ring * 3}px`,
              animationDelay: `${ring * 0.2}s`,
              animationDuration: "2s",
              opacity: 0.6 - ring * 0.15,
              boxShadow: `0 0 ${ring * 6}px rgba(255, 255, 255, 0.3), 
                         inset 0 0 ${ring * 4}px rgba(66, 147, 204, 0.2)`,
            }}
          />
        ))}

      {/* Main orb with sophisticated gradients */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden transform-gpu transition-all duration-500 ease-out"
        style={{
          background: isActiveSpeaker
            ? `radial-gradient(circle at center,
                rgba(135, 185, 230, 0.9) 0%,
                rgba(66, 147, 204, 0.95) 30%,
                rgba(30, 100, 160, 0.98) 70%,
                rgba(15, 50, 100, 1) 100%)`
            : `radial-gradient(circle at center,
                rgba(135, 185, 230, 0.9) 0%,
                rgba(66, 147, 204, 0.95) 40%,
                rgba(40, 120, 180, 1) 75%,
                rgba(20, 70, 130, 1) 100%)`,
          boxShadow: isActiveSpeaker
            ? `
              0 0 ${60 + waveIntensity * 40}px 8px rgba(66, 147, 204, 0.4),
              0 0 ${30 + waveIntensity * 20}px 4px rgba(255, 255, 255, 0.6),
              0 0 ${80 + waveIntensity * 60}px 12px rgba(135, 185, 230, 0.2),
              inset 0 4px 16px rgba(255, 255, 255, 0.4),
              inset 0 -4px 16px rgba(0, 0, 0, 0.1),
              inset 0 0 6px 3px rgba(255, 255, 255, 0.3)
            `
            : `
              0 0 40px 6px rgba(66, 147, 204, 0.3),
              0 0 20px 2px rgba(135, 185, 230, 0.2),
              inset 0 3px 12px rgba(255, 255, 255, 0.3),
              inset 0 -3px 12px rgba(0, 0, 0, 0.1),
              inset 0 0 4px 2px rgba(220, 240, 255, 0.4)
            `,
          transform: `scale(${1 + waveIntensity * 0.03})`,
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Animated texture overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none opacity-30"
          style={{
            background: `conic-gradient(from 0deg,
              transparent 0%,
              rgba(255, 255, 255, 0.1) 15%,
              transparent 30%,
              rgba(255, 255, 255, 0.05) 45%,
              transparent 60%,
              rgba(255, 255, 255, 0.1) 75%,
              transparent 90%,
              rgba(255, 255, 255, 0.1) 100%)`,
            animation: isActiveSpeaker
              ? "spin 8s linear infinite"
              : "spin 20s linear infinite",
          }}
        />
      </div>
    </div>
  );
};
