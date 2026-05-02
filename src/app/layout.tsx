import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Leges Digital - Estudio Juridico",
  description:
    "Estudio juridico digital. Conectamos clientes con abogados verificados. Busca, agenda y consulta de forma segura.",
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
