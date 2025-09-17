import Input from "@/components/Input/Input";
import Link from "next/link";

export default function Register() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Register</h2>
      <form className="card grid gap-3">
        <Input label="Email" type="email" />
        <Input label="Password" type="password" />
        <Input label="Confirm Password" type="password" />
        <div className="flex gap-2">
          <button type="button" className="btn-primary w-fit">
            Create Account
          </button>
          <Link className="btn-primary" href="/login">
            Back to Login
          </Link>
        </div>
      </form>
    </section>
  );
}