"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/utils";
import { FileText, Edit2, MessageSquare, Trash2 } from "lucide-react";
import { LockedFeature, deriveLockReason } from "@/components/lawyer/locked-feature";
import { SkeletonList } from "@/components/ui/skeleton";

interface CaseItem {
  id: string;
  status: string;
  description: string | null;
  updates: string | null;
  createdAt: string;
  updatedAt: string;
  appointment: {
    id: string;
    dateTime: string;
    client: { id: string; name: string; email: string };
    notes: string | null;
  };
}

const caseStatusMap: Record<string, { label: string; variant: any }> = {
  initiated: { label: "Iniciado", variant: "info" },
  in_progress: { label: "En Proceso", variant: "warning" },
  waiting_docs: { label: "Esperando Docs", variant: "warning" },
  in_court: { label: "En Juzgado", variant: "info" },
  resolved: { label: "Resuelto", variant: "success" },
};

export default function LawyerCases() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editModal, setEditModal] = useState<CaseItem | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editUpdates, setEditUpdates] = useState("");
  const [saving, setSaving] = useState(false);
  const [access, setAccess] = useState<any>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    fetch("/api/lawyers/me")
      .then((r) => r.json())
      .then((data) => {
        setAccess(data.access);
        setAccessChecked(true);
        if (data.access?.canAccessFeatures) fetchCases();
        else setLoading(false);
      });
  }, []);

  async function fetchCases() {
    setLoading(true);
    const res = await fetch("/api/cases");
    const data = await res.json();
    setCases(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function saveCase() {
    if (!editModal) return;
    setSaving(true);
    await fetch("/api/cases", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editModal.id,
        status: editStatus,
        description: editDescription,
        updates: editUpdates,
      }),
    });
    setSaving(false);
    setEditModal(null);
    fetchCases();
  }

  async function deleteCase(id: string, clientName: string) {
    if (!confirm(`¿Eliminar el caso resuelto de ${clientName}? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/cases?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "No se pudo eliminar");
      return;
    }
    fetchCases();
  }

  const filtered =
    filter === "all" ? cases : cases.filter((c) => c.status === filter);

  if (!accessChecked || loading) {
    return (
<SkeletonList rows={5} />
    );
  }

  const lockReason = access ? deriveLockReason(access) : null;
  if (lockReason) {
    return <LockedFeature featureName="Casos y Trámites" reason={lockReason} />;
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Casos y Tramites</h1>
        <p className="text-slate-500 mt-1">
          Seguimiento de todos tus casos legales
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "Todos" },
          { key: "initiated", label: "Iniciados" },
          { key: "in_progress", label: "En Proceso" },
          { key: "waiting_docs", label: "Esperando Docs" },
          { key: "in_court", label: "En Juzgado" },
          { key: "resolved", label: "Resueltos" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay casos</p>
            <p className="text-sm text-slate-400 mt-1">
              Crea tramites desde la seccion de Citas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const s = caseStatusMap[c.status] || {
              label: c.status,
              variant: "default",
            };
            return (
              <Card key={c.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        {c.appointment.client.name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {c.appointment.client.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Consulta: {formatDateTime(c.appointment.dateTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.variant}>{s.label}</Badge>
                      <Link
                        href={`/lawyer/messages?with=${c.appointment.client.id}&name=${encodeURIComponent(c.appointment.client.name)}`}
                        title="Enviar mensaje"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditModal(c);
                          setEditStatus(c.status);
                          setEditDescription(c.description || "");
                          setEditUpdates(c.updates || "");
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {c.status === "resolved" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCase(c.id, c.appointment.client.name)}
                          title="Eliminar caso resuelto"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {c.description && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-3">
                      <p className="text-sm text-slate-600">{c.description}</p>
                    </div>
                  )}

                  {c.updates && (
                    <div className="bg-brand-50 rounded-xl p-4 mb-3">
                      <p className="text-sm font-medium text-brand-700 mb-1">
                        Actualizaciones
                      </p>
                      <p className="text-sm text-brand-600">{c.updates}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <span>Creado: {formatDateTime(c.createdAt)}</span>
                    <span>Actualizado: {formatDateTime(c.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title="Editar Tramite"
      >
        {editModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Cliente:{" "}
              <span className="font-semibold">
                {editModal.appointment.client.name}
              </span>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Estado
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="initiated">Iniciado</option>
                <option value="in_progress">En Proceso</option>
                <option value="waiting_docs">Esperando Documentacion</option>
                <option value="in_court">En Juzgado</option>
                <option value="resolved">Resuelto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Descripcion
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] resize-none"
                placeholder="Detalle del caso..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Actualizaciones
              </label>
              <textarea
                value={editUpdates}
                onChange={(e) => setEditUpdates(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] resize-none"
                placeholder="Novedades del tramite..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditModal(null)}
              >
                Cancelar
              </Button>
              <Button className="flex-1" disabled={saving} onClick={saveCase}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
