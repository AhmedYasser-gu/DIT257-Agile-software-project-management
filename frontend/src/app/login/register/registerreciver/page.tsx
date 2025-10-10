"use client";
import { useEffect, useMemo, useState } from "react";
import type { Id } from "../../../../../../backend/convex/_generated/dataModel";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convexApi";
import { useRouter } from "next/navigation";
import Access from "@/components/Access/Access";

export default function RegisterReciver() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const registerReceiver = useMutation(api.functions.createUser.registerReceiver);
  const charities = useQuery(api.functions.createUser.listCharities, {});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [foodAllergy, setFoodAllergy] = useState("");
  const [activeTab, setActiveTab] = useState<"individual" | "charity">("individual");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedCharityId, setSelectedCharityId] = useState<Id<"charities"> | "" | typeof NEW_CHARITY_VALUE>("");
  const NEW_CHARITY_VALUE = "__new_charity__";
  // Inline charity creation
  const [charityName, setCharityName] = useState("");
  const [charityEmail, setCharityEmail] = useState("");
  const [charityPhone, setCharityPhone] = useState("");
  const [charityAddress, setCharityAddress] = useState("");

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!completed && !submitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    const handlePop = () => {
      if (!completed && !submitting) {
        history.pushState(null, "", location.href);
      }
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("popstate", handlePop);
    };
  }, [completed, submitting]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.primaryPhoneNumber?.phoneNumber ?? "");
    }
  }, [user]);

  // Autofill charity contact fields from Clerk when creating a new charity
  useEffect(() => {
    if (activeTab === "charity" && selectedCharityId === NEW_CHARITY_VALUE && user) {
      if (!charityEmail) setCharityEmail(user.primaryEmailAddress?.emailAddress ?? "");
      if (!charityPhone) setCharityPhone(user.primaryPhoneNumber?.phoneNumber ?? "");
    }
  }, [activeTab, selectedCharityId, user, charityEmail, charityPhone]);

  const allValid = useMemo(() => {
    const baseValid = firstName.trim() && lastName.trim() && phone.trim();
    if (activeTab === "individual") return baseValid;
    const chooseExisting = !!selectedCharityId && selectedCharityId !== NEW_CHARITY_VALUE;
    const createNew = selectedCharityId === NEW_CHARITY_VALUE && charityName && charityEmail && charityPhone && charityAddress;
    return baseValid && (chooseExisting || createNew);
  }, [firstName, lastName, phone, activeTab, selectedCharityId, charityName, charityEmail, charityPhone, charityAddress]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded || !userId) {
      setError("You must be signed in to register.");
      return;
    }
    if (!allValid) return;
    try {
      setSubmitting(true);
      if (activeTab === "charity" && selectedCharityId && selectedCharityId !== NEW_CHARITY_VALUE && selectedCharityId !== "") {
        await registerReceiver({
          clerk_id: userId,
          first_name: firstName,
          last_name: lastName,
          phone,
          food_allergy: undefined,
          charity_id: selectedCharityId as Id<"charities">,
        });
      } else if (activeTab === "charity" && selectedCharityId === NEW_CHARITY_VALUE) {
        await registerReceiver({
          clerk_id: userId,
          first_name: firstName,
          last_name: lastName,
          phone,
          food_allergy: undefined,
          charity_name: charityName,
          charity_contact_email: charityEmail,
          charity_contact_phone: charityPhone,
          charity_address: charityAddress,
        });
      } else if (activeTab === "charity" && selectedCharityId === "") {
        setError("Please choose an organization or add a new one.");
      } else {
        await registerReceiver({
          clerk_id: userId,
          first_name: firstName,
          last_name: lastName,
          phone,
          food_allergy: foodAllergy || undefined,
        });
      }
      setCompleted(true);
      window.location.assign("/dashboard");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Access requireAuth requireUnregistered redirectIfRegisteredTo="/dashboard">
      <section className="grid gap-4 max-w-3xl w-full">
        <h2 className="text-2xl font-semibold">Register as Receiver</h2>
        <div className="card grid gap-4 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              className={`btn-outline w-full sm:w-auto ${activeTab === "individual" ? "!bg-primary !text-white border-transparent" : ""}`}
              onClick={() => setActiveTab("individual")}
            >
              Individual
            </button>
            <button
              type="button"
              className={`btn-outline w-full sm:w-auto ${activeTab === "charity" ? "!bg-primary !text-white border-transparent" : ""}`}
              onClick={() => setActiveTab("charity")}
            >
              Charity user
            </button>
          </div>
          <p className="text-subtext">Create an account to start claiming food.</p>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="label">First name</span>
                <input className="input" value={firstName} onChange={e=>setFirstName(e.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="label">Last name</span>
                <input className="input" value={lastName} onChange={e=>setLastName(e.target.value)} />
              </label>
            </div>
            <label className="grid gap-1">
              <span className="label">Phone</span>
              <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} />
            </label>
            {activeTab === "individual" && (
              <label className="grid gap-1">
                <span className="label">Food allergies (optional)</span>
                <input className="input" value={foodAllergy} onChange={e=>setFoodAllergy(e.target.value)} />
              </label>
            )}
            {activeTab === "individual" ? (
              <div className="text-xs text-subtext">You will register as an individual receiver.</div>
            ) : (
              <>
                <label className="grid gap-1">
                  <span className="label">Organization</span>
                  <select
                    className="input"
                    value={selectedCharityId}
                    onChange={(e) => setSelectedCharityId(e.target.value as typeof selectedCharityId)}
                  >
                    <option value="">Select charity…</option>
                    <option value={NEW_CHARITY_VALUE}>+ Add new charity</option>
                    {(charities || []).map((c: { _id: string; name: string }) => (
                      <option key={c._id} value={c._id as string}>{c.name}</option>
                    ))}
                  </select>
                  <span className="text-xs text-subtext">Choose an existing charity or add a new one.</span>
                </label>
                {selectedCharityId === NEW_CHARITY_VALUE && (
                  <>
                    <label className="grid gap-1">
                      <span className="label">Charity name</span>
                      <input className="input" value={charityName} onChange={e=>setCharityName(e.target.value)} />
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="label">Email</span>
                        <input type="email" className="input" value={charityEmail} onChange={e=>setCharityEmail(e.target.value)} />
                      </label>
                      <label className="grid gap-1">
                        <span className="label">Phone</span>
                        <input className="input" value={charityPhone} onChange={e=>setCharityPhone(e.target.value)} />
                      </label>
                    </div>
                    <label className="grid gap-1">
                      <span className="label">Address</span>
                      <input className="input" value={charityAddress} onChange={e=>setCharityAddress(e.target.value)} />
                    </label>
                  </>
                )}
              </>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" className="btn-primary" disabled={!isLoaded || !userId || !allValid || submitting}>
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

