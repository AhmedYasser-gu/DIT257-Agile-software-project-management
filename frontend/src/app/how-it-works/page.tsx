export default function HowItWorks() {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold">How No Leftovers works</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="card p-5">
          <div className="font-medium mb-1">1) Donors post food</div>
          <p className="text-sm text-subtext">Restaurants create time‑boxed offers with pickup windows.</p>
        </div>
        <div className="card p-5">
          <div className="font-medium mb-1">2) Receivers claim</div>
          <p className="text-sm text-subtext">Individuals/charities browse nearby items and claim what they need.</p>
        </div>
        <div className="card p-5">
          <div className="font-medium mb-1">3) Pickup</div>
          <p className="text-sm text-subtext">Pickup happens within the stated window; expired items auto‑close.</p>
        </div>
      </div>
    </section>
  );
}
