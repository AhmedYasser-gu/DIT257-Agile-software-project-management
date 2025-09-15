import Input from "@/components/Input/Input";


export default function Donate() {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold">Post a donation</h2>
      <form className="card grid gap-3 max-w-xl">
        <Input label="Title" requiredMark placeholder="e.g., Bakery surplus" />
        <label className="grid gap-1">
          <span className="label">Description</span>
          <textarea className="input min-h-[96px]" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Quantity" requiredMark placeholder="e.g., 6 portions" />
          <Input label="Pickup window" requiredMark placeholder="17:00–19:00" />
        </div>
        <button type="button" className="btn-primary w-fit">Post Donation</button>
      </form>
    </section>
  );
}
