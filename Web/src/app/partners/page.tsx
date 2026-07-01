"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { Button as DSButton } from "@/ds";
import {
  BarChart3,
  CreditCard,
  Megaphone,
  Smartphone,
  Target,
  Trophy,
} from "lucide-react";
import { PARTNER_BUSINESS_TYPES, partnerTypeTileImage } from "@/lib/partnerBusinessTypes";

const BENEFITS = [
  { Icon: BarChart3, key: "partnersBenefit1" },
  { Icon: Smartphone, key: "partnersBenefit2" },
  { Icon: CreditCard, key: "partnersBenefit3" },
  { Icon: Megaphone, key: "partnersBenefit4" },
  { Icon: Target, key: "partnersBenefit5" },
  { Icon: Trophy, key: "partnersBenefit6" },
] as const;

const STEPS = ["partnersStep1", "partnersStep2", "partnersStep3"] as const;

export default function PartnersPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--rz-gray-050)] to-white px-6 py-24 sm:px-10 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="mb-4 inline-block rounded-full bg-[#ff5757] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
              {t("partnersEyebrow")}
            </span>
            <h1 className="text-4xl font-black leading-tight text-[#023047] sm:text-5xl">
              {t("partnersHeroTitle")}{" "}
              <span className="text-[#ff5757]">{t("partnersHeroHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg font-medium leading-relaxed text-[var(--rz-gray-600)]">
              {t("partnersHeroSub")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <DSButton
                variant="primary"
                size="lg"
                shape="pill"
                uppercase
                rightIcon="arrowRight"
                onClick={() => router.push("/business/join")}
              >
                {t("partnersCtaPrimary")}
              </DSButton>
              <DSButton
                variant="outline"
                size="lg"
                shape="pill"
                uppercase
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t("partnersCtaSecondary")}
              </DSButton>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-4">
              {[
                { stat: "50K+", label: t("partnersStat1") },
                { stat: "2,500+", label: t("partnersStat2") },
                { stat: "95%", label: t("partnersStat3") },
                { stat: "24/7", label: t("partnersStat4") },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--rz-gray-100)] bg-white p-4 shadow-sm"
                >
                  <p className="text-2xl font-black text-[#ff5757]">{item.stat}</p>
                  <p className="mt-1 text-xs font-bold text-[var(--rz-gray-500)]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {PARTNER_BUSINESS_TYPES.slice(0, 4).map((type) => (
              <div
                key={type.id}
                className="flex aspect-square flex-col items-center justify-center rounded-3xl border border-[var(--rz-gray-100)] bg-white p-4 text-center shadow-lg"
              >
                <span className="text-4xl">{type.emoji}</span>
                <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-[var(--rz-gray-600)]">
                  {t(`${type.labelKey}Title`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="business-types" className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl text-center">
          <span className="mb-3 inline-block rounded-full bg-[#ff5757] px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            {t("partnersTypesEyebrow")}
          </span>
          <h2 className="text-3xl font-black text-[#023047] sm:text-4xl">{t("partnersTypesTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--rz-gray-600)]">{t("partnersTypesSub")}</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNER_BUSINESS_TYPES.map((type) => (
            <article
              key={type.id}
              className="group relative overflow-hidden rounded-3xl border-2 border-transparent bg-[var(--rz-gray-050)] transition hover:border-[#ff5757] hover:shadow-lg"
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  src={partnerTypeTileImage(type)}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-2 left-3 text-3xl">{type.emoji}</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black text-[#023047]">{t(`${type.labelKey}Title`)}</h3>
                <p className="mt-2 text-sm font-medium text-[var(--rz-gray-600)]">{t(`${type.labelKey}Desc`)}</p>
                <ul className="mt-4 space-y-2">
                  {(["F1", "F2", "F3"] as const).map((n) => (
                    <li
                      key={n}
                      className="flex items-start gap-2 text-xs font-bold text-[var(--rz-gray-500)]"
                    >
                      <span className="text-[#ff5757]">✓</span>
                      {t(`${type.labelKey}${n}`)}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/business/join?type=${encodeURIComponent(type.id)}`}
                  className="mt-4 inline-block text-[10px] font-black uppercase tracking-widest text-[#ff5757] hover:underline"
                >
                  {t("partnersCtaPrimary")} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#023047] px-6 py-20 text-white sm:px-10">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-black sm:text-4xl">{t("partnersBenefitsTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--rz-gray-300)]">{t("partnersBenefitsSub")}</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ Icon, key }) => (
            <div key={key} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff5757] shadow-lg">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-black">{t(`${key}Title`)}</h3>
              <p className="mt-2 text-sm text-[var(--rz-gray-300)]">{t(`${key}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[var(--rz-gray-050)] px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-3 inline-block rounded-full bg-[#ff5757] px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            {t("partnersProcessEyebrow")}
          </span>
          <h2 className="text-3xl font-black text-[#023047]">{t("partnersProcessTitle")}</h2>
          <p className="mt-4 text-[var(--rz-gray-600)]">{t("partnersProcessSub")}</p>
        </div>
        <div className="mx-auto mt-12 max-w-3xl space-y-10">
          {STEPS.map((key, i) => (
            <div key={key} className="flex gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ff5757] text-xl font-black text-white">
                {i + 1}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#023047]">{t(`${key}Title`)}</h3>
                <p className="mt-2 font-medium leading-relaxed text-[var(--rz-gray-600)]">{t(`${key}Body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#ff5757] px-6 py-16 text-center text-white sm:px-10">
        <h2 className="text-3xl font-black sm:text-4xl">{t("partnersCtaBlockTitle")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg opacity-95">{t("partnersCtaBlockSub")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/business/join"
            className="rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-[#ff5757] shadow-lg transition hover:scale-105"
          >
            {t("partnersCtaPrimary")}
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border-2 border-white px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white/10"
          >
            {t("footerPrices")}
          </Link>
        </div>
      </section>
    </main>
  );
}
