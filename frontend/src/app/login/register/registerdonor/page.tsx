"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convexApi";
import { useRouter } from "next/navigation";
import Access from "@/components/Access/Access";
import MapViewOpenLayers from "@/components/Map/MapViewOpenLayers";

type DonorOption = { _id: string; name: string };

export default function RegisterDonater() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const registerDonor = useMutation(api.functions.createUser.registerDonor);
  const donors = useQuery(api.functions.createUser.listDonors, {}) as DonorOption[] | undefined;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [selectedDonorId, setSelectedDonorId] = useState<string>("");
  const NEW_BUSINESS_VALUE = "__new_business__";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // protect against accidental leave
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (!completed) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    const pop = () => !completed && history.pushState(null, "", location.href);
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("popstate", pop);
    };
  }, [completed]);

  const allValid = useMemo(() => {
    const hasUser = firstName.trim() && lastName.trim() && phone.trim();
    if (!hasUser) return false;
    if (selectedDonorId && selectedDonorId !== NEW_BUSINESS_VALUE) return true;
    return businessName.trim() && businessEmail.trim() && businessPhone.trim() && address.trim();
  }, [firstName, lastName, phone, selectedDonorId, businessName, businessEmail, businessPhone, address]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError("You must be signed in to register.");
      return;
    }
    if (!allValid && !selectedDonorId) return;

    try {
      setSubmitting(true);
      if (selectedDonorId && selectedDonorId !== NEW_BUSINESS_VALUE) {
        await registerDonor({
          clerk_id: userId,
          first_name: firstName,
          last_name: lastName,
          phone,
          donors_id: selectedDonorId as unknown as string,
        });
      } else {
        await registerDonor({
          clerk_id: userId,
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
          business_name: businessName,
          business_email: businessEmail,
          business_phone: businessPhone,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        });
      }
      setCompleted(true);
      router.replace("/dashboard");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // seed form from Clerk
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setBusinessEmail(user.primaryEmailAddress?.emailAddress ?? "");
    setPhone(user.primaryPhoneNumber?.phoneNumber ?? "");
  }, [user]);

  // --- Geocoding helpers (Nominatim) ---
  const geocodeTimer = useRef<number | null>(null);

  // forward geocode address -> coords (debounced)
  useEffect(() => {
    if (!address.trim()) return;
    if (geocodeTimer.current) window.clearTimeout(geocodeTimer.current);
    geocodeTimer.current = window.setTimeout(async () => {
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", address);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "1");
        const res = await fetch(url.toString(), {
          headers: { "Accept-Language": "en", "User-Agent": "NoLeftovers/1.0" },
        });
        const json = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (json?.[0]) {
          const lat = parseFloat(json[0].lat);
          const lng = parseFloat(json[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) setCoords({ lat, lng });
        }
      } catch {
        // ignore
      }
    }, 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // reverse geocode when user picks on map (only auto-fill if address is empty/short)
  const onPick = async (pos: { lat: number; lng: number } | null) => {
    setCoords(pos);
    if (!pos) return;
    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("lat", String(pos.lat));
      url.searchParams.set("lon", String(pos.lng));
      url.searchParams.set("format", "json");
      const res = await fetch(url.toString(), {
        headers: { "Accept-Language": "en", "User-Agent": "NoLeftovers/1.0" },
      });
      const j = await res.json();
      const disp = j?.display_name as string | undefined;
      if (disp && (!address || address.length < 8)) setAddress(disp);
    } catch {
      // ignore
    }
  };

  return (
    <Access requireAuth requireUnregistered redirectIfRegisteredTo="/dashboard">
      <section className="grid gap-4 max-w-md">
        <h2 className="text-2xl font-semibold">Register as Donor</h2>
        <div className="card grid gap-4 p-6">
          <p className="text-subtext">Create an account to start donating food.</p>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="label">First name</span>
                <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </label>
              <label className="grid gap-1">
                <span className="label">Last name</span>
                <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="label">Phone</span>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>

            <label className="grid gap-1">
              <span className="label">Organization</span>
              <select className="input" value={selectedDonorId} onChange={(e) => setSelectedDonorId(e.target.value)}>
                <option value="">Select organization…</option>
                <option value={NEW_BUSINESS_VALUE}>+ Add new business</option>
                {(donors || []).map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-subtext">Choose an existing organization or add a new one.</span>
            </label>

            {selectedDonorId === NEW_BUSINESS_VALUE && (
              <>
                <label className="grid gap-1">
                  <span className="label">Business name</span>
                  <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1">
                    <span className="label">Business email</span>
                    <input type="email" className="input" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} required />
                  </label>
                  <label className="grid gap-1">
                    <span className="label">Business phone</span>
                    <input className="input" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} required />
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="label">Business address</span>
                  <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </label>

                <div className="grid gap-1">
                  <div className="label">Business location (optional)</div>
                  <div className="text-xs text-subtext mb-2">Click on the map or type an address; they stay in sync.</div>
                  <MapViewOpenLayers value={coords ?? undefined} onChange={onPick} height={260} />
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn-primary" disabled={!allValid || submitting}>
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </section>
    </Access>
  );
}
