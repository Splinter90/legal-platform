import { prisma } from "@/lib/prisma";

export interface LawyerAccess {
  status: string;
  subscriptionStatus: string;
  subscriptionPaidUntil: Date | null;
  rejectionReason: string | null;
  hasActiveSubscription: boolean;
  canAccessFeatures: boolean;
}

export function deriveAccess(lawyer: {
  status: string;
  subscriptionStatus: string;
  subscriptionPaidUntil: Date | null;
  rejectionReason: string | null;
}): LawyerAccess {
  const hasActiveSubscription =
    lawyer.subscriptionStatus === "active" &&
    !!lawyer.subscriptionPaidUntil &&
    lawyer.subscriptionPaidUntil > new Date();

  const canAccessFeatures = lawyer.status === "approved" && hasActiveSubscription;

  return {
    status: lawyer.status,
    subscriptionStatus: lawyer.subscriptionStatus,
    subscriptionPaidUntil: lawyer.subscriptionPaidUntil,
    rejectionReason: lawyer.rejectionReason,
    hasActiveSubscription,
    canAccessFeatures,
  };
}

export async function requireLawyerFeatureAccess(lawyerId: string): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const access = await getLawyerAccess(lawyerId);
  if (!access) return { ok: false, error: "Abogado no encontrado", status: 404 };
  if (!access.canAccessFeatures) {
    const reason =
      access.status !== "approved"
        ? "Tu cuenta aún no fue aprobada por el Admin"
        : "Necesitás una suscripción activa para usar esta función";
    return { ok: false, error: reason, status: 403 };
  }
  return { ok: true };
}

export async function getLawyerAccess(lawyerId: string): Promise<LawyerAccess | null> {
  const lawyer = await prisma.lawyer.findUnique({
    where: { id: lawyerId },
    select: {
      status: true,
      subscriptionStatus: true,
      subscriptionPaidUntil: true,
      rejectionReason: true,
    },
  });
  if (!lawyer) return null;
  return deriveAccess(lawyer);
}
