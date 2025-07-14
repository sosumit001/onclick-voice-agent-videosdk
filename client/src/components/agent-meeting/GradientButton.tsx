import React from "react";
import { cn } from "@/lib/utils";

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  children: React.ReactNode;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles matching Figma specs
          "flex items-center justify-center",
          "w-[180px] h-[62px] sm:w-60 sm:h-[62px]", // 240px width, 62px height - responsive
          "px-4 py-3 sm:px-[34.617px] sm:py-[27.49px]", // Responsive padding
          "rounded-[160px]", // Full rounded pill shape
          "font-inter text-xl font-medium leading-[150%]", // 20px font-size, 500 weight, 150% line-height
          "transition-all duration-200 ease-in-out",
          "hover:scale-105 active:scale-95",

          // Variant styles
          variant === "primary" && [
            "bg-gradient-to-r from-white to-sky-400", // Gradient background
          ],

          variant === "secondary" && [
            "bg-gradient-to-r from-white to-sky-400", // Custom gradient background
            "text-[#121619]", // Dark text color from Figma
          ],

          variant === "outline" && [
            "bg-transparent",
            "border-[1.5px] border-white",
            "text-white",
          ],

          className
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn("relative", variant === "primary" && ["text-black"])}
        >
          {children}
        </span>
      </button>
    );
  }
);

GradientButton.displayName = "GradientButton";

export { GradientButton };
