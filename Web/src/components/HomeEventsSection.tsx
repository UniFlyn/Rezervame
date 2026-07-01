"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, ExternalLink, MapPin, Sparkles, Ticket } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import {
  fetchPublicEvents,
  publicEventImageSrc,
  type PublicEvent,
} from "@/lib/venueSearch";

const HOME_EVENTS_LIMIT = 5;

function formatEventDate(iso: string): { day: string; month: string; time: string; full: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { day: "—", month: "", time: "", full: "—" };
  }
  return {
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    full: d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function EventCard({
  event,
  onDetails,
}: {
  event: PublicEvent;
  onDetails: () => void;
}) {
  const hasWebsite = Boolean((event.websiteUrl || "").trim());
  const { t } = useI18n();
  const when = formatEventDate(event.startAt);
  const priceLabel =
    event.price > 0 ? `$${Number(event.price).toFixed(2)}` : t("homeEventsFree");

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-lg shadow-[color:rgba(2,48,71,0.05)] transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#ff5757]/15">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--rz-gray-200)]">
        <img
          src={publicEventImageSrc(event)}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(1,29,44,0.85)] via-[rgba(2,48,71,0.2)] to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ff5757] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-white shadow-md">
            <Sparkles size={9} aria-hidden />
            Event
          </span>
        </div>
        <div className="absolute right-3 top-3 flex min-w-[52px] flex-col items-center rounded-xl border border-white/20 bg-white/95 px-2 py-1.5 text-center shadow-lg backdrop-blur-md">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#ff5757]">
            {when.month}
          </span>
          <span className="text-xl font-black leading-none text-[var(--rz-navy)]">{when.day}</span>
          <span className="mt-0.5 text-[8px] font-bold text-[var(--rz-gray-500)]">{when.time}</span>
        </div>
        <h4 className="absolute bottom-3 left-3 right-3 line-clamp-2 text-base font-extrabold tracking-wide text-white drop-shadow-md">
          {event.title}
        </h4>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-relaxed text-[var(--rz-gray-600)]">
          {event.body}
        </p>
        <div className="mb-3 flex flex-col gap-2 text-[10px] font-bold text-[var(--rz-gray-500)]">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--rz-gray-050)] px-2 py-1.5">
            <Calendar size={12} className="shrink-0 text-[#ff5757]" aria-hidden />
            <span className="truncate">{when.full}</span>
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--rz-gray-050)] px-2 py-1.5">
              <MapPin size={12} className="shrink-0 text-[#ff5757]" aria-hidden />
              <span className="truncate">{event.location}</span>
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--rz-gray-100)] pt-3">
          <span className="text-base font-black text-[var(--rz-navy)]">{priceLabel}</span>
          {hasWebsite ? (
            <a
              href={event.websiteUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--rz-navy)] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-[#ff5757]"
            >
              <ExternalLink size={11} aria-hidden />
              {t("homeEventsDetails")}
            </a>
          ) : (
            <button
              type="button"
              onClick={onDetails}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--rz-navy)] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-[#ff5757]"
            >
              <Ticket size={11} aria-hidden />
              {t("homeEventsDetails")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function HomeEventsSection() {
  const { t } = useI18n();
  const router = useRouter();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPublicEvents(1, HOME_EVENTS_LIMIT)
      .then((res) => setEvents(res.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && events.length === 0) return null;

  const displayEvents = events;

  const eventGridClass =
    displayEvents.length <= 1
      ? "grid-cols-1"
      : displayEvents.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : displayEvents.length === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : displayEvents.length === 4
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  return (
    <section className="relative mb-16 overflow-hidden rounded-[32px] border border-[#023047]/5 bg-gradient-to-br from-[var(--rz-navy-900)] via-[var(--rz-navy)] to-[var(--rz-navy-800)] p-6 sm:p-10 md:p-12">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff5757]/25 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-violet-500/15 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />

      <div className="relative z-10 mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl text-left">
          <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#ff8a8e]">
            <Sparkles size={12} aria-hidden />
            {t("homeEventsEyebrow")}
          </span>
          <h3 className="text-[28px] font-extrabold tracking-wide text-white sm:text-[32px]">
            {t("homeEventsTitle")}
          </h3>
          <p className="mt-2 font-medium text-[var(--rz-gray-500)]">{t("homeEventsSub")}</p>
        </div>
        <Link
          href="/events"
          className="group inline-flex shrink-0 items-center self-start rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:border-[#ff5757]/50 hover:bg-white/15 sm:self-auto"
        >
          {t("homeEventsViewAll")}
          <ArrowRight
            size={16}
            className="ml-2 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </div>

      <div className={`relative z-10 grid gap-5 ${eventGridClass}`}>
        {loading
          ? Array.from({ length: HOME_EVENTS_LIMIT }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[360px] animate-pulse flex-col overflow-hidden rounded-[24px] bg-white/10"
              >
                <div className="aspect-[4/3] bg-white/5" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-4/5 rounded bg-white/10" />
                  <div className="mt-auto h-8 rounded bg-white/10" />
                </div>
              </div>
            ))
          : displayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDetails={() => router.push("/events")}
              />
            ))}
      </div>
    </section>
  );
}
