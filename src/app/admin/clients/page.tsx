"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Users, Mail, Phone, Calendar, Star, Search, Scale } from "lucide-react";

interface ClientLawyer {
  id: string;
  name: string;
}

interface Client {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  googleId: string | null;
  createdAt: string;
  lawyers: ClientLawyer[];
  _count: { appointments: number; reviews: number };
}

interface LawyerOpt {
  id: string;
  name: string;
}

type SortOption = "recent" | "name" | "lawyer" | "appointments";

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<LawyerOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lawyerFilter, setLawyerFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("recent");

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((data) => {
        setClients(data.clients || []);
        setLawyers(data.lawyers || []);
        setLoading(false);
      });
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = clients.filter((c) => {
      if (q) {
        const hay = `${c.name} ${c.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (lawyerFilter !== "all") {
        if (!c.lawyers.some((l) => l.id === lawyerFilter)) return false;
      }
      return true;
    });
    list = [...list];
    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "lawyer") {
      list.sort((a, b) => {
        const an = a.lawyers[0]?.name || "ž";
        const bn = b.lawyers[0]?.name || "ž";
        return an.localeCompare(bn);
      });
    } else if (sort === "appointments") {
      list.sort((a, b) => b._count.appointments - a._count.appointments);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [clients, search, lawyerFilter, sort]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <p className="text-slate-500 mt-1">
          {clients.length} clientes registrados
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
              <p className="text-xs text-slate-500">Total Clientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {clients.reduce((sum, c) => sum + c._count.appointments, 0)}
              </p>
              <p className="text-xs text-slate-500">Total Citas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {clients.reduce((sum, c) => sum + c._count.reviews, 0)}
              </p>
              <p className="text-xs text-slate-500">Total Resenas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
        <select
          value={lawyerFilter}
          onChange={(e) => setLawyerFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Todos los abogados</option>
          {lawyers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="recent">Más recientes</option>
          <option value="name">Nombre A-Z</option>
          <option value="lawyer">Abogado A-Z</option>
          <option value="appointments">Más citas</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No hay clientes para los filtros seleccionados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((client) => (
            <Card key={client.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                      {client.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{client.name}</h3>
                        {client.googleId && <Badge variant="info">Google</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {client.email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                      {client.lawyers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Scale className="w-3.5 h-3.5 text-brand-500" />
                          {client.lawyers.map((l) => (
                            <Badge key={l.id} variant="default" className="font-normal">
                              {l.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{client._count.appointments} citas</span>
                    <span>{client._count.reviews} resenas</span>
                    <span>{formatDate(client.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
