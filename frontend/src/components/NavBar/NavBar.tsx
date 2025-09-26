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
  const status = useQuery(api.functions.createUser.getRegistrationStatus, userId ? { clerk_id: userId } : "skip");
  if (hide) return null;

  const linksLoggedOut: { href: string; label: string; exact?: boolean }[] = [
    { href: "/", label: "Home", exact: true },
    { href: "/explore", label: "Explore" },
  ];
  const linksDonor: { href: string; label: string; exact?: boolean }[] = [
    { href: "/", label: "Home", exact: true },
    { href: "/donate", label: "Post Donation" },
    { href: "/dashboard", label: "Dashboard" },
  ];
  const linksReceiver: { href: string; label: string; exact?: boolean }[] = [
    { href: "/", label: "Home", exact: true },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  let links: { href: string; label: string; exact?: boolean }[] = linksLoggedOut;
  if (userId) {
    if (status === undefined) {
      links = [];
    } else if (status?.registered && status?.userType === "donor") {
      links = linksDonor;
    } else if (status?.registered && status?.userType === "receiver") {
      links = linksReceiver;
    } else {
      links = linksLoggedOut;
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
            <UserButton userProfileUrl="/profile" afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            {/* No auth buttons in header when signed out, per requirements */}
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}

