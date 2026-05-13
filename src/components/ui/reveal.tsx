"use client";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  delay?: number;
  as?: "div" | "section" | "article" | "li";
}

export function Reveal({
  className,
  delay = 0,
  as = "div",
  children,
  ...props
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  if (reduceMotion) {
    return (
      <MotionTag className={cn(className)} {...props}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -10% 0px" }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
        delay: delay / 1000,
      }}
      {...props}
    >
      {children}
    </MotionTag>
  );
}
