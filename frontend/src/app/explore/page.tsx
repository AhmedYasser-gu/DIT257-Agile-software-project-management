"use client";
import Access from "@/components/Access/Access";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convexApi";
import Skeleton from "@/components/Feedback/Skeleton";
import Empty from "@/components/Feedback/Empty";
import CategoryPill from "@/components/Badge/CategoryPill";
import StatusBadge from "@/components/Badge/StatusBadge";
import { fmt, minutesRemaining } from "@/helpers/time";
import Link from "next/link";
import MapViewOpenLayers, { MapPoint } from "@/components/Map/MapViewOpenLayers";

type SortKey = "soonest" | "newest" | "title";

type AvailableDonation = {
  _id: string;
  title: string;
  description?: string;
  category: string;
  quantity: number | bigint;
  pickup_window_start?: string;
  pickup_window_end?: string;
  status: "AVAILABLE" | "CLAIMED" | "PICKEDUP" | "EXPIRED" | string;
  donor?: {
    _id: string;
    business_name: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
  } | null;
};

const toNum = (x: number | bigint) => (typeof x === "bigint" ? Number(x) : x);

export default function Explore() {
  const data = useQuery(api.functions.listAvailableDonations.listAvailableDonations) as
    | AvailableDonation[]
    | undefined;

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("soonest");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);


  const donorIds = useMemo(
    () => Array.from(new Set((data ?? []).map((d) => d.donor?._id).filter(Boolean))),
    [data]
  );

  const donorReviews = useQuery(api.functions.reviews.getReviewsForDonors, {
    donorIds: donorIds as string[],
  }) as Record<string, { rating: number }[]> | undefined;


  const getAvgRating = (donorId: string) => {
    const reviews = donorReviews?.[donorId] ?? [];
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  };

  // device location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMe(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

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
          (d.description ?? "").toLowerCase().includes(t) ||
          (d.donor?.business_name ?? "").toLowerCase().includes(t)
      );
    }
    if (cat !== "all") L = L.filter((d) => d.category === cat);
    L.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "newest") return (b._id ?? "").localeCompare(a._id ?? "");
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

  // PER‑DONATION points; MapView will group them for the tooltip
  const points: MapPoint[] = useMemo(
    () =>
      (list ?? [])
        .filter((d) => Number.isFinite(d.donor?.lat) && Number.isFinite(d.donor?.lng))
        .map((d) => ({
          id: d._id,
          lat: d.donor!.lat as number,
          lng: d.donor!.lng as number,
          donorName: d.donor?.business_name,
          title: d.title,
          items: d.description
            ? d.description.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
            : undefined,
          status: d.status,
          detailUrl: "/dashboard",
        })),
    [list]
  );

  return (
    <Access requireAuth allowUserTypes={["receiver"]}>
      <section className="grid gap-4">
        {/* Controls */}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold">Nearby donations</h2>
            <p className="text-subtext text-sm">Browse and claim food that’s still good!</p>
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Search (title, description, donor)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="soonest">Soonest pickup</option>
              <option value="newest">Newest</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <MapViewOpenLayers
            className="order-1 md:order-none"
            points={points}
            userLocation={me}
            height={360}
            emptyMessage="No donors with available location shared yet."
          />

          <div className="order-2 md:order-none">
            {data === undefined && (
              <div className="grid gap-2">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            )}

            {data && list.length === 0 && (
              <Empty
                title="No donations match your filters."
                hint="Try clearing the search or switching category."
              />
            )}

            {data && list.length > 0 && (
              <ul className="grid gap-3">
                {list.map((d) => {
                  const mins = minutesRemaining(d.pickup_window_end);
                  return (
                  <li key={d._id} className="card donation-card flex items-start justify-between gap-4">
                    <div className="grid gap-1 overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="font-medium line-clamp-2 break-anywhere">{d.title}</div>
                        <CategoryPill label={d.category} />
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="text-sm text-subtext line-clamp-2 break-anywhere">
                        Qty: {String(toNum(d.quantity))} · {d.donor?.business_name ?? "Unknown donor"}
                      </div>
                      <div className="text-xs text-subtext line-clamp-2 break-anywhere">
                        Pickup: {fmt(d.pickup_window_start)} → {fmt(d.pickup_window_end)}
                        {Number.isFinite(mins) && mins > 0 && <span> · {mins} min left</span>}
                      </div>
                      {d.description && <div className="text-sm line-clamp-2 break-anywhere">{d.description}</div>}

                      {/* Reviews go here inside the same container */}
                      {d.donor?._id && donorReviews && (
                        <div className="text-sm line-clamp-2">
                          {(() => {
                            const avg = getAvgRating(d.donor._id);
                            if (!avg) return "No reviews yet";
                            const fullStars = Math.floor(avg);
                            const halfStar = avg - fullStars >= 0.5;
                            return (
                              <>
                                {"⭐".repeat(fullStars)}
                                {halfStar && "✩"} ({avg.toFixed(1)})
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link className="btn-primary" href="/dashboard">
                        Proceed
                      </Link>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </Access>
  );
}
