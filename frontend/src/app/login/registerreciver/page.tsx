"use client";
import { useState } from "react";
import { SignUpButton } from "@clerk/nextjs";

export default function RegisterReciver() {
  const [occupation, setOccupation] = useState("");
  const [referral, setReferral] = useState("");
  const [id, setId] = useState("");

  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Register</h2>
      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Create an account to start donating or claiming food.</p>
        <form className="grid gap-3">
          <label className="grid gap-1">
            <span className="label">Occupation</span>
            <input
              type="text"
              className="input"
              placeholder="Enter your occupation"
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="label">Referral</span>
            <input
              type="text"
              className="input"
              placeholder="Who referred you?"
              value={referral}
              onChange={e => setReferral(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="label">ID</span>
            <input
              type="text"
              className="input"
              placeholder="Enter your ID"
              value={id}
              onChange={e => setId(e.target.value)}
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