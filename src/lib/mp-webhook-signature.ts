import crypto from "crypto";

export type SignatureInput = {
  signatureHeader: string | null;
  requestId: string | null;
  body: string;
  queryDataId?: string | null;
  queryId?: string | null;
  secret: string | undefined;
};

export type SignatureResult =
  | { ok: true }
  | { ok: false; reason: string; debug?: Record<string, unknown> };

export function verifyMpWebhookSignature(input: SignatureInput): SignatureResult {
  const { signatureHeader, requestId, body, queryDataId, queryId, secret } = input;

  if (!secret) {
    return { ok: false, reason: "missing_secret" };
  }

  if (!signatureHeader || !requestId) {
    return { ok: false, reason: "missing_headers" };
  }

  const parts: Record<string, string> = {};
  signatureHeader.split(",").forEach((part) => {
    const [key, value] = part.trim().split("=");
    if (key && value) parts[key] = value;
  });

  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) {
    return { ok: false, reason: "malformed_signature" };
  }

  let bodyDataId: string | undefined;
  let bodyId: string | undefined;
  try {
    const parsed = JSON.parse(body);
    bodyDataId = parsed?.data?.id;
    bodyId = parsed?.id;
  } catch {}

  const rawDataId = queryDataId ?? bodyDataId ?? queryId ?? bodyId ?? "";
  if (!rawDataId) {
    return { ok: false, reason: "missing_data_id" };
  }

  const dataId = String(rawDataId).toLowerCase();
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  if (computed !== hash) {
    return {
      ok: false,
      reason: "signature_mismatch",
      debug: { manifest, computed, received: hash },
    };
  }

  return { ok: true };
}
