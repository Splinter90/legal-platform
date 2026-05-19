import type { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { getClientIp } from "./rate-limit";

export type AdminAction =
  | "lawyer.approve"
  | "lawyer.reject"
  | "lawyer.suspend"
  | "lawyer.set_pending"
  | "lawyer.status_change"
  | "settings.update"
  | "admin.2fa_enable"
  | "admin.2fa_disable"
  | "admin.password_reset_requested"
  | "admin.password_reset_completed"
  | "admin.login_success"
  | "admin.login_failed";

type LogInput = {
  adminId: string;
  action: AdminAction | string;
  target?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  req?: NextRequest | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function logAdminAction(input: LogInput): Promise<void> {
  const ip = input.ip ?? (input.req ? getClientIp(input.req) : null);
  const userAgent =
    input.userAgent ?? input.req?.headers.get("user-agent") ?? null;

  try {
    await prisma.adminLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        target: input.target ?? null,
        targetId: input.targetId ?? null,
        metadata: (input.metadata as any) ?? undefined,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[admin-audit] failed to write log", {
      action: input.action,
      adminId: input.adminId,
      err: err instanceof Error ? err.message : err,
    });
  }
}
