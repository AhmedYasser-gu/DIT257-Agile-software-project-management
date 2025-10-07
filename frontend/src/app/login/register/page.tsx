"use client";

import { SignUpButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  return (
    <section className="grid gap-4 max-w-md w-full">
      {/* Top bar with Back */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/login");
          }}
        >
          ← Back
        </button>
      </div>

      <h2 className="text-2xl font-semibold">🔐 Register</h2>

      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Create an account to start donating or claiming food.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {userId ? (
            <button
              type="button"
              className="btn-primary w-full sm:w-auto"
              onClick={() => router.push("/login/register/registerdonor")}
            >
              Continue as Donor
            </button>
          ) : (
            <SignUpButton mode="modal" forceRedirectUrl="/login/register/registerdonor">
              <button type="button" className="btn-primary w-full sm:w-auto">
                Register as Donor
              </button>
            </SignUpButton>
          )}

          {userId ? (
            <button
              type="button"
              className="btn-primary w-full sm:w-auto"
              onClick={() => router.push("/login/register/registerreciver")}
            >
              Continue as Receiver
            </button>
          ) : (
            <SignUpButton mode="modal" forceRedirectUrl="/login/register/registerreciver">
              <button type="button" className="btn-primary w-full sm:w-auto">
                Register as Receiver
              </button>
            </SignUpButton>
          )}
        </div>
      </div>
    </section>
  );
}
