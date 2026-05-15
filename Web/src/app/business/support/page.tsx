"use client";
import React from "react";
import { StaticPageLayout } from "../../../components/StaticPageLayout";
import { HelpCircle, BookOpen, Wrench } from "lucide-react";

export default function BusinessSupportPage() {
  return (
    <StaticPageLayout
      title="Business Support"
      subtitle="Everything you need to run your salon smoothly on REZERVAME."
      breadcrumb="Business Support"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-[#ff5a5f] transition-all">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl text-[#ff5a5f]"><HelpCircle size={32} /></div>
          <h3 className="text-lg font-black uppercase mb-4">FAQs</h3>
          <p className="text-sm font-bold text-slate-500">Quick answers to the most common merchant questions.</p>
        </div>
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-slate-900 transition-all">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl text-slate-900"><BookOpen size={32} /></div>
          <h3 className="text-lg font-black uppercase mb-4">Usage Guide</h3>
          <p className="text-sm font-bold text-slate-500">Step-by-step tutorials to set up your profile and services.</p>
        </div>
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-blue-500 transition-all">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl text-blue-500"><Wrench size={32} /></div>
          <h3 className="text-lg font-black uppercase mb-4">Technical Support</h3>
          <p className="text-sm font-bold text-slate-500">Having platform issues? Our team is here to help.</p>
        </div>
      </div>

      <div className="mt-20 p-10 bg-slate-900 text-white rounded-[40px]">
        <h2 className="text-white">New to REZERVAME?</h2>
        <p className="text-white/70 font-bold mb-8">Join businesses already saving time and increasing revenue.</p>
        <a href="/business/join" className="inline-block bg-[#ff5a5f] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#e0484d] transition-all">Register your business</a>
      </div>
    </StaticPageLayout>
  );
}
