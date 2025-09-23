"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convexApi";
import { useRouter } from "next/navigation";
import Access from "@/components/Access/Access";

export default function RegisterReciver() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const registerReceiver = useMutation(api.functions.createUser.registerReceiver);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [foodAllergy, setFoodAllergy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

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

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.primaryPhoneNumber?.phoneNumber ?? "");
    }
  }, [user]);

  const allValid = useMemo(() => {
    return firstName.trim() && lastName.trim() && phone.trim();
  }, [firstName, lastName, phone]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError("You must be signed in to register.");
      return;
    }
    if (!allValid) return;
    try {
      setSubmitting(true);
      await registerReceiver({
        clerk_id: userId,
        first_name: firstName,
        last_name: lastName,
        phone,
        food_allergy: foodAllergy || undefined,
      });
      setCompleted(true);
      router.replace("/dashboard");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Access requireAuth requireUnregistered>
      <section className="grid gap-4 max-w-md">
        <h2 className="text-2xl font-semibold">Register as Receiver</h2>
        <div className="card grid gap-4 p-6">
          <p className="text-subtext">Create an account to start claiming food.</p>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-3">
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
            <label className="grid gap-1">
              <span className="label">Food allergies (optional)</span>
              <input className="input" value={foodAllergy} onChange={e=>setFoodAllergy(e.target.value)} />
            </label>
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