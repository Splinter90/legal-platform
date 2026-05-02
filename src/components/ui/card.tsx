import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark" | "glass";
}

export function Card({ className, variant = "light", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300",
        variant === "light" &&
          "border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1",
        variant === "dark" &&
          "border border-white/10 bg-slate-900/60 backdrop-blur shadow-lg hover:border-brand-500/40 hover:-translate-y-1",
        variant === "glass" &&
          "border border-white/10 bg-white/5 backdrop-blur-md hover:border-brand-400/40 hover:-translate-y-1",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-4 border-b border-slate-100", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl", className)}
      {...props}
    />
  );
}
