"use client";

import Link from "next/link";

export default function Register() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Register</h2>
      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Create an account to start donating or claiming food.</p>
        <div className="flex gap-2">
          <Link href="/login/registerdonor">
            <button className="btn-primary">Register as Donor</button>
          </Link>
          <Link href="/login/registerreciver">
            <button className="btn-outline">Register as Receiver</button>
          </Link>
        </div>
      </div>
    </section>
  );
}