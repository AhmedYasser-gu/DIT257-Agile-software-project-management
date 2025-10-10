import Link from "next/link";
import { SignedOut, SignedIn } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageProvider";

export default function Home() {

  const { t } = useLanguage();

  return (
    <section className="grid gap-6">
      <div className="card">
        <h1 className="text-3xl font-bold">🥗No Leftovers</h1>
        <p className="mt-2 text-subtext">
          Reduce food waste by connecting restaurants and stores with NGOs and
          people nearby.
        </p>

        <div className="mt-4 flex gap-3">
          <SignedOut>
            <p className="mt-2 text-subtext">
              Please login or register to proceed forward !
            </p>
            <Link className="btn-primary" href="/login">
              Login / Register
            </Link>
          </SignedOut>
          <SignedIn>
            <Link className="btn-primary" href="/dashboard">
              Go to dashboard
            </Link>
            <Link className="btn-outline" href="/explore">
              Explore
            </Link>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
