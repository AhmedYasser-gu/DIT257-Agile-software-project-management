"use client";

import Link from "next/link";
import { SignedOut, SignedIn, useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";
import ConfirmPickupButton from "@/components/ConfirmPickupButton/ConfirmPickupButton";

type ClaimRow = {
  _id: string;
  _creationTime?: number;
  donation?: { title?: string; pickup_window_start?: string } | null;
  donor?: { business_name?: string } | null;
  status?: string | null;
};

type ImpactMetrics = {
  totals: {
    donations: number;
    donors: number;
    receivers: number;
    claims: number;
  };
  food: {
    totalQuantity: number;
    rescuedQuantity: number;
    claimedQuantity: number;
    availableQuantity: number;
  };
  claims: {
    totalClaims: number;
    pickedUpClaims: number;
    pickedUpQuantity: number;
    pendingClaims: number;
    timedOutClaims: number;
  };
};

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toString();
}

const landingHighlights = [
  {
    badge: "Donor tools",
    title: "Post surplus in minutes",
    description:
      "Restaurants, cafés, and grocers create rich listings with photos, pickup windows, and portion counts while meals are still fresh.",
    icon: "🥗",
  },
  {
    badge: "Receiver experience",
    title: "Discover what is nearby",
    description:
      "NGOs and vetted individuals search, filter, and explore a live map that highlights trusted donors and countdowns for every pickup window.",
    icon: "🗺️",
  },
  {
    badge: "Shared outcomes",
    title: "Dashboards for both roles",
    description:
      "Donors follow claims, pickups, and impact stats while receivers track reservations and logistics with real-time status updates.",
    icon: "📊",
  },
  {
    badge: "Reliable logistics",
    title: "Keep every handover smooth",
    description:
      "Hour-by-hour timers, pickup confirmations, and clear instructions reduce spoilage and last-minute surprises for everyone involved.",
    icon: "⏱️",
  },
];

const landingSteps = [
  {
    title: "Share surplus",
    detail: "Post ready-to-serve meals, produce, or pantry items with simple pickup instructions and portion counts.",
  },
  {
    title: "Match instantly",
    detail: "Receivers browse the live feed, claim what fits their community, and coordinate pickups with confidence.",
  },
  {
    title: "Prove the impact",
    detail: "Dashboards and confirmation flows help every partner report rescued meals and build long-term relationships.",
  },
];

const landingTestimonials = [
  {
    quote:
      "Some quote",
    name: "Restaurant owner",
  },
  {
    quote:
      "Some quote",
    name: "Some receiver",
  },
];

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

  const impactMetrics = useQuery(api.functions.impact.getImpactMetrics) as ImpactMetrics | undefined;

  const landingStats = useMemo(() => {
    const rescuedQty = impactMetrics?.food.rescuedQuantity;
    const donors = impactMetrics?.totals.donors ?? 0;
    const receivers = impactMetrics?.totals.receivers ?? 0;
    const partnerNetwork = donors + receivers;

    const totalClaims = impactMetrics?.claims.totalClaims ?? 0;
    const pickedUpClaims = impactMetrics?.claims.pickedUpClaims ?? 0;
    const pickupSuccessPct = totalClaims > 0 ? Math.round((pickedUpClaims / totalClaims) * 100) : null;

    return [
      {
        label: "Meals rescued",
        value: rescuedQty !== undefined ? formatNumber(rescuedQty) : "—",
        context: "Tracked portions saved from landfill in test deployments.",
      },
      {
        label: "Partner network",
        value: impactMetrics ? formatNumber(partnerNetwork) : "—",
        context: "Restaurants, cafés, groceries, and NGOs collaborating today.",
      },
      {
        label: "Pickup success",
        value: pickupSuccessPct !== null ? `${pickupSuccessPct}%` : "—",
        context: "Claims completed within the one hour confirmation window.",
      },
    ];
  }, [impactMetrics]);

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
    const claimTs =
      typeof claim._creationTime === "number" ? claim._creationTime : NaN;
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

  if (!userId) {
    return (
      <section className="grid gap-12">
        <section className="card relative overflow-hidden border-transparent bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-emerald-950 dark:via-zinc-950 dark:to-sky-950">
          <div className="absolute -left-24 top-10 h-48 w-48 rounded-full bg-emerald-200 opacity-40 blur-3xl dark:bg-emerald-900/40" />
          <div className="absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-sky-200 opacity-40 blur-3xl dark:bg-sky-900/40" />
          <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-center">
            <div className="flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm dark:bg-zinc-900/60">
                Zero hunger in every neighborhood
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-text md:text-5xl">
                No Leftovers, the community food-sharing hub
              </h1>
              <p className="text-base text-subtext md:text-lg">
                Connect restaurants, cafés, and grocery stores with NGOs and local receivers who can act fast. Donors post surplus meals with photos and pickup windows while receivers find what they need through search, smart filters, and an interactive map.
              </p>
              <p className="text-base text-subtext md:text-lg">
                Shared dashboards track listings, reservations, and hour-by-hour countdowns so every handover stays smooth. Together we reduce spoilage, build partnerships, and support the UN Zero Hunger goal.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link className="btn-primary btn-action" href="/login">
                  Login or register
                </Link>
                <Link className="btn-outline btn-action" href="/impact">
                  See community impact
                </Link>
              </div>
            </div>
            <div className="grid gap-4 rounded-xl border border-white/60 bg-white/80 p-5 shadow-inner dark:border-white/10 dark:bg-zinc-900/70">
              <h2 className="text-lg font-semibold text-text">Why partners love No Leftovers</h2>
              <div className="grid gap-4">
                {landingHighlights.map((item) => (
                  <div key={item.title} className="rounded-lg border border-border/70 bg-card p-4 shadow-sm dark:border-border/60">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      <span>{item.icon}</span>
                      <span>{item.badge}</span>
                    </div>
                    <p className="mt-2 text-base font-medium text-text">{item.title}</p>
                    <p className="mt-1 text-sm text-subtext">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {landingStats.map((stat) => (
            <article key={stat.label} className="card h-full">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-text">{stat.value}</p>
              <p className="mt-2 text-sm text-subtext">{stat.context}</p>
            </article>
          ))}
        </section>

        <section className="card">
          <h2 className="text-2xl font-semibold">How the flow works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {landingSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-lg border border-border/70 bg-background px-4 py-5 text-sm shadow-sm"
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="mt-3 text-base font-medium text-text">{step.title}</p>
                <p className="mt-2 text-subtext">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {landingTestimonials.map((item) => (
            <article
              key={item.name}
              className="card h-full border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50 dark:border-emerald-900/70 dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950"
            >
              <p className="text-base italic text-text">&ldquo;{item.quote}&rdquo;</p>
              <p className="mt-3 text-sm font-semibold text-subtext">- {item.name}</p>
            </article>
          ))}
        </section>

        <section className="card border-dashed border-primary bg-primary/5 dark:border-primary/40 dark:bg-primary/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-text">
                Ready to build a food sharing hub in your city?
              </h2>
              <p className="mt-1 text-subtext">
                Create an account to post surplus, discover nearby donations, and turn everyday extra into reliable meals.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link className="btn-primary btn-action" href="/login">
                Start now
              </Link>
              <Link className="btn-outline btn-action" href="/how-it-works">
                Learn how it works
              </Link>
            </div>
          </div>
        </section>
      </section>
    );
  }

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
              {status?.registered && status.userType === "receiver" && (
                <Link className="btn-outline" href="/explore">
                  Explore
                </Link>
              )}
            </div>
          </SignedIn>
        </div>
      </div>

      {isReceiver && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your claimed items</h2>
            <Link className="text-info underline text-sm" href="/dashboard">
              Manage in dashboard
            </Link>
          </div>
          {myClaims === undefined && (
            <div className="mt-3 text-subtext">Loading your claims…</div>
          )}
          {myClaims && claimsSorted.length === 0 && (
            <div className="mt-3 text-subtext">
              You have no claims yet today.
            </div>
          )}
          {myClaims && claimsSorted.length > 0 && (
            <ul className="mt-3 grid gap-2">
              {claimsSorted.map((c) => (
                <li
                  key={c._id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {c.donation?.title ?? "Donation"}
                    </div>
                    <div className="text-sm text-subtext truncate">
                      {c.donor?.business_name ?? "Donor"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                    {(() => {
                      // Show "Item picked up" if status is PICKEDUP
                      if (c.status === "PICKEDUP") {
                        return (
                          <div className="shrink-0 text-sm font-medium text-green-700">
                            Item picked up
                          </div>
                        );
                      }
                      const startTs = parseDate(
                        c.donation?.pickup_window_start
                      );
                      const hasStart = !Number.isNaN(startTs);
                      // Before pickup window opens
                      if (hasStart && startTs > nowTs) {
                        const untilStart = startTs - nowTs;
                        return (
                          <div className="shrink-0 flex flex-col items-end">
                            <div className="text-sm font-medium text-amber-700">
                              Items pickup starts in {fmtDuration(untilStart)}
                            </div>
                          </div>
                        );
                      }
                      // Pickup window open: countdown from effective start
                      const startEffective = getEffectiveStart(c);
                      const expired = isExpired(c);
                      if (Number.isNaN(startEffective)) {
                        return (
                          <div className="shrink-0 flex flex-col items-end">
                            <div className="text-sm font-medium text-subtext">
                              Pickup time unavailable
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="shrink-0 flex flex-col items-end">
                          <div
                            className={`text-sm font-medium ${expired ? "text-red-600" : "text-green-700"}`}
                          >
                            {expired
                              ? "Time up"
                              : `Pickup within ${fmtDuration(60 * 60 * 1000 - Math.max(0, nowTs - startEffective))}`}
                          </div>
                          {c.status === "PENDING" && (
                            <ConfirmPickupButton
                              claimId={c._id}
                              pickupWindowStart={
                                c.donation?.pickup_window_start
                              }
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
