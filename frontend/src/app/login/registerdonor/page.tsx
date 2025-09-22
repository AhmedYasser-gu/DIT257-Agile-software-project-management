"use client";
import { SignUpButton } from "@clerk/nextjs";
import { useState } from "react";

export default function RegisterDonater() {

  const [address, setAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [organizationNumber, setOrganizationNumber] = useState("");

  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Register as Donor</h2>
      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Create an account to start donating food.</p>
        <form className="grid gap-3">
          <label className="grid gap-1">
            <span className="label">Address</span>
            <input
              type="text"
              className="input"
              placeholder="Enter your address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="label">Company Name</span>
            <input
              type="text"
              className="input"
              placeholder="Enter your company name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="label">Organization Number</span>
            <input
              type="text"
              className="input"
              placeholder="Enter your organization number"
              value={organizationNumber}
              onChange={e => setOrganizationNumber(e.target.value)}
            />
          </label>
          <SignUpButton mode="modal" forceRedirectUrl="/">
            <button type="button" className="btn-primary">Open register</button>
          </SignUpButton>
        </form>
      </div>
    </section>
  );
}
