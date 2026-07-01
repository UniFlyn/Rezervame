"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Search, Calendar, CheckCircle } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <StaticPageLayout 
      title="How It Works" 
      subtitle="Discover how easy it is to book your favorite services in seconds."
      breadcrumb="How It Works"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
        <div className="text-center p-8 bg-[var(--rz-gray-050)] rounded-3xl border border-[var(--rz-gray-100)]">
           <div className="w-16 h-16 bg-[#ff5757] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#ff5757]/20">
              <Search size={32} />
           </div>
           <h3 className="text-xl font-black mb-4 uppercase">1. Explore</h3>
           <p className="text-sm font-bold text-[var(--rz-gray-500)]">Search by category, location, or rating to find the perfect spot.</p>
        </div>
        <div className="text-center p-8 bg-[var(--rz-gray-050)] rounded-3xl border border-[var(--rz-gray-100)]">
           <div className="w-16 h-16 bg-[var(--rz-navy)] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar size={32} />
           </div>
           <h3 className="text-xl font-black mb-4 uppercase">2. Book</h3>
           <p className="text-sm font-bold text-[var(--rz-gray-500)]">Choose your service, date, time, and favorite professional in real-time.</p>
        </div>
        <div className="text-center p-8 bg-[var(--rz-gray-050)] rounded-3xl border border-[var(--rz-gray-100)]">
           <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
              <CheckCircle size={32} />
           </div>
           <h3 className="text-xl font-black mb-4 uppercase">3. Enjoy</h3>
           <p className="text-sm font-bold text-[var(--rz-gray-500)]">Receive friendly reminders and enjoy a premium experience without waiting.</p>
        </div>
      </div>

      <div className="mt-20 space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-wider text-[var(--rz-navy)]">Benefits For You</h2>
        <ul className="space-y-4">
          <li className="text-[var(--rz-gray-600)] font-bold">
            <strong className="text-[var(--rz-navy)] block text-sm uppercase tracking-wider mb-1">Real-time Availability:</strong> 
            Forget making phone calls—view open slots and book instantly.
          </li>
          <li className="text-[var(--rz-gray-600)] font-bold">
            <strong className="text-[var(--rz-navy)] block text-sm uppercase tracking-wider mb-1">Friendly Reminders:</strong> 
            We send you notifications so you never miss an appointment.
          </li>
          <li className="text-[var(--rz-gray-600)] font-bold">
            <strong className="text-[var(--rz-navy)] block text-sm uppercase tracking-wider mb-1">Secure Transactions:</strong> 
            Pay securely at the venue or directly inside the app.
          </li>
        </ul>
      </div>
    </StaticPageLayout>
  );
}
