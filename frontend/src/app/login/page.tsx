"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";

export default function Login() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Login</h2>
      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Access your dashboard and post donations.</p>
        <div className="flex gap-2">
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="btn-primary">Login</button>
          </SignInButton>
          <Link href="/login/register">
            <button className="btn-outline">Register</button>
          </Link>
        </div>
      </div>
    </section>
  );
}
