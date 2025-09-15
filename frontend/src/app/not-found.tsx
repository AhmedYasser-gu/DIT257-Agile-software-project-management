import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-10 grid gap-4">
      <div className="card">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-subtext mt-1">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <div className="mt-4">
          <Link href="/" className="btn-primary">Go home</Link>
        </div>
      </div>
    </div>
  );
}
