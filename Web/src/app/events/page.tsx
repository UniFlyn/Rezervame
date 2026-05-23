"use client";
import React, { useEffect, useState } from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Calendar as CalendarIcon, ExternalLink, MapPin, Ticket } from "lucide-react";
import { fetchPublicEvents, publicEventImageSrc, type PublicEvent } from "@/lib/venueSearch";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

export default function EventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void fetchPublicEvents(page, PAGE_SIZE)
      .then((res) => {
        setEvents(res.data);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        setErr(null);
      })
      .catch(() => {
        setEvents([]);
        setTotalPages(1);
        setTotal(0);
        setErr("No se pudieron cargar los eventos.");
      });
  }, [page]);

  return (
    <StaticPageLayout
      title="Eventos y Talleres"
      subtitle="Mantente al día con los mejores eventos de la industria de la belleza en la región."
      breadcrumb="Events"
    >
      <div className="space-y-12 mt-10">
        {err ? <p className="text-center text-sm font-semibold text-rose-600">{err}</p> : null}
        {events.length === 0 && !err ? (
          <p className="text-center text-sm font-medium text-slate-500 py-12">
            No hay eventos publicados por ahora. Los administradores pueden añadirlos en la base de datos.
          </p>
        ) : null}
        {events.map((event) => {
          const start = new Date(event.startAt);
          const dateLabel = Number.isNaN(start.getTime())
            ? "—"
            : start.toLocaleDateString("es-PA", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
          const priceLabel =
            event.price > 0 ? `$${Number(event.price).toFixed(2)}` : "Gratis";
          return (
            <div
              key={event.id}
              className="flex flex-col md:flex-row gap-8 bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 group hover:shadow-2xl transition-all duration-500"
            >
              <div className="w-full md:w-1/3 aspect-video md:aspect-square overflow-hidden bg-slate-200">
                <img
                  src={publicEventImageSrc(event)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={event.title}
                />
              </div>
              <div className="flex-1 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[#ff5a5f] text-[10px] font-black uppercase tracking-widest mb-4">
                  <CalendarIcon size={14} /> {dateLabel}
                </div>
                <h3 className="text-2xl font-black uppercase text-slate-900 mb-2">{event.title}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-4">{event.body}</p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6">
                  <MapPin size={16} /> {event.location}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                  <span className="text-xl font-black text-slate-900">{priceLabel}</span>
                  {event.websiteUrl ? (
                    <a
                      href={event.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#ff5a5f] transition-all"
                    >
                      <ExternalLink size={14} /> Visit website
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      No registration link
                    </span>
                  )}
                </div>
              </div>
            </div>
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
    </StaticPageLayout>
  );
}
