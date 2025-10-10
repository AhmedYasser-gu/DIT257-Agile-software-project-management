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
import Image from "next/image";
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
  imageUrl?: string | null;
  donor?: {
    _id: string;
    business_name: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
  } | null;
};

const toNum = (x: number | bigint) => (typeof x === "bigint" ? Number(x) : x);

type AvailableDonationWithDistance = AvailableDonation & { distanceKm?: number | null };

const distanceFilters = [
  { value: "any", label: "All distances" },
  { value: "1", label: "Within 1 km" },
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "25", label: "Within 25 km" },
  { value: "50", label: "Within 50 km" },
];

const EARTH_RADIUS_KM = 6371;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

function distanceKmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const c = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const distance = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  return EARTH_RADIUS_KM * distance;
}

function formatDistance(km: number) {
  if (!Number.isFinite(km)) return null;
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

export default function Explore() {
  const data = useQuery(api.functions.listAvailableDonations.listAvailableDonations) as
    | AvailableDonation[]
    | undefined;

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("soonest");
  const [distanceFilter, setDistanceFilter] = useState<string>("any");
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
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      if (cancelled) return;
      setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    };

    const handleError = () => {
      if (cancelled) return;
      setMe((prev) => prev ?? null);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      cancelled = true;
      if (typeof watchId === "number") {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const cats = useMemo(() => {
    const c = new Set<string>();
    (data ?? []).forEach((d) => c.add(d.category));
    return ["all", ...Array.from(c)];
  }, [data]);

  const list = useMemo<AvailableDonationWithDistance[]>(() => {
    let L: AvailableDonationWithDistance[] = (data ?? []).map((d) => ({ ...d }));
    if (me) {
      L = L.map((d) => {
        const donorLat = d.donor?.lat;
        const donorLng = d.donor?.lng;
        if (Number.isFinite(donorLat) && Number.isFinite(donorLng)) {
          return {
            ...d,
            distanceKm: distanceKmBetween(me, {
              lat: donorLat as number,
              lng: donorLng as number,
            }),
          };
        }
        return { ...d, distanceKm: null };
      });
    }

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
    if (distanceFilter !== "any" && me) {
      const limit = Number(distanceFilter);
      if (Number.isFinite(limit)) {
        L = L.filter((d) =>
          d.distanceKm === null ? false : (d.distanceKm ?? Infinity) <= limit
        );
      }
    }
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
  }, [data, q, cat, sort, distanceFilter, me]);

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
        <div className="grid gap-4 sm:flex sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Nearby donations</h2>
            <p className="text-subtext text-sm">Browse and claim food that’s still good!</p>
          </div>
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center sm:gap-2">
            <input
              className="input w-full sm:w-52"
              placeholder="Search (title, description, donor)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="grid gap-2 sm:flex sm:gap-2">
              <select className="input w-full sm:w-40" value={cat} onChange={(e) => setCat(e.target.value)}>
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="input w-full sm:w-40"
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
              >
                {distanceFilters.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <select className="input w-full sm:w-40" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="soonest">Soonest pickup</option>
                <option value="newest">Newest</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MapViewOpenLayers
            className="order-1 md:order-none"
            points={points}
            userLocation={me}
            height={360}
            emptyMessage="No donors with available location shared yet."
            radiusKm={distanceFilter !== "any" ? Number(distanceFilter) : null}
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
                  const distanceLabel =
                    me && Number.isFinite(d.distanceKm) && d.distanceKm !== null
                      ? formatDistance(d.distanceKm as number)
                      : null;
                  return (
                    <li
                      key={d._id}
                      className="card donation-card flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:flex-1">
                        {d.imageUrl && (
                          <div className="relative h-32 w-full overflow-hidden rounded-md sm:h-24 sm:w-24 sm:shrink-0">
                            <Image
                              src={d.imageUrl}
                              alt={d.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 96px"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="grid gap-1 overflow-hidden">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 overflow-hidden">
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
                            {distanceLabel && <span> · {distanceLabel} away</span>}
                          </div>
                          {d.description && <div className="text-sm line-clamp-2 break-anywhere">{d.description}</div>}

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
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
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
