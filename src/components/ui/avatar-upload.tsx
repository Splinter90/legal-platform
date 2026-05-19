"use client";
import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  currentUrl: string | null | undefined;
  fallbackInitials: string;
  size?: "md" | "lg" | "xl";
  onChange: (url: string | null) => Promise<void>;
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  md: "w-16 h-16 text-lg",
  lg: "w-20 h-20 text-xl",
  xl: "w-24 h-24 text-2xl",
};

export function AvatarUpload({
  currentUrl,
  fallbackInitials,
  size = "lg",
  onChange,
  className = "",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type);
    if (!isImage) {
      toast.error("Solo imágenes (JPG, PNG, WEBP)");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "general");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "No se pudo subir la imagen");
        return;
      }
      await onChange(data.url as string);
      toast.success("Foto actualizada");
    } catch {
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemove() {
    if (!currentUrl) return;
    setRemoving(true);
    try {
      await onChange(null);
      toast.success("Foto eliminada");
    } catch {
      toast.error("No se pudo eliminar la foto");
    } finally {
      setRemoving(false);
    }
  }

  const sizeClass = SIZE_CLASSES[size];
  const busy = uploading || removing;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Foto de perfil"
            className={`${sizeClass} rounded-2xl object-cover border-2 border-white shadow`}
          />
        ) : (
          <div
            className={`${sizeClass} rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold`}
            aria-hidden="true"
          >
            {fallbackInitials}
          </div>
        )}
        {busy && (
          <div className={`absolute inset-0 ${sizeClass} rounded-2xl bg-black/40 flex items-center justify-center`}>
            <Loader2 className="w-5 h-5 text-white animate-spin" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFilePick}
          className="hidden"
          aria-label="Seleccionar foto de perfil"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Camera className="w-4 h-4" aria-hidden="true" />
          {currentUrl ? "Cambiar foto" : "Subir foto"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Quitar foto
          </button>
        )}
        <p className="text-xs text-slate-500">JPG, PNG o WEBP, hasta 5MB.</p>
      </div>
    </div>
  );
}
