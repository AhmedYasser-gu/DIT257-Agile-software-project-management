import Link from "next/link";

const items = [
  { id: 1, title: "Bakery surplus", qty: "4 baguettes", distance: "1.2 km" },
  { id: 2, title: "Sushi trays", qty: "6 portions",  distance: "2.0 km" },
];

export default function Explore() {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold">Nearby donations</h2>
      {items.map(i => (
        <div key={i.id} className="card flex items-center justify-between">
          <div>
            <div className="font-medium">{i.title}</div>
            <div className="text-sm text-subtext">{i.qty} · {i.distance}</div>
          </div>
          <Link className="btn-primary" href={`/explore/${i.id}`}>Claim</Link>
        </div>
      ))}
    </section>
  );
}
