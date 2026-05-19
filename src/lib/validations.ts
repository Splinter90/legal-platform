const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  return null;
}

export function validateRequired(fields: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
      return `El campo "${key}" es obligatorio`;
    }
  }
  return null;
}

export function validateNumericRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (typeof value !== "number" || isNaN(value)) return `${fieldName} debe ser un número válido`;
  if (value < min || value > max) return `${fieldName} debe estar entre ${min} y ${max}`;
  return null;
}

export function validateFutureDate(dateStr: string): string | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Fecha inválida";
  if (date <= new Date()) return "La fecha debe ser futura";
  return null;
}

export function validateRating(rating: unknown): number | null {
  const n = Number(rating);
  if (isNaN(n) || n < 1 || n > 5 || !Number.isInteger(n)) return null;
  return n;
}

const VALID_LAWYER_STATUSES = ["incomplete", "pending", "approved", "rejected", "suspended"] as const;
export type LawyerStatus = typeof VALID_LAWYER_STATUSES[number];

export function isValidLawyerStatus(status: string): status is LawyerStatus {
  return (VALID_LAWYER_STATUSES as readonly string[]).includes(status);
}

const VALID_CASE_STATUSES = ["initiated", "in_progress", "waiting_docs", "in_court", "resolved"] as const;
export type CaseStatus = typeof VALID_CASE_STATUSES[number];

export function isValidCaseStatus(status: string): status is CaseStatus {
  return (VALID_CASE_STATUSES as readonly string[]).includes(status);
}

const VALID_CRM_STATUSES = ["in_progress", "resolved", "closed"] as const;

export function isValidCrmStatus(status: string): boolean {
  return (VALID_CRM_STATUSES as readonly string[]).includes(status);
}

export function sanitizeFolderName(folder: string): string {
  return folder.replace(/[^a-zA-Z0-9_-]/g, "");
}
