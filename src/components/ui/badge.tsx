import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "brand" | "accent" | "success" | "warning" | "danger" | "info" | "outline-brand";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        {
          "bg-slate-100 text-slate-700": variant === "default",
          "bg-brand-100 text-brand-800": variant === "brand",
          "bg-accent-100 text-accent-800": variant === "accent",
          "bg-emerald-100 text-emerald-700": variant === "success",
          "bg-amber-100 text-amber-700": variant === "warning",
          "bg-red-100 text-red-700": variant === "danger",
          "bg-sky-100 text-sky-700": variant === "info",
          "border border-brand-500/40 text-brand-300 bg-brand-500/10":
            variant === "outline-brand",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
