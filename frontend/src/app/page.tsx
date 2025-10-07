import Link from "next/link";
import { SignedOut, SignedIn } from "@clerk/nextjs";

export default function Home() {
  return (
    <section className="grid gap-6">
      <div className="card">
        <h1 className="text-3xl font-bold">🥗No Leftovers</h1>
        <p className="mt-2 text-subtext">
          Reduce food waste by connecting restaurants and stores with NGOs and
          people nearby.
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <SignedOut>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-subtext">
                Please login or register to proceed forward !
              </p>
              <Link className="btn-primary" href="/login">
                Login / Register
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex gap-3">
              <Link className="btn-primary" href="/dashboard">
                Go to dashboard
              </Link>
              <Link className="btn-outline" href="/explore">
                Explore
              </Link>
            </div>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
