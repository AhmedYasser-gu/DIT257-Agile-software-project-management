"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Register() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Register</h2>
      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Create an account to start donating or claiming food.</p>
        <div className="flex gap-2">
          <SignUpButton mode="modal" forceRedirectUrl="/">
            <button className="btn-primary">Open register</button>
          </SignUpButton>
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="btn-outline">Login instead</button>
          </SignInButton>
        </div>
      </div>
    </section>
  );
}