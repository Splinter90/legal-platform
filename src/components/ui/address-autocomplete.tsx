"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface AddressOption {
  label: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onSelect?: (opt: AddressOption) => void;
  placeholder?: string;
  required?: boolean;
  city?: string;
  province?: string;
  helper?: string;
}

export function AddressAutocomplete({
  label = "Direccion",
  value,
  onChange,
  onSelect,
  placeholder = "Ej: Av. Corrientes 1234",
  required,
  city,
  province,
  helper,
}: AddressAutocompleteProps) {
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextLookupRef = useRef(false);

  useEffect(() => {
    const q = (value || "").trim();
    if (skipNextLookupRef.current) {
      skipNextLookupRef.current = false;
      return;
    }
    if (q.length < 4) {
      setOptions([]);
      setOpen(false);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (city) params.set("city", city);
        if (province) params.set("province", province);
        const res = await fetch(`/api/geocode/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          setOptions(Array.isArray(data.results) ? data.results : []);
          setOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [value, city, province]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => options.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-[34px] w-4 h-4 text-slate-400 animate-spin pointer-events-none" />
      )}
      {open && options.length > 0 && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {options.map((opt, i) => (
            <button
              key={`${opt.label}-${i}`}
              type="button"
              onClick={() => {
                skipNextLookupRef.current = true;
                onChange(opt.address);
                onSelect?.(opt);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 border-b border-slate-100 last:border-0 flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 mt-0.5 text-brand-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{opt.address}</p>
                <p className="text-xs text-slate-500 truncate">{opt.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}
