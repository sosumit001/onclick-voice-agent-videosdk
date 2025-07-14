import React, { useEffect, useState, useRef } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";

interface AnimatedFluidAvatarProps {
  participantId?: string;
  isConnected: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const AnimatedFluidAvatar: React.FC<AnimatedFluidAvatarProps> = ({
  participantId,
  isConnected,
  className = "",
  size = "xl",
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isActiveSpeaker, setIsActiveSpeaker] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Always call useParticipant to avoid hook order violations
  const participant = useParticipant(participantId || "");

  // Size mapping for the avatar
  const sizeMap = {
    sm: 80,
    md: 120,
    lg: 160,
    xl: 200,
  };

  const avatarSize = sizeMap[size];

  useEffect(() => {
    // Only proceed if we have a valid participant and participantId
    if (!participantId || !participant?.micStream) {
      setAudioLevel(0);
      setIsActiveSpeaker(false);
      return;
    }

    const stream = new MediaStream([participant.micStream.track]);
    const AudioContextClass =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      console.warn("AudioContext not supported");
      return;
    }

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

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
      audioContext.close();
    };
  }, [participantId, participant?.micStream]);

  const waveIntensity = isActiveSpeaker ? audioLevel * 100 : 0;
  const scale = 1 + audioLevel * 0.3;

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: `${avatarSize}px`,
        height: `${avatarSize}px`,
      }}
    >
      {/* Outer animated rings */}
      {[1, 2, 3, 4].map((ring) => (
        <div
          key={ring}
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `conic-gradient(from ${ring * 45}deg, 
              rgba(66, 147, 204, 0.3), 
              rgba(147, 220, 236, 0.5), 
              rgba(66, 147, 204, 0.3))`,
            transform: `scale(${0.7 + ring * 0.1 + waveIntensity * 0.002})`,
            opacity: isActiveSpeaker ? 0.8 - ring * 0.15 : 0.4 - ring * 0.1,
            transition: "transform 0.1s ease-out, opacity 0.2s ease-out",
            animationDelay: `${ring * 0.3}s`,
            animationDuration: `${2 + ring * 0.5}s`,
            filter: `blur(${ring}px)`,
          }}
        />
      ))}

      {/* Middle glow layer */}
      <div
        className="absolute inset-4 rounded-full"
        style={{
          background: `radial-gradient(circle, 
            rgba(147, 220, 236, ${isActiveSpeaker ? 0.8 : 0.5}) 0%, 
            rgba(66, 147, 204, ${isActiveSpeaker ? 0.6 : 0.3}) 50%, 
            transparent 100%)`,
          transform: `scale(${scale})`,
          transition: "transform 0.1s ease-out",
          filter: "blur(2px)",
        }}
      />

      {/* Main fluid orb */}
      <div
        className="absolute inset-6 rounded-full overflow-hidden"
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Animated gradient background */}
        <div
          className="w-full h-full rounded-full animate-spin"
          style={{
            background: `conic-gradient(from 0deg, 
              #4293CC, 
              #93DCEC, 
              #5AA8E6, 
              #7FD4E6, 
              #4293CC)`,
            animationDuration: `${isActiveSpeaker ? 3 : 8}s`,
            opacity: isActiveSpeaker ? 1 : 0.8,
          }}
        />

        {/* Fluid overlay */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(ellipse at ${
              50 + Math.sin(Date.now() * 0.001) * 20
            }% ${50 + Math.cos(Date.now() * 0.001) * 20}%, 
              rgba(147, 220, 236, 0.6) 0%, 
              rgba(66, 147, 204, 0.4) 50%, 
              transparent 80%)`,
            animationDuration: `${isActiveSpeaker ? 1 : 2}s`,
          }}
        />
      </div>

      {/* Inner core */}
      <div
        className="absolute inset-8 rounded-full"
        style={{
          background: `linear-gradient(135deg, 
            rgba(147, 220, 236, ${isActiveSpeaker ? 1 : 0.9}) 0%, 
            rgba(66, 147, 204, ${isActiveSpeaker ? 0.9 : 0.7}) 100%)`,
          boxShadow: isActiveSpeaker
            ? `0 0 ${30 + waveIntensity * 2}px rgba(147, 220, 236, 0.8), 
               inset 0 0 ${20 + waveIntensity}px rgba(255, 255, 255, 0.3)`
            : "0 0 15px rgba(147, 220, 236, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.2)",
          transform: `scale(${scale})`,
          transition: "transform 0.1s ease-out, box-shadow 0.2s ease-out",
        }}
      />

      {/* Sparkle effects for active speaking */}
      {isActiveSpeaker && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-ping"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s",
                opacity: 0.6,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};
