"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PRESET_FOOD_CATEGORIES } from "@/constants/categories";

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helper?: string;
  presets?: readonly string[];
};

export default function CategorySelect({
  label = "Category",
  value,
  onChange,
  placeholder = "Type or pick a category…",
  helper = "Choose from suggestions or type your own.",
  presets = PRESET_FOOD_CATEGORIES,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);
  const [active, setActive] = useState(0);

  // IMPORTANT: label ref must be HTMLLabelElement to match the <label> below
  const boxRef = useRef<HTMLLabelElement | null>(null);

  // keep input text in sync when parent changes value
  useEffect(() => {
    setQ(value);
  }, [value]);

  const options = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = presets.slice();
    if (!t) return base;
    return base.filter((c) => c.toLowerCase().includes(t));
  }, [q, presets]);

  // click-away
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = boxRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectValue = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setQ(trimmed);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && options.length > 0) selectValue(options[active]);
      else selectValue(q);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const typedIsNew =
    !!q.trim() && !presets.some((p) => p.toLowerCase() === q.trim().toLowerCase());

  return (
    <label className="grid gap-1" ref={boxRef}>
      <span className="label">{label}</span>

      <div className="relative">
        <input
          className="input pr-28"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />

        {/* Quick confirm button for typed value */}
        <div className="absolute inset-y-0 right-1 flex items-center">
          <button
            type="button"
            className="btn-outline !py-1 !px-2 text-xs"
            onClick={() => selectValue(q)}
            disabled={!q.trim()}
            title="Use typed category"
          >
            Selected “{q.trim() || "…"}”
          </button>
        </div>

        {open && (options.length > 0 || typedIsNew) && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow-lg">
            {options.map((c, i) => (
              <button
                key={c}
                type="button"
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-muted/40 ${
                  i === active ? "bg-muted/40" : ""
                }`}
                onMouseEnter={() => setActive(i)}
                onClick={() => selectValue(c)}
              >
                {c}
              </button>
            ))}
            {typedIsNew && <div className="border-t" />}
            {typedIsNew && (
              <button
                type="button"
                className="block w-full text-left px-3 py-2 text-sm hover:bg-muted/40"
                onClick={() => selectValue(q)}
              >
                + Create “{q.trim()}”
              </button>
            )}
          </div>
        )}
      </div>

      {helper && <span className="text-xs text-subtext">{helper}</span>}

      {/* Quick chips for most used */}
      <div className="flex flex-wrap gap-2 pt-1">
        {(presets.slice(0, 15) as string[]).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => selectValue(c)}
            className={`px-2 py-1 rounded-full text-xs border ${
              value.toLowerCase() === c.toLowerCase()
                ? "bg-muted/60"
                : "hover:bg-muted/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </label>
  );
}
