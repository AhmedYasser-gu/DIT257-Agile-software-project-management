"use client";

import Link from "next/link";
import { SignedOut, SignedIn, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";

type ClaimRow = {
  _id: string;
  _creationTime?: number;
  donation?: { title?: string; pickup_window_start?: string } | null;
  donor?: { business_name?: string } | null;
  status?: string | null;
};

export default function Home() {
  const { userId } = useAuth();

  const status = useQuery(
    api.functions.createUser.getRegistrationStatus,
    userId ? { clerk_id: userId } : "skip"
  );
  const myClaims = useQuery(
    api.functions.listMyClaims.listMyClaims,
    userId ? { clerk_id: userId } : "skip"
  ) as ClaimRow[] | undefined;

  const isReceiver = !!status?.registered && status?.userType === "receiver";

  const [nowTs, setNowTs] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Returns the UTC midnight timestamp (ms) for a given time.
  const getUTCMidnight = (ts: number) => {
    const d = new Date(ts);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  // Today's UTC midnight
  const todayUTCMidnight = getUTCMidnight(nowTs);
  const tomorrowUTCMidnight = todayUTCMidnight + 24 * 60 * 60 * 1000;

  // Only show claims where the creation time falls within today in UTC
  const claimsSorted = useMemo(() => {
    if (!myClaims) return [];
    return myClaims
      .filter((c) => {
        if (!c._creationTime) return false;
        // claim created between today's UTC midnight and next UTC midnight
        return (
          c._creationTime >= todayUTCMidnight &&
          c._creationTime < tomorrowUTCMidnight
        );
      })
      .slice()
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
  }, [myClaims, todayUTCMidnight, tomorrowUTCMidnight]);

  const formatHMS = (ms: number) => {
    const clamped = Math.max(0, ms);
    const totalSeconds = Math.floor(clamped / 1000);
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  };

  const getEffectiveStart = (claim: ClaimRow) => {
    const claimTs = typeof claim._creationTime === "number" ? claim._creationTime : NaN;
    const pickupStartTs = parseDate(claim.donation?.pickup_window_start);
    if (!Number.isNaN(pickupStartTs)) {
      if (Number.isNaN(claimTs)) return pickupStartTs;
      if (claimTs < pickupStartTs) return pickupStartTs;
    }
    if (!Number.isNaN(claimTs)) return claimTs;
    return NaN;
  };

  const fmtTimeLeft = (claim?: ClaimRow) => {
    if (!claim) return "--:--:--";
    const startTs = getEffectiveStart(claim);
    if (Number.isNaN(startTs)) return "--:--:--";
    const totalMs = 60 * 60 * 1000; // 1 hour
    const elapsed = nowTs - startTs;
    const remaining = Math.max(0, totalMs - elapsed);
    return formatHMS(remaining);
  };

  const isExpired = (claim?: ClaimRow) => {
    if (!claim) return false;
    const startTs = getEffectiveStart(claim);
    if (Number.isNaN(startTs)) return false;
    return nowTs - startTs >= 60 * 60 * 1000;
  };

  const parseDate = (s?: string) => {
    if (!s) return NaN;
    // Treat DB timestamps as UTC when timezone missing (global time). Sweden local users will see correct countdowns.
    const hasTZ = /[zZ]|[\+\-]\d{2}:?\d{2}$/.test(s);
    const base = s.includes("T") ? s : s.replace(" ", "T");
    const normalized = hasTZ ? base : `${base}Z`;
    const t = new Date(normalized).getTime();
    if (Number.isNaN(t)) return NaN;
    // If no timezone was present originally, adjust by -2 hours
    return hasTZ ? t : t - 2 * 60 * 60 * 1000;
  };

  const fmtDuration = (ms: number) => formatHMS(ms);

  return (
    <section className="grid gap-6">
      <div className="card">
        <h1 className="text-3xl font-bold">🥗No Leftovers</h1>
        <p className="mt-2 text-subtext">
          Reduce food waste by connecting restaurants and stores with NGOs and
          people nearby.
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <SignedOut>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-subtext">
                Please login or register to proceed forward !
              </p>
              <Link className="btn-primary" href="/login">
                Login / Register
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex gap-3">
              <Link className="btn-primary" href="/dashboard">
                Go to dashboard
              </Link>
              <Link className="btn-outline" href="/explore">
                Explore
              </Link>
            </div>
          </SignedIn>
        </div>
      </div>

      {isReceiver && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your claimed items</h2>
            <Link className="text-info underline text-sm" href="/dashboard">Manage in dashboard</Link>
          </div>
          {myClaims === undefined && (
            <div className="mt-3 text-subtext">Loading your claims…</div>
          )}
          {myClaims && claimsSorted.length === 0 && (
            <div className="mt-3 text-subtext">You have no claims yet today.</div>
          )}
          {myClaims && claimsSorted.length > 0 && (
            <ul className="mt-3 grid gap-2">
              {claimsSorted.map((c) => (
                <li key={c._id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.donation?.title ?? "Donation"}</div>
                    <div className="text-sm text-subtext truncate">{c.donor?.business_name ?? "Donor"}</div>
                  </div>
                  {(() => {
                    // Show "Item picked up" if status is PICKEDUP
                    if (c.status === "PICKEDUP") {
                      return (
                        <div className="shrink-0 text-sm font-medium text-green-700">
                          Item picked up
                        </div>
                      );
                    }
                    const startTs = parseDate(c.donation?.pickup_window_start);
                    const hasStart = !Number.isNaN(startTs);
                    // Before pickup window opens
                    if (hasStart && startTs > nowTs) {
                      const untilStart = startTs - nowTs;
                      return (
                        <div className="shrink-0 text-sm font-medium text-amber-700">
                          Items pickup starts in {fmtDuration(untilStart)}
                        </div>
                      );
                    }
                    // Pickup window open: countdown from effective start
                    const startEffective = getEffectiveStart(c);
                    const expired = isExpired(c);
                    if (Number.isNaN(startEffective)) {
                      return (
                        <div className="shrink-0 text-sm font-medium text-subtext">
                          Pickup time unavailable
                        </div>
                      );
                    }
                    return (
                      <div className={`shrink-0 text-sm font-medium ${expired ? "text-red-600" : "text-green-700"}`}>
                        {expired ? "Time up" : `Pickup within ${fmtDuration(60 * 60 * 1000 - Math.max(0, nowTs - startEffective))}`}
                      </div>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
