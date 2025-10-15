import { query } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type StatusBreakdown = {
  available: number;
  claimed: number;
  pickedUp: number;
  expired: number;
};

type FoodMetrics = {
  totalQuantity: number;
  rescuedQuantity: number;
  claimedQuantity: number;
  availableQuantity: number;
};

type ClaimsMetrics = {
  totalClaims: number;
  totalClaimedQuantity: number;
  pickedUpClaims: number;
  pickedUpQuantity: number;
  pendingClaims: number;
  timedOutClaims: number;
};

type TimelinePoint = {
  day: string;
  donations: number;
  claims: number;
  pickups: number;
  rescuedQuantity: number;
};

type CategoryBreakdownItem = {
  category: string;
  donations: number;
  quantity: number;
};

type TopDonorItem = {
  donorId: string;
  donorName: string;
  totalDonations: number;
  totalQuantity: number;
};

type RecentDonation = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  status: string;
  donorName: string | null;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  createdAt: number;
};

type ImpactMetrics = {
  totals: {
    donations: number;
    donors: number;
    receivers: number;
    claims: number;
  };
  statusBreakdown: StatusBreakdown;
  food: FoodMetrics;
  claims: ClaimsMetrics;
  timeline: TimelinePoint[];
  topCategories: CategoryBreakdownItem[];
  topDonors: TopDonorItem[];
  recentDonations: RecentDonation[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toNumber(value: Doc<"donations">["quantity"] | Doc<"claims">["amount"] | undefined | null): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return 0;
}

function formatDay(ts: number): string {
  const d = new Date(ts);
  // Convert to YYYY-MM-DD for stable keys (UTC)
  return d.toISOString().slice(0, 10);
}

export const getImpactMetrics = query(async ({ db }): Promise<ImpactMetrics> => {
  const [donations, claims, donors, receivers] = await Promise.all([
    db.query("donations").collect(),
    db.query("claims").collect(),
    db.query("donors").collect(),
    db.query("recievers").collect(),
  ]);

  const donorsById = new Map<string, Doc<"donors">>();
  donors.forEach((d) => {
    donorsById.set(String(d._id), d);
  });

  const totals = {
    donations: donations.length,
    donors: donors.length,
    receivers: receivers.length,
    claims: claims.length,
  };

  const statusBreakdown: StatusBreakdown = {
    available: 0,
    claimed: 0,
    pickedUp: 0,
    expired: 0,
  };

  const food: FoodMetrics = {
    totalQuantity: 0,
    rescuedQuantity: 0,
    claimedQuantity: 0,
    availableQuantity: 0,
  };

  const categoryMap = new Map<string, { quantity: number; donations: number }>();
  const donorContribution = new Map<string, { donorName: string; totalDonations: number; totalQuantity: number }>();

  donations.forEach((donation) => {
    const quantity = toNumber(donation.quantity);
    food.totalQuantity += quantity;

    const status = String(donation.status ?? "");
    switch (status) {
      case "AVAILABLE":
        statusBreakdown.available += 1;
        food.availableQuantity += quantity;
        break;
      case "CLAIMED":
        statusBreakdown.claimed += 1;
        food.claimedQuantity += quantity;
        break;
      case "PICKEDUP":
        statusBreakdown.pickedUp += 1;
        food.claimedQuantity += quantity;
        food.rescuedQuantity += quantity;
        break;
      case "EXPIRED":
        statusBreakdown.expired += 1;
        break;
      default:
        break;
    }

    const category = donation.category ?? "Uncategorized";
    const cat = categoryMap.get(category) ?? { quantity: 0, donations: 0 };
    cat.quantity += quantity;
    cat.donations += 1;
    categoryMap.set(category, cat);

    const donorId = donation.donor_id ? String(donation.donor_id) : "unknown";
    const donorDoc = donation.donor_id ? donorsById.get(donorId) : undefined;
    const donorName = donorDoc?.business_name ?? "Unknown donor";
    const donorStats = donorContribution.get(donorId) ?? {
      donorName,
      totalDonations: 0,
      totalQuantity: 0,
    };
    donorStats.totalDonations += 1;
    donorStats.totalQuantity += quantity;
    donorContribution.set(donorId, donorStats);
  });

  const claimsMetrics: ClaimsMetrics = {
    totalClaims: claims.length,
    totalClaimedQuantity: 0,
    pickedUpClaims: 0,
    pickedUpQuantity: 0,
    pendingClaims: 0,
    timedOutClaims: 0,
  };

  claims.forEach((claim) => {
    const amount = toNumber(claim.amount);
    claimsMetrics.totalClaimedQuantity += amount;

    const status = String(claim.status ?? "");
    if (status === "PENDING") {
      claimsMetrics.pendingClaims += 1;
    } else if (status === "TIMESUP") {
      claimsMetrics.timedOutClaims += 1;
    } else if (status === "PICKEDUP") {
      claimsMetrics.pickedUpClaims += 1;
      claimsMetrics.pickedUpQuantity += amount;
    }
  });

  // Ensure rescued quantity reflects claims data when available
  if (claimsMetrics.pickedUpQuantity > 0 && claimsMetrics.pickedUpQuantity > food.rescuedQuantity) {
    food.rescuedQuantity = claimsMetrics.pickedUpQuantity;
  }

  const now = Date.now();
  const timelineStart = now - DAY_MS * 29;

  const timelineMap = new Map<string, TimelinePoint>();
  for (let i = 29; i >= 0; i -= 1) {
    const ts = now - i * DAY_MS;
    const key = formatDay(ts);
    timelineMap.set(key, {
      day: key,
      donations: 0,
      claims: 0,
      pickups: 0,
      rescuedQuantity: 0,
    });
  }

  donations.forEach((donation) => {
    const created = Number((donation as any)._creationTime ?? 0);
    if (created >= timelineStart) {
      const key = formatDay(created);
      const bucket = timelineMap.get(key);
      if (bucket) {
        bucket.donations += 1;
      }
    }
  });

  claims.forEach((claim) => {
    const created = Number((claim as any)._creationTime ?? 0);
    if (created >= timelineStart) {
      const key = formatDay(created);
      const bucket = timelineMap.get(key);
      if (bucket) {
        bucket.claims += 1;
        if (String(claim.status ?? "") === "PICKEDUP") {
          bucket.pickups += 1;
          const amount = toNumber(claim.amount);
          bucket.rescuedQuantity += amount;
        }
      }
    }
  });

  const timeline = Array.from(timelineMap.values());

  const topCategories = Array.from(categoryMap.entries())
    .map(([category, info]) => ({
      category,
      donations: info.donations,
      quantity: info.quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  const topDonors = Array.from(donorContribution.entries())
    .filter(([donorId]) => donorId !== "unknown")
    .map(([donorId, info]) => ({
      donorId,
      donorName: info.donorName,
      totalDonations: info.totalDonations,
      totalQuantity: info.totalQuantity,
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

  const recentDonations = donations
    .slice()
    .sort((a, b) => Number((b as any)._creationTime ?? 0) - Number((a as any)._creationTime ?? 0))
    .slice(0, 6)
    .map((donation) => {
      const donorId = donation.donor_id ? String(donation.donor_id) : undefined;
      const donorDoc = donorId ? donorsById.get(donorId) : undefined;
      return {
        id: String(donation._id),
        title: donation.title,
        category: donation.category,
        quantity: toNumber(donation.quantity),
        status: String(donation.status ?? ""),
        donorName: donorDoc?.business_name ?? null,
        pickupWindowStart: donation.pickup_window_start,
        pickupWindowEnd: donation.pickup_window_end,
        createdAt: Number((donation as any)._creationTime ?? 0),
      };
    });

  return {
    totals,
    statusBreakdown,
    food,
    claims: claimsMetrics,
    timeline,
    topCategories,
    topDonors,
    recentDonations,
  };
});


