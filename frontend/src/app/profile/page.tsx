/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convexApi";
import Access from "@/components/Access/Access";

type ActiveTab = "clerk" | "app";

/** Shapes that mirror getProfileByClerkId output */
type ProfileUser = {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: "donor" | "receiver" | string;
};

type ProfileDonor = {
  _id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  address: string;
  verified: boolean;
} | null;

type ProfileReceiver = {
  _id: string;
  individuals_id: string | null;
  charity_id: string | null;
  individual: { _id: string; food_allergy: string | null } | null;
  charity:
    | {
        _id: string;
        charity_name: string;
        contact_phone: string;
        contact_email: string;
        address: string;
        verified: boolean;
      }
    | null;
} | null;

type ProfileResult =
  | null
  | {
      user: ProfileUser;
      type: "donor";
      donor_owner: boolean;
      donor: ProfileDonor;
    }
  | {
      user: ProfileUser;
      type: "receiver";
      charity_owner: boolean;
      receiver: ProfileReceiver;
    }
  | {
      user: ProfileUser;
      type: null;
    };

export default function ProfilePage() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("clerk");
  const [editMode, setEditMode] = useState(false);

  //  pass "skip" until userId exists (prevents {} args)
  const profile = useQuery(
    api.functions.createUser.getProfileByClerkId,
    userId ? { clerk_id: userId } : "skip"
  ) as ProfileResult | undefined;

  const updateProfile = useMutation(api.functions.createUser.updateProfile);

  // Local editable state (kept intentionally broad to keep existing UI)
  const [form, setForm] = useState<any | null>(null);
  const original = profile;

  const buildFormFromOriginal = (orig: ProfileResult) => {
    const base = {
      first_name: orig && "user" in orig ? orig.user.first_name : "",
      last_name: orig && "user" in orig ? orig.user.last_name : "",
      phone: orig && "user" in orig ? orig.user.phone : "",
    };

    if (orig && "type" in orig && orig.type === "donor") {
      return {
        ...base,
        donor_id: orig.donor?._id,
        business_name: orig.donor?.business_name ?? "",
        business_email: orig.donor?.business_email ?? "",
        business_phone: orig.donor?.business_phone ?? "",
        address: orig.donor?.address ?? "",
        verified: orig.donor?.verified ?? false,
      };
    }
    if (orig && "type" in orig && orig.type === "receiver") {
      return {
        ...base,
        receiver_id: orig.receiver?._id,
        individuals_id: orig.receiver?.individuals_id ?? null,
        charity_id: orig.receiver?.charity_id ?? null,
        food_allergy: orig.receiver?.individual?.food_allergy ?? "",
        charity: orig.receiver?.charity
          ? {
              charity_name: orig.receiver.charity.charity_name ?? "",
              contact_phone: orig.receiver.charity.contact_phone ?? "",
              contact_email: orig.receiver.charity.contact_email ?? "",
              address: orig.receiver.charity.address ?? "",
              verified: orig.receiver.charity.verified ?? false,
            }
          : null,
      };
    }
    return base;
  };

  useEffect(() => {
    if (!original || original === null || original === undefined) return;
    // When result is the “not registered” shape: { user, type: null }
    setForm(buildFormFromOriginal(original));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original && "user" in (original as any) ? (original as any).user._id : undefined, (original as any)?.type]);

  const isLoading = !!userId && profile === undefined;
  const notRegistered = !!profile && (profile as any)?.type === null;
  const accountType =
    (original as any)?.type === "donor"
      ? "Donor"
      : (original as any)?.type === "receiver"
      ? "Receiver"
      : "—";

  const onCancel = () => {
    if (!original) return;
    setForm(buildFormFromOriginal(original));
    setEditMode(false);
  };

  const onSave = async () => {
    if (!original || !("user" in original) || !original.user?._id || !form) return;
    const payload: Record<string, unknown> = { user_id: original.user._id };

    const addIfChanged = (key: string, newVal: unknown, oldVal: unknown) => {
      if (newVal !== oldVal) payload[key] = newVal;
    };

    addIfChanged("first_name", form.first_name, original.user.first_name);
    addIfChanged("last_name", form.last_name, original.user.last_name);
    addIfChanged("phone", form.phone, original.user.phone);

    if ((original as any).type === "donor") {
      payload["donor_id"] = form.donor_id;
      addIfChanged("business_name", form.business_name, (original as any).donor?.business_name ?? "");
      addIfChanged("business_email", form.business_email, (original as any).donor?.business_email ?? "");
      addIfChanged("business_phone", form.business_phone, (original as any).donor?.business_phone ?? "");
      addIfChanged("address", form.address, (original as any).donor?.address ?? "");
    }

    if ((original as any).type === "receiver") {
      payload["receiver_id"] = form.receiver_id;
      payload["individuals_id"] = form.individuals_id ?? undefined;
      if (form.individuals_id) {
        addIfChanged(
          "food_allergy",
          form.food_allergy,
          (original as any).receiver?.individual?.food_allergy ?? ""
        );
      }
      if (form.charity && (original as any).charity_owner && form.charity_id) {
        payload["charity_id"] = form.charity_id;
        addIfChanged("charity_name", form.charity.charity_name, (original as any).receiver?.charity?.charity_name ?? "");
        addIfChanged(
          "charity_contact_phone",
          form.charity.contact_phone,
          (original as any).receiver?.charity?.contact_phone ?? ""
        );
        addIfChanged(
          "charity_contact_email",
          form.charity.contact_email,
          (original as any).receiver?.charity?.contact_email ?? ""
        );
        addIfChanged("charity_address", form.charity.address, (original as any).receiver?.charity?.address ?? "");
      }
    }

    await updateProfile(payload);
    setEditMode(false);
  };

  const Field = ({
    label,
    value,
    onChange,
    readOnly = false,
  }: {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    readOnly?: boolean;
  }) => (
    <label className="grid gap-1">
      <span className="label">{label}</span>
      {editMode && !readOnly && onChange ? (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="input bg-muted/40 cursor-default select-text">{value || "—"}</div>
      )}
    </label>
  );

  return (
    <Access requireAuth>
      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Profile</h2>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            className={`btn-outline ${activeTab === "clerk" ? "!bg-primary !text-white border-transparent" : ""}`}
            onClick={() => setActiveTab("clerk")}
          >
            Account (Clerk)
          </button>
          <button
            type="button"
            className={`btn-outline ${activeTab === "app" ? "!bg-primary !text-white border-transparent" : ""}`}
            onClick={() => setActiveTab("app")}
          >
            App data
          </button>
        </div>

        {activeTab === "clerk" && <UserProfile routing="hash" />}

        {activeTab === "app" && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Your data</h3>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditMode((e) => !e)}
                disabled={isLoading || notRegistered || !form}
              >
                {editMode ? "Stop editing" : "Edit"}
              </button>
            </div>

            <div className="card grid gap-4 p-6">
              {isLoading && <p className="text-subtext">Loading...</p>}
              {!isLoading && notRegistered && (
                <p className="text-subtext">No profile data found. Please register first.</p>
              )}
              {!isLoading && !notRegistered && form && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field
                      label="First name"
                      value={form.first_name}
                      onChange={(v) => setForm({ ...form, first_name: v })}
                    />
                    <Field
                      label="Last name"
                      value={form.last_name}
                      onChange={(v) => setForm({ ...form, last_name: v })}
                    />
                  </div>
                  <Field
                    label="Phone"
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                  />
                  <Field label="Account type" value={accountType} readOnly />

                  {(original as any)?.type === "donor" && (
                    <div className="grid gap-3">
                      <h4 className="font-medium">Business</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field
                          label="Business name"
                          value={form.business_name}
                          onChange={(v) => setForm({ ...form, business_name: v })}
                        />
                        <Field
                          label="Business email"
                          value={form.business_email}
                          onChange={(v) => setForm({ ...form, business_email: v })}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field
                          label="Business phone"
                          value={form.business_phone}
                          onChange={(v) => setForm({ ...form, business_phone: v })}
                        />
                        <Field
                          label="Address"
                          value={form.address}
                          onChange={(v) => setForm({ ...form, address: v })}
                        />
                      </div>
                      <Field label="Verified" value={form.verified ? "Yes" : "No"} readOnly />
                    </div>
                  )}

                  {(original as any)?.type === "receiver" && (
                    <div className="grid gap-3">
                      <h4 className="font-medium">Receiver</h4>
                      {form.individuals_id && (
                        <Field
                          label="Food allergies"
                          value={form.food_allergy}
                          onChange={(v) => setForm({ ...form, food_allergy: v })}
                        />
                      )}
                      {form.charity && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Field
                            label="Charity name"
                            value={form.charity.charity_name}
                            onChange={(v) =>
                              setForm({ ...form, charity: { ...form.charity, charity_name: v } })
                            }
                            readOnly={!editMode || !(original as any)?.charity_owner}
                          />
                          <Field
                            label="Verified"
                            value={form.charity.verified ? "Yes" : "No"}
                            readOnly
                          />
                          <Field
                            label="Contact phone"
                            value={form.charity.contact_phone}
                            onChange={(v) =>
                              setForm({ ...form, charity: { ...form.charity, contact_phone: v } })
                            }
                            readOnly={!editMode || !(original as any)?.charity_owner}
                          />
                          <Field
                            label="Contact email"
                            value={form.charity.contact_email}
                            onChange={(v) =>
                              setForm({ ...form, charity: { ...form.charity, contact_email: v } })
                            }
                            readOnly={!editMode || !(original as any)?.charity_owner}
                          />
                          <Field
                            label="Address"
                            value={form.charity.address}
                            onChange={(v) =>
                              setForm({ ...form, charity: { ...form.charity, address: v } })
                            }
                            readOnly={!editMode || !(original as any)?.charity_owner}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {editMode && !isLoading && !notRegistered && (
              <div className="flex gap-2">
                <button type="button" className="btn-primary" onClick={onSave}>
                  Save
                </button>
                <button type="button" className="btn-secondary" onClick={onCancel}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </Access>
  );
}
