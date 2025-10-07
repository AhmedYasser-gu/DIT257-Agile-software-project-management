"use client";

import NavLink from "@/components/NavLink/NavLink";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";


export default function NavBar() {

  const pathname = usePathname();
  const { userId } = useAuth();
  const hide = pathname?.startsWith("/login/register");

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? resolvedTheme : "light";

  const toggleIcon = (on: boolean) => (
    <span
      aria-hidden
      className="relative inline-block h-4 w-7 rounded-full border border-border bg-card dark:bg-zinc-800"
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-3" : "",
        ].join(" ")}
      />
    </span>
  );

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
    { href: "/how-it-works", label: "How it works" },
  ];
  const linksReceiver = [
    { href: "/", label: "Home", exact: true },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Dashboard" },
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
    <header className="border-b border-border bg-card dark:border-zinc-800 dark:bg-zinc-900/80">
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
            {status?.registered && status?.userType && (
              <span className="rounded px-2 py-1 text-xs bg-border/70 text-text">
                {status.userType.charAt(0).toUpperCase() + status.userType.slice(1)} Account
              </span>
            )}
              <UserButton userProfileUrl="/profile" afterSignOutUrl="/">
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Theme"
                    labelIcon={toggleIcon(current === "dark")}
                    onClick={() => setTheme(current === "dark" ? "light" : "dark")}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          <SignedOut>{/* no auth buttons when signed out */}</SignedOut>
        </div>
      </nav>
    </header>
  );
}


