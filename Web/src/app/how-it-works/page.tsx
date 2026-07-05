"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Search, Calendar, CheckCircle } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";

export default function HowItWorksPage() {
  const { t } = useI18n();

  return (
    <StaticPageLayout
      title={t("howItWorks")}
      subtitle={t("howItWorksSub")}
      breadcrumb={t("footerHow")}
    >
      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
        <div className="rounded-3xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--rz-coral)] text-white shadow-lg shadow-[var(--rz-coral)]/20">
            <Search size={32} />
          </div>
          <h3 className="mb-4 text-xl font-black uppercase">{t("step1")}</h3>
          <p className="text-sm font-bold text-[var(--rz-gray-500)]">{t("step1Sub")}</p>
        </div>
        <div className="rounded-3xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--rz-navy)] text-white shadow-lg">
            <Calendar size={32} />
          </div>
          <h3 className="mb-4 text-xl font-black uppercase">{t("step2")}</h3>
          <p className="text-sm font-bold text-[var(--rz-gray-500)]">{t("step2Sub")}</p>
        </div>
        <div className="rounded-3xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 text-white shadow-lg shadow-green-100">
            <CheckCircle size={32} />
          </div>
          <h3 className="mb-4 text-xl font-black uppercase">{t("step3")}</h3>
          <p className="text-sm font-bold text-[var(--rz-gray-500)]">{t("step3Sub")}</p>
        </div>
      </div>
    </StaticPageLayout>
  );
}
