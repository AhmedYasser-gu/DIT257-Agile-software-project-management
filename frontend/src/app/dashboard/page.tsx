"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export enum ListingStatus {
  OPEN = "OPEN",
  CLAIMED = "CLAIMED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

const items = [
  { id: 1, title: "Bakery surplus", qty: "4 baguettes", status: ListingStatus.OPEN, posted: "Today, 1:45 PM", pickup: "5 PM - 7 PM" },
  { id: 2, title: "Bolognese", qty: "4 portions", status: ListingStatus.OPEN, posted: "Today, 1:45 PM", pickup: "5 PM - 7 PM" },
  { id: 3, title: "Sushi trays", qty: "6 portions", status: ListingStatus.CLAIMED, posted: "Today, 2:00 PM", pickup: "5 PM - 7 PM", claimed_by: "John Doe", claimed_time: "Today, 1:50 PM" },
  { id: 4, title: "Hamburgers", qty: "2 portions", status: ListingStatus.EXPIRED, posted: "Today, 2:00 PM", pickup: "5 PM - 7 PM" },
];

// ---- Helpers for stats ----
function calcChange(current: number, previous: number) {
  if (previous === 0) return { percent: 100, trend: "up" };
  const diff = current - previous;
  const percent = Math.round((diff / previous) * 100);
  return { percent: Math.abs(percent), trend: diff >= 0 ? "up" : "down" };
}

interface StatCardProps {
  title: string;
  current: number;
  previous: number;
  unit?: string;
  colorFrom: string;
  colorTo: string;
  data: { day: string; value: number }[];
}

function StatCard({ title, current, previous, unit, colorFrom, colorTo, data }: StatCardProps) {
  const { percent, trend } = calcChange(current, previous);
  const isUp = trend === "up";

  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorFrom} ${colorTo} p-4 shadow-sm flex flex-col`}>
      <div>
        <h3 className="text-sm text-gray-700">{title}</h3>
        <p className="text-2xl font-bold">
          {current} {unit}
        </p>
        <p className="text-xs text-gray-600">Prev: {previous} {unit}</p>
        <p
          className={`mt-1 text-sm font-medium ${isUp ? "text-green-600" : "text-red-600"
            }`}
        >
          {isUp ? "▲" : "▼"} {percent}%
        </p>
      </div>

      {/* Chart */}
      <div className="mt-3 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" hide />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: "#ccc", strokeDasharray: "5 5" }}
              contentStyle={{ fontSize: "12px" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Period Buttons ----
interface PeriodButtonProps {
  label: string;
  selectedRange: { start: string; end: string };
  setSelectedRange: (range: { start: string; end: string }) => void;
}

function PeriodButton({ label, selectedRange, setSelectedRange }: PeriodButtonProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <div className="relative mt-1">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          {selectedRange.start} → {selectedRange.end}
        </button>

        {showDatePicker && (
          <div className="absolute z-50 mt-2 w-48 p-3 bg-white border rounded-lg shadow-lg">
            <DatePickerMenu
              setSelectedRange={setSelectedRange}
              closeMenu={() => setShowDatePicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface DatePickerMenuProps {
  setSelectedRange: (range: { start: string; end: string }) => void;
  closeMenu: () => void;
}

function DatePickerMenu({ setSelectedRange, closeMenu }: DatePickerMenuProps) {
  const presets = [
    { label: "Last 7 Days", range: { start: "2025-09-16", end: "2025-09-22" } },
    { label: "Last 15 Days", range: { start: "2025-09-08", end: "2025-09-22" } },
    { label: "Last 30 Days", range: { start: "2025-08-24", end: "2025-09-22" } },
  ];

  return (
    <div className="grid gap-1">
      {presets.map((p) => (
        <button
          key={p.label}
          className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-gray-100"
          onClick={() => {
            setSelectedRange(p.range);
            closeMenu();
          }}
        >
          {p.label}
        </button>
      ))}
      <button
        className="mt-2 w-full rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
        onClick={closeMenu}
      >
        Apply
      </button>
    </div>
  );
}

// ---- Dashboard ----
export default function Dashboard() {
  const [selectedPreviousRange, setSelectedPreviousRange] = useState<{ start: string; end: string }>({
    start: "2025-09-08",
    end: "2025-09-15",
  });
  const [selectedCurrentRange, setSelectedCurrentRange] = useState<{ start: string; end: string }>({
    start: "2025-09-16",
    end: "2025-09-22",
  });

  const [showClaimed, setShowClaimed] = useState(false);
  const [showOpen, setShowOpen] = useState(true);
  const [showExpired, setShowExpired] = useState(false);


  // fake stats for demo
  const stats = {
    created: { current: 42, previous: 35, daily: [5, 6, 7, 5, 6, 7, 6] },
    claimed: { current: 30, previous: 28, daily: [4, 5, 3, 4, 5, 4, 5] },
    expired: { current: 5, previous: 10, daily: [1, 0, 1, 1, 0, 1, 1] },
    quantity: { current: 86, previous: 70, daily: [10, 12, 15, 11, 13, 12, 13] },
  };

  // convert daily stats into chart data
  const makeChartData = (arr: number[]) =>
    arr.map((val, idx) => ({ day: `D${idx + 1}`, value: val }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
      {/* Listings Section (same as before) */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold border-b pb-2">Listings</h2>
        <Link
          href={`/explore/`}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          📅 Today <span className="text-gray-500">(2025-09-24)</span>
        </Link>
        {/* Open Listings */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={() => setShowOpen(!showOpen)}
        >
          <h3 className="text-lg font-semibold">
            Open ({items.filter((i) => i.status === ListingStatus.OPEN).length})
          </h3>
          <span className={`transform transition-transform ${showOpen ? "rotate-180" : "rotate-0"}`}>
            ▼
          </span>
        </div>
        {showOpen && (
          <div className="grid gap-3">
            {items
              .filter((i) => i.status === ListingStatus.OPEN)
              .map((i) => (
                <div
                  key={i.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <h4 className="text-lg font-semibold">{i.title}</h4>
                  <p className="text-sm text-gray-500">{i.qty}</p>
                  <p className="text-sm text-gray-500">Posted: {i.posted}</p>
                  <p className="text-sm text-gray-500">Pickup: {i.pickup}</p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/explore/${i.id}`}
                      className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/explore/${i.id}`}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                    >
                      Cancel
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Claimed Listings */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={() => setShowClaimed(!showClaimed)}
        >
          <h3 className="text-lg font-semibold">
            Claimed ({items.filter((i) => i.status === ListingStatus.CLAIMED).length})
          </h3>
          <span className={`transform transition-transform ${showClaimed ? "rotate-180" : "rotate-0"}`}>
            ▼
          </span>
        </div>
        {showClaimed && (
          <div className="grid gap-3">
            {items
              .filter((i) => i.status === ListingStatus.CLAIMED)
              .map((i) => (
                <div
                  key={i.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <h4 className="text-lg font-semibold">{i.title}</h4>
                  <p className="text-sm text-gray-500">{i.qty}</p>
                  <p className="text-sm text-gray-500">Claimed by: {i.claimed_by}</p>
                  <p className="text-sm text-gray-500">Claimed: {i.claimed_time}</p>
                </div>
              ))}
          </div>
        )}

        {/* Expired Listings */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={() => setShowExpired(!showExpired)}
        >
          <h3 className="text-lg font-semibold">
            Expired ({items.filter((i) => i.status === ListingStatus.EXPIRED).length})
          </h3>
          <span className={`transform transition-transform ${showExpired ? "rotate-180" : "rotate-0"}`}>
            ▼
          </span>
        </div>
        {showExpired && (
          <div className="grid gap-3">
            {items
              .filter((i) => i.status === ListingStatus.EXPIRED)
              .map((i) => (
                <div
                  key={i.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <h4 className="text-lg font-semibold">{i.title}</h4>
                  <p className="text-sm text-gray-500">{i.qty}</p>
                  <p className="text-sm text-gray-500">Posted: {i.posted}</p>
                  <p className="text-sm text-gray-500">Pickup: {i.pickup}</p>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Statistics Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold border-b pb-2">Statistics</h2>

        <div className="flex gap-6">
          <PeriodButton
            label="Current period"
            selectedRange={selectedCurrentRange}
            setSelectedRange={setSelectedCurrentRange}
          />
          <PeriodButton
            label="Previous period"
            selectedRange={selectedPreviousRange}
            setSelectedRange={setSelectedPreviousRange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <StatCard
            title="Listings created"
            current={stats.created.current}
            previous={stats.created.previous}
            data={makeChartData(stats.created.daily)}
            colorFrom="from-blue-50"
            colorTo="to-blue-100"
          />
          <StatCard
            title="Listings claimed"
            current={stats.claimed.current}
            previous={stats.claimed.previous}
            data={makeChartData(stats.claimed.daily)}
            colorFrom="from-green-50"
            colorTo="to-green-100"
          />
          <StatCard
            title="Listings expired"
            current={stats.expired.current}
            previous={stats.expired.previous}
            data={makeChartData(stats.expired.daily)}
            colorFrom="from-red-50"
            colorTo="to-red-100"
          />
          <StatCard
            title="Food quantity"
            current={stats.quantity.current}
            previous={stats.quantity.previous}
            unit="portions"
            data={makeChartData(stats.quantity.daily)}
            colorFrom="from-purple-50"
            colorTo="to-purple-100"
          />
        </div>
      </section>
    </div>
  );
}
