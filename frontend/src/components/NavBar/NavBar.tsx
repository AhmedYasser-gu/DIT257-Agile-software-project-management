"use client";

import NavLink from "@/components/NavLink/NavLink";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function NavBar() {
  const links: { href: string; label: string; exact?: boolean }[] = [
    { href: "/", label: "Home", exact: true },
    { href: "/explore", label: "Explore" },
    { href: "/donate", label: "Post Donation" },
    { href: "/dashboard", label: "Dashboard" },
  ];

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