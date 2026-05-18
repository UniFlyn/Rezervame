"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";

export default function TermsPage() {
  return (
    <StaticPageLayout 
      title="Terms of Service" 
      subtitle="By using our platform, you agree to these terms. Please read them carefully."
      breadcrumb="Terms of Service"
    >
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">
        Effective starting: March 30, 2026.
      </p>

      <div className="space-y-8 mt-8">
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">1. Acceptance of Terms</h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            By accessing or using REZERVAME, you agree to comply with these terms and all applicable 
            laws and regulations. If you do not agree with any of these terms, you are prohibited 
            from using or accessing this site.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">2. Use of the Platform</h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            Our platform allows users to book appointments with beauty professionals. 
            You are responsible for maintaining the confidentiality of your account and for all activities 
            that occur under your username.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">3. Cancellation Policy</h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            Cancellations are subject to the individual policies of each registered business. 
            REZERVAME is not responsible for cancellation fees or charges imposed by service providers.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">4. Limitation of Liability</h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            REZERVAME does not guarantee the quality of the services provided by registered businesses. 
            We act solely as a technological intermediary to facilitate the booking and reservation process.
          </p>
        </div>
      </div>
    </StaticPageLayout>
  );
}
