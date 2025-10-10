"use client";

import NavLink from "@/components/NavLink/NavLink";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

import { useEffect, useState } from "react";

export default function NavBar() {

  const pathname = usePathname();
  const { userId } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? resolvedTheme : "light";
  const { lang, setLang, t } = useLanguage(); // "en" | "sv"


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

const langBadge = (current: "en" | "sv") => (
  <span
    aria-hidden
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,           // fits Clerk's icon slot
      height: 16,
      borderRadius: 9999,
      background: "var(--c-primary)",
      color: "#fff",
      fontSize: 10,
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    {current.toUpperCase()}
  </span>
);





  const status = useQuery(
    api.functions.createUser.getRegistrationStatus,
    userId ? { clerk_id: userId } : "skip"
  );

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const hide = pathname?.startsWith("/login/register");
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
        { href: "/", label: t("Home"), exact: true },
        { href: "/dashboard", label: t("Dashboard") },
      ];
    } else if (status?.registered && status?.userType === "donor") {
      links = linksDonor;
    } else if (status?.registered && status?.userType === "receiver") {
      links = linksReceiver;
    } else {
      links = [
        { href: "/", label: t("Home"), exact: true },
        { href: "/dashboard", label: t("Dashboard") },
      ];
    }
  }
  const userTypeBadge =
    status && status.registered && status.userType ? (
      <span className="text-xs px-2 py-1 rounded bg-[#E0E0E0] text-[#212121]">
        {status.userType.charAt(0).toUpperCase() + status.userType.slice(1)} Account
      </span>
    ) : null;

  return (
    <header className="border-b border-border bg-card dark:border-zinc-800 dark:bg-zinc-900/80">
      <nav className="container relative flex h-14 items-center gap-4">
        <NavLink href="/" exact className="font-semibold hover:no-underline">
          No Leftovers
        </NavLink>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} exact={l.exact}>
              {l.label}
            </NavLink>
          ))}    
             
          <SignedIn>
            {userTypeBadge}
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

        <div className="ml-auto md:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-text transition-colors hover:bg-muted"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="sr-only">Toggle navigation menu</span>
            <span className="flex flex-col items-center justify-center gap-1">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>

          {isMenuOpen && (
            <div className="fixed inset-x-4 top-16 z-50 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
              <nav className="flex flex-col gap-2 p-4">
                {links.map((l) => (
                  <NavLink
                    key={l.href}
                    href={l.href}
                    exact={l.exact}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {l.label}
                  </NavLink>
                ))}
                <SignedIn>
                  {userTypeBadge}
                  <UserButton userProfileUrl="/profile" afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>{/* no auth buttons when signed out */}</SignedOut>
              </nav>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}


