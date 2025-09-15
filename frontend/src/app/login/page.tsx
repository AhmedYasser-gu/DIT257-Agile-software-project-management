import Input from "@/components/Input/Input";

export default function Login() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Login</h2>
      <form className="card grid gap-3">
        <Input label="Email" type="email" />
        <Input label="Password" type="password" />
        <button type="button" className="btn-primary w-fit">Sign in</button>
      </form>
    </section>
  );
}
