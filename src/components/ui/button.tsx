"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "accent"
    | "secondary"
    | "outline"
    | "outline-dark"
    | "ghost"
    | "ghost-dark"
    | "danger"
    | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  pill?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", pill = true, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          pill ? "rounded-full" : "rounded-xl",
          {
            "bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-500 hover:to-brand-600 focus:ring-brand-500 shadow-glow-brand hover:shadow-[0_15px_40px_-10px_rgba(20,184,166,0.6)] hover:-translate-y-0.5":
              variant === "primary",
            "bg-gradient-to-r from-accent-400 to-accent-500 text-slate-900 hover:from-accent-300 hover:to-accent-400 focus:ring-accent-500 shadow-glow-accent hover:shadow-[0_15px_40px_-10px_rgba(251,191,36,0.6)] hover:-translate-y-0.5":
              variant === "accent",
            "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500":
              variant === "secondary",
            // Light context (default for panels/forms): visible text on white bg
            "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-brand-400 focus:ring-brand-500":
              variant === "outline",
            "text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-400":
              variant === "ghost",
            // Dark context: light text on dark surfaces
            "border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-brand-400 focus:ring-brand-500":
              variant === "outline-dark",
            "text-slate-300 hover:text-white hover:bg-white/5 focus:ring-slate-500":
              variant === "ghost-dark",
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500":
              variant === "danger",
            "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500":
              variant === "dark",
          },
          {
            "text-xs px-3 py-1.5 gap-1.5": size === "sm",
            "text-sm px-5 py-2.5 gap-2": size === "md",
            "text-base px-7 py-3.5 gap-2": size === "lg",
            "text-base px-9 py-4 gap-3": size === "xl",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
