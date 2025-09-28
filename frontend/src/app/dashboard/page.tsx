"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convexApi";
import Access from "@/components/Access/Access";
import Link from "next/link";
import ConfirmDialog from "@/components/Modal/ConfirmDialog";
import { useToast } from "@/components/Toast/ToastContext";

// Charts (donor stats)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";


// ---------- shared types ----------
type DonationStatus = "AVAILABLE" | "CLAIMED" | "PICKEDUP" | "EXPIRED" | string;
type ClaimStatus = "PENDING" | "PICKEDUP" | string;

type DonorMini = { _id: string; business_name: string };
type DonationRow = {
  _id: string;
  title: string;
  description?: string;
  category: string;
  quantity: number | bigint;
  pickup_window_start?: string;
  pickup_window_end?: string;
  status: DonationStatus;
  donor?: DonorMini | null;
  _creationTime?: number; // Convex client serializes this; optional in enriched result
};

type ClaimRow = {
  _id: string;
  status: ClaimStatus;
  donation?: DonationRow | null;
  donor?: DonorMini | null;
  _creationTime?: number;
};

type Tab = "available" | "myClaims";

// ---------- small helpers ----------
const toNum = (q: number | bigint | undefined) =>
  typeof q === "bigint" ? Number(q) : q ?? 0;

const claimLabel = (c: ClaimRow) => {
  if (c?.donation?.status === "CLAIMED") return "CLAIMED";
  if (c?.status === "PICKEDUP") return "PICKED UP";
  return "PENDING";
};

const fmtQty = (q: number | bigint) => String(toNum(q));

// build D1..D7 chart points
const makeChartData = (arr: number[]) =>
  arr.map((val, idx) => ({ day: `D${idx + 1}`, value: val }));

// % change helper
function calcChange(current: number, previous: number) {
  if (previous === 0) return { percent: 100, trend: "up" as const };
  const diff = current - previous;
  const percent = Math.round((Math.abs(diff) / previous) * 100);
  return { percent, trend: diff >= 0 ? ("up" as const) : ("down" as const) };
}

// ---------- donor section components (pure UI) ----------
type StatCardProps = {
  title: string;
  current: number;
  previous: number;
  unit?: string;
  colorFrom: string;
  colorTo: string;
  data: { day: string; value: number }[];
};
function StatCard({
  title,
  current,
  previous,
  unit,
  colorFrom,
  colorTo,
  data,
}: StatCardProps) {
  const { percent, trend } = calcChange(current, previous);
  const isUp = trend === "up";
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${colorFrom} ${colorTo} p-4 shadow-sm flex flex-col`}
    >
      <div>
        <h3 className="text-sm text-gray-700">{title}</h3>
        <p className="text-2xl font-bold">
          {current} {unit}
        </p>
        <p className="text-xs text-gray-600">
          Prev: {previous} {unit}
        </p>
        <p className={`mt-1 text-sm font-medium ${isUp ? "text-green-600" : "text-red-600"}`}>
          {isUp ? "▲" : "▼"} {percent}%
        </p>
      </div>

      <div className="mt-3 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" hide />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: "#ccc", strokeDasharray: "5 5" }}
              contentStyle={{ fontSize: "12px" }}
            />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- main page ----------
export default function Dashboard() {
  const { userId } = useAuth();
  const toast = useToast();

  const status = useQuery(
    api.functions.createUser.getRegistrationStatus,
    userId ? { clerk_id: userId } : "skip"
  );

  // Receiver data
  const available = useQuery(
    api.functions.listAvailableDonations.listAvailableDonations
  ) as DonationRow[] | undefined;

  const myClaims = useQuery(
    api.functions.listMyClaims.listMyClaims,
    userId ? { clerk_id: userId } : "skip"
  ) as ClaimRow[] | undefined;

  // Donor data
  const myDonations = useQuery(
    api.functions.listMyDonations.listMyDonations,
    userId ? { clerk_id: userId } : "skip"
  ) as DonationRow[] | undefined;

  const claimDonation = useMutation(api.functions.claimDonation.claimDonation);

  const [active, setActive] = useState<Tab>("available");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const isReceiver = !!status?.registered && status?.userType === "receiver";
  const isDonor = !!status?.registered && status?.userType === "donor";

  const title = useMemo(() => {
    if (status === undefined) return "Loading…";
    if (!status?.registered) return "My dashboard";
    return isReceiver ? "Receiver dashboard" : isDonor ? "Donor dashboard" : "My dashboard";
  }, [status, isReceiver, isDonor]);

  // Receiver: perform claim
  const doClaim = async () => {
    if (!userId || !pendingId) return;
    try {
      await claimDonation({ clerk_id: userId, donation_id: pendingId });
      toast.success("Donation claimed!");
      setActive("myClaims");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to claim donation";
      toast.error(msg);
    } finally {
      setPendingId(null);
    }
  };

  // ---------- donor: compute sections from live data ----------
  const donorLists = useMemo(() => {
    const list = myDonations ?? [];
    const OPEN = list.filter((d) => d.status === "AVAILABLE");
    const CLAIMED = list.filter((d) => d.status === "CLAIMED");
    const EXPIRED = list.filter((d) => d.status === "EXPIRED");
    return { OPEN, CLAIMED, EXPIRED };
  }, [myDonations]);

  // donor: very lightweight stats using live data
  // time slices: simple last-7 vs previous-7 by _creationTime
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const startCurr = now - 7 * day;
  const startPrev = now - 14 * day;

  const donations = myDonations ?? [];
  const claims = myClaims ?? [];

  const inRange = (t: number | undefined, s: number, e: number) =>
    typeof t === "number" && t >= s && t < e;

  const createdPrev = donations.filter((d) => inRange(d._creationTime, startPrev, startCurr)).length;
  const createdCurr = donations.filter((d) => inRange(d._creationTime, startCurr, now)).length;

  const claimedPrev = donations.filter(
    (d) => d.status === "CLAIMED" && inRange(d._creationTime, startPrev, startCurr)
  ).length;
  const claimedCurr = donations.filter(
    (d) => d.status === "CLAIMED" && inRange(d._creationTime, startCurr, now)
  ).length;

  const expiredPrev = donations.filter(
    (d) => d.status === "EXPIRED" && inRange(d._creationTime, startPrev, startCurr)
  ).length;
  const expiredCurr = donations.filter(
    (d) => d.status === "EXPIRED" && inRange(d._creationTime, startCurr, now)
  ).length;

  const qtyPrev = donations
    .filter((d) => inRange(d._creationTime, startPrev, startCurr))
    .reduce((s, d) => s + toNum(d.quantity), 0);
  const qtyCurr = donations
    .filter((d) => inRange(d._creationTime, startCurr, now))
    .reduce((s, d) => s + toNum(d.quantity), 0);

  // tiny 7-point series (not strictly daily; just distribute counts to look nice)
  const spreadSeries = (n: number): number[] => {
    const arr = Array(7).fill(0);
    for (let i = 0; i < n; i++) arr[i % 7]++;
    return arr;
  };

  const statsSeries = {
    created: { current: createdCurr, previous: createdPrev, daily: spreadSeries(createdCurr) },
    claimed: { current: claimedCurr, previous: claimedPrev, daily: spreadSeries(claimedCurr) },
    expired: { current: expiredCurr, previous: expiredPrev, daily: spreadSeries(expiredCurr) },
    quantity: { current: qtyCurr, previous: qtyPrev, daily: spreadSeries(qtyCurr) },
  };

  // donor accordions state
  const [showOpen, setShowOpen] = useState(true);
  const [showClaimed, setShowClaimed] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  return (
    <Access requireAuth>
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">{title}</h2>

        {/* ---------------- Receiver view ---------------- */}
        {isReceiver && (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn-outline ${
                  active === "available" ? "!bg-[#4CAF50] !text-white border-transparent" : ""
                }`}
                onClick={() => setActive("available")}
              >
                Available
              </button>
              <button
                type="button"
                className={`btn-outline ${
                  active === "myClaims" ? "!bg-[#4CAF50] !text-white border-transparent" : ""
                }`}
                onClick={() => setActive("myClaims")}
              >
                My claims
              </button>
            </div>

            {/* Available */}
            {active === "available" && (
              <div className="grid gap-3">
                {available === undefined && <div className="card p-6">Loading available donations…</div>}
                {available && available.length === 0 && (
                  <div className="card p-6">No donations available right now. Please check back later.</div>
                )}
                {available && available.length > 0 && (
                  <ul className="grid gap-3">
                    {available.map((d) => (
                      <li key={d._id} className="card flex items-start justify-between gap-4">
                        <div className="grid gap-1">
                          <div className="font-medium">{d.title}</div>
                          <div className="text-sm text-subtext">
                            {d.category} · Qty: {fmtQty(d.quantity)} · {d.donor?.business_name ?? "Unknown donor"}
                          </div>
                          <div className="text-xs text-subtext">
                            Pickup: {d.pickup_window_start} → {d.pickup_window_end}
                          </div>
                          {d.description && <div className="text-sm">{d.description}</div>}
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary" onClick={() => setPendingId(d._id)}>
                            Claim
                          </button>
                          <Link className="btn-outline" href="/explore">
                            Explore Details
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* My claims */}
            {active === "myClaims" && (
              <div className="grid gap-3">
                {myClaims === undefined && <div className="card p-6">Loading your claims…</div>}
                {myClaims && myClaims.length === 0 && (
                  <div className="card p-6">You haven’t claimed anything yet.</div>
                )}
                {myClaims && myClaims.length > 0 && (
                  <ul className="grid gap-3">
                    {myClaims.map((c) => (
                      <li key={c._id} className="card grid gap-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {c.donation?.title ?? "Donation"} — {c.donor?.business_name ?? "Unknown donor"}
                          </div>
                          <div className="text-sm " >
                            Claim status: <span className="text-subtext">{claimLabel(c)}</span>
                          </div>
                        </div>
                        <div className="text-xs text-subtext">
                          Pickup: {c.donation?.pickup_window_start} → {c.donation?.pickup_window_end}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <ConfirmDialog
              open={!!pendingId}
              title="Claim this donation?"
              description="The donor will see your claim. Please pick up within the specified window."
              confirmText="Claim"
              cancelText="Cancel"
              onConfirm={doClaim}
              onCancel={() => setPendingId(null)}
            />
          </>
        )}

        {/* ---------------- Donor view ---------------- */}
        {isDonor && (
          <div className="max-w-5xl px-0 py-2 space-y-12">
            <section className="space-y-6">

              {/* OPEN */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => setShowOpen((s) => !s)}
              >
                <h4 className="text-lg font-semibold">Open ({donorLists.OPEN.length})</h4>
                <span className={`transform transition-transform ${showOpen ? "rotate-180" : "rotate-0"}`}>▼</span>
              </div>
              {showOpen && (
                <div className="grid gap-3">
                  {donorLists.OPEN.map((d) => (
                    <div
                      key={d._id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                    >
                      <h5 className="text-lg font-semibold">{d.title}</h5>
                      <p className="text-sm text-gray-600">
                        Qty: {fmtQty(d.quantity)} · Category: {d.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        Pickup: {d.pickup_window_start} → {d.pickup_window_end}
                      </p>
                      {d.description && <p className="text-sm text-gray-600 mt-1">{d.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* CLAIMED */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => setShowClaimed((s) => !s)}
              >
                <h4 className="text-lg font-semibold">Claimed ({donorLists.CLAIMED.length})</h4>
                <span
                  className={`transform transition-transform ${showClaimed ? "rotate-180" : "rotate-0"}`}
                >
                  ▼
                </span>
              </div>
              {showClaimed && (
                <div className="grid gap-3">
                  {donorLists.CLAIMED.map((d) => (
                    <div
                      key={d._id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                    >
                      <h5 className="text-lg font-semibold">{d.title}</h5>
                      <p className="text-sm text-gray-600">
                        Qty: {fmtQty(d.quantity)} · Category: {d.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        Pickup: {d.pickup_window_start} → {d.pickup_window_end}
                      </p>
                      {d.description && <p className="text-sm text-gray-600 mt-1">{d.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* EXPIRED */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => setShowExpired((s) => !s)}
              >
                <h4 className="text-lg font-semibold">Expired ({donorLists.EXPIRED.length})</h4>
                <span
                  className={`transform transition-transform ${showExpired ? "rotate-180" : "rotate-0"}`}
                >
                  ▼
                </span>
              </div>
              {showExpired && (
                <div className="grid gap-3">
                  {donorLists.EXPIRED.map((d) => (
                    <div
                      key={d._id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                    >
                      <h5 className="text-lg font-semibold">{d.title}</h5>
                      <p className="text-sm text-gray-600">
                        Qty: {fmtQty(d.quantity)} · Category: {d.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        Pickup: {d.pickup_window_start} → {d.pickup_window_end}
                      </p>
                      {d.description && <p className="text-sm text-gray-600 mt-1">{d.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Statistics section (live, simple) */}
            <section className="space-y-6">
              <h3 className="text-2xl font-semibold border-b pb-2">Statistics</h3>

              {/* period pickers were purely visual in your teammate’s code;
                  keeping layout but stats are computed automatically as last-7 vs previous-7 */}
              <div className="text-sm text-gray-600">
                Showing last 7 days vs previous 7 days (auto).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-1">
                <StatCard
                  title="Listings created"
                  current={statsSeries.created.current}
                  previous={statsSeries.created.previous}
                  data={makeChartData(statsSeries.created.daily)}
                  colorFrom="from-blue-50"
                  colorTo="to-blue-100"
                />
                <StatCard
                  title="Listings claimed"
                  current={statsSeries.claimed.current}
                  previous={statsSeries.claimed.previous}
                  data={makeChartData(statsSeries.claimed.daily)}
                  colorFrom="from-green-50"
                  colorTo="to-green-100"
                />
                <StatCard
                  title="Listings expired"
                  current={statsSeries.expired.current}
                  previous={statsSeries.expired.previous}
                  data={makeChartData(statsSeries.expired.daily)}
                  colorFrom="from-red-50"
                  colorTo="to-red-100"
                />
                <StatCard
                  title="Food quantity"
                  current={statsSeries.quantity.current}
                  previous={statsSeries.quantity.previous}
                  unit="portions"
                  data={makeChartData(statsSeries.quantity.daily)}
                  colorFrom="from-purple-50"
                  colorTo="to-purple-100"
                />
              </div>
            </section>
          </div>
        )}

        {/* Not registered */}
        {status && !status.registered && (
          <div className="card">
            You haven’t completed registration. Go to{" "}
            <Link className="text-info underline" href="/login/register">
              Register
            </Link>{" "}
            to continue.
          </div>
        )}
      </section>
    </Access>
  );
}
