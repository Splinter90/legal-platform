import type { Metadata } from "next";

const SITE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const TITLE = "Abogados verificados en Argentina";
const DESCRIPTION =
  "Encontra abogados matriculados, filtra por especialidad y provincia, y agenda tu consulta legal online en minutos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/abogados" },
  openGraph: {
    url: `${SITE_URL}/abogados`,
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

export default function AbogadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
