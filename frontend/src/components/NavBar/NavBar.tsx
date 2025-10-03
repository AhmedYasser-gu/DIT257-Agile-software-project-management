"use client";

import NavLink from "@/components/NavLink/NavLink";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";

export default function NavBar() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const hide = pathname?.startsWith("/login/register");
  const status = useQuery(
    api.functions.createUser.getRegistrationStatus,
    userId ? { clerk_id: userId } : "skip"
  );
  if (hide) return null;

  const linksLoggedOut = [
    { href: "/", label: "Home", exact: true },
    { href: "/how-it-works", label: "How it works" },
  ];
  const linksDonor = [
    { href: "/", label: "Home", exact: true },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/donate", label: "Post Donation" },
    { href: "/reviews", label: "Reviews" },
    { href: "/how-it-works", label: "How it works" },
  ];
  const linksReceiver = [
    { href: "/", label: "Home", exact: true },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/reviews", label: "Reviews" },
    { href: "/how-it-works", label: "How it works" },
  ];

  let links = linksLoggedOut;
  if (userId) {
    if (status === undefined) {
      links = [
        { href: "/", label: "Home", exact: true },
        { href: "/dashboard", label: "Dashboard" },
      ];
    } else if (status?.registered && status?.userType === "donor") {
      links = linksDonor;
    } else if (status?.registered && status?.userType === "receiver") {
      links = linksReceiver;
    } else {
      links = [
        { href: "/", label: "Home", exact: true },
        { href: "/dashboard", label: "Dashboard" },
      ];
    }
  }

  return (
    <header className="border-b border-border bg-card">
      <nav className="container flex h-14 items-center gap-4">
        <NavLink href="/" exact className="font-semibold hover:no-underline">
          No Leftovers
        </NavLink>
        <div className="ml-auto flex items-center gap-2">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} exact={l.exact}>
              {l.label}
            </NavLink>
          ))}
          <SignedIn>
            {status && status.registered && status.userType && (
              <span className="text-xs px-2 py-1 rounded bg-[#E0E0E0] text-[#212121]">
                {status.userType.charAt(0).toUpperCase() +
                  status.userType.slice(1)}{" "}
                Account
              </span>
            )}
            <UserButton userProfileUrl="/profile" afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>{/* no auth buttons when signed out */}</SignedOut>
        </div>
      </nav>
    </header>
  );
}
