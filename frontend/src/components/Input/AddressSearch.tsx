"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GeoCandidate, searchAddress } from "@/helpers/geocode";

type Props = {
  label?: string;
  value: string;                          // controlled text value
  onChangeText: (v: string) => void;      // typing
  onSelectPlace: (c: GeoCandidate) => void; // pick from suggestions
  placeholder?: string;
};

export default function AddressSearch({
  label = "Address",
  value,
  onChangeText,
  onSelectPlace,
  placeholder = "Search address…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GeoCandidate[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLLabelElement | null>(null);
  const timer = useRef<number | null>(null);

  // Debounced fetch
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!value.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }
    timer.current = window.setTimeout(async () => {
      try {
        const res = await searchAddress(value, 8);
        setItems(res);
        setOpen(res.length > 0);
        setActive(0);
      } catch {
        setOpen(false);
      }
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value]);

  // click‑away
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = items[active];
      if (pick) {
        onSelect(pick);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const onSelect = (c: GeoCandidate) => {
    onSelectPlace(c);
    onChangeText(c.label); // reflect label into the field
    setOpen(false);
  };

  return (
    <label className="grid gap-1" ref={boxRef}>
      <span className="label">{label}</span>
      <input
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChangeText(e.target.value)}
        onFocus={() => setOpen(items.length > 0)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && items.length > 0 && (
        <div className="mt-1 max-h-60 overflow-auto rounded-md border bg-white shadow-lg z-20">
          {items.map((c, i) => (
            <button
              key={`${c.lat},${c.lng},${i}`}
              type="button"
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-muted/40 ${
                i === active ? "bg-muted/40" : ""
              }`}
              onMouseEnter={() => setActive(i)}
              onClick={() => onSelect(c)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
