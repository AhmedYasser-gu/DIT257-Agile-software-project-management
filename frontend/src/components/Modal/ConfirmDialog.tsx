"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: PropsWithChildren<Props>) {
  const root = typeof window !== "undefined" ? document.getElementById("modal-root") : null;
  const firstBtn = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => firstBtn.current?.focus(), 0);
  }, [open]);

  if (!open || !root) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded p-5 max-w-md w-full shadow-md">
          <div className="text-lg font-semibold">{title}</div>
          {description && <p className="text-sm text-subtext mt-1">{description}</p>}
          <div className="mt-4 flex gap-2 justify-end">
            <button ref={firstBtn} className="btn-outline" onClick={onCancel}>{cancelText}</button>
            <button className="btn-primary" onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>,
    root
  );
}
