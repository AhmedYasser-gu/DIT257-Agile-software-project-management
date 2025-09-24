"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";

type UserType = "donor" | "receiver";

type AccessProps = {
  requireAuth?: boolean;
  allowIfLoggedOut?: boolean;
  allowUserTypes?: UserType[];
  requireUnregistered?: boolean;
  children: ReactNode;
};

export default function Access({
  requireAuth,
  allowIfLoggedOut,
  allowUserTypes,
  requireUnregistered,
  children,
}: AccessProps) {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const status = useQuery(
    api.functions.createUser.getRegistrationStatus,
    userId ? { clerk_id: userId } : "skip"
  );

  // Determine gating/loading and redirect rules synchronously to avoid content flash
  const needsStatus = (requireUnregistered || (allowUserTypes && allowUserTypes.length > 0)) && !!userId;
  const isChecking = !isLoaded || (needsStatus && status === undefined);

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
      if (allowIfLoggedOut) {
        notAllowed = true;
        redirectTo = "/";
      } else {
        if (requireUnregistered && status) {
          if (status.registered) {
            notAllowed = true;
            redirectTo = "/";
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


