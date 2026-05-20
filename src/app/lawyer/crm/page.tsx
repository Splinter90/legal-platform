"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LockedFeature, deriveLockReason } from "@/components/lawyer/locked-feature";
import { PhoneInputAR } from "@/components/ui/phone-input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { isOptionalPhoneARValid } from "@/lib/phone";
import { toast } from "sonner";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  FolderOpen,
} from "lucide-react";
import { DocumentsManager } from "@/components/lawyer/documents-manager";

interface CrmClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  situation: string;
  caseType: string;
  status: string;
  source: string;
  notes: string;
  createdAt: string;
}

const caseTypes = [
  "Penal",
  "Civil",
  "Laboral",
  "Comercial",
  "Familia",
  "Tributario",
  "Administrativo",
  "Otro",
];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  situation: "",
  caseType: "",
  status: "in_progress",
  source: "external",
  notes: "",
};

export default function LawyerCRM() {
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CrmClient | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [docsClient, setDocsClient] = useState<CrmClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<any>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    fetch("/api/lawyers/me")
      .then((r) => r.json())
      .then((data) => {
        setAccess(data.access);
        setAccessChecked(true);
        if (data.access?.canAccessFeatures) fetchClients();
        else setLoading(false);
      });
  }, []);

  async function fetchClients() {
    setLoading(true);
    const res = await fetch("/api/lawyers/crm");
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    if (form.phone && !isOptionalPhoneARValid(form.phone)) {
      toast.error("Ingresá un celular válido (formato +54 9 11 1234-5678).");
      return;
    }
    if (editing) {
      await fetch("/api/lawyers/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/lawyers/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
    fetchClients();
  }

  async function deleteClient(id: string) {
    if (!confirm("Eliminar este cliente?")) return;
    await fetch("/api/lawyers/crm", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchClients();
  }

  function openEdit(client: CrmClient) {
    setEditing(client);
    setForm({
      name: client.name,
      phone: client.phone || "",
      email: client.email || "",
      address: client.address || "",
      situation: client.situation || "",
      caseType: client.caseType || "",
      status: client.status,
      source: client.source,
      notes: client.notes || "",
    });
    setShowModal(true);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: any }> = {
      in_progress: { label: "En Proceso", variant: "warning" },
      resolved: { label: "Resuelto", variant: "success" },
      pending: { label: "Pendiente", variant: "info" },
    };
    const s = map[status] || { label: status, variant: "default" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const sourceBadge = (source: string) => {
    return source === "platform" ? (
      <Badge variant="info">Plataforma</Badge>
    ) : (
      <Badge variant="default">Externo</Badge>
    );
  };

  if (!accessChecked) {
    return (
<SkeletonList rows={5} />
    );
  }

  const lockReason = access ? deriveLockReason(access) : null;
  if (lockReason) {
    return <LockedFeature featureName="CRM Clientes" reason={lockReason} />;
  }

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Clientes</h1>
          <p className="text-slate-500 mt-1">
            Gestiona todos tus clientes en un solo lugar
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "Todos" },
            { key: "in_progress", label: "En Proceso" },
            { key: "resolved", label: "Resueltos" },
            { key: "pending", label: "Pendientes" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === f.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
<SkeletonList rows={4} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay clientes</p>
            <Button className="mt-4" onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((client) => (
            <Card key={client.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold">
                      {client.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {client.name}
                        </h3>
                        {statusBadge(client.status)}
                        {sourceBadge(client.source)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {client.phone}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {client.email}
                          </span>
                        )}
                        {client.caseType && (
                          <span className="text-slate-400">
                            | {client.caseType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDocsClient(client)}
                      title="Documentos"
                    >
                      <FolderOpen className="w-4 h-4 text-brand-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(client)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteClient(client.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        title={editing ? "Editar Cliente" : "Nuevo Cliente"}
        className="max-w-lg"
      >
        <form onSubmit={saveClient} className="space-y-4">
          <Input
            label="Nombre completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <PhoneInputAR
              label="Celular"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              showErrorOnIncomplete
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <AddressAutocomplete
            label="Direccion"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            onSelect={(opt) => setForm({ ...form, address: opt.address })}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tipo de Caso
              </label>
              <select
                value={form.caseType}
                onChange={(e) => setForm({ ...form, caseType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Seleccionar</option>
                {caseTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Proceso</option>
                <option value="resolved">Resuelto</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Situacion
            </label>
            <textarea
              value={form.situation}
              onChange={(e) => setForm({ ...form, situation: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] resize-none"
              placeholder="Descripcion de la situacion del cliente..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] resize-none"
              placeholder="Notas adicionales..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editing ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!docsClient}
        onClose={() => setDocsClient(null)}
        title={docsClient ? `Documentos de ${docsClient.name}` : "Documentos"}
        className="max-w-xl"
      >
        {docsClient && <DocumentsManager kind="crm" id={docsClient.id} />}
      </Modal>
    </div>
  );
}
