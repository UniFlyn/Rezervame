"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Calendar as CalendarIcon, MapPin, Ticket } from "lucide-react";

export default function EventsPage() {
  const events = [
    {
      id: 1,
      title: "Masterclass de Barbería Moderna",
      date: "15 de Abril, 2026",
      location: "Hotel Panama, Ciudad de Panamá",
      price: "$45.00",
      img: "1585747860715-2ba37e788b70"
    },
    {
      id: 2,
      title: "Expo Belleza Latina 2026",
      date: "22 de Mayo, 2026",
      location: "Centro de Convenciones Atlapa",
      price: "Gratis",
      img: "1503951914875-452162b0f3f1"
    }
  ];

  return (
    <StaticPageLayout 
      title="Eventos y Talleres" 
      subtitle="Mantente al día con los mejores eventos de la industria de la belleza en la región."
      breadcrumb="Events"
    >
      <div className="space-y-12 mt-10">
        {events.map(event => (
          <div key={event.id} className="flex flex-col md:flex-row gap-8 bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 group hover:shadow-2xl transition-all duration-500">
            <div className="w-full md:w-1/3 aspect-video md:aspect-square overflow-hidden bg-slate-200">
                <img 
                  src={`https://images.unsplash.com/photo-${event.img}?q=80&w=600&fit=crop`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={event.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&fit=crop"; // High quality barber placeholder
                  }}
                />
            </div>
            <div className="flex-1 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[#ff5a5f] text-[10px] font-black uppercase tracking-widest mb-4">
                    <CalendarIcon size={14} /> {event.date}
                </div>
                <h3 className="text-2xl font-black uppercase text-slate-900 mb-2">{event.title}</h3>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6">
                    <MapPin size={16} /> {event.location}
                </div>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-black text-slate-900">{event.price}</span>
                    <button className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#ff5a5f] transition-all">
                        <Ticket size={14} /> Adquirir Entrada
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </StaticPageLayout>
  );
}
