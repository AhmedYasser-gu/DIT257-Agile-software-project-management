"use client";

import { SignIn } from "@clerk/nextjs";

export default function Login() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Login</h2>
      <div className="card grid gap-3">
        <SignIn routing="hash" />
      </div>
    </section>
  );
}
