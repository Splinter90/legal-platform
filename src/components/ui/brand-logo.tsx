import Link from "next/link";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md";
  tone?: "dark" | "light";
  className?: string;
}

export function BrandLogo({ href = "/", size = "md", tone = "dark", className }: BrandLogoProps) {
  const iconSize = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const titleClass = size === "sm" ? "text-base" : "text-lg";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand",
          iconSize
        )}
      >
        <Scale className="w-5 h-5 text-white" strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
      </div>
      <div className="leading-tight">
        <span
          className={cn(
            "block font-extrabold tracking-tight",
            titleClass,
            tone === "dark" ? "bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent" : "text-slate-900"
          )}
        >
          Leyes Digital
        </span>
        <span
          className={cn(
            "block text-[10px] uppercase tracking-[0.2em]",
            tone === "dark" ? "text-slate-400" : "text-slate-500"
          )}
        >
          Estudio Juridico
        </span>
      </div>
    </div>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
