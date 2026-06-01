"use client";

import { Wrench } from "lucide-react";

type MaintenancePageProps = {
  platformName?: string;
};

export function MaintenancePage({ platformName = "Rezervame" }: MaintenancePageProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
        <Wrench size={36} strokeWidth={2.2} />
      </div>
      <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
        We&apos;ll be back soon
      </h1>
      <p className="mt-4 max-w-md text-sm font-semibold leading-relaxed text-slate-500">
        {platformName} is undergoing scheduled maintenance. Please check again in a little while.
      </p>
      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
        Thank you for your patience
      </p>
    </div>
  );
}
