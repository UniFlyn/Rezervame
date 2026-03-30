"use client";
import React from "react";
import { useI18n } from "../components/I18nProvider";
import { useRouter } from "next/navigation";

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="bg-white font-sans text-slate-900">
      {/* HERO SECTION */}
      <div 
        className="relative h-[480px] bg-cover bg-center flex flex-col items-center pt-24" 
        style={{ backgroundImage: "url('/HeroSection.png')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4 w-full max-w-4xl pt-8">
          <h2 className="text-[44px] leading-tight font-extrabold mb-3 max-w-2xl mx-auto drop-shadow-md">{t('heroTitle')}</h2>
          <p className="text-lg font-normal mb-8 max-w-xl mx-auto opacity-90">{t('heroSubtitle')}</p>
          
          <div className="bg-white p-2 rounded-xl shadow-2xl flex w-full max-w-3xl mx-auto items-center h-[72px]">
            <div className="flex-[1.5] flex items-center px-4 border-r border-slate-200 h-full">
              <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder={t('searchPlaceholder')} className="w-full h-full text-sm outline-none text-slate-800 bg-transparent placeholder-slate-400 font-medium" />
            </div>
            <div className="flex-1 flex items-center px-4 h-full">
              <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input type="text" placeholder={t('locationPlaceholder')} className="w-full h-full text-sm outline-none text-slate-800 bg-transparent placeholder-slate-400 font-medium" />
            </div>
            <button 
              onClick={() => router.push('/search')}
              className="bg-[#ff5a5f] hover:bg-[#e0454a] text-white px-8 h-full rounded-lg font-bold transition flex-shrink-0"
            >
              {t('searchBtn')}
            </button>
          </div>
          
          <div className="mt-8 text-sm font-semibold flex items-center justify-center">
             <span className="mr-3">{t('featuredServices')}:</span>
              {[
                { key: 'cut', label: t('cut') },
                { key: 'nails', label: t('nails') },
                { key: 'massage', label: t('massage') },
                { key: 'facial', label: t('facial') },
                { key: 'eyebrows', label: t('eyebrows') },
                { key: 'makeup', label: t('makeup') }
              ].map(svc => (
                <span 
                  key={svc.key} 
                  onClick={() => router.push(`/search?category=${svc.label}`)}
                  className="inline-block px-4 py-1.5 mx-1 border border-white/20 bg-black/40 rounded-lg hover:bg-black/60 cursor-pointer backdrop-blur-md transition shadow-sm"
                >
                  {svc.label}
                </span>
              ))}
          </div>
        </div>
      </div>

      <main className="w-full max-w-[1240px] mx-auto py-16 px-6">
        
        {/* CATEGORIES */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h3 className="text-[32px] font-extrabold text-slate-900 tracking-tight">{t('chooseCategory')}</h3>
            <p className="text-slate-500 mt-2 font-medium max-w-lg mx-auto">{t('chooseCategorySub')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
            {[ 
              { title: t('hairService'), stat: '1,245', img: '1560066984-138dadb4c035' },
              { title: t('spaService'), stat: '284', img: '1544161515-4ab6ce6db874' },
              { title: t('beautyService'), stat: '434', img: '1487412947147-5cebf100ffc2' },
              { title: t('hairRemoval'), stat: '41', img: '1544161515-4ab6ce6db874' },
              { title: t('nailCare'), stat: '220', img: '1522337660859-02fbefca4702' },
              { title: t('barber'), stat: '29', img: '1585747860715-2ba37e788b70' }
            ].map((cat, i) => (
              <div 
                key={i} 
                onClick={() => router.push(`/search?category=${cat.title}`)}
                className="flex flex-col items-center cursor-pointer group"
              >
                  <div className="relative mb-5 p-1.5 rounded-full bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-[#ff5a5f] group-hover:to-[#ff9a9e] transition-all duration-500 shadow-sm group-hover:shadow-xl group-hover:shadow-[#ff5a5f]/20 group-hover:-translate-y-1">
                     <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-[4px] border-white overflow-hidden relative z-10">
                         <img 
                           src={`https://images.unsplash.com/photo-${cat.img}?q=80&w=250&fit=crop`} 
                           alt={cat.title} 
                           className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                           onError={(e) => {
                             const target = e.target as HTMLImageElement;
                             target.src = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=250&fit=crop";
                           }}
                         />
                     </div>
                     <div className="absolute inset-0 bg-white rounded-full scale-90 group-hover:scale-100 transition-transform duration-500 -z-10" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-[15px] group-hover:text-[#ff5a5f] transition-colors mb-0.5">{cat.title}</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{cat.stat} {t('places')}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED SERVICES */}
        <section className="mb-24 bg-gradient-to-br from-slate-50 to-white rounded-[40px] p-10 md:p-14 border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ff5a5f]/5 rounded-full blur-[120px] pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-end mb-12 relative z-10">
              <div className="text-left">
                 <h3 className="text-[32px] font-extrabold text-slate-900 tracking-tight mb-2">{t('featuredServicesTitle')}</h3>
                 <p className="text-slate-500 font-medium">{t('featuredServicesSub2')}</p>
              </div>
              <button 
                onClick={() => router.push('/search')}
                className="hidden md:flex font-bold text-slate-900 text-[14px] bg-white px-6 py-2.5 rounded-xl border border-slate-200 hover:border-[#ff5a5f]/30 hover:text-[#ff5a5f] shadow-sm transition-all duration-300 group items-center"
              >
                 {t('viewAllFeatured')} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {[
                { s: 'Corte de Cabello Premium', c: 'Luxe Hair Studio', p: '$45.00', r: '4.9', t: `45 ${t('min')}`, i: '1560066984-138dadb4c035', id: 1 },
                { s: 'Manicura Spa + Gel', c: 'Nail Society', p: '$30.00', r: '4.8', t: `60 ${t('min')}`, i: '1522337660859-02fbefca4702', id: 3 },
                { s: 'Masaje Tejido Profundo', c: 'Bliss Beauty Spa', p: '$65.00', r: '5.0', t: `90 ${t('min')}`, i: '1544161515-4ab6ce6db874', id: 2 },
                { s: 'Limpieza Facial Detox', c: 'Skin Care Clinic', p: '$50.00', r: '4.7', t: `60 ${t('min')}`, i: '1487412947147-5cebf100ffc2', id: 4 }
              ].map((serv, i) => (
                 <div 
                   key={i} 
                   onClick={() => router.push(`/venue/${serv.id}`)}
                   className="group cursor-pointer bg-white rounded-3xl p-4 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 border border-slate-100 transition-all duration-500 flex flex-col h-full transform hover:-translate-y-1.5"
                 >
                    <div className="relative h-44 rounded-2xl overflow-hidden mb-5 shadow-inner">
                       <img 
                         src={`https://images.unsplash.com/photo-${serv.i}?q=80&w=400&fit=crop`} 
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                         alt={serv.s} 
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&fit=crop";
                         }}
                       />
                       <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-black shadow-sm flex items-center">
                          <span className="text-amber-400 mr-1.5 text-xs">★</span>{serv.r}
                       </div>
                    </div>
                    <div className="flex justify-between items-start mb-2 flex-1 px-1">
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#ff5a5f] transition-colors line-clamp-2">{serv.s}</h4>
                    </div>
                    <div className="px-1 py-4 flex items-center justify-between border-t border-slate-50 mt-4">
                       <div className="flex flex-col">
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{serv.c}</span>
                          <span className="font-black text-slate-900 text-lg">{serv.p}</span>
                       </div>
                       <div className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {serv.t}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* BEST BUSINESSES */}
        <section className="text-center mb-16">
          <div className="flex flex-col items-center mb-10">
             <h3 className="text-[28px] font-extrabold text-slate-900 leading-tight mb-1">{t('bestNear')}</h3>
             <p className="text-slate-500 font-medium">{t('bestNearSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[18px] text-left mb-10">
            {[
              { n: 'Luxe Hair Studio', rat: '4.9', rts: `(120 ${t('reviews')})`, s: ['Corte', 'Color', 'Peinado', '+4 más'], p: '$45.00', id: 1 },
              { n: 'Bliss Beauty', rat: '4.8', rts: `(89 ${t('reviews')})`, s: ['Corte', 'Color', 'Peinado', '+4 más'], p: '$45.00', id: 2 },
              { n: 'Nail Society', rat: '4.7', rts: `(62 ${t('reviews')})`, s: ['Manicura', 'Pedicura', 'Relleno', '+2 más'], p: '$25.00', id: 3 },
              { n: 'Brow Studio', rat: '4.9', rts: `(194 ${t('reviews')})`, s: ['Corte', 'Hilo', 'Relleno', '+2 más'], p: '$32.75', id: 4 },
              { n: 'Brow Haus Panamá', rat: '4.9', rts: `(323 ${t('reviews')})`, s: ['Corte', 'Hilo', 'Alisado', '+2 más'], p: '$15.50', id: 5 }
            ].map((biz, i) => (
              <div 
                key={i} 
                onClick={() => router.push(`/venue/${biz.id}`)}
                className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition flex flex-col pt-1 pl-1 pr-1 pb-1"
              >
                <div className="relative h-[150px] rounded-[13px] overflow-hidden">
                  <img 
                    src={`https://images.unsplash.com/photo-${['1560066984-138dadb4c035','1522337660859-02fbefca4702','1487412947147-5cebf100ffc2','1585747860715-2ba37e788b70','1544161515-4ab6ce6db874'][i]}?q=80&w=600&fit=crop`} 
                    alt={biz.n} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&fit=crop";
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black text-white text-[10px] px-2.5 py-1 rounded-[6px] font-bold tracking-wide shadow-sm">{t('recommended')}</div>
                  <button className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center bg-white shadow-sm rounded-full hover:bg-slate-50"><svg className="w-3.5 h-3.5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button>
                </div>
                <div className="px-3 pt-4 pb-3 flex flex-col flex-1">
                  <h4 className="font-black text-[15px] text-slate-900 leading-tight mb-1">{biz.n}</h4>
                  <p className="text-[12px] text-slate-500 mb-2 font-medium">{t('beautySalon')}</p>
                  
                  <div className="flex items-center text-[11px] font-black text-slate-800 mb-3">
                    <span className="text-amber-400 mr-[3px] text-sm leading-none">★</span> 
                    <span className="leading-none pt-0.5">{biz.rat} <span className="text-slate-400 font-semibold ml-1 font-sans">{biz.rts}</span></span>
                  </div>
                  
                  <div className="flex items-center text-[10.5px] text-slate-500 mb-3.5 font-semibold">
                    <svg className="w-[14px] h-[14px] text-slate-400 mr-[4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Avenida Balboa <span className="ml-auto">• 0.5 km</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-[5px] mb-5 border-b border-slate-100 pb-5">
                     {biz.s.map(sTag => (
                        <span key={sTag} className="bg-slate-50 border border-slate-100/60 text-slate-600 px-[6px] py-[3px] rounded-[5px] text-[10px] font-black">{sTag}</span>
                     ))}
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-4">
                      <span className="flex flex-col xs:flex-row xs:items-center text-slate-500 font-semibold text-[10px] leading-tight max-w-[55%]">
                         <div className="flex items-center mb-0.5 xs:mb-0"><svg className="w-[14px] h-[14px] mr-1 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {t('nextAppt')}</div> 
                         {t('today')} 3:00 PM
                      </span>
                      <span className="font-black text-slate-900 text-[16px] tracking-tight">{biz.p}</span>
                    </div>
                    <button className="w-full py-[10px] bg-[#fd5b60] hover:bg-[#e64e52] text-white text-[13px] font-black rounded-[10px] transition tracking-wide shadow-sm">
                      {t('bookBtn')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => router.push('/search')}
            className="font-bold text-slate-900 text-[15px] hover:text-[#ff5a5f] transition inline-flex items-center group"
          >
            {t('viewAllBiz')} <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </section>

      </main>

      {/* HOW IT WORKS */}
      <section className="bg-[#fcfdfd] py-20 text-center border-t border-slate-100">
        <h3 className="text-[28px] font-extrabold text-slate-900 leading-tight">Cómo funciona REZERVAME</h3>
        <p className="text-slate-500 mt-2 mb-16 font-medium">Programa tu próxima experiencia de belleza en solo unos clics.</p>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start justify-center pt-4 relative px-4">
          <div className="absolute top-[32px] left-[15%] w-[70%] h-[1px] border-t-2 border-dashed border-slate-200 hidden md:block z-0"></div>
          {[
              { i: "1", t: "Descubre", s: "Conecta con los mejores espacios en belleza y bienestar cerca de ti.", ic: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
              { i: "2", t: "Reserva", s: "Elige tu servicio y reserva una cita al instante en línea.", ic: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { i: "3", t: "Confirma", s: "Realiza el pago y prepárate para tu momento de belleza.", ic: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { i: "4", t: "Disfruta", s: "Llega y disfruta tu servicio, sin complicaciones, sin esperas.", ic: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" }
          ].map(step => (
            <div key={step.i} className="flex-1 flex flex-col items-center relative z-10 px-4 mb-10 md:mb-0">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-xl relative shadow-md shadow-slate-100 border border-slate-50">
                  <svg className="w-7 h-7 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.ic} /></svg>
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-900 border-[3px] border-white rounded-full flex justify-center items-center text-white text-[10px] font-extrabold">{step.i}</div>
              </div>
              <h4 className="font-extrabold text-sm mb-2">{step.t}</h4>
              <p className="text-slate-500 text-xs font-medium max-w-[200px] leading-relaxed">{step.s}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
