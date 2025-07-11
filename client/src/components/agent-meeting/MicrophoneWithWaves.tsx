
import React from "react";
import { MicrophoneIcon } from "../icons/MicrophoneIcon";

interface MicrophoneWithWavesProps {
  isConnected: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export const MicrophoneWithWaves: React.FC<MicrophoneWithWavesProps> = ({
  isConnected,
  isSpeaking = false,
  className = "",
}) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Animated Wave Rings - Only when agent is speaking */}
      {isConnected && isSpeaking && (
        <>
          {/* First wave ring - innermost, small radius */}
          <div
            className="absolute rounded-full border-2 animate-ping"
            style={{
              width: "210px",
              height: "210px",
              borderColor: "#F96E8C",
              opacity: 0.7,
              animationDuration: "2s",
              animationDelay: "0s",
            }}
          />
          
          {/* Second wave ring - slightly larger */}
          <div
            className="absolute rounded-full border-2 animate-ping"
            style={{
              width: "220px",
              height: "220px",
              borderColor: "#DE4CE3",
              opacity: 0.5,
              animationDuration: "2.5s",
              animationDelay: "0.3s",
            }}
          />
          
          {/* Third wave ring - outermost */}
          <div
            className="absolute rounded-full border-2 animate-ping"
            style={{
              width: "230px",
              height: "230px",
              borderColor: "#6A65F3",
              opacity: 0.3,
              animationDuration: "3s",
              animationDelay: "0.6s",
            }}
          />
        </>
      )}

      {/* Microphone Icon */}
      <div className="relative z-10">
        <MicrophoneIcon />
      </div>
    </div>
  );
};
