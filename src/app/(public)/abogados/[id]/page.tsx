import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star, ArrowLeft, ShieldCheck, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";

const SITE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

async function getPublicLawyer(id: string) {
  return prisma.lawyer.findFirst({
    where: {
      id,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionPaidUntil: { gt: new Date() },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialties: true,
      province: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      narrative: true,
      experience: true,
      rating: true,
      reviewCount: true,
      profilePhoto: true,
      consultationDuration: true,
    },
  });
}

async function getPublicReviews(lawyerId: string) {
  return prisma.review.findMany({
    where: { lawyerId, comment: { not: null } },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
}

function splitSpecialties(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function firstNameOnly(name: string | null | undefined): string {
  if (!name) return "Cliente";
  return name.split(" ")[0] || "Cliente";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lawyer = await getPublicLawyer(params.id);
  if (!lawyer) {
    return { title: "Abogado no disponible", robots: { index: false } };
  }

  const fullName = `${lawyer.firstName} ${lawyer.lastName}`;
  const specialties = splitSpecialties(lawyer.specialties);
  const primary = specialties[0];
  const where = [lawyer.city, lawyer.province].filter(Boolean).join(", ");
  const title = `${fullName} - Abogado${primary ? ` ${primary}` : ""}${
    where ? ` en ${where}` : ""
  }`;
  const description =
    (lawyer.narrative && lawyer.narrative.slice(0, 200)) ||
    `Perfil profesional de ${fullName}. Agenda una consulta legal online con un abogado matriculado verificado.`;

  return {
    title,
    description,
    alternates: { canonical: `/abogados/${lawyer.id}` },
    openGraph: {
      type: "profile",
      url: `${SITE_URL}/abogados/${lawyer.id}`,
      title,
      description,
      images: lawyer.profilePhoto
        ? [{ url: lawyer.profilePhoto, alt: fullName }]
        : undefined,
    },
    twitter: {
      card: lawyer.profilePhoto ? "summary_large_image" : "summary",
      title,
      description,
      images: lawyer.profilePhoto ? [lawyer.profilePhoto] : undefined,
    },
  };
}

export default async function LawyerPublicProfilePage({ params }: Props) {
  const lawyer = await getPublicLawyer(params.id);
  if (!lawyer) notFound();

  const reviews = await getPublicReviews(lawyer.id);
  const specialties = splitSpecialties(lawyer.specialties);
  const fullName = `${lawyer.firstName} ${lawyer.lastName}`;
  const initials =
    (lawyer.firstName[0] || "") + (lawyer.lastName[0] || "");

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Attorney",
    name: fullName,
    url: `${SITE_URL}/abogados/${lawyer.id}`,
    image: lawyer.profilePhoto || undefined,
    description: lawyer.narrative || undefined,
    areaServed: {
      "@type": "AdministrativeArea",
      name: [lawyer.city, lawyer.province].filter(Boolean).join(", ") || "Argentina",
    },
    knowsAbout: specialties,
    address:
      lawyer.address || lawyer.city
        ? {
            "@type": "PostalAddress",
            streetAddress: lawyer.address || undefined,
            addressLocality: lawyer.city || undefined,
            addressRegion: lawyer.province || undefined,
            addressCountry: "AR",
          }
        : undefined,
    geo:
      lawyer.latitude && lawyer.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: lawyer.latitude,
            longitude: lawyer.longitude,
          }
        : undefined,
    aggregateRating:
      lawyer.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: lawyer.rating,
            reviewCount: lawyer.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review: reviews.map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: { "@type": "Person", name: firstNameOnly(r.client.name) },
      datePublished: r.createdAt.toISOString(),
      reviewBody: r.comment || undefined,
    })),
  };

  const bookingHref = `/client/lawyers/${lawyer.id}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/abogados"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al listado
      </Link>

      <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          {lawyer.profilePhoto ? (
            <img
              src={lawyer.profilePhoto}
              alt={fullName}
              className="w-28 h-28 rounded-3xl object-cover border border-white/10"
            />
          ) : (
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl font-bold">
              {initials}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-slate-300">
              {lawyer.reviewCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <strong className="text-white">{lawyer.rating.toFixed(1)}</strong>
                  <span className="text-slate-400">
                    ({lawyer.reviewCount} reseña
                    {lawyer.reviewCount === 1 ? "" : "s"})
                  </span>
                </span>
              )}
              {(lawyer.city || lawyer.province) && (
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  {[lawyer.city, lawyer.province].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Matricula verificada
              </span>
            </div>

            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 rounded-full bg-brand-500/15 text-brand-200 border border-brand-500/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="sm:flex-shrink-0">
            <Link
              href={bookingHref}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:from-brand-400 hover:to-brand-500 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Reservar consulta
            </Link>
            <p className="text-xs text-slate-500 mt-2 text-center">
              {lawyer.consultationDuration} min - 100% online
            </p>
          </div>
        </div>
      </header>

      {lawyer.narrative && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-3">
            Sobre {lawyer.firstName}
          </h2>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {lawyer.narrative}
          </p>
        </section>
      )}

      {lawyer.experience && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-3">Experiencia</h2>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {lawyer.experience}
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          Reseñas {lawyer.reviewCount > 0 && (
            <span className="text-slate-400 text-base font-normal">
              ({lawyer.reviewCount})
            </span>
          )}
        </h2>

        {reviews.length === 0 ? (
          <p className="text-slate-400">
            Este abogado todavía no tiene reseñas publicadas.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">
                    {firstNameOnly(r.client.name)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-300 text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {r.rating}/5
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {r.comment}
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  {r.createdAt.toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 rounded-3xl border border-brand-500/30 bg-brand-500/5 p-6 sm:p-8 text-center">
        <h3 className="text-xl font-semibold text-white">
          Listo para tu consulta con {lawyer.firstName}?
        </h3>
        <p className="text-slate-300 mt-2">
          Agenda en segundos, paga seguro con Mercado Pago y reuni por Google Meet.
        </p>
        <Link
          href={bookingHref}
          className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:from-brand-400 hover:to-brand-500 transition-all"
        >
          <Calendar className="w-4 h-4" />
          Reservar consulta
        </Link>
      </section>
    </div>
  );
}
