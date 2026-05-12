import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = 0;

function sweepIfNeeded(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return req.ip || "unknown";
}

export function getIpFromHeaders(headers: Record<string, string | string[] | undefined> | undefined): string {
  if (!headers) return "unknown";
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const xff = pick(headers["x-forwarded-for"]);
  if (xff) return xff.split(",")[0]!.trim();
  const real = pick(headers["x-real-ip"]);
  if (real) return real.trim();
  return "unknown";
}

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  sweepIfNeeded(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return {
      ok: true,
      limit,
      remaining: limit - 1,
      retryAfterSeconds: 0,
      resetAt: bucket.resetAt,
    };
  }

  existing.count++;

  if (existing.count > limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
    };
  }

  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: 0,
    resetAt: existing.resetAt,
  };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const res = NextResponse.json(
    { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
    { status: 429 }
  );
  res.headers.set("Retry-After", String(result.retryAfterSeconds));
  res.headers.set("X-RateLimit-Limit", String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  return res;
}
