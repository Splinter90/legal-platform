"use client";
import { Sidebar } from "./sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface DashboardLayoutProps {
  role: "admin" | "lawyer" | "client";
  userName?: string;
  children: React.ReactNode;
}

export function DashboardLayout({ role, userName, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={role} userName={userName} />
      {/* Top bar with notifications */}
      <div className="fixed top-0 right-0 left-0 lg:left-64 h-14 bg-white/80 backdrop-blur-lg border-b border-slate-100 z-30 flex items-center justify-end px-6 gap-3">
        <NotificationBell />
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow-brand flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
          {userName?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8" style={{ paddingTop: "5rem" }}>{children}</main>
    </div>
  );
}
