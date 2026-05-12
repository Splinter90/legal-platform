import { describe, it, expect } from "vitest";
import {
  LAWYER_STATUS_TRANSITIONS,
  canTransitionLawyerStatus,
} from "@/lib/lawyer-status-transitions";

describe("canTransitionLawyerStatus", () => {
  it.each([
    ["pending", "approved"],
    ["pending", "rejected"],
    ["approved", "suspended"],
    ["rejected", "pending"],
    ["suspended", "approved"],
    ["incomplete", "rejected"],
  ])("permite %s -> %s", (from, to) => {
    expect(canTransitionLawyerStatus(from, to)).toBe(true);
  });

  it.each([
    ["incomplete", "approved"],
    ["incomplete", "pending"],
    ["pending", "suspended"],
    ["approved", "rejected"],
    ["approved", "pending"],
    ["rejected", "approved"],
    ["suspended", "rejected"],
    ["suspended", "pending"],
  ])("rechaza %s -> %s", (from, to) => {
    expect(canTransitionLawyerStatus(from, to)).toBe(false);
  });

  it("rechaza estados desconocidos", () => {
    expect(canTransitionLawyerStatus("frozen", "approved")).toBe(false);
    expect(canTransitionLawyerStatus("approved", "deleted")).toBe(false);
  });

  it("ningun estado puede transicionar a si mismo", () => {
    for (const status of Object.keys(LAWYER_STATUS_TRANSITIONS)) {
      expect(canTransitionLawyerStatus(status, status)).toBe(false);
    }
  });
});
