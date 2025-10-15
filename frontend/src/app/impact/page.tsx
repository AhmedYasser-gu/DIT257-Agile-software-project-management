"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";
import Access from "@/components/Access/Access";
import isoToDate from "@/components/isoToDate/isoToDate";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartTooltipStyle = {
  backgroundColor: "var(--c-card)",
  color: "var(--c-text)",
  borderRadius: "0.5rem",
  border: "1px solid var(--c-border)",
  fontSize: "12px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)",
};

type ImpactMetrics = {
  totals: {
    donations: number;
    donors: number;
    receivers: number;
    claims: number;
  };
  statusBreakdown: {
    available: number;
    claimed: number;
    pickedUp: number;
    expired: number;
  };
  food: {
    totalQuantity: number;
    rescuedQuantity: number;
    claimedQuantity: number;
    availableQuantity: number;
  };
  claims: {
    totalClaims: number;
    totalClaimedQuantity: number;
    pickedUpClaims: number;
    pickedUpQuantity: number;
    pendingClaims: number;
    timedOutClaims: number;
  };
  timeline: Array<{
    day: string;
    donations: number;
    claims: number;
    pickups: number;
    rescuedQuantity: number;
  }>;
  topCategories: Array<{
    category: string;
    donations: number;
    quantity: number;
  }>;
  topDonors: Array<{
    donorId: string;
    donorName: string;
    totalDonations: number;
    totalQuantity: number;
  }>;
  recentDonations: Array<{
    id: string;
    title: string;
    category: string;
    quantity: number;
    status: string;
    donorName: string | null;
    pickupWindowStart?: string;
    pickupWindowEnd?: string;
    createdAt: number;
  }>;
};

type TimelineKey = "donations" | "claims" | "pickups" | "rescuedQuantity";

type StatCardProps = {
  title: string;
  unit?: string;
  current: number;
  previous: number;
  gradient: { from: string; to: string };
  data: { day: string; value: number }[];
};

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  CLAIMED: "bg-sky-100 text-sky-800",
  PICKEDUP: "bg-indigo-100 text-indigo-800",
  EXPIRED: "bg-rose-100 text-rose-800",
};

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "B";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toString();
}

function formatDayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function calcChange(current: number, previous: number) {
  if (previous === 0) {
    return { percent: null as number | null, trend: null as "up" | "down" | null };
  }
  const diff = current - previous;
  const percent = Math.round((Math.abs(diff) / previous) * 100);
  return { percent, trend: diff >= 0 ? "up" : "down" };
}

function StatCard({ title, unit, current, previous, gradient, data }: StatCardProps) {
  const { percent, trend } = calcChange(current, previous);
  const isUp = trend === "up";

  return (
    <div className={`rounded-xl bg-gradient-to-br ${gradient.from} ${gradient.to} p-4 shadow-sm flex flex-col`}
    >
      <div>
        <h3 className="text-sm text-gray-700">{title}</h3>
        <p className="text-2xl font-bold">
          {formatNumber(current)} {unit}
        </p>
        <p className="text-xs text-gray-600">
          Prev: {formatNumber(previous)} {unit}
        </p>
        {percent !== null && (
          <p className={`mt-1 text-sm font-medium ${isUp ? "text-green-700" : "text-rose-600"}`}>
            {isUp ? "▲" : "▼"} {percent}% vs prev period
          </p>
        )}
      </div>
      <div className="mt-3 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
            <XAxis dataKey="day" hide tick={{ fill: "var(--c-subtext)" }} />
            <YAxis hide tick={{ fill: "var(--c-subtext)" }} />
            <Tooltip
              formatter={(value: number) => [String(value), "Value"]}
              labelFormatter={(label: string) => `Date: ${label}`}
              cursor={{ stroke: "var(--c-border)", strokeDasharray: "5 5" }}
              contentStyle={chartTooltipStyle}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--c-primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--c-primary)", strokeWidth: 2, fill: "var(--c-card)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function buildSeries(
  timeline: ImpactMetrics["timeline"],
  key: TimelineKey,
  range: number
): {
  recent: { day: string; value: number }[];
  currentTotal: number;
  previousTotal: number;
} {
  if (timeline.length === 0) {
    return { recent: [], currentTotal: 0, previousTotal: 0 };
  }

  const recent = timeline.slice(-range);
  const previous = timeline.slice(-2 * range, -range);

  const mapSeries = (arr: ImpactMetrics["timeline"]) =>
    arr.map((item) => ({ day: formatDayLabel(item.day), value: item[key] ?? 0 }));

  const sum = (arr: ImpactMetrics["timeline"], prop: TimelineKey) =>
    arr.reduce((acc, item) => acc + (item[prop] ?? 0), 0);

  return {
    recent: mapSeries(recent),
    currentTotal: sum(recent, key),
    previousTotal: sum(previous, key),
  };
}

export default function ImpactPage() {
  const metrics = useQuery(api.functions.impact.getImpactMetrics) as ImpactMetrics | undefined;
  const isLoading = metrics === undefined;
  const timeline = metrics?.timeline ?? [];
  const rangeDays = 14;

  const donationsSeries = useMemo(() => buildSeries(timeline, "donations", rangeDays), [timeline]);
  const claimsSeries = useMemo(() => buildSeries(timeline, "claims", rangeDays), [timeline]);
  const pickupsSeries = useMemo(() => buildSeries(timeline, "pickups", rangeDays), [timeline]);
  const rescuedSeries = useMemo(() => buildSeries(timeline, "rescuedQuantity", rangeDays), [timeline]);

  const trendChartData = useMemo(
    () =>
      donationsSeries.recent.map((row, idx) => ({
        day: row.day,
        donations: row.value,
        claims: claimsSeries.recent[idx]?.value ?? 0,
        pickups: pickupsSeries.recent[idx]?.value ?? 0,
      })),
    [donationsSeries.recent, claimsSeries.recent, pickupsSeries.recent]
  );

  const statCards: StatCardProps[] = useMemo(
    () => [
      {
        title: "Meals rescued",
        unit: "portions",
        current: rescuedSeries.currentTotal,
        previous: rescuedSeries.previousTotal,
        data: rescuedSeries.recent,
        gradient: { from: "from-emerald-200", to: "to-emerald-100" },
      },
      {
        title: "Donations posted",
        current: donationsSeries.currentTotal,
        previous: donationsSeries.previousTotal,
        data: donationsSeries.recent,
        gradient: { from: "from-sky-200", to: "to-sky-100" },
      },
      {
        title: "Claims placed",
        current: claimsSeries.currentTotal,
        previous: claimsSeries.previousTotal,
        data: claimsSeries.recent,
        gradient: { from: "from-indigo-200", to: "to-indigo-100" },
      },
      {
        title: "Pickups completed",
        current: pickupsSeries.currentTotal,
        previous: pickupsSeries.previousTotal,
        data: pickupsSeries.recent,
        gradient: { from: "from-amber-200", to: "to-amber-100" },
      },
    ],
    [rescuedSeries, donationsSeries, claimsSeries, pickupsSeries]
  );

  return (
    <Access>
      <section className="grid gap-6">
        <header className="card p-6 md:p-8 grid gap-3 md:grid-cols-[1fr_auto] items-center">
          <div className="grid gap-2">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">Impact dashboard</h1>
            <p className="text-subtext max-w-2xl">
              Live indicators of how the No Leftovers community reduces food waste. Track rescued meals, engaged donors, and receiver activity updated in real time.
            </p>
          </div>
          <div aria-hidden className="hidden md:flex items-center justify-center">
            <div className="size-28 md:size-32 rounded-2xl bg-[#F5F5F5] grid place-items-center border border-[#E0E0E0]">
              <span className="text-5xl">🌍</span>
            </div>
          </div>
        </header>

        <section className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <article className="card p-5">
              <header className="flex flex-col gap-1 mb-4">
                <h2 className="text-lg font-semibold">14-day activity trend</h2>
                <p className="text-xs text-subtext">Daily counts for donations, claims, and pickups</p>
              </header>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                    <XAxis
                      dataKey="day"
                      stroke="var(--c-border)"
                      tick={{ fontSize: 12, fill: "var(--c-subtext)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--c-border)" }}
                    />
                    <YAxis
                      stroke="var(--c-border)"
                      tick={{ fontSize: 12, fill: "var(--c-subtext)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--c-border)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value: number, name) => [String(value), name]}
                      labelFormatter={(label: string) => `Date: ${label}`}
                      cursor={{ stroke: "var(--c-border)", strokeDasharray: "4 4" }}
                      contentStyle={chartTooltipStyle}
                    />
                    <Line
                      type="monotone"
                      dataKey="donations"
                      stroke="var(--c-primary)"
                      strokeWidth={2}
                      dot={false}
                      name="Donations"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--c-primary)", fill: "var(--c-card)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="claims"
                      stroke="var(--c-accent)"
                      strokeWidth={2}
                      dot={false}
                      name="Claims"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--c-accent)", fill: "var(--c-card)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pickups"
                      stroke="var(--c-accent)"
                      strokeWidth={2}
                      dot={false}
                      name="Pickups"
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--c-accent)", fill: "var(--c-card)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card p-5">
              <h2 className="text-lg font-semibold mb-3">Food balance</h2>
              <ul className="grid gap-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-subtext">All-time portions posted</span>
                  <span className="font-semibold">{formatNumber(metrics?.food.totalQuantity ?? 0)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-subtext">Claimed by receivers</span>
                  <span className="font-semibold text-emerald-600">{formatNumber(metrics?.food.claimedQuantity ?? 0)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-subtext">Rescued (picked up)</span>
                  <span className="font-semibold text-emerald-700">{formatNumber(metrics?.food.rescuedQuantity ?? 0)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-subtext">Still available right now</span>
                  <span className="font-semibold text-sky-600">{formatNumber(metrics?.food.availableQuantity ?? 0)}</span>
                </li>
              </ul>
              <div className="mt-4 grid gap-1 text-xs text-subtext">
                <span className="font-medium text-text">Community size</span>
                <span>{formatNumber(metrics?.totals.donors ?? 0)} donors sharing meals</span>
                <span>{formatNumber(metrics?.totals.receivers ?? 0)} receivers registered</span>
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="card p-5">
            <h2 className="text-lg font-semibold mb-4">Top categories saved</h2>
            {isLoading && <p className="text-subtext text-sm">Loading categories…</p>}
            {!isLoading && metrics?.topCategories.length ? (
              <ul className="grid gap-3">
                {metrics.topCategories.map((item) => {
                  const totalTop = metrics.topCategories[0]?.quantity || 1;
                  const pct = Math.max(6, Math.round((item.quantity / totalTop) * 100));
                  return (
                    <li key={item.category} className="grid gap-1">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>{item.category}</span>
                        <span className="text-subtext font-normal">{formatNumber(item.quantity)} portions</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-[#4CAF50]" style={{ width: `${pct}%` }} aria-hidden />
                      </div>
                      <span className="text-xs text-subtext">{item.donations} donations contributed</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-subtext text-sm">No categories to display yet.</p>
            )}
          </article>

          <article className="card p-5">
            <h2 className="text-lg font-semibold mb-4">Most active donors</h2>
            {isLoading && <p className="text-subtext text-sm">Loading donors…</p>}
            {!isLoading && metrics?.topDonors.length ? (
              <ul className="grid gap-3">
                {metrics.topDonors.map((donor) => (
                  <li key={donor.donorId} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                    <div>
                      <p className="font-medium text-sm">{donor.donorName}</p>
                      <p className="text-xs text-subtext">{donor.totalDonations} donations</p>
                    </div>
                    <span className="font-semibold text-sm">{formatNumber(donor.totalQuantity)} portions</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-subtext text-sm">No donor activity yet.</p>
            )}
          </article>
        </section>

        <section className="card p-5 grid gap-4">
          <header className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Latest donations</h2>
            <p className="text-xs text-subtext">Newest posts across the platform</p>
          </header>
          {isLoading && <p className="text-subtext text-sm">Loading recent donations…</p>}
          {!isLoading && metrics?.recentDonations.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase text-subtext">
                  <tr>
                    <th className="px-2 py-2 text-left">Donation</th>
                    <th className="px-2 py-2 text-left">Category</th>
                    <th className="px-2 py-2 text-right">Quantity</th>
                    <th className="px-2 py-2 text-left">Donor</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Pickup window</th>
                    <th className="px-2 py-2 text-right">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentDonations.map((row) => (
                    <tr key={row.id} className="border-t border-border/60">
                      <td className="px-2 py-2 font-medium">{row.title}</td>
                      <td className="px-2 py-2">{row.category}</td>
                      <td className="px-2 py-2 text-right">{formatNumber(row.quantity)}</td>
                      <td className="px-2 py-2">{row.donorName ?? "—"}</td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[row.status] ?? "bg-gray-200 text-gray-800"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-xs text-subtext">
                        {row.pickupWindowStart || row.pickupWindowEnd ? (
                          <>
                            {row.pickupWindowStart ? isoToDate(row.pickupWindowStart) : "—"} → {row.pickupWindowEnd ? isoToDate(row.pickupWindowEnd) : "—"}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-2 text-right text-xs text-subtext">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-subtext text-sm">No donations posted yet.</p>
          )}
        </section>

        <footer className="text-xs text-subtext text-center">
          Data updates live from Convex. Portions are donor reported; rescued totals reflect confirmed pickups when available.
        </footer>
      </section>
    </Access>
  );
}


