"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Input from "@/components/Input/Input";
import Access from "@/components/Access/Access";
import { api } from "@/convexApi";
import { FOOD_CATEGORIES, FoodCategory } from "@/constants/categories";
import { useToast } from "@/components/Toast/ToastContext";

type DonorOption = { _id: string; business_name: string };

type CreateDonationInput = {
  description: string;
  donor_id: string;
  pickup_window_start: string; // ISO "YYYY-MM-DDTHH:mm"
  pickup_window_end: string;   // ISO "YYYY-MM-DDTHH:mm"
  quantity: number;
  title: string;
  status: "AVAILABLE" | "CLAIMED" | "PICKEDUP" | "EXPIRED";
  category: string;
};

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowISOTimeHM(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function combineISO(date: string, time: string): string {
  // returns "YYYY-MM-DDTHH:mm"
  return `${date}T${time}`;
}

export default function Donate() {
  const { userId } = useAuth();
  const toast = useToast();

  const donorData = useQuery(
    api.functions.getAllDonors.getAllDonors,
    userId ? { clerk_id: userId } : "skip"
  ) as DonorOption[] | undefined;

  const [donors, setDonors] = useState<DonorOption[]>([]);
  useEffect(() => {
    if (donorData) setDonors(donorData);
  }, [donorData]);

  const [description, setDescription] = useState("");
  const [donor_id, setDonorId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FoodCategory>("Bakery");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // NEW: split date/time (24h) inputs with hints
  const [startDate, setStartDate] = useState(todayISODate());
  const [startTime, setStartTime] = useState(nowISOTimeHM());
  const [endDate, setEndDate] = useState(todayISODate());
  const [endTime, setEndTime] = useState(nowISOTimeHM());

  const pickupStartISO = useMemo(() => combineISO(startDate, startTime), [startDate, startTime]);
  const pickupEndISO = useMemo(() => combineISO(endDate, endTime), [endDate, endTime]);

  const createDonation = useMutation(api.functions.createDonation.createDonation);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const now = new Date();

    // validations
    if (!donor_id || !title || !description || !quantity || !startDate || !startTime || !endDate || !endTime) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    const start = new Date(pickupStartISO);
    const end = new Date(pickupEndISO);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setErrorMessage("Please enter a valid date and time (24h format).");
      return;
    }
    if (start > end) {
      setErrorMessage("Pickup window start cannot be later than end.");
      return;
    }
    if (start < now) {
      setErrorMessage("Pickup window start cannot be in the past.");
      return;
    }
    if (end < now) {
      setErrorMessage("Pickup window end cannot be in the past.");
      return;
    }
    setErrorMessage("");

    const payload: CreateDonationInput = {
      description,
      donor_id,
      pickup_window_start: pickupStartISO,
      pickup_window_end: pickupEndISO,
      quantity,
      title,
      status: "AVAILABLE",
      category,
    };

    try {
      await createDonation(payload as unknown as Record<string, unknown>);
      toast.success("Donation posted!");

      // reset to sensible defaults
      setDonorId("");
      setTitle("");
      setDescription("");
      setQuantity(0);
      setCategory("Bakery");
      const today = todayISODate();
      const nowHM = nowISOTimeHM();
      setStartDate(today);
      setStartTime(nowHM);
      setEndDate(today);
      setEndTime(nowHM);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to create donation";
      toast.error(msg);
    }
  };

  return (
    <Access requireAuth allowUserTypes={["donor"]}>
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">➕ Post a donation</h2>

        <form className="card grid gap-3 max-w-xl" onSubmit={handleSubmit}>
          {/* Donor selector */}
          <div className="grid gap-1">
            <label className="label">Select business to post donation for</label>
            <select
              className="input"
              value={donor_id}
              onChange={(e) => setDonorId(e.target.value)}
              required
            >
              <option value="">Select a business...</option>
              {donors.map((donor) => (
                <option key={donor._id} value={donor._id}>
                  {donor.business_name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <Input
            label="Title"
            requiredMark
            placeholder="e.g., Bakery surplus"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            title="Title is required."
          />

          {/* Description */}
          <label className="grid gap-1">
            <span className="label">Description</span>
            <textarea
              className="input min-h-[96px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {/* Quantity */}
          <Input
            label="Quantity"
            requiredMark
            placeholder="e.g., 6 portions"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            type="number"
            min={1}
          />

          {/* Category */}
          <div className="grid gap-1">
            <label className="label">Select Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              required
            >
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup window */}
          <div className="grid gap-2">
            <span className="label">Pickup window (24‑hour)</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <span className="text-xs text-subtext">Start date</span>
                <input
                  className="input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={todayISODate()}
                  required
                />
              </div>
              <div className="grid gap-1">
                <span className="text-xs text-subtext">Start time (HH:mm)</span>
                <input
                  className="input"
                  type="time"
                  step={60}
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  placeholder="13:00"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <span className="text-xs text-subtext">End date</span>
                <input
                  className="input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required
                />
              </div>
              <div className="grid gap-1">
                <span className="text-xs text-subtext">End time (HH:mm)</span>
                <input
                  className="input"
                  type="time"
                  step={60}
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  placeholder="13:00"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <p className="text-xs text-subtext">
              Use 24‑hour time (e.g., <span className="font-mono">13:00</span>).
            </p>
          </div>

          {errorMessage && <p className="text-red-600">{errorMessage}</p>}

          <button type="submit" className="btn-primary w-fit">Post Donation</button>
        </form>
      </section>
    </Access>
  );
}
