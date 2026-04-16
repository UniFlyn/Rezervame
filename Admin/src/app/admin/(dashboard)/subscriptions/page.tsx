"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Zap, 
  Crown, 
  Check, 
  TrendingUp,
  Settings2,
  Lock,
  ArrowRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  { 
    id: 'basic', 
    name: 'Basic', 
    price: '$19', 
    period: '/mo',
    icon: ShieldCheck, 
    color: 'bg-slate-100 text-slate-600',
    features: ['Up to 5 staff members', 'Basic Analytics', 'Mobile App Access', 'Email Support'],
    activeUsers: 450,
    growth: '+12%'
  },
  { 
    id: 'pro', 
    name: 'Business Pro', 
    price: '$49', 
    period: '/mo',
    icon: Zap, 
    color: 'bg-blue-600 text-white shadow-xl shadow-blue-600/20',
    features: ['Unlimited staff members', 'Advanced Analytics', 'SMS Notifications', 'Priority Support', 'Custom Branding'],
    activeUsers: 320,
    growth: '+24%',
    popular: true
  },
  {
    id: "elite",
    name: "Elite",
    price: "$99",
    period: "/mo",
    icon: Crown,
    color: "bg-amber-100 text-amber-700",
    features: [
      "Everything in Pro",
      "Dedicated success manager",
      "API access & webhooks",
      "Advanced fraud controls",
      "SLA-backed support",
    ],
    activeUsers: 126,
    growth: "+31%",
  }
];

export default function SubscriptionsPage() {
  const [thresholdPlan, setThresholdPlan] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [thresholdValues, setThresholdValues] = useState({
    minPayout: "250",
    maxDailyPayout: "5000",
    disputeCap: "1500",
    holdDays: "3",
    overageAlert: "85",
  });
  const [customizerValues, setCustomizerValues] = useState({
    clientName: "",
    seatVolume: "100",
    monthlyCommit: "7500",
    supportSla: "gold",
    billingModel: "monthly",
    addOns: [] as string[],
    notes: "",
  });

  const toggleAddOn = (addOn: string) => {
    setCustomizerValues((prev) => {
      const exists = prev.addOns.includes(addOn);
      return {
        ...prev,
        addOns: exists ? prev.addOns.filter((value) => value !== addOn) : [...prev.addOns, addOn],
      };
    });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase tracking-tighter italic">Billing & Tier Protocols</h1>
          <p className="text-slate-500 text-sm mt-1">Configure and monitor platform subscription performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={cn(
            "relative bg-white rounded-[2.5rem] border p-10 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-slate-200/50 group",
            plan.popular ? "border-blue-500 ring-4 ring-blue-500/10" : "border-slate-100"
          )}>
            {plan.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/30">Most Popular</span>
            )}

            <div className="space-y-8">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", plan.color)}>
                <plan.icon className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-slate-900 leading-none">{plan.price}</span>
                  <span className="text-slate-400 font-bold text-base tracking-tight">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-50">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-base font-semibold text-slate-600 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Active</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{plan.activeUsers}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center justify-end gap-1">
                    {plan.growth} <TrendingUp className="w-4 h-4" />
                  </p>
                  <p className="text-[10px] font-bold text-slate-300 italic uppercase">vs last month</p>
                </div>
              </div>

              <button className={cn(
                "w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition shadow-md active:scale-95 flex items-center justify-center gap-2",
                plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-950/20"
              )}
              onClick={() => setThresholdPlan(plan.name)}
              >
                Edit Thresholds
                <Settings2 className="w-4 h-4 opacity-50" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-blue-500/40"></div>
         
         <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest border border-white/10 backdrop-blur-sm italic">
                <Lock className="w-4 h-4 text-blue-400" />
                Security Overwrite
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">Need a custom plan for a major client?</h2>
              <p className="text-white/60 font-medium text-lg leading-relaxed">Our enterprise override allows you to bypass standard pricing and create bespoke terminal agreements directly for large-scale operations.</p>
           </div>
           
           <button
              type="button"
              onClick={() => setShowCustomizer(true)}
              className="bg-white text-slate-900 px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition active:scale-95 shadow-2xl shadow-white/10 flex items-center gap-4"
           >
              Open Customizer
              <ArrowRight className="w-6 h-6 bg-slate-900 text-white p-1 rounded-full" />
           </button>
         </div>
      </div>

      {thresholdPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit Thresholds - {thresholdPlan}</h2>
                <p className="text-xs text-slate-500">Adjust payout protection limits and risk controls.</p>
              </div>
              <button
                type="button"
                onClick={() => setThresholdPlan(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-4">
                {[
                  { key: "minPayout", label: "Minimum Payout Amount", prefix: "$" },
                  { key: "maxDailyPayout", label: "Max Daily Payout", prefix: "$" },
                  { key: "disputeCap", label: "Dispute Escalation Cap", prefix: "$" },
                  { key: "holdDays", label: "Settlement Hold (days)", prefix: "" },
                  { key: "overageAlert", label: "Overage Alert Trigger", suffix: "%" },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {field.label}
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 px-3 py-2">
                      {field.prefix ? <span className="mr-1 text-sm text-slate-500">{field.prefix}</span> : null}
                      <input
                        value={thresholdValues[field.key as keyof typeof thresholdValues]}
                        onChange={(event) =>
                          setThresholdValues((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                        className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
                      />
                      {field.suffix ? <span className="ml-1 text-sm text-slate-500">{field.suffix}</span> : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Impact Preview</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>Plan: <span className="font-semibold">{thresholdPlan}</span></p>
                  <p>Minimum payout: <span className="font-semibold">${thresholdValues.minPayout}</span></p>
                  <p>Max daily payout: <span className="font-semibold">${thresholdValues.maxDailyPayout}</span></p>
                  <p>Dispute cap: <span className="font-semibold">${thresholdValues.disputeCap}</span></p>
                  <p>Settlement hold: <span className="font-semibold">{thresholdValues.holdDays} days</span></p>
                  <p>Overage alert: <span className="font-semibold">{thresholdValues.overageAlert}%</span></p>
                </div>
                <p className="text-xs text-slate-500">
                  These values apply to newly billed periods for this tier.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setThresholdPlan(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setThresholdPlan(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save Thresholds
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Enterprise Customizer</h2>
                <p className="text-xs text-slate-500">Create a custom contract package for high-value clients.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomizer(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client Name</label>
                  <input
                    value={customizerValues.clientName}
                    onChange={(event) =>
                      setCustomizerValues((prev) => ({ ...prev, clientName: event.target.value }))
                    }
                    placeholder="e.g. Prime Grooming Group"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seat Volume</label>
                    <input
                      value={customizerValues.seatVolume}
                      onChange={(event) =>
                        setCustomizerValues((prev) => ({ ...prev, seatVolume: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly Commit</label>
                    <input
                      value={customizerValues.monthlyCommit}
                      onChange={(event) =>
                        setCustomizerValues((prev) => ({ ...prev, monthlyCommit: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support SLA</label>
                    <select
                      value={customizerValues.supportSla}
                      onChange={(event) =>
                        setCustomizerValues((prev) => ({ ...prev, supportSla: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="silver">Silver - 24h</option>
                      <option value="gold">Gold - 8h</option>
                      <option value="platinum">Platinum - 1h</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billing Model</label>
                    <select
                      value={customizerValues.billingModel}
                      onChange={(event) =>
                        setCustomizerValues((prev) => ({ ...prev, billingModel: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Internal Notes</label>
                  <textarea
                    value={customizerValues.notes}
                    onChange={(event) =>
                      setCustomizerValues((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    placeholder="Commercial conditions, legal clauses, migration notes..."
                    className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Module Add-ons</h3>
                <div className="grid grid-cols-1 gap-2">
                  {["Advanced Fraud Shield", "Dedicated CSM", "API Webhooks", "White-label Portal", "Priority Payouts"].map(
                    (addOn) => (
                      <button
                        key={addOn}
                        type="button"
                        onClick={() => toggleAddOn(addOn)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-sm transition",
                          customizerValues.addOns.includes(addOn)
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        {addOn}
                      </button>
                    ),
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Configuration Summary</p>
                  <p>Client: {customizerValues.clientName || "-"}</p>
                  <p>Seats: {customizerValues.seatVolume}</p>
                  <p>Commit: ${customizerValues.monthlyCommit}</p>
                  <p>SLA: {customizerValues.supportSla}</p>
                  <p>Add-ons: {customizerValues.addOns.length ? customizerValues.addOns.join(", ") : "None"}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowCustomizer(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCustomizer(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save Custom Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
