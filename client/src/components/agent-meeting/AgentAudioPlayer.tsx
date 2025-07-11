import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";

interface AgentAudioPlayerProps {
  participantId: string;
}

export const AgentAudioPlayer: React.FC<AgentAudioPlayerProps> = ({
  participantId,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentPlayPromise = useRef<Promise<void> | null>(null);

  const safePlay = useCallback(async () => {
    if (!audioRef.current || !isAudioEnabled) return;

    try {
      // Wait for any previous play promise to resolve
      if (currentPlayPromise.current) {
        await currentPlayPromise.current.catch(() => {
          // Ignore errors from previous play attempts
        });
      }

      // Check if the audio element is ready
      if (audioRef.current.readyState >= 2) {
        // HAVE_CURRENT_DATA
        console.log("Attempting to play agent audio...");
        currentPlayPromise.current = audioRef.current.play();
        await currentPlayPromise.current;
        setIsPlaying(true);
        console.log("Agent audio playing successfully");
      }
    } catch (error) {
      // Handle common audio play errors
      if (error instanceof Error && error.name === "NotAllowedError") {
        console.warn(
          "Audio autoplay blocked by browser. User interaction required."
        );
      } else if (error instanceof Error && error.name !== "AbortError") {
        console.warn("Audio play failed:", error);
      }
      setIsPlaying(false);
    } finally {
      currentPlayPromise.current = null;
    }
  }, [isAudioEnabled]);

  const safePause = useCallback(() => {
    if (!audioRef.current) return;

    try {
      // Cancel any pending play promise
      if (currentPlayPromise.current) {
        currentPlayPromise.current.catch(() => {
          // Ignore AbortError from cancellation
        });
        currentPlayPromise.current = null;
      }

      audioRef.current.pause();
      setIsPlaying(false);
      console.log("Agent audio paused");
    } catch (error) {
      console.warn("Audio pause failed:", error);
    }
  }, []);

  const { micStream } = useParticipant(participantId, {
    onStreamEnabled: (stream) => {
      console.log("Agent audio stream enabled:", stream);
      if (audioRef.current && stream) {
        // Pause current playback before changing source
        safePause();

        const mediaStream = new MediaStream([stream.track]);
        audioRef.current.srcObject = mediaStream;
        console.log("Agent audio stream source set");
      }
    },
    onStreamDisabled: (stream) => {
      console.log("Agent audio stream disabled:", stream);
      if (audioRef.current) {
        safePause();
        audioRef.current.srcObject = null;
      }
    },
  });

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !micStream) return;

    const handleLoadedData = () => {
      console.log("Agent audio loaded and ready");
      if (isAudioEnabled) {
        safePlay();
      }
    };

    const handleCanPlay = () => {
      console.log("Agent audio can play");
      if (isAudioEnabled && !isPlaying) {
        safePlay();
      }
    };

    const handlePlay = () => {
      console.log("Agent audio started playing");
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log("Agent audio paused");
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log("Agent audio ended");
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.warn("Audio error:", e);
      setIsPlaying(false);
    };

    // Set up the audio stream
    const mediaStream = new MediaStream([micStream.track]);
    audioElement.srcObject = mediaStream;
    audioElement.volume = volume;

    // Add event listeners
    audioElement.addEventListener("loadeddata", handleLoadedData);
    audioElement.addEventListener("canplay", handleCanPlay);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);

    // Cleanup function
    return () => {
      audioElement.removeEventListener("loadeddata", handleLoadedData);
      audioElement.removeEventListener("canplay", handleCanPlay);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
    };
  }, [micStream, isAudioEnabled, volume, safePlay, isPlaying]);

  // Auto-enable audio on first user interaction (clicking anywhere)
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!isPlaying && isAudioEnabled) {
        safePlay();
      }
    };

    // Listen for any user interaction to enable audio
    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("keydown", handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, [safePlay, isPlaying, isAudioEnabled]);

  // No UI - just the hidden audio element
  return (
    <audio
      ref={audioRef}
      autoPlay={true}
      playsInline
      muted={false}
      style={{ display: "none" }}
    />
  );
};
