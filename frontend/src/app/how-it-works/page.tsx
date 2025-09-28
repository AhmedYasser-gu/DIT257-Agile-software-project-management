"use client";

import Link from "next/link";
import { useState } from "react";

type Tab = "donor" | "receiver";

export default function HowItWorks() {
  const [tab, setTab] = useState<Tab>("receiver");

  return (
    <section className="grid gap-6">
      {/* Hero */}
      <div className="card p-6 md:p-8 grid gap-3 md:grid-cols-[1fr_auto] items-center">
        <div className="grid gap-2">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            How <span className="text-[#4CAF50]">No Leftovers</span> works
          </h1>
          <p className="text-subtext">
            A simple, real‑time way to reduce food waste. Restaurants and stores
            post surplus food; individuals and charities can claim and pick up within a
            set time window. Clean, safe, and transparent.
          </p>
        </div>
        <div aria-hidden className="hidden md:flex items-center justify-center">
          <div className="size-28 md:size-32 rounded-2xl bg-[#F5F5F5] grid place-items-center border border-[#E0E0E0]">
            <span className="text-5xl">🥗</span>
          </div>
        </div>
      </div>

      {/* 3‑step overview */}
      <div className="grid md:grid-cols-3 gap-3">
        <StepCard
          number={1}
          title="Donors post food"
          emoji="📝"
          text="Restaurants create time‑boxed offers with title, quantity, category, and pickup window."
        />
        <StepCard
          number={2}
          title="Receivers claim"
          emoji="🤝"
          text="Individuals and charities browse nearby items and claim what they need."
        />
        <StepCard
          number={3}
          title="Timely pickup"
          emoji="⏱️"
          text="Pickup happens within the stated window; expired items auto-close to keep lists clean."
        />
      </div>

      {/* Role switch */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            className={`btn-outline ${tab === "receiver" ? "!bg-[#4CAF50] !text-white border-transparent" : ""}`}
            onClick={() => setTab("receiver")}
            type="button"
            aria-pressed={tab === "receiver"}
          >
            For Receivers
          </button>
          <button
            className={`btn-outline ${tab === "donor" ? "!bg-[#4CAF50] !text-white border-transparent" : ""}`}
            onClick={() => setTab("donor")}
            type="button"
            aria-pressed={tab === "donor"}
          >
            For Donors
          </button>
        </div>

        {tab === "receiver" ? <ReceiverGuide /> : <DonorGuide />}
      </div>

      {/* Quick start tiles */}
      <div className="grid md:grid-cols-3 gap-3">
        <Tile
          title="Create your account"
          emoji="🚀"
          text="Use your email to sign in via Clerk. Choose whether you’re a donor or receiver."
          href="/login"
          cta="Login / Register"
        />
        <Tile
          title="Explore nearby"
          emoji="🗺️"
          text="Filter by category, sort by time, and see pickup windows at a glance."
          href="/explore"
          cta="Open Explore"
        />
        <Tile
          title="Post a donation"
          emoji="➕"
          text="Donors can post food in minutes: set a title, quantity, and pickup window."
          href="/donate"
          cta="Post Donation"
        />
      </div>

      {/* Safety & etiquette */}
      <div className="card p-6 grid gap-4">
        <h3 className="text-xl font-semibold">Safety, quality & etiquette</h3>
        <ul className="list-disc ml-5 grid gap-2 text-sm text-subtext">
          <li>
            <span className="text-[#212121] font-medium">Food quality:</span> Donors only post safe, consumable items. If in doubt, don’t list it.
          </li>
          <li>
            <span className="text-[#212121] font-medium">Be on time:</span> Respect pickup windows to keep operations smooth for restaurants and charities.
          </li>
          <li>
            <span className="text-[#212121] font-medium">Be respectful:</span> Treat staff and other receivers kindly; we’re all here to reduce waste.
          </li>
          <li>
            <span className="text-[#212121] font-medium">Privacy:</span> We store minimal data. Your account details are handled securely via Clerk.
          </li>
        </ul>
        <div className="text-xs text-subtext">
          If something seems off, please inform the donor or your coordinator, and consider skipping the item.
        </div>
      </div>

      {/* FAQ (accessible, no JS needed) */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-2">Frequently asked questions</h3>
        <div className="grid gap-2">
          <Faq q="Do I need to pay for items?">
            No — it’s about reducing waste. Items are free, within limits set by the donor.
          </Faq>
          <Faq q="What happens after I claim?">
            The item status becomes <b>CLAIMED</b> and will show in your dashboard under <i>My claims</i>. Be on time for pickup.
          </Faq>
          <Faq q="Is location used?">
            We’ll add smarter location features later. For now, donors include address in the profile and post.
          </Faq>
          <Faq q="I can’t see my post or claim.">
            Try refreshing your dashboard. If the issue persists, log out/in or contact your team lead.
          </Faq>
        </div>
      </div>

      {/* Final CTA */}
      <div className="card p-6 md:p-8 grid md:grid-cols-[1fr_auto] items-center gap-3">
        <div>
          <h3 className="text-xl font-semibold">Ready to get started?</h3>
          <p className="text-subtext text-sm">
            Join the movement to turn surplus into smiles. Claim food you need or share what you can.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/explore" className="btn-primary">Explore now</Link>
          <Link href="/donate" className="btn-outline">Post food</Link>
        </div>
      </div>
    </section>
  );
}

/*  Small page‑local components  */

function StepCard({
  number,
  title,
  emoji,
  text,
}: {
  number: number;
  title: string;
  emoji: string;
  text: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="size-7 grid place-items-center rounded-full bg-[#4CAF50] text-white text-sm font-semibold">
          {number}
        </div>
        <div className="font-medium">{title}</div>
        <span className="ml-auto" aria-hidden>
          {emoji}
        </span>
      </div>
      <p className="text-sm text-subtext">{text}</p>
    </div>
  );
}

function Tile({
  title,
  emoji,
  text,
  href,
  cta,
}: {
  title: string;
  emoji: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="card p-5 grid gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>{emoji}</span>
        <div className="font-medium">{title}</div>
      </div>
      <p className="text-sm text-subtext">{text}</p>
      <div>
        <Link href={href} className="btn-primary">{cta}</Link>
      </div>
    </div>
  );
}

function ReceiverGuide() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-lg bg-[#F5F5F5] p-4 border border-[#E0E0E0]">
        <h4 className="font-semibold mb-2">🎯 What you can do</h4>
        <ul className="grid gap-2 text-sm text-subtext list-disc ml-5">
          <li>Create an account as <b>Receiver</b> (individual or charity).</li>
          <li>Browse <b>Explore</b>, filter by category, and check pickup windows.</li>
          <li>Claim items you need — they’ll show under <b>My claims</b>.</li>
          <li>Arrive on time and confirm pickup with the donor.</li>
        </ul>
      </div>
      <div className="rounded-lg bg-[#F5F5F5] p-4 border border-[#E0E0E0]">
        <h4 className="font-semibold mb-2">✅ Tips for a smooth pickup</h4>
        <ul className="grid gap-2 text-sm text-subtext list-disc ml-5">
          <li>Bring a bag/container if needed.</li>
          <li>Show your claim info on your phone if asked.</li>
          <li>Be respectful to staff & other receivers.</li>
          <li>If you can’t make it, don’t claim — keep items available for others.</li>
        </ul>
      </div>
    </div>
  );
}

function DonorGuide() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-lg bg-[#F5F5F5] p-4 border border-[#E0E0E0]">
        <h4 className="font-semibold mb-2">🏪 What you can do</h4>
        <ul className="grid gap-2 text-sm text-subtext list-disc ml-5">
          <li>Register as <b>Donor</b> and add your business details.</li>
          <li>Post surplus food: title, description, quantity, category, pickup window.</li>
          <li>When a receiver claims, the listing updates to <b>CLAIMED</b>.</li>
          <li>Items auto‑expire after the window closes.</li>
        </ul>
      </div>
      <div className="rounded-lg bg-[#F5F5F5] p-4 border border-[#E0E0E0]">
        <h4 className="font-semibold mb-2">📌 Posting best practices</h4>
        <ul className="grid gap-2 text-sm text-subtext list-disc ml-5">
          <li>Be specific: include portion sizes or rough counts.</li>
          <li>Set a realistic pickup window that fits your closing time.</li>
          <li>Post early — more time means fewer expirations.</li>
          <li>Mark items accurately to build trust with the community.</li>
        </ul>
      </div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg border border-[#E0E0E0] bg-white p-4 open:shadow-sm">
      <summary className="cursor-pointer list-none font-medium">
        {q}
      </summary>
      <div className="mt-2 text-sm text-subtext">{children}</div>
    </details>
  );
}
