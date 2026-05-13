"use client";
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

type BaseDivProps = Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "exit" | "whileHover" | "transition" | "variants"
>;

interface CardProps extends BaseDivProps {
  variant?: "light" | "dark" | "glass";
  interactive?: boolean;
}

export function Card({
  className,
  variant = "light",
  interactive = true,
  ...props
}: CardProps) {
  const reduceMotion = useReducedMotion();
  const hover = !reduceMotion && interactive
    ? { y: -4, scale: 1.005 }
    : undefined;

  return (
    <motion.div
      whileHover={hover}
      transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.6 }}
      className={cn(
        "rounded-2xl",
        variant === "light" &&
          "border border-slate-200 bg-white shadow-sm hover:shadow-xl",
        variant === "dark" &&
          "border border-white/10 bg-slate-900/60 backdrop-blur shadow-lg hover:border-brand-500/40",
        variant === "glass" &&
          "border border-white/10 bg-white/5 backdrop-blur-md hover:border-brand-400/40",
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
