"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  Download,
} from "lucide-react";

interface CaseDocument {
  id: string;
  url: string;
  publicId: string | null;
  resourceType: string;
  type: "pdf" | "image" | string;
  name: string;
  size: number;
  description: string | null;
  createdAt: string;
}

interface Props {
  kind: "crm" | "case";
  id: string;
  emptyText?: string;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DocumentsManager({ kind, id, emptyText }: Props) {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryParam = kind === "crm" ? "crmClientId" : "caseTrackingId";
  const bodyKey = kind === "crm" ? "crmClientId" : "caseTrackingId";

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lawyers/documents?${queryParam}=${id}`);
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar los documentos");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [id, queryParam]);

  useEffect(() => {
    if (id) fetchDocs();
  }, [id, fetchDocs]);

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const ok =
      ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        file.type
      );
    if (!ok) {
      toast.error("Solo se permiten imágenes (JPG, PNG, WEBP) o PDF");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("El archivo no puede superar 10 MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "case-documents");
      const upRes = await fetch("/api/upload", { method: "POST", body: formData });
      const upData = await upRes.json();
      if (!upRes.ok) {
        toast.error(upData?.error || "Error al subir");
        return;
      }

      const saveRes = await fetch("/api/lawyers/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [bodyKey]: id,
          url: upData.url,
          publicId: upData.publicId,
          resourceType: upData.resourceType,
          type: upData.type,
          name: upData.name,
          size: upData.size,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        toast.error(saveData?.error || "Error al guardar");
        return;
      }
      setDocuments((prev) => [saveData, ...prev]);
      toast.success("Documento subido");
    } catch {
      toast.error("Error al subir el documento");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/lawyers/documents?id=${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "No se pudo eliminar");
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Documento eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  function openInNewTab(doc: CaseDocument) {
    window.open(`/api/lawyers/documents/${doc.id}/download`, "_blank");
  }

  function downloadFile(doc: CaseDocument) {
    window.location.href = `/api/lawyers/documents/${doc.id}/download?download=1`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Documentos</h4>
          <p className="text-xs text-slate-500">
            Subí imágenes o PDF (máx. 10 MB). Solo vos podés verlos.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFilePick}
          className="hidden"
          aria-label="Subir documento"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Subiendo..." : "Subir"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            {emptyText || "Todavía no hay documentos cargados"}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => {
            const Icon = doc.type === "pdf" ? FileText : ImageIcon;
            const isDeleting = deletingId === doc.id;
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-brand-300 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    doc.type === "pdf"
                      ? "bg-red-50 text-red-600"
                      : "bg-brand-50 text-brand-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => openInNewTab(doc)}
                    className="text-sm font-medium text-slate-900 truncate hover:text-brand-600 transition-colors text-left w-full"
                    title={doc.name}
                  >
                    {doc.name}
                  </button>
                  <p className="text-xs text-slate-500">
                    {formatSize(doc.size)} · {formatDate(doc.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadFile(doc)}
                  className="p-2 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  title="Descargar"
                  aria-label={`Descargar ${doc.name}`}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id, doc.name)}
                  disabled={isDeleting}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  title="Eliminar"
                  aria-label={`Eliminar ${doc.name}`}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
