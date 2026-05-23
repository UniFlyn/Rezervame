"use client";

import React, { useEffect, useState } from "react";
import { 
  Store, 
  Users, 
  CalendarCheck, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Settings, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  Zap,
  CreditCard
} from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { formatCurrency, cn } from "@/lib/utils";
import { PageLoader } from "@/components/admin/AppLoader";

type DashboardPayload = {
  stats?: {
    businesses?: number;
    users?: number;
    bookings?: number;
    revenue?: number;
    pendingApprovals?: number;
    avgBookingValue?: number;
  };
};

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, plansRes] = await Promise.all([
        apiGet<DashboardPayload>("/admin/dashboard"),
        apiGet<SubscriptionPlan[]>("/admin/plans")
      ]);
      setData(statsRes);
      setPlans(plansRes);
    } catch (e) {
      toastError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreate = () => {
    setEditingPlan({
      name: "",
      price: 0,
      billingCycle: "monthly",
      features: [""],
      active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this plan? Existing businesses on this plan will remain but no new ones can join.")) return;
    try {
      await apiDelete(`/admin/plans/${id}`);
      setPlans(plans.filter(p => p.id !== id));
      toastSuccess("Plan deleted");
    } catch (err) {
      toastError("Failed to delete plan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...editingPlan,
        features: editingPlan.features?.filter(f => f.trim() !== "")
      };
      if (editingPlan.id) {
        const updated = await apiPatch<SubscriptionPlan>(`/admin/plans/${editingPlan.id}`, payload);
        setPlans(plans.map(p => p.id === updated.id ? updated : p));
        toastSuccess("Plan updated");
      } else {
        const created = await apiPost<SubscriptionPlan>("/admin/plans", payload);
        setPlans([...plans, created]);
        toastSuccess("Plan created");
      }
      setIsModalOpen(false);
    } catch (err) {
      toastError("Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = data?.stats ?? {};
  const cards = [
    { label: "Active businesses", value: Number(stats.businesses ?? 0).toLocaleString(), icon: Store, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "End customers", value: Number(stats.users ?? 0).toLocaleString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Gross revenue", value: formatCurrency(Number(stats.revenue ?? 0)), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  if (isLoading) {
    return <PageLoader label="Loading plans…" />;
  }

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Plans & Billing</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Manage platform subscription tiers and monitor real-time business aggregates.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-lg active:scale-95 shrink-0"
        >
          <Plus size={16} />
          New Tier
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-20", c.bg)} />
            <div className={cn("inline-flex p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110 duration-500", c.bg, c.color)}>
              <c.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{c.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{c.value}</h3>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
           <Zap className="text-amber-500 fill-amber-500" size={20} />
           <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">Available Tiers</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-10 flex flex-col relative group overflow-hidden">
               {!plan.active && (
                 <div className="absolute top-6 right-6 px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-widest">
                   Disabled
                 </div>
               )}
               <div className="mb-8">
                 <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                 <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black tracking-tighter text-slate-900">{formatCurrency(plan.price)}</span>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ {plan.billingCycle}</span>
                 </div>
               </div>

               <div className="flex-1 space-y-4 mb-10">
                 {plan.features.map((feature, i) => (
                   <div key={i} className="flex items-start gap-3">
                     <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} />
                     <span className="text-sm font-bold text-slate-600 leading-tight italic">{feature}</span>
                   </div>
                 ))}
               </div>

               <div className="pt-8 border-t border-slate-50 flex items-center justify-between gap-4">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-[10px] font-black uppercase tracking-wider"
                  >
                    <Edit3 size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 transition text-[10px] font-black uppercase tracking-wider"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
               </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="md:col-span-3 py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <Settings className="mx-auto text-slate-300 mb-4 animate-spin-slow" size={48} />
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No active subscription plans defined.</p>
               <button onClick={handleCreate} className="mt-4 text-blue-600 font-black uppercase text-xs tracking-widest hover:underline">Create First Plan</button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingPlan.id ? "Edit Plan" : "New Subscription Plan"}</h2>
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">Tier configuration</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition shadow-sm">
                 <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Plan Name</label>
                   <input 
                    required
                    type="text"
                    value={editingPlan.name || ""}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:border-blue-500 outline-none transition"
                    placeholder="e.g. Professional"
                   />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Price ($)</label>
                   <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                     <input 
                      required
                      type="number"
                      step="0.01"
                      value={editingPlan.price !== undefined ? editingPlan.price : ""}
                      onChange={(e) => setEditingPlan({...editingPlan, price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-10 pr-6 py-4 text-sm font-black text-slate-900 focus:border-blue-500 outline-none transition"
                      placeholder="0.00"
                     />
                   </div>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Billing Cycle</label>
                   <select 
                    value={editingPlan.billingCycle || "monthly"}
                    onChange={(e) => setEditingPlan({...editingPlan, billingCycle: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:border-blue-500 outline-none transition"
                   >
                     <option value="monthly">Monthly</option>
                     <option value="yearly">Yearly</option>
                   </select>
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center justify-between">
                   Features Included
                   <button 
                    type="button"
                    onClick={() => setEditingPlan({...editingPlan, features: [...(editingPlan.features || []), ""]})}
                    className="text-blue-600 hover:underline"
                   >
                     + Add Feature
                   </button>
                 </label>
                 <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                   {editingPlan.features?.map((feature, i) => (
                     <div key={i} className="flex gap-2 group">
                       <input 
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const f = [...(editingPlan.features || [])];
                          f[i] = e.target.value;
                          setEditingPlan({...editingPlan, features: f});
                        }}
                        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition"
                        placeholder="e.g. Unlimited staff members"
                       />
                       <button 
                        type="button"
                        onClick={() => {
                          const f = [...(editingPlan.features || [])].filter((_, idx) => idx !== i);
                          setEditingPlan({...editingPlan, features: f});
                        }}
                        className="p-3 text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={16} />
                       </button>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    id="plan-active"
                    checked={editingPlan.active}
                    onChange={(e) => setEditingPlan({...editingPlan, active: e.target.checked})}
                    className="w-5 h-5 rounded-lg accent-blue-600"
                  />
                  <label htmlFor="plan-active" className="text-sm font-black text-slate-700 uppercase tracking-widest italic">Plan is currently active</label>
               </div>

               <div className="pt-8 border-t border-slate-50 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-8 py-4 rounded-2xl border-2 border-slate-100 font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 transition"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Commit Tier
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
