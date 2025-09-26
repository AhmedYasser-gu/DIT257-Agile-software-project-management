"use client"
import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react"
import Input from "@/components/Input/Input";
import Access from "@/components/Access/Access";
import { api } from "@/convexApi";
import { FOOD_CATEGORIES, FoodCategory } from "@/constants/categories"

export default function Donate() {

  const { userId } = useAuth();
  const [donors, setDonors] = useState<any[]>([]);
  const donorData = useQuery(api.functions.getAllDonors.getAllDonors, { clerk_id: userId });

  useEffect(() => {
    if (donorData) {
      setDonors(donorData);
    }
  }, [donorData]);

  const [description, setDescription] = useState('');
  const [donor_id, setDonorId] = useState('');
  const [pickupWindowStart, setPickupWindowStart] = useState('');
  const [pickupWindowEnd, setPickupWindowEnd] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [title, setTitle] = useState('');
  const [status] = useState("AVAILABLE");
  const [category, setCategory] = useState<FoodCategory>('Bakery');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const createDonation = useMutation(api.functions.createDonation.createDonation);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!donor_id || !title || !description || !quantity || !pickupWindowStart || !pickupWindowEnd) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    if (new Date(pickupWindowStart) > new Date(pickupWindowEnd)) {
      setErrorMessage('Pickup window start cannot be later than end.');
      return;
    }

    setErrorMessage('');

    const donationData = {
      description,
      donor_id,
      pickup_window_start: pickupWindowStart,
      pickup_window_end: pickupWindowEnd,
      quantity,
      title,
      status,
      category,
    };

    try {
      const newDonation = await createDonation(donationData);
      console.log('Donation created:', newDonation);
      setSuccessMessage('Donation successfully posted!');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error creating donation:', error);
    }
  };

  return (
    <Access requireAuth allowUserTypes={["donor"]}>
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold">Post a donation</h2>
      <form className="card grid gap-3 max-w-xl" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <label className="label">Select business to post donation for</label>
            <select
              className="input"
              value={donor_id}
              onChange={(e) => setDonorId(e.target.value)}
              required
            >
              <option value="">Select a business...</option>
              {donors.length > 0 &&
                donors.map((donor) => (
                  <option key={donor._id} value={donor._id}>
                    {donor.business_name}
                  </option>
                ))
              }
            </select>
          </div>
        <Input label="Title" requiredMark placeholder="e.g., Bakery surplus" value={title} onChange={(e) => setTitle(e.target.value)} title="Title is required."/>
        <label className="grid gap-1">
          <span className="label">Description</span>
          <textarea className="input min-h-[96px]" value={description} onChange={(e) => setDescription(e.target.value)}/>
        </label>
        <div className="grid gap-3">
          <Input label="Quantity" requiredMark placeholder="e.g., 6 portions" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)} type="number"/>
        </div>
          <div className="grid gap-3">
            <label className="label">Select Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              required
            >
              {FOOD_CATEGORIES.map((foodCategory) => (
                <option key={foodCategory} value={foodCategory}>
                  {foodCategory}
                </option>
              ))}
            </select>
          </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Pickup window start" requiredMark value={pickupWindowStart} onChange={(e) => setPickupWindowStart(e.target.value)} type="datetime-local"/>
          <Input label="Pickup window end" requiredMark value={pickupWindowEnd} onChange={(e) => setPickupWindowEnd(e.target.value)} type="datetime-local"/>
        </div>
        {errorMessage && <p className="text-red-600">{errorMessage}</p>}
        {successMessage && <p className="text-green-600">{successMessage}</p>}
        <button type="submit" className="btn-primary w-fit">Post Donation</button>
      </form>
    </section>
    </Access>
  );
}
