"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en.json";
import sv from "@/locales/sv.json";

type Lang = "en" | "sv";
type Messages = Record<string, string>;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  // load saved language on mount
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("nl.lang")) as Lang | null;
    if (saved === "sv" || saved === "en") setLang(saved);
  }, []);

  // persist + set <html lang="">
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("nl.lang", lang);
    if (typeof document !== "undefined") document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const messages: Messages = useMemo(() => (lang === "sv" ? sv : en), [lang]);

  const t = (key: string) => messages[key] ?? key; // safe fallback

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
