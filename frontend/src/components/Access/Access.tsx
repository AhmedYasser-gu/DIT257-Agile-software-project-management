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

  useEffect(() => {
    if (!isLoaded) return;

    // Logged out and only allowed when logged out
    if (!userId && allowIfLoggedOut) {
      return;
    }

    // Require auth but missing
    if (requireAuth && !userId) {
      router.replace("/login");
      return;
    }

    // If logged in and page is only for logged-out users
    if (userId && allowIfLoggedOut) {
      router.replace("/");
      return;
    }

    // Registration status checks (only when logged in)
    if (userId) {
      if (requireUnregistered) {
        if (status === undefined) return; // loading
        if (status?.registered) {
          router.replace("/");
          return;
        }
      }

      if (allowUserTypes && allowUserTypes.length > 0) {
        if (status === undefined) return; // loading
        const ok = status?.registered && status?.userType && allowUserTypes.includes(status.userType as UserType);
        if (!ok) {
          router.replace("/");
          return;
        }
      }
    }
  }, [userId, isLoaded, requireAuth, allowIfLoggedOut, requireUnregistered, allowUserTypes, status, router]);

  // Simple loading state while auth or status loads for guarded cases
  const needsStatus = (requireUnregistered || (allowUserTypes && allowUserTypes.length > 0)) && !!userId;
  const isLoading = !isLoaded || (needsStatus && status === undefined);
  if (isLoading) {
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


