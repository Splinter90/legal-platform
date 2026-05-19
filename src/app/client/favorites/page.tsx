"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { SkeletonList } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/client/favorite-button";
import { Heart, MapPin, ArrowRight, Search } from "lucide-react";

type FavoriteLawyer = {
  id: string;
  createdAt: string;
  lawyer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto: string | null;
    specialties: string;
    city: string;
    province: string;
    rating: number;
    reviewCount: number;
    status: string;
    subscriptionStatus: string;
    subscriptionPaidUntil: string | null;
  };
};

export default function ClientFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteLawyer[] | null>(null);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setFavorites(Array.isArray(d) ? d : []))
      .catch(() => setFavorites([]));
  }, []);

  function handleRemoved(lawyerId: string) {
    setFavorites((prev) => (prev ? prev.filter((f) => f.lawyer.id !== lawyerId) : prev));
  }

  if (!favorites) {
    return (
      <div className="max-w-4xl">
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            Mis favoritos
          </h1>
          <p className="text-slate-500 mt-1">
            Tus abogados guardados, listos para volver a consultar.
          </p>
        </div>
        <Link
          href="/client/lawyers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <Search className="w-4 h-4" />
          Buscar más abogados
        </Link>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Todavía no guardaste ningún abogado</p>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              Tocá el corazón en cualquier perfil para sumarlo a esta lista.
            </p>
            <Link
              href="/client/lawyers"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-brand-400 hover:to-brand-500 transition-all"
            >
              <Search className="w-4 h-4" />
              Buscar abogados
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => {
            const l = fav.lawyer;
            const fullName = `${l.firstName} ${l.lastName}`;
            const initials = `${l.firstName[0] || ""}${l.lastName[0] || ""}`.toUpperCase();
            const subscriptionFutureMs = l.subscriptionPaidUntil
              ? new Date(l.subscriptionPaidUntil).getTime()
              : 0;
            const isAvailable =
              l.status === "approved" &&
              l.subscriptionStatus === "active" &&
              subscriptionFutureMs > Date.now();
            const specialtyList = (l.specialties || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);

            return (
              <Card
                key={fav.id}
                className="relative hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton
                    lawyerId={l.id}
                    initial={true}
                    size="sm"
                    onChange={(active) => {
                      if (!active) handleRemoved(l.id);
                    }}
                  />
                </div>
                <CardContent className="py-5">
                  <Link
                    href={`/client/lawyers/${l.id}`}
                    className="flex items-start gap-3"
                  >
                    {l.profilePhoto ? (
                      <img
                        src={l.profilePhoto}
                        alt={fullName}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 pr-7">
                      <p className="font-semibold text-slate-900 truncate">{fullName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Stars rating={Math.round(l.rating)} size="sm" />
                        <span className="text-xs text-slate-500">({l.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {l.city}, {l.province}
                      </div>
                    </div>
                  </Link>

                  {specialtyList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {specialtyList.slice(0, 3).map((s) => (
                        <Badge key={s} variant="info">
                          {s}
                        </Badge>
                      ))}
                      {specialtyList.length > 3 && (
                        <Badge variant="info">+{specialtyList.length - 3}</Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {isAvailable ? (
                      <Link
                        href={`/client/lawyers/${l.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Reservar consulta
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">
                        No disponible por ahora
                      </span>
                    )}
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
