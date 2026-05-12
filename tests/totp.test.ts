import { describe, it, expect, vi, afterEach } from "vitest";
import { generateTotpSecret, verifyTotp, buildOtpauthUri } from "@/lib/totp";

afterEach(() => {
  vi.useRealTimers();
});

describe("totp", () => {
  it("genera secret base32 de 32 chars (20 bytes)", () => {
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
  });

  it("acepta el codigo del slot actual", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
    // Calculamos el codigo actual reutilizando la propia implementacion
    // verificando que verify acepta lo que ella misma generaria.
    // El test funcional real es que verifyTotp con el codigo correcto pase.
    const correct = pickKnownCode(secret, Date.now());
    expect(verifyTotp(secret, correct)).toBe(true);
  });

  it("rechaza codigo invalido", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    expect(verifyTotp(secret, "000000")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(verifyTotp(secret, "12345")).toBe(false);
    expect(verifyTotp(secret, "1234567")).toBe(false);
  });

  it("acepta codigo de slot anterior dentro del window", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    vi.useFakeTimers();
    const base = new Date(2026, 0, 1, 12, 0, 30).getTime();
    vi.setSystemTime(base);
    const codeAtPrev = pickKnownCode(secret, base - 30_000);
    expect(verifyTotp(secret, codeAtPrev, 1)).toBe(true);
  });

  it("rechaza codigo de hace 3 slots con window=1", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    vi.useFakeTimers();
    const base = new Date(2026, 0, 1, 12, 5, 0).getTime();
    vi.setSystemTime(base);
    const codeOld = pickKnownCode(secret, base - 3 * 30_000);
    // si por casualidad coincide con el slot actual lo descartamos
    const codeNow = pickKnownCode(secret, base);
    if (codeOld === codeNow) return;
    expect(verifyTotp(secret, codeOld, 1)).toBe(false);
  });

  it("buildOtpauthUri genera URI valida", () => {
    const uri = buildOtpauthUri("JBSWY3DPEHPK3PXP", "admin@test.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("issuer=LegalConnect");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });
});

// Helper que reproduce el algoritmo TOTP solo para el test
import crypto from "crypto";
function pickKnownCode(secret: string, timestamp: number): string {
  const counter = Math.floor(timestamp / 30000);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", base32(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(code % 1_000_000).padStart(6, "0");
}
function base32(s: string): Buffer {
  const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = s.replace(/=+$/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const i = ALPH.indexOf(ch);
    if (i === -1) continue;
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
