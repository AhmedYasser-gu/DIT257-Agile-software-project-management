"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

type Donation = {
  _id: string;
  title: string;
  description?: string;
  category: string;
  quantity: number | bigint;
  pickup_window_start?: string;
  pickup_window_end?: string;
  status: string;
  donor?: { _id: string; business_name: string; address?: string } | null;
};

type Props = {
  open: boolean;
  donation: Donation | null;
  onClose: () => void;
};

export default function DetailsDialog({ open, donation, onClose }: Props) {
  const root = typeof window !== "undefined" ? document.getElementById("modal-root") : null;
  const closeBtn = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => closeBtn.current?.focus(), 0);
  }, [open]);

  if (!open || !root || !donation) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded shadow-md w-full max-w-2xl">
          <div className="flex items-start justify-between p-4 border-b border-border">
            <div>
              <h3 className="text-lg font-semibold break-anywhere">{donation.title}</h3>
              <div className="text-xs text-subtext mt-0.5 break-anywhere">{donation.category} · Status: {donation.status}</div>
            </div>
            <button
              ref={closeBtn}
              aria-label="Close"
              className="text-[#6B7280] hover:text-[#111827] text-lg px-2"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="p-4 max-h-[70vh] overflow-y-auto break-anywhere">
            <div className="grid gap-2">
              <div className="text-sm break-anywhere"><span className="text-subtext">Quantity:</span> {String(donation.quantity)}</div>
              <div className="text-sm text-subtext break-anywhere">
                Pickup: {donation.pickup_window_start ?? "-"} → {donation.pickup_window_end ?? "-"}
              </div>
              <div className="text-sm break-anywhere">
                <span className="text-subtext">Donor:</span> {donation.donor?.business_name ?? "Unknown donor"}
                {donation.donor?.address && <span> · {donation.donor.address}</span>}
              </div>
              {donation.description && (
                <div className="text-sm whitespace-pre-wrap break-anywhere">
                  {donation.description}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border flex justify-end">
            <button className="btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    root
  );
}


