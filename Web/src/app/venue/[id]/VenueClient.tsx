"use client";
import React, { useState } from "react";
import { useI18n } from "../../../components/I18nProvider";
import { 
  Search, MapPin, Grid, List as ListIcon, Filter, ChevronDown, 
  Star, Clock, Heart, ChevronRight, ChevronLeft, LayoutGrid, Share2, Info, Check, Calendar, Phone, Mail, Instagram, Youtube, X,
  Wifi, Coffee, Wind, Car, Tv, Plug, GlassWater, CreditCard
} from "lucide-react";
import { BookingModal } from "../../../components/BookingModal";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function generateStaticParams() {
  return [{ id: '1' }]; // Pre-render at least one ID for the static build
}


const VENUE_DATA = {
  id: 1,
  name: "Luxe Hair Studio",
  category: "Servicios para el cabello",
  rating: 4.9,
  reviews: 217,
  address: "Avenida Balboa, Ciudad de Panamá",
  description: "Nuestro salón de belleza combina diseño moderno, productos de alta gama y un equipo de estilistas expertos dedicados a resaltar tu estilo y personalidad. Ya sea que busques un cambio radical o un mantenimiento de tu corte, ofrecemos servicios personalizados para cada tipo de cabello y estilo de vida.",
  images: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1200&fit=crop",
    "https://images.unsplash.com/photo-1621605815891-2b97b0c03ffc?q=80&w=1200&fit=crop"
  ],
  services: [
    { id: 1, name: "Corte de cabello para mujer", description: "Corte y peinado profesional adaptado a tus preferencias", time: "60 min", price: 65, tag: "Todos los servicios" },
    { id: 2, name: "Corte de cabello para hombre", description: "Corte clásico o moderno, realizado con precisión y estilo", time: "45 min", price: 35, tag: "Más vendidos" },
    { id: 3, name: "Coloración de cabello", description: "Servicio completo de color con productos de alta gama", time: "3-4 horas", price: 120, tag: "Promociones" },
    { id: 4, name: "Highlights", description: "Reflejos parciales o completos para aportar dimensión y profundidad al cabello", time: "2-3 horas", price: 140, tag: "Todos los servicios" },
    { id: 5, name: "Balayage", description: "Reflejos aplicados a mano para un efecto natural y luminoso tipo 'baño de sol'", time: "3-4 horas", price: 180, tag: "Más vendidos" },
    { id: 6, name: "Secado de Cabello (Blower)", description: "Lavado profesional y peinado con secado tipo salón", time: "45 min", price: 45, tag: "Promociones" },
    { id: 7, name: "Tratamiento de Keratina", description: "Tratamiento alisador para un cabello suave, sin frizz y con un brillo radiante", time: "3-4 horas", price: 250, tag: "Todos los servicios" },
    { id: 8, name: "Extensiones de Cabello", description: "Consulta y aplicación de extensiones premium", time: "2-5 horas", price: 300, tag: "Más vendidos" },
  ],
  team: [
    { id: 1, name: "Mateo Ríos", role: "Estilista Senior & Grooming Expert", rating: 4.8, reviews: 120, clients: "250+", years: "8+", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&fit=crop" },
    { id: 2, name: "Mateo Ríos", role: "Estilista Senior & Grooming Expert", rating: 4.9, reviews: 120, clients: "250+", years: "8+", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&fit=crop" },
    { id: 3, name: "Mateo Ríos", role: "Estilista Senior & Grooming Expert", rating: 4.5, reviews: 120, clients: "250+", years: "8+", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&fit=crop" },
    { id: 4, name: "Mateo Ríos", role: "Estilista Senior & Grooming Expert", rating: 4.2, reviews: 120, clients: "250+", years: "8+", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&fit=crop" },
  ],
  schedule: [
    { day: "Lunes a Viernes", hours: "9:00 AM - 8:00 PM" },
    { day: "Sábados y Domingos", hours: "11:00 AM - 6:00 PM" }
  ],
  socials: {
    instagram: "@luxehairpma",
    tiktok: "@luxehair_salon",
    youtube: "/luxehairpma"
  }
};

const CATEGORIES = ["Servicios para el cabello", "Spa y Bienestar", "Servicios de Belleza", "Depilación", "Cuidado de las Uñas", "Barbería"];

export default function VenueDetailsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("servicios");
  const [activeServiceFilter, setActiveServiceFilter] = useState("Todos los servicios");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const toggleService = (id: number) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* VENUE NAME TOP BAR (SLIM) */}
      <div className="bg-slate-50 border-b border-slate-200 px-12 py-3 flex items-center justify-between sticky top-[73px] z-40 backdrop-blur-md bg-white/80">
          <div className="flex items-center gap-4">
              <Link href="/search" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <ChevronLeft size={20} className="text-slate-600" />
              </Link>
              <div>
                  <h1 className="text-xl font-black text-slate-900 leading-none">{VENUE_DATA.name}</h1>
                  <p className="text-[10px] font-bold text-[#ff5a5f] uppercase tracking-widest mt-1">{VENUE_DATA.category}</p>
              </div>
          </div>
          <div className="flex items-center gap-4">
              {selectedServices.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl animate-in fade-in zoom-in duration-300">
                      <Check size={12} className="text-green-400" /> {selectedServices.length} {selectedServices.length === 1 ? 'servicio' : 'servicios'}
                  </div>
              )}
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                disabled={selectedServices.length === 0}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                    selectedServices.length > 0 
                    ? 'bg-[#ff5a5f] text-white hover:bg-[#e0454a] shadow-[#ff5a5f]/20 cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed grayscale'
                }`}
              >
                  RESERVAR AHORA
              </button>
          </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative h-[550px] w-full overflow-hidden">
          <img 
            src={VENUE_DATA.images[0]} 
            className="w-full h-full object-cover" 
            alt={VENUE_DATA.name} 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1200&fit=crop";
            }}
          />
         <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
         <div className="absolute bottom-12 left-12 right-12 flex justify-end gap-3">
             <button className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all text-slate-900"><Share2 size={20} /></button>
             <button className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all text-slate-900"><Heart size={20} /></button>
         </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-14 py-16 flex flex-col lg:flex-row gap-12">
          
          <main className="flex-1">
              <div className="flex justify-between items-start mb-8">
                  <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-[#ff5a5f]/5 text-[#ff5a5f] text-[10px] font-black px-3 py-1.5 rounded-full border border-[#ff5a5f]/10 uppercase tracking-widest">Nuevo en la plataforma</span>
                        <div className="flex gap-1.5 items-center">
                            <Share2 className="w-5 h-5 text-slate-300 hover:text-[#ff5a5f] cursor-pointer" />
                            <Heart className="w-5 h-5 text-slate-300 hover:text-[#ff5a5f] cursor-pointer" />
                        </div>
                      </div>
                      <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">{VENUE_DATA.name}</h1>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                             <div className="flex gap-1">
                                {Array.from({length: 5}).map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                ))}
                             </div>
                             <span className="text-sm font-black text-slate-900">{VENUE_DATA.rating}</span>
                             <span className="text-sm font-bold text-slate-400">({VENUE_DATA.reviews} reseñas)</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                             <MapPin size={16} />
                             <span className="text-sm font-bold">{VENUE_DATA.address}</span>
                        </div>
                      </div>
                  </div>
              </div>

              <p className="text-slate-500 leading-relaxed font-medium mb-12 max-w-3xl border-l-[4px] border-slate-100 pl-8 py-2 italic">
                  {VENUE_DATA.description}
              </p>

              {/* TABS */}
              <div className="flex gap-4 mb-12 border-b border-slate-100 pb-4 sticky top-[100px] bg-white pt-4 z-30">
                  {["Servicios", "Equipo", "Reseñas", "Amenidades"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${activeTab === tab.toLowerCase() ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>

              {/* TAB CONTENT: SERVICIOS */}
              {activeTab === "servicios" && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">{t('ourServices')}</h2>
                        <p className="text-slate-400 text-sm font-bold max-w-xl mx-auto uppercase tracking-tighter">Desde cortes de precisión hasta servicios de color transformadores, nuestro equipo de expertos ofrece resultados excepcionales utilizando productos de la más alta calidad.</p>
                    </div>

                    <div className="flex justify-center gap-4 mb-12">
                        {["Todos los servicios", "Más vendidos", "Promociones"].map(f => (
                            <button 
                                key={f}
                                onClick={() => setActiveServiceFilter(f)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeServiceFilter === f ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                        {VENUE_DATA.services.filter(s => activeServiceFilter === "Todos los servicios" || s.tag === activeServiceFilter).map(s => (
                            <div key={s.id} className="group bg-white p-5 rounded-2xl border border-slate-100 hover:border-[#ff5a5f]/25 hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative">
                                <div>
                                    <h4 className="text-base font-black text-slate-900 mb-1.5 group-hover:text-[#ff5a5f] transition-colors tracking-wide">{s.name}</h4>
                                    <p className="text-slate-500 text-[11px] font-medium leading-snug mb-4 tracking-normal">{s.description}</p>
                                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                                        <Clock size={13} className="text-[#ff5a5f] shrink-0" /> {s.time}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100 gap-3">
                                    <span className="text-xl font-black text-slate-900">${s.price}</span>
                                    <button 
                                        onClick={() => toggleService(s.id)}
                                        className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shrink-0 ${
                                            selectedServices.includes(s.id) 
                                            ? 'bg-slate-900 text-white shadow-md' 
                                            : 'bg-white border-2 border-[#ff5a5f] text-[#ff5a5f] hover:bg-[#ff5a5f] hover:text-white'
                                        }`}
                                    >
                                        {selectedServices.includes(s.id) ? 'AÑADIDO' : 'RESERVAME'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <button className="font-black text-slate-900 uppercase tracking-[0.3em] text-[11px] group flex items-center gap-4 mx-auto hover:text-[#ff5a5f] transition-colors">
                            VER MÁS <span className="text-2xl transition-transform group-hover:translate-x-2">+</span>
                        </button>
                    </div>
                </div>
              )}

              {/* TAB CONTENT: EQUIPO */}
              {activeTab === "equipo" && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Nuestro staff profesional</h2>
                        <p className="text-slate-400 text-sm font-bold max-w-xl mx-auto uppercase tracking-tighter">Conoce a los expertos que harán realidad tu cambio de imagen. Cada miembro de nuestro equipo cuenta con años de experiencia y capacitación internacional.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {VENUE_DATA.team.map((member, i) => (
                            <div key={i} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-[#ff5a5f]/20 hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer">
                                <div className="relative h-56 overflow-hidden">
                                    <img 
                                      src={member.img} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                                      alt={member.name}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&fit=crop";
                                      }}
                                    />
                                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 px-2.5 py-1 rounded-lg text-[11px] font-black text-slate-900 shadow-sm border border-slate-100">
                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        {member.rating}
                                    </div>
                                </div>
                                <div className="p-5 text-left flex flex-col flex-1">
                                    <h4 className="text-base font-black text-slate-900 mb-1 tracking-wide group-hover:text-[#ff5a5f] transition-colors">{member.name}</h4>
                                    <p className="text-[#ff5a5f] text-[9px] font-black uppercase tracking-widest mb-3 line-clamp-2">{member.role}</p>
                                    <p className="text-slate-500 text-[11px] leading-snug mb-4 flex-1 tracking-normal">
                                      Especialista certificado con enfoque en experiencia premium y resultados consistentes.
                                    </p>
                                    <div className="flex gap-4 text-[10px] font-bold text-slate-600 border-t border-slate-100 pt-3">
                                        <span>{member.years} exp.</span>
                                        <span className="text-slate-300">|</span>
                                        <span>{member.clients} clientes</span>
                                        <span className="text-slate-300">|</span>
                                        <span>{member.reviews} reseñas</span>
                                    </div>
                                    <button type="button" className="mt-4 w-full py-2.5 rounded-xl border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-colors">
                                      Ver perfil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* TAB CONTENT: RESEÑAS */}
              {activeTab === "reseñas" && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Opiniones de clientes</h2>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1">
                                    {Array.from({length: 5}).map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <span className="text-lg font-black text-slate-900">4.9 / 5.0</span>
                                <span className="text-sm font-bold text-slate-400">basado en 217 reseñas</span>
                            </div>
                        </div>
                        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl">
                            ESCRIBIR RESEÑA
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {[
                            { name: "Lucía Fernández", date: "Hace 2 días", rating: 5, comment: "Fui por un balayage y quedé encantada. El trato de Mateo es excepcional y los productos que usan son de primer nivel. El ambiente del salón es súper relajante.", avatar: "LF" },
                            { name: "Roberto Gómez", date: "Hace 1 semana", rating: 5, comment: "Excelente servicio de barbería. Muy profesional y detallista. Definitivamente volveré.", avatar: "RG" },
                            { name: "Carla Martínez", date: "Hace 2 semanas", rating: 4, comment: "Muy buen servicio, aunque tuve que esperar 10 minutos más de mi cita. Aún así, el corte valió la pena.", avatar: "CM" }
                        ].map((rev, i) => (
                            <div key={i} className="bg-white p-8 rounded-[32px] border-2 border-slate-50 hover:shadow-xl transition-all duration-500">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#ff5a5f]/10 text-[#ff5a5f] rounded-full flex items-center justify-center font-black text-sm">{rev.avatar}</div>
                                        <div>
                                            <h4 className="font-black text-slate-900 tracking-tight">{rev.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rev.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {Array.from({length: rev.rating}).map((_, i) => (
                                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-[#ff5a5f]/20 pl-6">"{rev.comment}"</p>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* TAB CONTENT: AMENIDADES */}
              {activeTab === "amenidades" && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Servicios & Comodidades</h2>
                        <p className="text-slate-400 text-sm font-bold max-w-xl mx-auto uppercase tracking-tighter">Nos esforzamos por hacer que tu visita sea lo más cómoda y agradable posible. Disfruta de nuestras instalaciones diseñadas para tu bienestar.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {[
                            { Icon: Wifi, name: "WiFi Gratis", desc: "Conexión de alta velocidad" },
                            { Icon: Coffee, name: "Café & Bebidas", desc: "Cortesía de la casa" },
                            { Icon: Wind, name: "Aire Acondicionado", desc: "Ambiente climatizado" },
                            { Icon: Car, name: "Estacionamiento", desc: "Seguro y gratuito" },
                            { Icon: Tv, name: "TV & Entretenimiento", desc: "Pantallas en cada zona" },
                            { Icon: Plug, name: "Estaciones de Carga", desc: "Para tus dispositivos" },
                            { Icon: GlassWater, name: "Barra de Refrescos", desc: "Variedad de opciones" },
                            { Icon: CreditCard, name: "Pago con Tarjeta", desc: "Aceptamos todas las marcas" }
                        ].map((amenity, i) => {
                          const Icon = amenity.Icon;
                          return (
                            <div key={i} className="group bg-white p-4 rounded-xl border border-slate-100 hover:border-[#ff5a5f]/25 hover:shadow-md transition-all duration-300 text-center">
                                <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-700 group-hover:bg-[#ff5a5f]/10 group-hover:text-[#ff5a5f] transition-colors">
                                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                                </div>
                                <h4 className="font-black text-slate-900 text-xs mb-1 tracking-wide">{amenity.name}</h4>
                                <p className="text-[10px] font-medium text-slate-500 leading-snug tracking-normal">{amenity.desc}</p>
                            </div>
                          );
                        })}
                    </div>
                </div>
              )}
          </main>

          {/* SIDEBAR */}
          <aside className="w-full lg:w-[450px] space-y-12">
               {/* MINI MAP */}
               <div className="rounded-[40px] overflow-hidden border-2 border-slate-100 shadow-2xl relative group h-[400px]">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src="https://www.openstreetmap.org/export/embed.html?bbox=-79.54%2C8.95%2C-79.52%2C8.97&amp;layer=mapnik" 
                    ></iframe>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-[#ff5a5f] p-4 rounded-2xl shadow-2xl animate-bounce border-4 border-white">
                            <MapPin className="text-white" size={32} fill="white" />
                        </div>
                    </div>
               </div>

               {/* INFO SECTION */}
               <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-5 flex items-center gap-2">
                       <Info size={18} className="text-[#ff5a5f]" />
                       Información
                   </h3>
                   
                   <div className="space-y-5">
                       <div>
                           <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-wide mb-2">Horario</p>
                           {VENUE_DATA.schedule.map(s => (
                               <div key={s.day} className="flex justify-between items-center gap-3 py-2 border-b border-slate-100 last:border-0 text-[13px]">
                                   <span className="font-semibold text-slate-600">{s.day}</span>
                                   <span className="font-bold text-slate-900 whitespace-nowrap">{s.hours}</span>
                               </div>
                           ))}
                       </div>

                       <div>
                           <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-wide mb-2">Contacto</p>
                           <div className="space-y-2.5">
                                <div className="flex items-center gap-3 text-slate-700 hover:text-[#ff5a5f] cursor-pointer transition-colors group">
                                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-[#ff5a5f]/10 shrink-0"><Phone size={15} /></div>
                                    <span className="text-[13px] font-semibold">(507) 6649-0428</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 hover:text-[#ff5a5f] cursor-pointer transition-colors group">
                                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-[#ff5a5f]/10 shrink-0"><Mail size={15} /></div>
                                    <span className="text-[13px] font-semibold break-all">info@luxehairpma.com</span>
                                </div>
                           </div>
                       </div>
                   </div>

                   <div className="mt-8 flex justify-center gap-3">
                       <button className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all"><Instagram size={24} /></button>
                       <button className="w-14 h-14 rounded-2xl bg-[#000000] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all font-black text-xl italic uppercase">T</button>
                       <button className="w-14 h-14 rounded-2xl bg-[#ff0000] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all"><Youtube size={24} /></button>
                   </div>
               </div>
          </aside>
      </div>

      {/* BOTTOM CATEGORY EXPLORATION */}
      <section className="bg-slate-50/50 py-24 border-t border-slate-100">
           <div className="max-w-[1920px] mx-auto px-6 lg:px-14">
                <div className="text-center mb-20 animate-in fade-in duration-1000">
                    <h2 className="text-6xl font-black text-slate-900 tracking-tight mb-6">Elige tu categoría</h2>
                    <p className="text-slate-400 text-xl font-bold uppercase tracking-widest">Descubre el servicio perfecto para ti</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {CATEGORIES.map((c, i) => (
                        <div key={c} className="group relative aspect-square rounded-[32px] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.03]">
                            <img 
                              src={`https://images.unsplash.com/photo-${i % 2 === 0 ? '1560066984-138dadb4c035' : '1522337660859-02fbefca4702'}?q=80&w=400&fit=crop`} 
                              className="w-full h-full object-cover transition duration-1000 group-hover:scale-125" 
                              alt={c} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=400&fit=crop";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                                <h4 className="text-white text-sm font-black leading-tight mb-1 uppercase tracking-tighter group-hover:text-[#ff5a5f] transition-all line-clamp-2">{c}</h4>
                                <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest">Explorar</p>
                            </div>
                        </div>
                    ))}
                </div>
           </div>
      </section>
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedServiceIds={selectedServices}
        venueData={VENUE_DATA}
      />
    </div>
  );
}
