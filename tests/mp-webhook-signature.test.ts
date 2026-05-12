import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyMpWebhookSignature } from "@/lib/mp-webhook-signature";

const SECRET = "test-secret-shhh";

function sign(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("verifyMpWebhookSignature", () => {
  it("acepta una firma valida con dataId en query", () => {
    const result = verifyMpWebhookSignature({
      signatureHeader: sign("12345", "req-1", "1700000000"),
      requestId: "req-1",
      body: JSON.stringify({ type: "payment", data: { id: "12345" } }),
      queryDataId: "12345",
      queryId: null,
      secret: SECRET,
    });
    expect(result.ok).toBe(true);
  });

  it("acepta cuando el dataId esta solo en el body", () => {
    const result = verifyMpWebhookSignature({
      signatureHeader: sign("ABCDE", "req-2", "1700000001"),
      requestId: "req-2",
      body: JSON.stringify({ data: { id: "ABCDE" } }),
      queryDataId: null,
      queryId: null,
      secret: SECRET,
    });
    expect(result.ok).toBe(true);
  });

  it("rechaza cuando falta el secret", () => {
    const result = verifyMpWebhookSignature({
      signatureHeader: sign("12345", "req-1", "1700000000"),
      requestId: "req-1",
      body: JSON.stringify({ data: { id: "12345" } }),
      queryDataId: "12345",
      queryId: null,
      secret: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_secret");
  });

  it("rechaza cuando faltan los headers", () => {
    const result = verifyMpWebhookSignature({
      signatureHeader: null,
      requestId: "req-1",
      body: "{}",
      queryDataId: "1",
      queryId: null,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_headers");
  });

  it("rechaza cuando el x-signature esta mal formado", () => {
    const result = verifyMpWebhookSignature({
      signatureHeader: "foo=bar,baz=qux",
      requestId: "req-1",
      body: JSON.stringify({ data: { id: "1" } }),
      queryDataId: "1",
      queryId: null,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed_signature");
  });

  it("rechaza cuando no hay dataId en ningun lado", () => {
    const result = verifyMpWebhookSignature({
      signatureHeader: sign("", "req-1", "1700000000"),
      requestId: "req-1",
      body: "{}",
      queryDataId: null,
      queryId: null,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_data_id");
  });

  it("rechaza una firma que no coincide (tampered)", () => {
    const tamperedSecret = "other-secret";
    const manifest = `id:12345;request-id:req-1;ts:1700000000;`;
    const v1 = crypto
      .createHmac("sha256", tamperedSecret)
      .update(manifest)
      .digest("hex");

    const result = verifyMpWebhookSignature({
      signatureHeader: `ts=1700000000,v1=${v1}`,
      requestId: "req-1",
      body: JSON.stringify({ data: { id: "12345" } }),
      queryDataId: "12345",
      queryId: null,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("signature_mismatch");
  });

  it("rechaza si el atacante cambia el data.id sin recomputar v1", () => {
    const headerForOriginal = sign("ORIGINAL", "req-9", "1700000099");
    const result = verifyMpWebhookSignature({
      signatureHeader: headerForOriginal,
      requestId: "req-9",
      body: JSON.stringify({ data: { id: "TAMPERED" } }),
      queryDataId: "TAMPERED",
      queryId: null,
      secret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("signature_mismatch");
  });
});
