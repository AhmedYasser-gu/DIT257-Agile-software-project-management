"use client";

import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold">Profile</h2>
        <UserProfile routing="hash" />
    </section>
  );
}