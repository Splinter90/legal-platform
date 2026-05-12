"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Stars } from "@/components/ui/stars";
import {
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Download,
  FileText,
  Search,
} from "lucide-react";

interface Lawyer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricula: string;
  specialties: string;
  province: string;
  city: string;
  narrative: string;
  experience: string;
  cbuAlias: string;
  status: string;
  rating: number;
  reviewCount: number;
  subscriptionStatus: string;
  profilePhoto: string | null;
  titleDocument: string | null;
  createdAt: string;
  _count: {
    appointments: number;
    crmClients: number;
    reviews: number;
  };
}

function LawyerAvatar({
  lawyer,
  size,
}: {
  lawyer: Pick<Lawyer, "profilePhoto" | "firstName" | "lastName">;
  size: "sm" | "lg";
}) {
  const cls =
    size === "sm"
      ? "w-12 h-12 text-lg"
      : "w-16 h-16 text-xl";
  if (lawyer.profilePhoto) {
    return (
      <img
        src={lawyer.profilePhoto}
        alt={`${lawyer.firstName} ${lawyer.lastName}`}
        className={`${cls} rounded-full object-cover border border-slate-200`}
      />
    );
  }
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold`}
    >
      {lawyer.firstName[0]}
      {lawyer.lastName[0]}
    </div>
  );
}

const VALID_STATUS_FILTERS = ["all", "pending", "approved", "rejected", "suspended", "incomplete"];

export default function AdminLawyers() {
  const searchParams = useSearchParams();
  const initialStatus = (() => {
    const s = searchParams.get("status");
    return s && VALID_STATUS_FILTERS.includes(s) ? s : "all";
  })();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [filter, setFilter] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<Lawyer | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);

  useEffect(() => {
    fetchLawyers();
  }, [filter]);

  async function fetchLawyers() {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/lawyers${params}`);
    const data = await res.json();
    setLawyers(data);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    if (status === "rejected") {
      const target = lawyers.find((l) => l.id === id) || selected;
      if (target) {
        setRejecting(target);
        setRejectionReason("");
      }
      return;
    }
    const res = await fetch("/api/admin/lawyers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Error al actualizar");
      return;
    }
    fetchLawyers();
    setSelected(null);
  }

  async function confirmRejection() {
    if (!rejecting) return;
    if (rejectionReason.trim().length < 5) {
      alert("El motivo debe tener al menos 5 caracteres");
      return;
    }
    setSubmittingRejection(true);
    const res = await fetch("/api/admin/lawyers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: rejecting.id,
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      }),
    });
    setSubmittingRejection(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Error al rechazar");
      return;
    }
    setRejecting(null);
    setRejectionReason("");
    setSelected(null);
    fetchLawyers();
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: any }> = {
      pending: { label: "Pendiente", variant: "warning" },
      approved: { label: "Aprobado", variant: "success" },
      rejected: { label: "Rechazado", variant: "danger" },
      suspended: { label: "Suspendido", variant: "danger" },
      incomplete: { label: "Incompleto", variant: "default" },
    };
    const s = map[status] || { label: status, variant: "default" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const filters = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pendientes" },
    { key: "approved", label: "Aprobados" },
    { key: "rejected", label: "Rechazados" },
    { key: "suspended", label: "Suspendidos" },
    { key: "incomplete", label: "Incompletos" },
  ];

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Gestion de Abogados
        </h1>
        <p className="text-slate-500 mt-1">
          Administra la cartera de profesionales
        </p>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-brand-600 text-white shadow-lg shadow-glow-brand"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
        </div>
      ) : (() => {
        const q = search.trim().toLowerCase();
        const visible = q
          ? lawyers.filter(
              (l) =>
                `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
                l.email.toLowerCase().includes(q) ||
                (l.matricula || "").toLowerCase().includes(q)
            )
          : lawyers;
        if (visible.length === 0) {
          return (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No se encontraron abogados</p>
              </CardContent>
            </Card>
          );
        }
        return (
        <div className="grid gap-4">
          {visible.map((lawyer) => (
            <Card key={lawyer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <LawyerAvatar lawyer={lawyer} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {lawyer.firstName} {lawyer.lastName}
                        </h3>
                        {statusBadge(lawyer.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {lawyer.city}, {lawyer.province}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          Mat. {lawyer.matricula}
                        </span>
                        <Stars rating={Math.round(lawyer.rating)} size="sm" />
                        <span>({lawyer.reviewCount})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(lawyer)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    {lawyer.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(lawyer.id, "approved")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => updateStatus(lawyer.id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    {lawyer.status === "approved" && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => updateStatus(lawyer.id, "suspended")}
                      >
                        Suspender
                      </Button>
                    )}
                    {lawyer.status === "suspended" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(lawyer.id, "approved")}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Reactivar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        );
      })()}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Detalle del Abogado"
        className="max-w-2xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <LawyerAvatar lawyer={selected} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selected.firstName} {selected.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge(selected.status)}
                  <Stars rating={Math.round(selected.rating)} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4" />
                {selected.email}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4" />
                {selected.phone || "Sin telefono"}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                {selected.city}, {selected.province}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Briefcase className="w-4 h-4" />
                Matricula: {selected.matricula}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                CBU / Alias
              </h4>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-2">
                {selected.cbuAlias || "No cargado"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                Especialidades
              </h4>
              <div className="flex flex-wrap gap-2">
                {selected.specialties.split(",").map((s) => (
                  <Badge key={s} variant="info">
                    {s.trim()}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Título universitario
              </h4>
              {selected.titleDocument ? (
                <div className="flex items-start gap-3">
                  <a
                    href={selected.titleDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-32 h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 hover:opacity-90 transition-opacity"
                    title="Click para ver en grande"
                  >
                    <img
                      src={selected.titleDocument}
                      alt="Título universitario"
                      className="w-full h-full object-cover"
                    />
                  </a>
                  <div className="flex flex-col gap-2">
                    <a
                      href={selected.titleDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Ver en tamaño completo
                    </a>
                    <a
                      href={selected.titleDocument}
                      download={`titulo-${selected.firstName}-${selected.lastName}.jpg`}
                      className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-2">
                  No se subió título.
                </p>
              )}
            </div>

            {selected.narrative && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-1">
                  Narrativa
                </h4>
                <p className="text-sm text-slate-600">{selected.narrative}</p>
              </div>
            )}

            {selected.experience && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-1">
                  Experiencia
                </h4>
                <p className="text-sm text-slate-600">{selected.experience}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-600">
                  {selected._count.appointments}
                </p>
                <p className="text-xs text-slate-500">Citas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {selected._count.crmClients}
                </p>
                <p className="text-xs text-slate-500">Clientes CRM</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {selected._count.reviews}
                </p>
                <p className="text-xs text-slate-500">Resenas</p>
              </div>
            </div>

            {selected.status === "pending" && (
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => updateStatus(selected.id, "approved")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => updateStatus(selected.id, "rejected")}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            )}
            {selected.status === "approved" && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => updateStatus(selected.id, "suspended")}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Suspender
                </Button>
              </div>
            )}
            {selected.status === "suspended" && (
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => updateStatus(selected.id, "approved")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Reactivar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!rejecting}
        onClose={() => {
          if (!submittingRejection) {
            setRejecting(null);
            setRejectionReason("");
          }
        }}
        title="Rechazar solicitud"
        className="max-w-md"
      >
        {rejecting && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a rechazar a <strong>{rejecting.firstName} {rejecting.lastName}</strong>. El motivo se le mostrará en su dashboard para que pueda corregirlo y reenviar la solicitud.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Motivo del rechazo
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px] resize-none"
                placeholder="Ej: La foto del título no es legible. Subí una imagen más clara."
                disabled={submittingRejection}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRejecting(null);
                  setRejectionReason("");
                }}
                disabled={submittingRejection}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={confirmRejection}
                disabled={submittingRejection || rejectionReason.trim().length < 5}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {submittingRejection ? "Enviando..." : "Rechazar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
