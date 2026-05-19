import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Sin conexión",
  description: "No hay conexión a internet.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <WifiOff className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Sin conexión
        </h1>
        <p className="text-slate-600 mb-6">
          No pudimos conectarnos a internet. Revisá tu red e intentá de nuevo.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-brand-400 hover:to-brand-500 transition-all"
        >
          Reintentar
        </a>
      </div>
    </div>
  );
}
