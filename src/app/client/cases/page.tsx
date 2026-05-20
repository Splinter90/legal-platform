"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { FileText, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton";

interface CaseItem {
  id: string;
  status: string;
  description: string | null;
  updates: string | null;
  createdAt: string;
  updatedAt: string;
  appointment: {
    dateTime: string;
    lawyer: { firstName: string; lastName: string };
    notes: string | null;
  };
}

const caseStatusMap: Record<string, { label: string; variant: any; icon: React.ReactNode }> = {
  initiated: { label: "Iniciado", variant: "info", icon: <Clock className="w-4 h-4" /> },
  in_progress: { label: "En Proceso", variant: "warning", icon: <Loader2 className="w-4 h-4" /> },
  waiting_docs: { label: "Esperando Docs", variant: "warning", icon: <AlertCircle className="w-4 h-4" /> },
  in_court: { label: "En Juzgado", variant: "info", icon: <FileText className="w-4 h-4" /> },
  resolved: { label: "Resuelto", variant: "success", icon: <CheckCircle className="w-4 h-4" /> },
};

export default function ClientCases() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data) => {
        setCases(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
<SkeletonList rows={5} />
    );
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mis Tramites</h1>
        <p className="text-slate-500 mt-1">
          Seguimiento de tus casos legales en curso
        </p>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No tenes tramites en curso</p>
            <p className="text-sm text-slate-400 mt-1">
              Cuando un abogado inicie un tramite vinculado a tu consulta, aparecera aca
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => {
            const s = caseStatusMap[c.status] || {
              label: c.status,
              variant: "default",
              icon: null,
            };
            return (
              <Card key={c.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                        {c.appointment.lawyer.firstName[0]}
                        {c.appointment.lawyer.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {c.appointment.lawyer.firstName}{" "}
                          {c.appointment.lawyer.lastName}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Consulta: {formatDateTime(c.appointment.dateTime)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={s.variant}>
                      {s.icon}
                      <span className="ml-1">{s.label}</span>
                    </Badge>
                  </div>

                  {c.description && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-3">
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Descripcion
                      </p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                        {c.description}
                      </p>
                    </div>
                  )}

                  {c.updates && (
                    <div className="bg-brand-50 rounded-xl p-4 mb-3">
                      <p className="text-sm font-medium text-brand-700 mb-1">
                        Actualizaciones
                      </p>
                      <p className="text-sm text-brand-600 whitespace-pre-wrap break-words">
                        {c.updates}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                    <span>Creado: {formatDateTime(c.createdAt)}</span>
                    <span>Actualizado: {formatDateTime(c.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
