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
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (skipNextLookupRef.current) {
      skipNextLookupRef.current = false;
      return;
    }
    const q = (value || "").trim();
    if (q.length < 4) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    const myId = ++requestIdRef.current;

    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (city) params.set("city", city);
        if (province) params.set("province", province);
        const res = await fetch(`/api/geocode/search?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (myId !== requestIdRef.current) return;
        if (skipNextLookupRef.current) return;
        const results = Array.isArray(data.results) ? data.results : [];
        setOptions(results);
        setOpen(results.length > 0);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      } finally {
        if (myId === requestIdRef.current) setLoading(false);
      }
    }, 350);

    return () => {
      ctrl.abort();
      clearTimeout(handle);
    };
  }, [value, city, province]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(opt: AddressOption) {
    skipNextLookupRef.current = true;
    requestIdRef.current++;
    setOptions([]);
    setOpen(false);
    setLoading(false);
    onChange(opt.address);
    onSelect?.(opt);
  }

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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
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
