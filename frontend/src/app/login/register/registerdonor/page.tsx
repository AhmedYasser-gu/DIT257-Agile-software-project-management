"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convexApi";
import { useRouter } from "next/navigation";
import Access from "@/components/Access/Access";
import MapViewOpenLayers from "@/components/Map/MapViewOpenLayers";
import AddressSearch from "@/components/Input/AddressSearch";
import { reverseGeocode } from "@/helpers/geocode";

type DonorOption = { _id: string; name: string };

export default function RegisterDonater() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const registerDonor = useMutation(api.functions.createUser.registerDonor);
  const donors = useQuery(api.functions.createUser.listDonors, {}) as
    | DonorOption[]
    | undefined;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const [selectedDonorId, setSelectedDonorId] = useState<string>("");
  const NEW_BUSINESS_VALUE = "__new_business__";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // protect against accidental leave (but allow while submitting or after completion)
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (!completed && !submitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    const pop = () => {
      if (!completed && !submitting) {
        history.pushState(null, "", location.href);
      }
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("popstate", pop);
    };
  }, [completed, submitting]);

  const allValid = useMemo(() => {
    const hasUser = firstName.trim() && lastName.trim() && phone.trim();
    if (!hasUser) return false;
    if (selectedDonorId && selectedDonorId !== NEW_BUSINESS_VALUE) return true;
    return (
      businessName.trim() &&
      businessEmail.trim() &&
      businessPhone.trim() &&
      address.trim()
    );
  }, [
    firstName,
    lastName,
    phone,
    selectedDonorId,
    businessName,
    businessEmail,
    businessPhone,
    address,
  ]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded || !userId) {
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
      window.location.assign("/dashboard");
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

  // map -> address (reverse geocode every valid pick)
  const onPick = async (pos: { lat: number; lng: number } | null) => {
    setCoords(pos);
    if (!pos) return;
    try {
      const disp = await reverseGeocode(pos.lat, pos.lng);
      if (disp) setAddress(disp);
    } catch {
      // ignore
    }
  };

  return (
    <Access requireAuth requireUnregistered redirectIfRegisteredTo="/dashboard">
      <section className="grid gap-4 max-w-3xl w-full">
        <h2 className="text-2xl font-semibold">Register as Donor</h2>

        <div className="card grid gap-4 p-6">
          <p className="text-subtext">
            Create an account to start donating food.
          </p>

          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="label">First name</span>
                <input
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1">
                <span className="label">Last name</span>
                <input
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="label">Phone</span>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="label">Organization</span>
              <select
                className="input"
                value={selectedDonorId}
                onChange={(e) => setSelectedDonorId(e.target.value)}
              >
                <option value="">Select organization…</option>
                <option value={NEW_BUSINESS_VALUE}>+ Add new business</option>
                {(donors || []).map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-subtext">
                Choose an existing organization or add a new one.
              </span>
            </label>

            {selectedDonorId === NEW_BUSINESS_VALUE && (
              <>
                <label className="grid gap-1">
                  <span className="label">Business name</span>
                  <input
                    className="input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="label">Business email</span>
                    <input
                      type="email"
                      className="input"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="label">Business phone</span>
                    <input
                      className="input"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      required
                    />
                  </label>
                </div>

                {/* Searchable address + live map */}
                <AddressSearch
                  label="Business address"
                  value={address}
                  onChangeText={(v) => setAddress(v)}
                  onSelectPlace={(c) => {
                    setAddress(c.label);
                    setCoords({ lat: c.lat, lng: c.lng });
                  }}
                />

                <div className="grid gap-1">
                  <div className="label">Business location (optional)</div>
                  <div className="text-xs text-subtext mb-2">
                    Search or click the map—both stay in sync.
                  </div>
                  <div className="h-60 w-full overflow-hidden rounded-md">
                    <MapViewOpenLayers
                      value={coords ?? undefined}
                      onChange={onPick}
                      height={240}
                      legendMode="pickerOnly"
                    />
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="btn-primary"
                disabled={!isLoaded || !userId || !allValid || submitting}
              >
                {submitting ? "Registering..." : "Register"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (window.history.length > 1) router.back();
                  else router.push("/login/register");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </Access>
  );
}
