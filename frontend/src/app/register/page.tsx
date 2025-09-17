"use client";

import { SignUp } from "@clerk/nextjs";

export default function Register() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Register</h2>
      <div className="card grid gap-3">
        <SignUp routing="hash" />
      </div>
    </section>
  );
}