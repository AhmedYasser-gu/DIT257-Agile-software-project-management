"use client";

import { SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Register() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Register</h2>
      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Create an account to start donating or claiming food.</p>
        <div className="flex flex-wrap gap-2">
          <SignUpButton mode="modal" forceRedirectUrl="/login/register/registerdonor">
            <button type="button" className="btn-primary">Register as Donor</button>
          </SignUpButton>
          <SignUpButton mode="modal" forceRedirectUrl="/login/register/registerreciver">
            <button type="button" className="btn-primary">Register as Receiver</button>
          </SignUpButton>
        </div>
      </div>
    </section>
  );
}