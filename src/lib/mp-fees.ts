// Mercado Pago Checkout Pro fee helpers (Argentina).
// MP does not expose a public fee API, so defaults are kept here and the admin
// can override them in /admin/settings. Source: https://www.mercadopago.com.ar/costs-section

export type MPAccreditationScheme = "immediate" | "14days" | "28days" | "custom";

export interface MPFeeConfig {
  scheme: MPAccreditationScheme;
  feePercent: number;
  fixedFee: number;
  ivaPercent: number;
}

export const MP_SCHEME_DEFAULTS: Record<
  Exclude<MPAccreditationScheme, "custom">,
  { feePercent: number; fixedFee: number; label: string }
> = {
  immediate: { feePercent: 6.29, fixedFee: 4, label: "Acreditación inmediata" },
  "14days": { feePercent: 3.99, fixedFee: 0, label: "Acreditación a 14 días" },
  "28days": { feePercent: 2.99, fixedFee: 0, label: "Acreditación a 28 días" },
};

export const MP_OFFICIAL_FEES_URL = "https://www.mercadopago.com.ar/costs-section";

export interface MPBreakdown {
  gross: number;
  mpBaseFee: number;
  mpIva: number;
  mpTotalFee: number;
  marketplaceReceives: number;
  platformCommission: number;
  lawyerReceives: number;
}

export function calculateMPBreakdown(
  gross: number,
  platformCommissionPercent: number,
  mp: MPFeeConfig
): MPBreakdown {
  const safeGross = Number.isFinite(gross) ? Math.max(0, gross) : 0;
  const mpBaseFee = safeGross * (mp.feePercent / 100) + mp.fixedFee;
  const mpIva = mpBaseFee * (mp.ivaPercent / 100);
  const mpTotalFee = mpBaseFee + mpIva;
  const marketplaceReceives = safeGross - mpTotalFee;
  const platformCommission = safeGross * (platformCommissionPercent / 100);
  const lawyerReceives = marketplaceReceives - platformCommission;
  return {
    gross: safeGross,
    mpBaseFee,
    mpIva,
    mpTotalFee,
    marketplaceReceives,
    platformCommission,
    lawyerReceives,
  };
}

export function isValidScheme(value: string): value is MPAccreditationScheme {
  return ["immediate", "14days", "28days", "custom"].includes(value);
}
