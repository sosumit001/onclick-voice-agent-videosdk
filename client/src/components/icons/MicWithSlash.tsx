import React from "react";
import MicIcon from "./MicIcon"; // Adjust the import path as needed

const MicWithSlash: React.FC<{ disabled: boolean }> = ({ disabled }) => (
  <div className="relative w-6 h-6 flex items-center justify-center">
    <MicIcon className="w-6 h-6" />
    {disabled && (
      <svg
        className="absolute inset-0 w-7 h-7 pointer-events-none"
        viewBox="0 0 24 24"
      >
        <line
          x1="1"
          y1="26"
          x2="26"
          y2="2"
          stroke="white"
          strokeWidth="3"
          strokeDasharray="30"
          strokeDashoffset="30"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="30"
            to="0"
            dur="0.3s"
            fill="freeze"
          />
        </line>
      </svg>
    )}
  </div>
);

export default MicWithSlash;
