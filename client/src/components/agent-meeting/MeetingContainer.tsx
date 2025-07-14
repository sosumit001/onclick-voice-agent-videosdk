import React from "react";
import { AgentSettings } from "./types";
import { RoomLayout } from "../layout/RoomLayout";
import { MicrophoneWithWaves } from "./MicrophoneWithWaves";
import { ThreeJSAvatar } from "./ThreeJSAvatar";
import { Button } from "../ui/button";
import { CustomButton } from "./CustomButton";
import { BlueGradientButton } from "./BlueGradientButton";
import { GradientButton } from "./GradientButton";

interface MeetingContainerProps {
  onConnect: () => void;
  agentSettings: AgentSettings;
  isConnecting: boolean;
}

export const MeetingContainer: React.FC<MeetingContainerProps> = ({
  onConnect,
  agentSettings,
  isConnecting,
}) => {
  return (
    <RoomLayout agentSettings={agentSettings}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent relative">
        {/* Fixed Avatar Position - Higher up with larger gap */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -translate-y-40">
          <ThreeJSAvatar isConnected={false} className="" size="xl" />
        </div>

        {/* Fixed Control Panel Position - Lower down with larger gap */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 translate-y-24">
          <div className="flex items-center justify-center">
            {/* Connect Button - New Gradient Style */}
            <GradientButton
              onClick={onConnect}
              disabled={isConnecting}
              variant="primary"
            >
              {isConnecting ? "Give it a sec!" : "Give it a try!"}
            </GradientButton>
          </div>
        </div>
      </div>
    </RoomLayout>
  );
};
