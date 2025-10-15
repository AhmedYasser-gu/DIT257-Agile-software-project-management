"use client";
import React from "react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";
export type Toast = {
  id: string;
  type: ToastKind;
  title: string;
  message?: string;
  timeout?: number;
};

type Ctx = {
  toasts: Toast[];
  // main API
  show: (t: Omit<Toast, "id">) => void;
  success: (title: string, message?: string, timeout?: number) => void;
  error: (title: string, message?: string, timeout?: number) => void;
  info: (title: string, message?: string, timeout?: number) => void;
  remove: (id: string) => void;
  // backwards‑compat alias (some pages still use push({...}))
  push: (t: { title: string; message?: string; timeout?: number; kind?: ToastKind; type?: ToastKind }) => void;
};

const ToastContext = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${idRef.current++}`;
      const toast: Toast = { timeout: 5000, ...t, id };
      setToasts((list) => [...list, toast]);
    },
    []
  );

  const success = useCallback((title: string, message?: string, timeout?: number) => {
    show({ type: "success", title, message, timeout });
  }, [show]);
  const error = useCallback((title: string, message?: string, timeout?: number) => {
    show({ type: "error", title, message, timeout });
  }, [show]);
  const info = useCallback((title: string, message?: string, timeout?: number) => {
    show({ type: "info", title, message, timeout });
  }, [show]);

  // alias for older code that calls push({ title, kind })
  const push: Ctx["push"] = useCallback(
    ({ title, message, timeout, kind, type }) => {
      const t = type ?? kind ?? "info";
      show({ type: t, title, message, timeout });
    },
    [show]
  );

  const value: Ctx = useMemo(
    () => ({ toasts, show, success, error, info, remove, push }),
    [toasts, show, success, error, info, remove, push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

const color = (t: ToastKind) =>
  t === "success" ? "bg-primary" : t === "error" ? "bg-rose-500" : "bg-sky-500";

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed z-[60] bottom-4 right-4 flex flex-col-reverse items-end gap-2 w-[min(420px,96vw)] pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  const duration = t.timeout && t.timeout > 0 ? t.timeout : 5000;
  const [animate, setAnimate] = useState(false);

  // Start countdown and auto-dismiss
  React.useEffect(() => {
    const timeoutId = setTimeout(() => onDismiss(t.id), duration);
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(raf);
    };
  }, [t.id, duration, onDismiss]);

  return (
    <div className="card shadow-lg border border-border p-3 relative overflow-hidden bg-card pointer-events-auto">
      <div
        className={`absolute left-0 top-0 h-1 ${color(t.type)}`}
        style={{ width: animate ? "0%" : "100%", transition: `width ${duration}ms linear` }}
      />
      <button
        aria-label="Close"
        className="absolute top-2 right-2 text-subtext hover:text-text text-sm"
        onClick={() => onDismiss(t.id)}
      >
        ×
      </button>
      <div className="pt-2">
        <div className="font-medium text-text">{t.title}</div>
        {t.message && <div className="text-xs mt-0.5 text-subtext">{t.message}</div>}
      </div>
    </div>
  );
}
