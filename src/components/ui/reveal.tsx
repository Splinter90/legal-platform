"use client";
import { useEffect, useRef, useState, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  as?: "div" | "section" | "article" | "li";
}

export function Reveal({ className, delay = 0, as: Tag = "div", style, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as any}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...(props as any)}
    />
  );
}
