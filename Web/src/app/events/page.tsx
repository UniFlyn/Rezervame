"use client";
import React, { useEffect, useState } from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Calendar as CalendarIcon, ExternalLink, MapPin } from "lucide-react";
import { fetchPublicEvents, publicEventImageSrc, type PublicEvent } from "@/lib/venueSearch";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/components/I18nProvider";
import { StatePanel, statePanelVariantForMessage } from "@/components/ui/StatePanel";
import { userFacingError } from "@/lib/userFacingError";
import { PageLoader } from "@/components/ui/AppLoader";

const PAGE_SIZE = 10;

export default function EventsPage() {
  const { t, language } = useI18n();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);

  const dateLocale = language === "es" ? "es-PA" : "en-US";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPublicEvents(page, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setEvents(res.data);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        setErr(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setEvents([]);
        setTotalPages(1);
        setTotal(0);
        setErr(userFacingError(e, t("eventsLoadError")));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, reloadNonce, t]);

  return (
    <StaticPageLayout
      title={t("eventsTitle")}
      subtitle={t("eventsSub")}
      breadcrumb={t("footerEvents")}
    >
      {loading ? (
        <PageLoader label={t("eventsLoading")} />
      ) : (
        <>
          <div className="mt-10 space-y-12">
            {err ? (
              <StatePanel
                variant={statePanelVariantForMessage(err)}
                title={t("stateLoadFailedTitle")}
                description={err}
                actions={[{ label: t("tryAgain"), onClick: () => setReloadNonce((n) => n + 1), primary: true }]}
              />
            ) : null}
            {events.length === 0 && !err ? (
              <StatePanel variant="empty" title={t("stateEmptyEvents")} />
            ) : null}
            {events.map((event) => {
              const start = new Date(event.startAt);
              const dateLabel = Number.isNaN(start.getTime())
                ? "—"
                : start.toLocaleDateString(dateLocale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
              const priceLabel =
                event.price > 0
                  ? `$${Number(event.price).toFixed(2)}`
                  : t("eventsFree") || "Free";

              return (
                <article
                  key={event.id}
                  className="group flex flex-col gap-8 overflow-hidden rounded-[32px] border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] transition-all duration-500 hover:shadow-2xl md:flex-row"
                >
                  <div className="aspect-video w-full overflow-hidden bg-[var(--rz-gray-200)] md:aspect-square md:w-1/3">
                    <img
                      src={publicEventImageSrc(event)}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={event.title}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-8">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--rz-coral)]">
                      <CalendarIcon size={14} /> {dateLabel}
                    </div>
                    <h3 className="mb-2 text-2xl font-black uppercase text-[var(--rz-navy)]">{event.title}</h3>
                    <p className="mb-4 line-clamp-4 text-sm text-[var(--rz-gray-600)]">{event.body}</p>
                    <div className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--rz-gray-500)]">
                      <MapPin size={16} /> {event.location}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                      <span className="text-xl font-black text-[var(--rz-navy)]">{priceLabel}</span>
                      {event.websiteUrl ? (
                        <a
                          href={event.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl bg-[var(--rz-navy)] px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--rz-coral)]"
                        >
                          <ExternalLink size={14} /> {t("eventsVisitWebsite")}
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                          {t("eventsNoRegistrationLink")}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </StaticPageLayout>
  );
}
