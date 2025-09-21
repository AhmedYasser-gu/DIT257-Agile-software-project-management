import { SignUpButton } from "@clerk/nextjs";

export default function RegisterReciver() {
  return (
    <section className="grid gap-4 max-w-md">
      <h2 className="text-2xl font-semibold">Register</h2>
      <div className="card grid gap-4 p-6">
        <p className="text-subtext">Create an account to start donating or claiming food.</p>
        <form className="grid gap-3">
          <label className="grid gap-1">
            <span className="label">Occupation</span>
            <input type="text" className="input" placeholder="Enter your occupation" />
          </label>
          <label className="grid gap-1">
            <span className="label">Referral</span>
            <input type="text" className="input" placeholder="Who referred you?" />
          </label>
          <label className="grid gap-1">
            <span className="label">ID</span>
            <input type="text" className="input" placeholder="Enter your ID" />
          </label>
          <SignUpButton mode="modal" forceRedirectUrl="/">
            <button type="button" className="btn-primary">Open register</button>
          </SignUpButton>
        </form>
      </div>
    </section>
  );
}