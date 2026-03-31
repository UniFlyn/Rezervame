"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Zap, 
  Crown, 
  Plus, 
  Check, 
  Users, 
  TrendingUp,
  Settings2,
  Lock,
  ArrowRight
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
  }
];

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase tracking-tighter italic">Billing & Tier Protocols</h1>
          <p className="text-slate-500 text-sm mt-1">Configure and monitor platform subscription performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
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
              )}>
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
           
           <button className="bg-white text-slate-900 px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition active:scale-95 shadow-2xl shadow-white/10 flex items-center gap-4">
              Open Customizer
              <ArrowRight className="w-6 h-6 bg-slate-900 text-white p-1 rounded-full" />
           </button>
         </div>
      </div>
    </div>
  );
}
