// Argentine mobile phone helpers. Display format: "+54 9 11 1234-5678".
// Canonical storage format: "+5491112345678".

export function stripARPhone(value: string): string {
  let d = (value || "").replace(/\D/g, "");
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9")) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("15")) d = d.slice(2);
  return d.slice(0, 10);
}

export function formatPhoneAR(value: string): string {
  const d = stripARPhone(value);
  if (!d) return "";
  if (d.length <= 2) return `+54 9 ${d}`;
  if (d.length <= 6) return `+54 9 ${d.slice(0, 2)} ${d.slice(2)}`;
  return `+54 9 ${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6, 10)}`;
}

export function normalizePhoneAR(value: string): string | null {
  const d = stripARPhone(value);
  if (d.length !== 10) return null;
  return `+549${d}`;
}

export function validatePhoneAR(value: string): boolean {
  return normalizePhoneAR(value) !== null;
}

export function isOptionalPhoneARValid(value: string | null | undefined): boolean {
  if (!value || String(value).trim() === "") return true;
  return validatePhoneAR(String(value));
}
