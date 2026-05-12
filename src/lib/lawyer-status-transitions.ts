export type LawyerStatus =
  | "incomplete"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export const LAWYER_STATUS_TRANSITIONS: Record<LawyerStatus, LawyerStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["suspended"],
  rejected: ["pending"],
  suspended: ["approved"],
  incomplete: ["rejected"],
};

export function canTransitionLawyerStatus(from: string, to: string): boolean {
  const allowed = LAWYER_STATUS_TRANSITIONS[from as LawyerStatus];
  if (!allowed) return false;
  return allowed.includes(to as LawyerStatus);
}
