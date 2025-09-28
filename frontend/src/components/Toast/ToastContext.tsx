"use client";
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
      const toast: Toast = { timeout: 3500, ...t, id };
      setToasts((list) => [...list, toast]);
      if (toast.timeout && toast.timeout > 0) {
        setTimeout(() => remove(id), toast.timeout);
      }
    },
    [remove]
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

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const color = (t: ToastKind) =>
    t === "success" ? "bg-[#2ECC71]" : t === "error" ? "bg-[#E74C3C]" : "bg-[#3498DB]";
  return (
    <div className="fixed z-[60] top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[min(420px,96vw)]">
      {toasts.map((t) => (
        <div key={t.id} className="card shadow-lg border border-[#E0E0E0] p-3 relative overflow-hidden bg-white">
          <div className={`absolute inset-x-0 top-0 h-1 ${color(t.type)}`} />
          <div className="pt-2">
            <div className="font-medium text-[#212121]">{t.title}</div>
            {t.message && <div className="text-xs mt-0.5 text-[#212121]/70">{t.message}</div>}
            <button className="btn-outline mt-2 px-2 py-1 text-xs" onClick={() => onDismiss(t.id)}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
