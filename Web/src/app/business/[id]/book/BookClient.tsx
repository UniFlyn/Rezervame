"use client";

import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";

export default function BookClient({ params }: { params: { id: string } }) {
  const businessId = params.id;
  const [services, setServices] = useState<{ id: string; name: string; price: number }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      apiGet<{ id: string; name: string; price: number }[]>(`/business/${businessId}/services`),
      apiGet<{ id: string; name: string }[]>(`/business/${businessId}/staff`),
    ])
      .then(([s, t]) => {
        if (cancelled) return;
        setServices(s);
        setStaff(t);
        if (s[0]?.id) setServiceId(s[0].id);
      })
      .catch(() => {
        if (!cancelled) {
          const msg = "Could not load services for this business.";
          setMessage(msg);
          toastError("Load failed", msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const submit = async () => {
    setMessage(null);
    if (typeof window !== "undefined" && !localStorage.getItem("rezervame_token")) {
      const msg =
        "Sign in with a customer account (same email as the mobile app) to book.";
      setMessage(msg);
      toastWarning("Sign in required", msg);
      return;
    }
    if (!serviceId || !dateStr) {
      const msg = "Choose a service and date/time.";
      setMessage(msg);
      toastWarning("Validation", msg);
      return;
    }
    const iso = new Date(dateStr).toISOString();
    setSubmitting(true);
    try {
      await apiPost<{ id: string }>(
        "/mobile/bookings",
        { businessId, serviceId, date: iso },
        "USER",
      );
      const ok =
        "Booking request submitted. Status starts as Pending until the business confirms.";
      setMessage(ok);
      toastSuccess("Booking submitted", ok);
    } catch {
      const err =
        "Could not create booking. Ensure you are logged in as a customer user.";
      setMessage(err);
      toastError("Booking failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Confirm your appointment</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">1. Service</h2>
          {services.length === 0 ? (
            <p className="text-sm text-slate-500">No services listed for this business yet.</p>
          ) : (
            <select
              className="w-full p-3 border rounded-lg bg-white"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ${Number(s.price).toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">2. Preferred professional</h2>
          <p className="text-sm text-slate-500 mb-2">
            Optional — final assignment is up to the business.
          </p>
          <select className="w-full p-3 border rounded-lg bg-white" defaultValue="">
            <option value="">Any available</option>
            {staff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">3. Date &amp; time</h2>
          <input
            type="datetime-local"
            className="w-full p-3 border rounded-lg"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-4">4. Payment</h2>
          <p className="text-sm text-slate-600">
            Pay at the venue or per agreement with the business. Online card capture is not required for this step.
          </p>
        </div>

        {message ? (
          <p className="text-sm rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">{message}</p>
        ) : null}

        <button
          type="button"
          disabled={submitting || services.length === 0}
          onClick={() => void submit()}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-lg text-lg shadow hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit booking request"}
        </button>
      </div>
    </div>
  );
}
