import { query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

type AvailableDonation = {
  _id: Id<"donations">;
  title: string;
  description: string;
  category: string;
  quantity: Doc<"donations">["quantity"];
  pickup_window_start: string;
  pickup_window_end: string;
  status: Doc<"donations">["status"];
  imageUrl?: string | null;
  donor: null | {
    _id: Id<"donors">;
    business_name: string;
    address: string;
    lat: number | null;
    lng: number | null;
  };
};

export const listAvailableDonations = query(async ({ db, storage }): Promise<AvailableDonation[]> => {
  const all: Doc<"donations">[] = await db.query("donations").collect();
  const now = Date.now();

  const available = all
    .filter((d) => {
      if (d.status !== "AVAILABLE") return false;
      const endStr = d.pickup_window_end;
      if (!endStr) return true;
      const normalized = endStr.includes("T") ? endStr : endStr.replace(" ", "T");
      const end = new Date(normalized).getTime();
      return Number.isFinite(end) ? end >= now : true;
    })
    .sort((a, b) => {
      const aEnd = new Date((a.pickup_window_end || "").replace(" ", "T")).getTime() || 0;
      const bEnd = new Date((b.pickup_window_end || "").replace(" ", "T")).getTime() || 0;
      return aEnd - bEnd || a.title.localeCompare(b.title);
    });

  const withDonor: AvailableDonation[] = await Promise.all(
    available.map(async (d) => {
      const donor = await db.get(d.donor_id as Id<"donors">);
      const firstImageId = Array.isArray((d as any).images) && (d as any).images.length > 0
        ? ((d as any).images[0] as any)
        : null;
      const imageUrl = firstImageId ? await storage.getUrl(firstImageId) : null;
      return {
        _id: d._id,
        title: d.title,
        description: d.description,
        category: d.category,
        quantity: d.quantity,
        pickup_window_start: d.pickup_window_start,
        pickup_window_end: d.pickup_window_end,
        status: d.status,
        imageUrl,
        donor: donor
          ? {
              _id: donor._id,
              business_name: donor.business_name,
              address: donor.address,
              lat: typeof donor.lat === "number" ? donor.lat : null,
              lng: typeof donor.lng === "number" ? donor.lng : null,
            }
          : null,
      };
    })
  );

  return withDonor;
});
