import Input from "@/components/Input/Input";
import Link from "next/link";

export default function Login() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Login</h2>
      <form className="card grid gap-3">
        <Input label="Email" type="email" />
        <Input label="Password" type="password" />
        <div className="flex gap-2">
          <button type="button" className="btn-primary w-fit">Sign in</button>
          <Link className="btn-primary" href="/register">Register</Link>
        </div>
      </form>
    </section>
  );
}
