import type { Metadata } from "next";

const SITE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const TITLE = "Mapa de abogados en Argentina";
const DESCRIPTION =
  "Visualiza en el mapa todos los abogados matriculados disponibles cerca tuyo. Filtros por especialidad y agenda online.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/mapa" },
  openGraph: {
    url: `${SITE_URL}/mapa`,
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: TITLE,
  description: DESCRIPTION,
  url: `${SITE_URL}/mapa`,
  inLanguage: "es-AR",
  isPartOf: {
    "@type": "WebSite",
    name: "Leges Digital",
    url: SITE_URL,
  },
};

export default function MapaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
