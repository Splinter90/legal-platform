"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { UserCircle, LogOut, ChevronDown } from "lucide-react";

interface UserMenuProps {
  role: "client" | "lawyer";
  userName?: string;
  userImage?: string | null;
}

export function UserMenu({ role, userName, userImage }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const profileHref = role === "client" ? "/client/settings" : "/lawyer/profile";
  const profileLabel = role === "client" ? "Actualizar perfil" : "Actualizar perfil";
  const initial = userName?.[0]?.toUpperCase() || "U";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {userImage ? (
          <img
            src={userImage}
            alt={userName || "Mi cuenta"}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-glow-brand"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow-brand flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
            {initial}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-40"
        >
          {userName && (
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {role === "client" ? "Cliente" : "Abogado"}
              </p>
            </div>
          )}
          <Link
            href={profileHref}
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <UserCircle className="w-4 h-4 text-slate-500" aria-hidden="true" />
            {profileLabel}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
