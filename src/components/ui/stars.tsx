"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number;
  maxRating?: number;
  size?: "xs" | "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function Stars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarsProps) {
  const sizes = { xs: "w-3 h-3", sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-6 h-6" };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizes[size],
            "transition-colors duration-150",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200",
            interactive && "cursor-pointer hover:fill-amber-300 hover:text-amber-300"
          )}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
}
