"use client";
import Access from "@/components/Access/Access";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";
import Skeleton from "@/components/Feedback/Skeleton";
import Empty from "@/components/Feedback/Empty";
import CategoryPill from "@/components/Badge/CategoryPill";
import StatusBadge from "@/components/Badge/StatusBadge";
import { fmt, minutesRemaining } from "@/helpers/time";
import Link from "next/link";

type SortKey = "soonest" | "newest" | "title";

type AvailableDonation = {
  _id: string; // Convex ids are serialized to strings in the client
  title: string;
  description?: string;
  category: string;
  quantity: number | bigint;
  pickup_window_start?: string;
  pickup_window_end?: string;
  status: "AVAILABLE" | "CLAIMED" | "PICKEDUP" | "EXPIRED" | string;
  donor?: { _id: string; business_name: string; address?: string } | null;
};

export default function Explore() {
  const data = useQuery(api.functions.listAvailableDonations.listAvailableDonations) as
    | AvailableDonation[]
    | undefined;

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("soonest");

  const cats = useMemo(() => {
    const c = new Set<string>();
    (data ?? []).forEach((d) => c.add(d.category));
    return ["all", ...Array.from(c)];
  }, [data]);

  const list = useMemo(() => {
    let L = (data ?? []).slice();
    if (q.trim()) {
      const t = q.toLowerCase();
      L = L.filter(
        (d) =>
          d.title.toLowerCase().includes(t) ||
          (d.description ?? "").toLowerCase().includes(t)
      );
    }
    if (cat !== "all") L = L.filter((d) => d.category === cat);
    L.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "newest") return b._id.localeCompare(a._id);
      const ae =
        new Date((a.pickup_window_end || "").replace(" ", "T")).getTime() ||
        Infinity;
      const be =
        new Date((b.pickup_window_end || "").replace(" ", "T")).getTime() ||
        Infinity;
      return ae - be;
    });
    return L;
  }, [data, q, cat, sort]);

  return (
    <Access requireAuth allowUserTypes={["receiver"]}>
      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Nearby donations</h2>
            <p className="text-subtext text-sm">Browse and claim food that’s still good !</p>
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Search…" value={q} onChange={(e)=>setQ(e.target.value)} />
            <select className="input" value={cat} onChange={(e)=>setCat(e.target.value)}>
              {cats.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className="input" value={sort} onChange={(e)=>setSort(e.target.value as SortKey)}>
              <option value="soonest">Soonest pickup</option>
              <option value="newest">Newest</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        {data === undefined && (
          <div className="grid gap-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}

        {data && list.length === 0 && (
          <Empty title="No donations match your filters." hint="Try clearing the search or switching category." />
        )}

        {data && list.length > 0 && (
          <ul className="grid gap-3">
            {list.map((d) => {
              const mins = minutesRemaining(d.pickup_window_end);
              return (
                <li key={d._id} className="card flex items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{d.title}</div>
                      <CategoryPill label={d.category} />
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="text-sm text-subtext">
                      Qty: {String(d.quantity)} · {d.donor?.business_name ?? "Unknown donor"}
                    </div>
                    <div className="text-xs text-subtext">
                      Pickup: {fmt(d.pickup_window_start)} → {fmt(d.pickup_window_end)}
                      {Number.isFinite(mins) && mins > 0 && <span> · {mins} min left</span>}
                    </div>
                    {d.description && <div className="text-sm">{d.description}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Link className="btn-primary" href="/dashboard">Proceed</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Access>
  );
}
