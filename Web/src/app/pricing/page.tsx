"use client";
import React, { useState } from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Zap, Shield, Star, Users, Loader2, CheckCircle } from "lucide-react";
import { useBusinessStore } from "../../store/businessStore";
import { apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { business, hydrate } = useBusinessStore();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (plan: string) => {
    if (!business) {
      router.push("/business/login");
      return;
    }

    if (business.status === "Pending") {
      toastError("Account Pending", "Your business account must be approved before upgrading.");
      return;
    }

    setUpgrading(plan);
    try {
      await apiPost(`/business/${business.id}/upgrade`, { plan }, 'BUSINESS');
      toastSuccess(`Upgraded to ${plan}`, "Your plan has been updated successfully.");
      await hydrate();
    } catch (err) {
      toastError("Upgrade failed", "There was an error processing your upgrade.");
    } finally {
      setUpgrading(null);
    }
  };

  const isCurrentPlan = (plan: string) => {
    const current = (business as any)?.plan || "Basic";
    return current === plan;
  };

  return (
    <StaticPageLayout 
      title="Planes y Precios" 
      subtitle="Soluciones flexibles para negocios de todos los tamaños. Elige el plan que mejor se adapte a ti."
      breadcrumb="Pricing"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {/* Basic Plan */}
        <div className={`p-10 bg-slate-50 rounded-[40px] border flex flex-col items-center text-center transition-all ${isCurrentPlan("Basic") ? 'border-[#ff5a5f] bg-white ring-4 ring-[#ff5a5f]/10' : 'border-slate-100'}`}>
           <Zap className="w-12 h-12 text-slate-400 mb-6" />
           {isCurrentPlan("Basic") && (
             <div className="bg-[#ff5a5f] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                Plan Actual
             </div>
           )}
           <h3 className="text-2xl font-black uppercase mb-2">Plan Básico</h3>
           <p className="text-4xl font-black text-slate-900 mb-6">$0<span className="text-lg text-slate-400">/Mes</span></p>
           <ul className="text-left w-full space-y-4 mb-10">
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-green-500 w-5 h-5" /> Hasta 50 reservas/mes</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-green-500 w-5 h-5" /> Perfil de negocio básico</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-green-500 w-5 h-5" /> Soporte por email</li>
           </ul>
           <button 
             disabled={isCurrentPlan("Basic") || upgrading !== null}
             onClick={() => handleUpgrade("Basic")}
             className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isCurrentPlan("Basic") ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
           >
             {isCurrentPlan("Basic") ? "Plan Activo" : "Seleccionar Básico"}
           </button>
        </div>

        {/* Premium Plan */}
        <div className={`p-10 bg-white rounded-[40px] border-4 flex flex-col items-center text-center relative shadow-2xl transition-all ${isCurrentPlan("Premium") ? 'border-amber-400 shadow-amber-400/10' : 'border-[#ff5a5f] shadow-[#ff5a5f]/10'}`}>
           {!isCurrentPlan("Premium") && (
             <div className="absolute -top-5 bg-[#ff5a5f] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Recomendado</div>
           )}
           {isCurrentPlan("Premium") && (
             <div className="absolute -top-5 bg-amber-400 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <CheckCircle size={14} /> Plan Premium Activo
             </div>
           )}
           <Star className={`w-12 h-12 mb-6 ${isCurrentPlan("Premium") ? 'text-amber-400' : 'text-[#ff5a5f]'}`} />
           <h3 className="text-2xl font-black uppercase mb-2">Plan Premium</h3>
           <p className="text-4xl font-black text-slate-900 mb-6">$29<span className="text-lg text-slate-400">/Mes</span></p>
           <ul className="text-left w-full space-y-4 mb-10">
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-[#ff5a5f] w-5 h-5" /> Reservas ilimitadas</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-[#ff5a5f] w-5 h-5" /> Marketing y Promociones</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-[#ff5a5f] w-5 h-5" /> Analíticas avanzadas</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-[#ff5a5f] w-5 h-5" /> Soporte prioritario 24/7</li>
           </ul>
           <button 
             disabled={isCurrentPlan("Premium") || upgrading !== null}
             onClick={() => handleUpgrade("Premium")}
             className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${isCurrentPlan("Premium") ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-[#ff5a5f] text-white hover:bg-[#e0454a] shadow-[#ff5a5f]/30'}`}
           >
             {upgrading === "Premium" ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : isCurrentPlan("Premium") ? "Plan Activo" : "Activar Premium"}
           </button>
        </div>
      </div>
    </StaticPageLayout>
  );
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
