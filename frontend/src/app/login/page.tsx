"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Login() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Login</h2>
      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Access your dashboard and post donations.</p>
        <div className="flex gap-2">
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="btn-primary">Open login</button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl="/">
            <button className="btn-outline">Register instead</button>
          </SignUpButton>
        </div>
      </div>
    </section>
  );
}
