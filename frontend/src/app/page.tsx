import Link from "next/link";


export default function Home() {
  return (
    <section className="grid gap-6">
      <div className="card">
        <h1 className="text-3xl font-bold">No Leftovers</h1>
        <p className="mt-2 text-subtext">
          Reduce food waste by connecting restaurants and stores with NGOs and people nearby.
        </p>
        <div className="mt-4 flex gap-3">
          <Link className="btn-primary" href="/explore">Explore</Link>
          <Link className="btn-outline" href="/donate">Post Donation</Link>
          <Link className="btn-outline" href="/login">Login to account</Link>
        </div>
      </div>
    </section>
  );
}
