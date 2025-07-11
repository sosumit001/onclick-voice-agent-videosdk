
import ShareIcon from "./icons/ShareIcon";
import CodeIcon from "./icons/CodeIcon";
import RocketIcon from "./icons/RocketIcon";
import { AgentSettings } from "./agent-meeting/types";

const RightHeaderBar = ({
  agentSettings,
}: {
  agentSettings: AgentSettings;
}) => {
  return (
    <div className="bg-[#1F1F1F] text-white px-6 py-3 flex items-center justify-between border-b-[1px] border-[#252A34]">
      <h1 className="text-lg font-medium">{agentSettings.model}</h1>

      <div className="flex items-center gap-3">
        <button className="text-white text-[14px] bg-[#31353B] hover:bg-gray-800 flex items-center gap-2 px-3 py-2 rounded-[45px] text-sm font-medium transition-colors">
          <ShareIcon className="h-[12px]" />
          Share
        </button>

        <button className="text-white bg-[#31353B] hover:bg-gray-800 flex items-center gap-2 px-3 py-2 rounded-[45px] text-sm font-medium transition-colors">
          <CodeIcon className="h-[12px]" />
          View Code
        </button>

        <button className="bg-[#5568FE] text-[14px] hover:bg-blue-700 text-white flex items-center gap-2 px-3 py-2 rounded-[45px] text-sm font-medium transition-colors">
          <RocketIcon className="h-[12px]" />
          Start Building
        </button>
      </div>
    </div>
  );
};

export default RightHeaderBar;
