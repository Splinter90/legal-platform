"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import {
  LayoutDashboard,
  Users,
  Settings,
  Scale,
  Calendar,
  MessageSquare,
  UserCircle,
  Search,
  CreditCard,
  MapPin,
  LogOut,
  Briefcase,
  Clock,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: "admin" | "lawyer" | "client";
  userName?: string;
}

const menuItems: Record<string, SidebarItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Abogados", href: "/admin/lawyers", icon: <Scale className="w-5 h-5" /> },
    { label: "Clientes", href: "/admin/clients", icon: <Users className="w-5 h-5" /> },
    { label: "Pagos", href: "/admin/payments", icon: <CreditCard className="w-5 h-5" /> },
    { label: "Mapa", href: "/admin/map", icon: <MapPin className="w-5 h-5" /> },
    { label: "Configuracion", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
  ],
  lawyer: [
    { label: "Dashboard", href: "/lawyer/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Mi Perfil", href: "/lawyer/profile", icon: <UserCircle className="w-5 h-5" /> },
    { label: "Disponibilidad", href: "/lawyer/availability", icon: <Clock className="w-5 h-5" /> },
    { label: "Citas", href: "/lawyer/appointments", icon: <Calendar className="w-5 h-5" /> },
    { label: "CRM Clientes", href: "/lawyer/crm", icon: <Briefcase className="w-5 h-5" /> },
    { label: "Casos", href: "/lawyer/cases", icon: <FileText className="w-5 h-5" /> },
    { label: "Mensajes", href: "/lawyer/messages", icon: <MessageSquare className="w-5 h-5" /> },
  ],
  client: [
    { label: "Dashboard", href: "/client/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Buscar Abogados", href: "/client/lawyers", icon: <Search className="w-5 h-5" /> },
    { label: "Mapa", href: "/client/map", icon: <MapPin className="w-5 h-5" /> },
    { label: "Mis Citas", href: "/client/appointments", icon: <Calendar className="w-5 h-5" /> },
    { label: "Mis Tramites", href: "/client/cases", icon: <FileText className="w-5 h-5" /> },
    { label: "Mensajes", href: "/client/messages", icon: <MessageSquare className="w-5 h-5" /> },
  ],
};

const roleLabels = {
  admin: "Administrador",
  lawyer: "Abogado",
  client: "Cliente",
};

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signoutOpen, setSignoutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/" });
  };

  const initials = (userName || "U")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="relative px-5 py-6 overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50/40" />
        <div className="relative flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5 text-white" strokeWidth={2.5} />
            <span className="absolute inset-0 rounded-2xl ring-1 ring-white/30" />
          </div>
          <div className="leading-tight min-w-0">
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
              Leyes Digital
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {roleLabels[role]}
            </p>
          </div>
        </div>
      </div>

      {/* User pill */}
      {userName && (
        <div className="mx-3 my-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
            <p className="text-[11px] text-slate-500 truncate">{roleLabels[role]}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative",
                isActive
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow-brand"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-brand-500"
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            setSignoutOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-white shadow-lg border border-slate-200 lg:hidden hover:border-brand-300 transition-colors"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 lg:hidden shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 z-10"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex-col z-40 hidden lg:flex">
        {sidebarContent}
      </aside>

      {/* Signout confirmation modal */}
      <Modal
        isOpen={signoutOpen}
        onClose={() => {
          if (!signingOut) setSignoutOpen(false);
        }}
        title="Cerrar sesion"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              ¿Seguro que querés cerrar sesión? Vas a tener que volver a iniciar sesión para acceder
              a tu cuenta.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSignoutOpen(false)}
              disabled={signingOut}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {signingOut ? "Cerrando..." : "Cerrar sesion"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
