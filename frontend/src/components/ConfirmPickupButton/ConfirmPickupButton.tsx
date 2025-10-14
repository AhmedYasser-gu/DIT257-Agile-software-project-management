"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/Modal/ConfirmDialog";
import { useMutation } from "convex/react";
import { api } from "@/convexApi";
import { useToast } from "@/components/Toast/ToastContext";

type ConfirmPickupButtonProps = {
  claimId: string;
  pickupWindowStart?: string;
  disabledText?: string;
};

function hasPickupStarted(start?: string): boolean {
  if (!start) return false;
  const startTime = new Date(start.includes("T") ? start : start.replace(" ", "T")).getTime();
  return Date.now() >= startTime;
}

export default function ConfirmPickupButton({
  claimId,
  pickupWindowStart,
  disabledText = "You can confirm after pickup window starts.",
}: ConfirmPickupButtonProps) {
  const [open, setOpen] = useState(false);
  const confirmPickup = useMutation(api.functions.confirmPickup.confirmPickup);
  const toast = useToast();

  const pickupStarted = hasPickupStarted(pickupWindowStart);

  const doConfirmPickup = async () => {
    try {
      await confirmPickup({ claim_id: claimId });
      toast.success("Pickup confirmed!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to confirm pickup";
      toast.error(msg);
    } finally {
      setOpen(false);
    }
  };

  if (!pickupStarted) {
    return <p className="text-xs text-gray-500 italic mt-2 text-right">{disabledText}</p>;
  }

  return (
    <>
      <button
        className="btn-primary mt-2 w-fit"
        onClick={() => setOpen(true)}
      >
        Confirm pickup
      </button>

      <ConfirmDialog
        open={open}
        title="Confirm pickup?"
        description="Please confirm that you have collected this donation."
        confirmText="Yes, I picked it up"
        cancelText="Cancel"
        onConfirm={doConfirmPickup}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
