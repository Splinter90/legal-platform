"use client";
import { Input } from "@/components/ui/input";
import { formatPhoneAR, isOptionalPhoneARValid } from "@/lib/phone";

interface PhoneInputARProps {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  showErrorOnIncomplete?: boolean;
}

export function PhoneInputAR({
  label = "Celular",
  value,
  onChange,
  required,
  error,
  placeholder = "+54 9 11 1234-5678",
  disabled,
  showErrorOnIncomplete,
}: PhoneInputARProps) {
  const display = formatPhoneAR(value || "");
  const computedError =
    error ??
    (showErrorOnIncomplete && value && !isOptionalPhoneARValid(value)
      ? "Numero incompleto (ej: +54 9 11 1234-5678)"
      : undefined);

  return (
    <Input
      label={label}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder={placeholder}
      value={display}
      onChange={(e) => onChange(formatPhoneAR(e.target.value))}
      required={required}
      error={computedError}
      disabled={disabled}
    />
  );
}
