
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Settings } from "lucide-react";
import { AgentSettings } from "../agent-meeting/types";
import { AgentConfiguration } from "../agent-meeting/AgentConfiguration";

interface ResponsiveAgentConfigProps {
  agentSettings: AgentSettings;
  onSettingsChange?: (settings: AgentSettings) => void;
}

export const ResponsiveAgentConfig: React.FC<ResponsiveAgentConfigProps> = ({
  agentSettings,
  onSettingsChange,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            size="lg"
            className="w-14 h-14 rounded-full bg-[#1F1F1F] hover:bg-[#252A34] border border-[#252A34] shadow-lg"
          >
            <Settings className="w-6 h-6 text-white" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] bg-[#161616] border-t border-[#252A34]">
          <div className="h-full overflow-hidden">
            <AgentConfiguration
              agentSettings={agentSettings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
