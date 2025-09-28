"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convexApi";
import { useRouter } from "next/navigation";
import Access from "@/components/Access/Access";
import MapPickerOpenLayers from "@/components/Map/MapViewOpenLayers";


type DonorOption = { _id: string; name: string };

export default function RegisterDonater() {
  const router = useRouter();
  const { userId } = useAuth();
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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [selectedDonorId, setSelectedDonorId] = useState<string>("");
  const NEW_BUSINESS_VALUE = "__new_business__";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // prevent accidental navigation away mid‑form
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!completed) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    const handlePop = () => {
      if (!completed) {
        history.pushState(null, "", location.href);
      }
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("popstate", handlePop);
    };
  }, [completed]);

  const allValid = useMemo(() => {
    const hasUser = firstName.trim() && lastName.trim() && phone.trim();
    if (!hasUser) return false;
    if (selectedDonorId && selectedDonorId !== NEW_BUSINESS_VALUE) return true;
    // location is optional; we only require business basics when creating a new org
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
          donors_id: selectedDonorId as unknown as string, // Convex will accept the id string
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

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setBusinessEmail(user.primaryEmailAddress?.emailAddress ?? "");
      setPhone(user.primaryPhoneNumber?.phoneNumber ?? "");
    }
  }, [user]);

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

                <div className="grid grid-cols-2 gap-3">
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

                <label className="grid gap-1">
                  <span className="label">Business address</span>
                  <input
                    className="input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </label>

                {/*  map picker  */}
                <div className="grid gap-1">
                  <div className="label">Business location (optional)</div>
                  <div className="text-xs text-subtext mb-2">
                    Click on the map to set your pickup location (we’ll show this
                    on the Explore map).
                  </div>
                  <MapPickerOpenLayers value={coords ?? undefined} onChange={setCoords} />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <label className="grid gap-1">
                      <span className="label">Lat</span>
                      <input
                        className="input"
                        inputMode="decimal"
                        value={coords?.lat ?? ""}
                        onChange={(e) =>
                          setCoords((c) => ({
                            lat: Number(e.target.value) || 0,
                            lng: c?.lng ?? 0,
                          }))
                        }
                        placeholder="e.g. 57.7089"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="label">Lng</span>
                      <input
                        className="input"
                        inputMode="decimal"
                        value={coords?.lng ?? ""}
                        onChange={(e) =>
                          setCoords((c) => ({
                            lat: c?.lat ?? 0,
                            lng: Number(e.target.value) || 0,
                          }))
                        }
                        placeholder="e.g. 11.9746"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="btn-primary"
              disabled={!allValid || submitting}
            >
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </section>
    </Access>
  );
}
