import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
          {
            // Brand: black button, yellow hover
            "bg-ink-900 text-primary-400 hover:bg-ink-950 hover:text-primary-300 shadow-card hover:shadow-lift":
              variant === "default",
            "bg-red-600 text-white hover:bg-red-700 shadow-card":
              variant === "destructive",
            "border border-ink-200 bg-white text-ink-800 hover:border-ink-900 hover:text-ink-950":
              variant === "outline",
            "bg-ink-100 text-ink-900 hover:bg-ink-200":
              variant === "secondary",
            "text-ink-600 hover:bg-ink-100 hover:text-ink-950":
              variant === "ghost",
          },
          {
            "h-10 px-5 py-2 text-sm": size === "default",
            "h-8 px-3.5 text-xs": size === "sm",
            "h-12 px-7 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
