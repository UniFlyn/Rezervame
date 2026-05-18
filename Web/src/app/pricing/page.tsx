"use client";
import React, { useState, useEffect } from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Zap, Star, Loader2, CheckCircle } from "lucide-react";
import { useBusinessStore } from "../../store/businessStore";
import { apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { business, hydrate } = useBusinessStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const fetched = await apiGet<any[]>("/public/plans");
        setPlans(fetched);
      } catch (err) {
        toastError("Error", "Could not load subscription plans.");
      } finally {
        setLoadingPlans(false);
      }
    };
    void fetchPlans();
  }, []);

  const handleUpgrade = async (planName: string, planId: string) => {
    if (!business) {
      router.push("/business/login");
      return;
    }

    if (business.status === "Pending") {
      toastError("Account Pending", "Your business account must be approved before upgrading.");
      return;
    }

    setUpgrading(planId);
    try {
      await apiPost(`/business/${business.id}/upgrade`, { plan: planName, planId }, 'BUSINESS');
      toastSuccess(`Upgraded to ${planName}`, "Your plan has been updated successfully.");
      await hydrate();
    } catch (err) {
      toastError("Upgrade failed", "There was an error processing your upgrade.");
    } finally {
      setUpgrading(null);
    }
  };

  const isCurrentPlan = (planName: string) => {
    const current = (business as any)?.plan || "Basic";
    return current.toLowerCase() === planName.toLowerCase();
  };

  if (loadingPlans) {
    return (
      <StaticPageLayout 
        title="Plans & Pricing" 
        subtitle="Flexible solutions for businesses of all sizes. Choose the plan that best fits you."
        breadcrumb="Pricing"
      >
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#ff5a5f]" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading subscription tiers...</p>
        </div>
      </StaticPageLayout>
    );
  }

  return (
    <StaticPageLayout 
      title="Plans & Pricing" 
      subtitle="Flexible solutions for businesses of all sizes. Choose the plan that best fits you."
      breadcrumb="Pricing"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {plans.map((plan) => {
          const active = isCurrentPlan(plan.name);
          const isPremium = plan.price > 0;
          return (
            <div 
              key={plan.id} 
              className={`p-10 rounded-[40px] border flex flex-col items-center text-center transition-all ${
                active 
                  ? isPremium 
                    ? 'border-amber-400 bg-white ring-4 ring-amber-400/10 shadow-2xl relative' 
                    : 'border-[#ff5a5f] bg-white ring-4 ring-[#ff5a5f]/10 shadow-2xl relative'
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              {isPremium && !active && (
                <div className="absolute -top-5 bg-[#ff5a5f] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Recommended</div>
              )}
              {active && (
                <div className={`absolute -top-5 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                  isPremium ? 'bg-amber-400' : 'bg-[#ff5a5f]'
                }`}>
                  <CheckCircle size={14} /> Active Plan
                </div>
              )}
              
              {isPremium ? (
                <Star className={`w-12 h-12 mb-6 ${active ? 'text-amber-400' : 'text-[#ff5a5f]'}`} />
              ) : (
                <Zap className="w-12 h-12 text-slate-400 mb-6" />
              )}
              
              <h3 className="text-2xl font-black uppercase mb-2">{plan.name}</h3>
              <p className="text-4xl font-black text-slate-900 mb-6">
                ${plan.price}
                <span className="text-lg text-slate-400">/{plan.billingCycle === 'monthly' ? 'Month' : 'Year'}</span>
              </p>
              
              <ul className="text-left w-full space-y-4 mb-10">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 font-bold text-slate-500">
                    <CheckIcon className={`w-5 h-5 ${isPremium ? 'text-[#ff5a5f]' : 'text-green-500'}`} /> 
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                disabled={active || upgrading !== null}
                onClick={() => handleUpgrade(plan.name, plan.id)}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                  active 
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                    : isPremium 
                      ? 'bg-[#ff5a5f] text-white hover:bg-[#e0454a] shadow-[#ff5a5f]/30 shadow-xl' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {upgrading === plan.id 
                  ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> 
                  : active 
                    ? "Active Plan" 
                    : `Select ${plan.name}`
                }
              </button>
            </div>
          );
        })}
      </div>
    </StaticPageLayout>
  );
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
