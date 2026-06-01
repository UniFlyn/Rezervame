"use client";

import React from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, formatMerchantNumericId, parseWorkingHours, cn } from "@/lib/utils";

type DetailSection = { title: string; rows: { label: string; value: string }[] };

function DetailGrid({ sections }: { sections: DetailSection[] }) {
  if (!sections?.length) return <p className="text-sm text-slate-500">No extra registration data.</p>;
  return (
    <div className="space-y-4">
      {sections.map((sec) => (
        <div key={sec.title} className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">{sec.title}</p>
          <dl className="grid gap-2 sm:grid-cols-2">
            {sec.rows.map((row) => (
              <div key={`${sec.title}-${row.label}`} className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{row.label}</dt>
                <dd className="text-sm font-semibold text-slate-800 break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function BusinessRecordDetail({
  business,
  loading,
  onClose,
  children,
}: {
  business: any;
  loading?: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  if (!business && !loading) return null;

  const hours = parseWorkingHours(business?.workingHours);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Business Record</h2>
            {business ? (
              <p className="text-xs text-slate-500">
                Merchant ID:{" "}
                <span className="font-mono tabular-nums text-slate-800">
                  {formatMerchantNumericId(business.merchantNumber)}
                </span>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading full record…</p>
          </div>
        ) : business ? (
          <div className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business profile</p>
                <p className="text-lg font-semibold text-slate-900">{business.name}</p>
                <p className="text-sm text-slate-700">{business.description || "—"}</p>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{business.address}</span>
                </div>
                {business.latitude != null && business.longitude != null ? (
                  <p className="text-xs text-slate-500 font-mono">
                    {business.latitude}, {business.longitude}
                  </p>
                ) : null}
                <p className="text-sm text-slate-700">Owner: {business.owner}</p>
                <p className="text-sm text-slate-700">Phone: {business.phone}</p>
                <p className="text-sm text-slate-700">Email: {business.email}</p>
                <p className="text-sm text-slate-700">Tax ID: {business.taxId}</p>
                <p className="text-sm text-slate-700">Status: {business.status}</p>
                <p className="text-sm text-slate-700">
                  App / web listing:{" "}
                  {business.status === "active" && business.listingVisible
                    ? "Public (merchant opted in)"
                    : business.status === "pending"
                      ? "Owner preview only (awaiting approval)"
                      : "Hidden"}
                </p>
                <p className="text-sm text-slate-700">Plan: {business.planName || business.plan || "—"}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(business.categoryLabels || business.categoryKeys || []).map((key: string) => (
                    <span
                      key={key}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {key}
                    </span>
                  ))}
                </div>
                {(business.amenities || []).length > 0 ? (
                  <div className="pt-2">
                    <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Amenities</p>
                    <p className="text-sm text-slate-700">
                      {(business.amenities as { labelEn?: string }[]).map((a) => a.labelEn).filter(Boolean).join(", ")}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account & settings</p>
                {business.loginAccount ? (
                  <dl className="grid gap-2 text-sm">
                    <div>
                      <dt className="text-[10px] font-bold uppercase text-slate-400">Login name</dt>
                      <dd className="font-semibold text-slate-800">{business.loginAccount.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase text-slate-400">Login email</dt>
                      <dd className="font-semibold text-slate-800">{business.loginAccount.email}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase text-slate-400">User status</dt>
                      <dd className="font-semibold text-slate-800">{business.loginAccount.status}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">No linked user account.</p>
                )}
                <p className="text-sm text-slate-700">Joined: {formatDate(business.joinedDate)}</p>
                <p className="text-sm text-slate-700">Revenue: {formatCurrency(business.revenue)}</p>
                <p className="text-sm text-slate-700">Balance: {formatCurrency(business.balance)}</p>
                <p className="text-sm text-slate-700">Tax %: {business.taxPercentage ?? 0}</p>
                <p className="text-sm text-slate-700">Approval: {business.appointmentApprovalMode}</p>
                <p className="text-sm text-slate-700">
                  Cancellation: {business.cancellationAllowed ? `Yes (${business.cancellationHoursBefore}h before)` : "No"}
                </p>
                {hours.length > 0 ? (
                  <div className="pt-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Operating hours</p>
                    <ul className="space-y-1">
                      {hours.map((row) => (
                        <li key={row.day} className="flex justify-between gap-4 text-sm text-slate-700">
                          <span className="font-medium text-slate-800">{row.day}</span>
                          <span className="text-slate-600 tabular-nums">{row.hours}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {(business.socialInstagram || business.socialYoutube || business.socialX || business.socialTiktok) && (
                  <div className="text-sm text-slate-700 space-y-1 pt-2">
                    <p className="font-semibold">Social</p>
                    {business.socialInstagram ? <p>Instagram: {business.socialInstagram}</p> : null}
                    {business.socialTiktok ? <p>TikTok: {business.socialTiktok}</p> : null}
                    {business.socialYoutube ? <p>YouTube: {business.socialYoutube}</p> : null}
                    {business.socialX ? <p>X: {business.socialX}</p> : null}
                  </div>
                )}
              </div>
            </div>

            {(business.logoUrl || business.bannerUrl || (business.images || []).length > 0) && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Branding & gallery</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {business.logoUrl ? (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Logo</p>
                      <img src={business.logoUrl} alt="Logo" className="h-24 w-full rounded-lg object-cover border" />
                    </div>
                  ) : null}
                  {business.bannerUrl ? (
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Banner</p>
                      <img src={business.bannerUrl} alt="Banner" className="h-24 w-full rounded-lg object-cover border" />
                    </div>
                  ) : null}
                  {(business.images || []).map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="h-24 w-full rounded-lg object-cover border" />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Partner registration (full)
              </p>
              <DetailGrid sections={business.registrationSections || []} />
            </div>

            {(business.registrationPhotoUrls || []).length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Registration photos</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {business.registrationPhotoUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" className="h-28 w-full rounded-lg object-cover border hover:opacity-90" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {(business.services || []).length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-3">
                  Services ({business.services.length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 text-xs uppercase">
                        <th className="pb-2 pr-4">Name</th>
                        <th className="pb-2 pr-4">Category</th>
                        <th className="pb-2 pr-4">Duration</th>
                        <th className="pb-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {business.services.map((s: any) => (
                        <tr key={s.id} className="border-t border-slate-100">
                          <td className="py-2 pr-4 font-semibold">{s.name}</td>
                          <td className="py-2 pr-4">{s.category}</td>
                          <td className="py-2 pr-4">{s.duration} min</td>
                          <td className="py-2">{formatCurrency(s.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(business.staff || []).length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Team ({business.staff.length})</p>
                <ul className="space-y-2">
                  {business.staff.map((st: any) => (
                    <li key={st.id} className="text-sm text-slate-700 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="font-semibold">{st.name}</span> — {st.role}
                      {st.bio ? <span className="block text-slate-500 text-xs mt-1">{st.bio}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
