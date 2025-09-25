"use client";

import { useState } from "react";
import Link from "next/link";

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

interface PeriodButtonProps {
  label: string;
  selectedRange: { start: string; end: string };
  setSelectedRange: (range: { start: string; end: string }) => void;
}

function PeriodButton({ label, selectedRange, setSelectedRange }: PeriodButtonProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div>
      <div className="text-1xl font-semibold">{label}</div>
      <div className="relative">
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="bg-info hover:bg-opacity-80 text-white font-medium px-4 py-2 rounded mt-2"
        >
          {selectedRange.start} - {selectedRange.end}
        </button>

        {showDatePicker && (
          <div className="absolute z-50 mt-2 p-4 bg-white border rounded shadow-lg">
            <DatePickerMenu
              selectedRange={selectedRange}
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
  selectedRange: { start: string; end: string };
  setSelectedRange: (range: { start: string; end: string }) => void;
  closeMenu: () => void;
}

function DatePickerMenu({ selectedRange, setSelectedRange, closeMenu }: DatePickerMenuProps) {
  const presets = [
    { label: "Last 7 Days", range: { start: "2025-09-16", end: "2025-09-22" } },
    { label: "Last 15 Days", range: { start: "2025-09-08", end: "2025-09-22" } },
    { label: "Last 30 Days", range: { start: "2025-08-24", end: "2025-09-22" } },
  ];

  return (
    <div className="grid gap-2">
      {presets.map((p) => (
        <button
          key={p.label}
          className="text-left px-2 py-1 hover:bg-gray-100 rounded"
          onClick={() => {
            setSelectedRange(p.range);
            closeMenu();
          }}
        >
          {p.label}
        </button>
      ))}
      <button
        className="mt-2 px-2 py-1 bg-pink-500 text-white rounded"
        onClick={closeMenu}
      >
        Apply
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [showClaimed, setShowClaimed] = useState(false);
  const [showOpen, setShowOpen] = useState(true);
  const [showExpired, setShowExpired] = useState(false);

  const [selectedPreviousRange, setSelectedPreviousRange] = useState<{ start: string; end: string }>({
    start: "2025-09-16",
    end: "2025-09-22",
  });
  const [selectedCurrentRange, setSelectedCurrentRange] = useState<{ start: string; end: string }>({
    start: "2025-09-16",
    end: "2025-09-22",
  });

  return (
    <div className="grid gap-10">
      <section className="grid gap-4">
        <h2 className="text-3xl font-bold border-b border-gray-200 pb-2">
          Our Listings Today
        </h2>
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => setShowOpen(!showOpen)}
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            transform="rotate(270)"
            className={`w-4 h-4 transition-transform duration-300 ${showOpen ? 'rotate-0' : 'rotate-270'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
          <h2 className="text-xl font-bold select-none">Open ({items.filter(i => i.status == ListingStatus.OPEN).length})</h2>
        </div>
        {showOpen && items
          .filter(i => i.status == ListingStatus.OPEN)
          .map(i => (
            // The parent div no longer has flex properties.
            <div key={i.id} className="card">
              <div>
                <div className="font-medium">{i.title}</div>
                <div className="text-sm text-subtext">{i.qty}</div>
                <div className="text-sm text-subtext">Posted: {i.posted}</div>
                <div className="text-sm text-subtext">Pickup: {i.pickup}</div>
              </div>
              {/* The button is now a separate element on a new line */}
              <div className="mt-2 flex space-x-2 text-sm">
                <Link
                  href={`/explore/${i.id}`}
                  className="bg-info hover:bg-opacity-80 text-white font-medium px-4 py-2 rounded"
                >
                  Edit
                </Link>
                <Link
                  href={`/explore/${i.id}`}
                  className="bg-error hover:bg-opacity-80 text-white font-medium px-4 py-2 rounded"
                >
                  Cancel listing
                </Link>
              </div>
            </div>
          ))}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => setShowClaimed(!showClaimed)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            transform="rotate(270)"
            className={`w-4 h-4 transition-transform duration-300 ${showClaimed ? 'rotate-0' : 'rotate-270'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
          <h2 className="text-xl font-bold select-none">Claimed ({items.filter(i => i.status == ListingStatus.CLAIMED).length})</h2>
        </div>
        {showClaimed && items
          .filter(i => i.status == ListingStatus.CLAIMED)
          .map(i => (
            <div key={i.id} className="card">
              <div>
                <div className="font-medium">{i.title}</div>
                <div className="text-sm text-subtext">{i.qty}</div>
                <div className="text-sm text-subtext">Claimed by: {i.claimed_by}</div>
                <div className="text-sm text-subtext">Claimed: {i.claimed_time}</div>
              </div>
            </div>
          ))}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => setShowExpired(!showExpired)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            transform="rotate(270)"
            className={`w-4 h-4 transition-transform duration-300 ${showExpired ? 'rotate-0' : 'rotate-270'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
          <h2 className="text-xl font-bold select-none">Expired ({items.filter(i => i.status == ListingStatus.EXPIRED).length})</h2>
        </div>
        {showExpired && items
          .filter(i => i.status == ListingStatus.EXPIRED)
          .map(i => (
            <div key={i.id} className="card">
              <div>
                <div className="font-medium">{i.title}</div>
                <div className="text-sm text-subtext">{i.qty}</div>
                <div className="text-sm text-subtext">Posted: {i.posted}</div>
                <div className="text-sm text-subtext">Pickup: {i.pickup}</div>
              </div>
            </div>
          ))}
      </section>

      <section className="grid gap-4">
        <h2 className="text-3xl font-bold border-b border-gray-200 pb-2">
          Past Listings
        </h2>

        <div>
          <Link
            href={`/explore/`}
            className="bg-info hover:bg-opacity-80 text-white font-medium px-4 py-2 rounded"
          >
            Yesterday (2025-09-24)
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-3xl font-bold border-b border-gray-200 pb-2">
          Statistics
        </h2>
        <section className="mt-2 flex space-x-10">
          <PeriodButton
            label="Current period (15 listings)"
            selectedRange={selectedCurrentRange}
            setSelectedRange={setSelectedCurrentRange}
          />

          <PeriodButton
            label="Previous period (17 listings)"
            selectedRange={selectedPreviousRange}
            setSelectedRange={setSelectedPreviousRange}
          />
        </section>

        <h2 className="text-xl font-bold select-none">Listings created</h2>
        <h2 className="text-xl font-bold select-none">Listings claimed</h2>
        <h2 className="text-xl font-bold select-none">Listings expired</h2>
        <h2 className="text-xl font-bold select-none">Food quantity</h2>
      </section>
    </div>

  );
}