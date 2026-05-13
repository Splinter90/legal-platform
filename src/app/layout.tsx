import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const SITE_DESCRIPTION =
  "Estudio juridico digital. Conectamos clientes con abogados matriculados de toda la Argentina. Busca, agenda y consulta de forma 100% online.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Leyes Digital - Marketplace de abogados en Argentina",
    template: "%s | Leyes Digital",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Leyes Digital",
  authors: [{ name: "Leyes Digital" }],
  keywords: [
    "abogados",
    "consulta legal online",
    "asesoramiento juridico",
    "marketplace legal",
    "abogados Argentina",
    "consulta abogado online",
    "agendar consulta legal",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "Leyes Digital",
    title: "Leyes Digital - Marketplace de abogados en Argentina",
    description: SITE_DESCRIPTION,
    images: [{ url: "/logo.jpeg", width: 512, height: 512, alt: "Leyes Digital" }],
  },
  twitter: {
    card: "summary",
    title: "Leyes Digital - Marketplace de abogados en Argentina",
    description: SITE_DESCRIPTION,
    images: ["/logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
