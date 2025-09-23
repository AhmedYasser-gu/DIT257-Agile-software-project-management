import Link from "next/link";

const items = [
  { id: 1, title: "Bakery surplus", qty: "4 baguettes", claimed: false },
  { id: 2, title: "Sushi trays", qty: "6 portions",  claimed: true },
];

export default function Dashboard() {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold">My listings</h2>
      <h2 className="text-xl font-bold">Open</h2>
      {items
        .filter(i => !i.claimed)
        .map(i => (
          <div key={i.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{i.title}</div>
              <div className="text-sm text-subtext">{i.qty}</div>
            </div>
          </div>
      ))}
      <h2 className="text-xl font-bold">Claimed</h2>
      {items
        .filter(i => i.claimed)
        .map(i => (
          <div key={i.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{i.title}</div>
              <div className="text-sm text-subtext">{i.qty}</div>
            </div>
          </div>
      ))}
    </section>
  );
}