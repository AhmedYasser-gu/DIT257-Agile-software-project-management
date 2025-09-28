"use client";

import Link from "next/link";
import Access from "@/components/Access/Access";
import { SignIn } from "@clerk/nextjs";
import { useState } from "react";

export default function Login() {
  const [open, setOpen] = useState(false);
  return (
    <Access allowIfLoggedOut>
      <section className="grid gap-4 max-w-md">
        <h2 className="text-2xl font-semibold"> 🔐Login / Register</h2>
        <div className="card grid gap-4 p-6">
          <p className="text-subtext">
            Log in or sign up to unlock your dashboard and explore more
            features! ✨
          </p>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setOpen(true)}>
              Login
            </button>
            <Link href="/login/register">
              <button className="btn-outline">Register</button>
            </Link>
          </div>
        </div>
      </section>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <SignIn
            routing="hash"
            signUpUrl="/login/register"
            afterSignInUrl="/"
            transferable={false}
            waitlistUrl="/login/register"
          />
        </div>
      )}
    </Access>
  );
}
