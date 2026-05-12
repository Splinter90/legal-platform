import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const STATIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/abogados", changeFrequency: "daily", priority: 0.9 },
  { path: "/mapa", changeFrequency: "daily", priority: 0.8 },
  { path: "/register-lawyer", changeFrequency: "monthly", priority: 0.5 },
  { path: "/register-client", changeFrequency: "monthly", priority: 0.5 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacidad", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terminos", changeFrequency: "yearly", priority: 0.3 },
  { path: "/contacto", changeFrequency: "yearly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  let lawyerEntries: MetadataRoute.Sitemap = [];
  try {
    const lawyers = await prisma.lawyer.findMany({
      where: {
        status: "approved",
        subscriptionStatus: "active",
        subscriptionPaidUntil: { gt: now },
      },
      select: { id: true, updatedAt: true },
      take: 5000,
    });

    lawyerEntries = lawyers.map((l) => ({
      url: `${SITE_URL}/abogados/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (err) {
    console.error("[sitemap] failed to fetch lawyers:", err);
  }

  return [...staticEntries, ...lawyerEntries];
}
