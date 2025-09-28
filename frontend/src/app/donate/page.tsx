"use client";
import React, { useState, useEffect } from "react";
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
  pickup_window_start: string;
  pickup_window_end: string;
  quantity: number;
  title: string;
  status: "AVAILABLE" | "CLAIMED" | "PICKEDUP" | "EXPIRED";
  category: string;
};

export default function Donate() {
  const { userId } = useAuth();
  const toast = useToast();

  const donorData = useQuery(
    api.functions.getAllDonors.getAllDonors,
    userId ? { clerk_id: userId } : "skip"
  ) as DonorOption[] | undefined;

  const [donors, setDonors] = useState<DonorOption[]>([]);
  useEffect(() => { if (donorData) setDonors(donorData); }, [donorData]);

  const [description, setDescription] = useState("");
  const [donor_id, setDonorId] = useState("");
  const [pickupWindowStart, setPickupWindowStart] = useState("");
  const [pickupWindowEnd, setPickupWindowEnd] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FoodCategory>("Bakery");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const currentDateTime = new Date().toISOString().slice(0, 16);
  const createDonation = useMutation(api.functions.createDonation.createDonation);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!donor_id || !title || !description || !quantity || !pickupWindowStart || !pickupWindowEnd) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }
    if (new Date(pickupWindowStart) > new Date(pickupWindowEnd)) {
      setErrorMessage("Pickup window start cannot be later than end.");
      return;
    }
    if (new Date(pickupWindowStart) < new Date(currentDateTime)) {
      setErrorMessage("Pickup window start cannot be in the past.");
      return;
    }
    if (new Date(pickupWindowEnd) < new Date(currentDateTime)) {
      setErrorMessage("Pickup window end cannot be in the past.");
      return;
    }
    setErrorMessage("");

    const payload: CreateDonationInput = {
      description,
      donor_id,
      pickup_window_start: pickupWindowStart,
      pickup_window_end: pickupWindowEnd,
      quantity,
      title,
      status: "AVAILABLE",
      category,
    };

    try {
      await createDonation(payload as unknown as Record<string, unknown>);
      toast.success("Donation posted!");
      setDonorId(""); setTitle(""); setDescription(""); setQuantity(0);
      setPickupWindowStart(""); setPickupWindowEnd(""); setCategory("Bakery");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to create donation";
      toast.error(msg);
    }
  };

  return (
    <Access requireAuth allowUserTypes={["donor"]}>
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">➕Post a donation</h2>
        <form className="card grid gap-3 max-w-xl" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <label className="label">Select business to post donation for</label>
            <select className="input" value={donor_id} onChange={(e) => setDonorId(e.target.value)} required>
              <option value="">Select a business...</option>
              {donors.map((donor) => (
                <option key={donor._id} value={donor._id}>
                  {donor.business_name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Title" requiredMark placeholder="e.g., Bakery surplus" value={title} onChange={(e) => setTitle(e.target.value)} title="Title is required."/>
          <label className="grid gap-1">
            <span className="label">Description</span>
            <textarea className="input min-h-[96px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <Input label="Quantity" requiredMark placeholder="e.g., 6 portions" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)} type="number"/>
          <div className="grid gap-3">
            <label className="label">Select Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as FoodCategory)} required>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Pickup window start" requiredMark value={pickupWindowStart} onChange={(e) => setPickupWindowStart(e.target.value)} type="datetime-local" min={currentDateTime}/>
            <Input label="Pickup window end" requiredMark value={pickupWindowEnd} onChange={(e) => setPickupWindowEnd(e.target.value)} type="datetime-local" min={currentDateTime}/>
          </div>
          {errorMessage && <p className="text-red-600">{errorMessage}</p>}
          <button type="submit" className="btn-primary w-fit">Post Donation</button>
        </form>
      </section>
    </Access>
  );
}
