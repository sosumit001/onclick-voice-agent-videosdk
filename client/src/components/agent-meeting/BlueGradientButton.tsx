import React from "react";

interface BlueGradientButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export const BlueGradientButton: React.FC<BlueGradientButtonProps> = ({
  text,
  onClick,
  disabled = false,
  size = "lg",
  variant = "primary",
  className = "",
}) => {
  const sizeConfig = {
    sm: {
      width: "180px",
      height: "44px",
      fontSize: "14px",
      padding: "px-6 py-3",
    },
    md: {
      width: "220px",
      height: "52px",
      fontSize: "16px",
      padding: "px-8 py-4",
    },
    lg: {
      width: "260px",
      height: "62px",
      fontSize: "18px",
      padding: "px-10 py-5",
    },
  };

  const config = sizeConfig[size];

  const getVariantStyles = () => {
    if (disabled) {
      return {
        background: "rgb(120, 150, 170)",
        color: "rgba(255, 255, 255, 0.7)",
        cursor: "not-allowed",
        boxShadow: "inset 2px 2px 6px rgba(0, 0, 0, 0.1)",
        opacity: 0.6,
      };
    }

    switch (variant) {
      case "primary":
        return {
          background: `radial-gradient(ellipse at center, rgb(135, 185, 230), rgb(66, 147, 204))`,
          color: "#ffffff",
          boxShadow: `
            0 0 20px 2px rgba(66, 147, 204, 0.3),
            inset 2px 2px 8px rgba(255, 255, 255, 0.3),
            inset -2px -2px 8px rgba(0, 0, 0, 0.1),
            inset 0 0 1px 1px rgba(185, 215, 240, 0.4)
          `,
        };

      case "secondary":
        return {
          background: `radial-gradient(ellipse at center, rgb(155, 195, 235), rgb(86, 157, 214))`,
          color: "#ffffff",
          boxShadow: `
            0 0 15px 1px rgba(66, 147, 204, 0.25),
            inset 2px 2px 6px rgba(255, 255, 255, 0.25),
            inset -2px -2px 6px rgba(0, 0, 0, 0.1)
          `,
          opacity: 0.9,
        };

      case "outline":
        return {
          background: "rgba(66, 147, 204, 0.1)",
          border: "2px solid rgb(66, 147, 204)",
          color: "rgb(66, 147, 204)",
          boxShadow: `
            0 0 15px 1px rgba(66, 147, 204, 0.2),
            inset 1px 1px 4px rgba(255, 255, 255, 0.3)
          `,
        };

      default:
        return {};
    }
  };

  const baseStyles = {
    width: config.width,
    height: config.height,
    fontSize: config.fontSize,
    borderRadius: "32px",
    fontWeight: "600" as const,
    letterSpacing: "0.02em",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative" as const,
    overflow: "hidden" as const,
    border: variant === "outline" ? undefined : "none",
    ...getVariantStyles(),
  };

  const hoverStyles = !disabled
    ? {
        transform: "translateY(-2px) scale(1.02)",
        boxShadow:
          variant === "primary"
            ? `
        0 0 25px 3px rgba(66, 147, 204, 0.4),
        inset 3px 3px 10px rgba(255, 255, 255, 0.4),
        inset -3px -3px 10px rgba(0, 0, 0, 0.15),
        inset 0 0 2px 1px rgba(185, 215, 240, 0.5)
      `
            : variant === "outline"
            ? `
        0 0 20px 2px rgba(66, 147, 204, 0.3),
        inset 2px 2px 6px rgba(255, 255, 255, 0.4)
      `
            : `
        0 0 20px 2px rgba(66, 147, 204, 0.3),
        inset 3px 3px 8px rgba(255, 255, 255, 0.3),
        inset -3px -3px 8px rgba(0, 0, 0, 0.12)
      `,
      }
    : {};

  const activeStyles = !disabled
    ? {
        transform: "translateY(0px) scale(0.98)",
      }
    : {};

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative
          ${config.padding}
          text-center
          font-medium
          whitespace-nowrap
          flex
          items-center
          justify-center
          focus:outline-none
          focus:ring-4
          focus:ring-blue-200/30
          ${className}
        `}
        style={baseStyles}
        onMouseEnter={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, hoverStyles);
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, baseStyles);
          }
        }}
        onMouseDown={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, {
              ...baseStyles,
              ...activeStyles,
            });
          }
        }}
        onMouseUp={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, {
              ...baseStyles,
              ...hoverStyles,
            });
          }
        }}
      >
        {/* Text */}
        <span className="relative z-10">{text}</span>
      </button>
    </div>
  );
};
