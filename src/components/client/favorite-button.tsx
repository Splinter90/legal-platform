"use client";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

type Props = {
  lawyerId: string;
  initial?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onChange?: (active: boolean) => void;
};

export function FavoriteButton({ lawyerId, initial, size = "md", className = "", onChange }: Props) {
  const [active, setActive] = useState<boolean>(!!initial);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(initial !== undefined);

  useEffect(() => {
    if (initial !== undefined) return;
    let cancelled = false;
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setActive(data.some((f: any) => f?.lawyer?.id === lawyerId));
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
    return () => {
      cancelled = true;
    };
  }, [lawyerId, initial]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    const next = !active;
    setActive(next);
    try {
      const res = next
        ? await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lawyerId }),
          })
        : await fetch(`/api/favorites?lawyerId=${encodeURIComponent(lawyerId)}`, {
            method: "DELETE",
          });
      if (!res.ok) {
        setActive(!next);
      } else {
        onChange?.(next);
      }
    } catch {
      setActive(!next);
    } finally {
      setLoading(false);
    }
  }

  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  const padding = size === "sm" ? "p-1.5" : size === "lg" ? "p-3" : "p-2";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!hydrated || loading}
      aria-pressed={active}
      title={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`${padding} rounded-full border transition-all ${
        active
          ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100"
          : "bg-white/80 border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200"
      } ${className}`}
    >
      <Heart className={`${iconSize} ${active ? "fill-rose-500" : ""}`} />
    </button>
  );
}
