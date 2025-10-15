"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";
import { useToast } from "./ToastContext";

type Donation = {
  _id: string;
  title: string;
  pickup_window_end?: string;
  status: string;
};

type Claim = {
  _id: string;
  status: string;
  donation?: { _id: string; title: string } | null;
};

const TEN_MIN_MS = 10 * 60 * 1000;

export default function RealtimeToasts() {
  const { userId } = useAuth();
  const toast = useToast();

  // Who am I? Avoid unnecessary queries based on role
  const reg = useQuery(
    api.functions.createUser.getRegistrationStatus,
    userId ? { clerk_id: userId } : "skip"
  ) as { registered?: boolean; userType?: "donor" | "receiver" } | undefined;

  const isDonor = !!reg?.registered && reg?.userType === "donor";
  const isReceiver = !!reg?.registered && reg?.userType === "receiver";

  const myDonations = useQuery(
    api.functions.listMyDonations.listMyDonations,
    userId && isDonor ? { clerk_id: userId } : "skip"
  ) as Donation[] | undefined;

  const myClaims = useQuery(
    api.functions.listMyClaims.listMyClaims,
    userId && isReceiver ? { clerk_id: userId } : "skip"
  ) as Claim[] | undefined;

  // Previous snapshots to detect changes
  const prevDonationsRef = useRef<Map<string, Donation>>(new Map());
  const prevClaimsRef = useRef<Map<string, Claim>>(new Map());

  // Track which donations we've already warned about the 10-minute window
  const warnedRef = useRef<Set<string>>(new Set());

  const now = Date.now();

  // Normalize arrays to maps for easier diff
  const donationsById = useMemo(() => {
    const m = new Map<string, Donation>();
    (myDonations ?? []).forEach((d) => m.set(d._id, d));
    return m;
  }, [myDonations]);

  const claimsById = useMemo(() => {
    const m = new Map<string, Claim>();
    (myClaims ?? []).forEach((c) => m.set(c._id, c));
    return m;
  }, [myClaims]);

  // Donor: watch donations for near-expiry and expiry transitions
  useEffect(() => {
    if (!isDonor || !myDonations) return;

    for (const d of myDonations) {
      const prev = prevDonationsRef.current.get(d._id);

      if (prev && d.status !== prev.status) {
        if (d.status === "CLAIMED") {
          toast.info("Donation claimed", d.title ? `"${d.title}" was claimed.` : "One of your donations was claimed.");
        } else if (d.status === "PICKEDUP") {
          toast.success("Donation picked up", d.title ? `"${d.title}" was picked up.` : "A donation was picked up.");
        } else if (d.status === "EXPIRED") {
          toast.info("A donation expired", d.title ? `"${d.title}" expired.` : "A donation expired.");
        }
      }

      if (d.status !== "EXPIRED") {
        const endISO = d.pickup_window_end;
        if (endISO) {
          const endTs = new Date(endISO.includes("T") ? endISO : endISO.replace(" ", "T")).getTime();
          if (!Number.isNaN(endTs)) {
            const msLeft = endTs - now;
            if (msLeft > 0 && msLeft <= TEN_MIN_MS && !warnedRef.current.has(d._id)) {
              warnedRef.current.add(d._id);
              const mins = Math.max(1, Math.floor(msLeft / 60000));
              toast.info(
                "Pickup window ending soon",
                d.title ? `"${d.title}" ends in about ${mins} minute(s).` : "A donation ends soon."
              );
            }
          }
        }
      }
    }

    prevDonationsRef.current = donationsById;
  }, [isDonor, myDonations, donationsById, now, toast]);

  // Receiver: watch claims for status changes
  useEffect(() => {
    if (!isReceiver || !myClaims) return;

    for (const c of myClaims) {
      const prev = prevClaimsRef.current.get(c._id);
      if (!prev) continue;
      if (c.status !== prev.status) {
        const title = c.donation?.title ? `\"${c.donation.title}\"` : "Your claim";
        if (c.status === "PICKEDUP") {
          toast.success("Pickup confirmed", `${title} is marked picked up.`);
        } else if (c.status === "TIMESUP") {
          toast.error("Claim time window ended", `${title} has timed out.`);
        } else if (c.status === "PENDING") {
          toast.info("Claim updated", `${title} is now pending.`);
        }
      }
    }

    // Update snapshot
    prevClaimsRef.current = claimsById;
  }, [isReceiver, myClaims, claimsById, toast]);

  return null;
}



