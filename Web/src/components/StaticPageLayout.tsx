"use client";
import React from "react";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  children: React.ReactNode;
}

export const StaticPageLayout = ({ title, subtitle, breadcrumb, children }: StaticPageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[var(--rz-navy-800)]">
      <main className="flex-1">
        <div className="relative bg-[var(--rz-navy)] border-b border-[var(--rz-navy-800)] py-24 md:py-32 overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-[#ff5757]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="max-w-[1200px] mx-auto px-8 relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
            {breadcrumb && (
              <div className="inline-block px-4 py-1.5 bg-[#ff5757] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 shadow-lg shadow-[#ff5757]/20">
                {breadcrumb}
              </div>
            )}
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-6 uppercase leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-xl font-bold text-white/60 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-8 py-20 animate-in fade-in duration-1000">
          {children}
        </div>
      </main>
    </div>
  );
};
