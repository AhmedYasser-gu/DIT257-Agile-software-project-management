"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";

type UserType = "donor" | "receiver";

type AccessProps = {
  requireAuth?: boolean;
  allowIfLoggedOut?: boolean;
  allowUserTypes?: UserType[];
  requireUnregistered?: boolean;
  redirectIfRegisteredTo?: string;
  children: ReactNode;
};

export default function Access({
  requireAuth,
  allowIfLoggedOut,
  allowUserTypes,
  requireUnregistered,
  redirectIfRegisteredTo,
  children,
}: AccessProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, isLoaded } = useAuth();
  const status = useQuery(
    api.functions.createUser.getRegistrationStatus,
    userId ? { clerk_id: userId } : "skip"
  );

  // Determine gating/loading and redirect rules synchronously to avoid content flash
  // For registration pages (requireUnregistered), don't block UI while status loads.
  // Only block when we need status for role-based gating via allowUserTypes.
  const needsStatus = ((allowUserTypes && allowUserTypes.length > 0) ? true : false) && !!userId;
  const deferAuthForRegistration = !!requireUnregistered;
  const onRegistrationRoute = (pathname ?? "").startsWith("/login/register");
  const shouldGateRegistrationCheck = !!userId && !onRegistrationRoute;
  const isChecking =
    (!deferAuthForRegistration && !isLoaded) ||
    (needsStatus && status === undefined) ||
    (shouldGateRegistrationCheck && status === undefined);

  let notAllowed = false;
  let redirectTo: string | null = null;

  if (isLoaded && !isChecking) {
    if (!userId) {
      if (requireAuth) {
        notAllowed = true;
        redirectTo = "/login";
      } else if (!allowIfLoggedOut) {
        // Public page; allowed
      }
    } else {
      // If user is logged in but not registered in Convex, always redirect to register flow
      if (!onRegistrationRoute && status && !status.registered) {
        notAllowed = true;
        redirectTo = "/login/register";
      } else if (allowIfLoggedOut) {
        // Logged in users should not see pages marked allowIfLoggedOut (e.g., login page)
        // If they are already registered, send them home; if not, the above rule already handled it.
        notAllowed = true;
        redirectTo = "/";
      } else {
        if (requireUnregistered && status) {
          if (status.registered) {
            // On registration pages, do not block UI; just trigger a redirect.
            redirectTo = redirectIfRegisteredTo || "/dashboard";
          }
        }
        if (!notAllowed && allowUserTypes && allowUserTypes.length > 0 && status) {
          const ok = !!status.registered && !!status.userType && allowUserTypes.includes(status.userType as UserType);
          if (!ok) {
            notAllowed = true;
            redirectTo = "/";
          }
        }
      }
    }
  }

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    // Only auto-refresh while waiting on role/status checks.
    // Avoid refreshing during redirects or on registration pages.
    if (!(needsStatus && status === undefined)) return;
    const id = setInterval(() => {
      router.refresh();
    }, 2000);
    return () => clearInterval(id);
  }, [needsStatus, status, router]);

  // While checking or when redirecting, render only a minimal placeholder
  if (isChecking || notAllowed) {
    return (
      <section className="grid gap-4 max-w-md">
        <div className="card grid gap-4 p-6">
          <p className="text-subtext">Checking permissions…</p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}


