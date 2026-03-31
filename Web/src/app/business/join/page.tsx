"use client";
import React, { useState } from "react";
import { 
  Building2, MapPin, Phone, Mail, 
  ChevronRight, ChevronLeft, Check, 
  Scissors, Camera, Plus, Star,
  ShieldCheck, ArrowRight, Sparkles
} from "lucide-react";
import { useI18n } from "../../../components/I18nProvider";
import { useBusinessStore } from "../../../store/businessStore";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4 | 5;

export default function BusinessJoinPage() {
  const { language } = useI18n();
  const router = useRouter();
  const loginBusiness = useBusinessStore((state) => state.login);
  const [isLoginMode, setIsLoginMode] = useState(true); // Default to login to resolve the redirect easily
  const [step, setStep] = useState<Step>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginBusiness();
    router.push('/business/dashboard');
  };

  const nextStep = () => setStep((prev) => (prev + 1) as Step);
  const prevStep = () => setStep((prev) => (prev - 1) as Step);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-slate-50 animate-in fade-in duration-700">
         <div className="bg-white max-w-2xl w-full rounded-[48px] p-16 text-center shadow-2xl shadow-slate-200 border border-slate-100 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-green-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-green-100">
               <Check size={48} strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight leading-tight">
               ¡Solicitud Enviada!
            </h1>
            <p className="text-slate-500 font-bold text-lg mb-12 leading-relaxed px-10">
               Gracias por unirte a REZERVAME. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo en las próximas 24-48 horas para activar tu cuenta de negocio.
            </p>
            <div className="bg-slate-50 rounded-[32px] p-8 mb-12 border border-slate-100">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">PRÓXIMOS PASOS</h4>
               <ul className="text-left space-y-4">
                  <li className="flex items-center gap-4 text-slate-700 font-bold text-sm">
                     <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs ml-0">1</span>
                     Verificación de documentos legales.
                  </li>
                  <li className="flex items-center gap-4 text-slate-700 font-bold text-sm">
                     <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs ml-0">2</span>
                     Llamada de bienvenida y configuración de perfil.
                  </li>
                  <li className="flex items-center gap-4 text-slate-700 font-bold text-sm">
                     <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs ml-0">3</span>
                     Activación del panel de administración.
                  </li>
               </ul>
            </div>
            <a href="/" className="inline-block bg-[#ff5a5f] text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-[#e0484d] transition-all transform hover:-translate-y-1 shadow-2xl shadow-[#ff5a5f]/30">
               Volver al inicio
            </a>
         </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-slate-50 py-12 px-6 lg:p-20 relative overflow-hidden animate-in fade-in duration-700">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gradient-to-br from-[#ff5a5f]/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-gradient-to-tr from-slate-200/50 to-transparent rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 relative z-10 w-full">
        
        {isLoginMode ? (
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-xl shadow-slate-200/40 relative">
              <div className="text-center mb-10">
                <span className="bg-[#ff5a5f] text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 inline-block shadow-lg shadow-[#ff5a5f]/20">Business Login</span>
                <h1 className="text-4xl font-black text-slate-900 mt-2 uppercase tracking-tight leading-tight">
                  Welcome Back
                </h1>
                <p className="text-slate-400 font-bold mt-4">Manage your appointments and customers.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Email</label>
                   <div className="relative">
                     <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                     <input type="email" placeholder="admin@business.com" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Password</label>
                   <div className="relative">
                     <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                     <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                   </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-[#ff5a5f] transition-all transform hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3">
                   Login
                </button>
              </form>
              <div className="mt-8 text-center">
                 <button onClick={() => setIsLoginMode(false)} className="text-sm font-bold text-slate-500 hover:text-[#ff5a5f] transition-colors">
                   Don't have an account? Register your business
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Sidebar / Progress */}
        <aside className="w-full lg:w-[380px] shrink-0">
           <div className="mb-12">
             <span className="bg-[#ff5a5f] text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 inline-block shadow-lg shadow-[#ff5a5f]/20">Business Portal</span>
             <h1 className="text-4xl font-black text-slate-900 mt-2 uppercase tracking-tight leading-tight">
               Haz crecer tu negocio con <span className="text-[#ff5a5f]">REZERVAME</span>
             </h1>
             <p className="text-slate-400 font-bold text-lg mt-6 leading-relaxed mb-4">
               Únete a la plataforma líder de reservas y gestiona tus clientes de forma profesional.
             </p>
             <button onClick={() => setIsLoginMode(true)} className="text-[#ff5a5f] font-bold text-sm uppercase tracking-widest hover:text-slate-900 transition-colors">
               Already have an account? Login
             </button>
           </div>

           <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-xl shadow-slate-200/40 relative">
              <div className="space-y-4">
                 {[
                   { step: 1, title: 'Identificación', desc: 'Nombre y categoría' },
                   { step: 2, title: 'Contacto', desc: 'Dueño y comunicación' },
                   { step: 3, title: 'Ubicación', desc: 'Dirección de tu local' },
                   { step: 4, title: 'Servicios', desc: 'Tus especialidades' },
                   { step: 5, title: 'Finalizar', desc: 'Revisión y envío' }
                 ].map((s) => (
                   <div key={s.step} className={`flex items-start gap-5 p-4 rounded-2xl transition-all duration-500 ${step === s.step ? 'bg-[#ff5a5f] text-white shadow-lg shadow-[#ff5a5f]/20' : step > s.step ? 'bg-green-50 border border-green-100' : 'opacity-50'}`}>
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${step === s.step ? 'bg-white text-[#ff5a5f]' : step > s.step ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                         {step > s.step ? <Check size={16} strokeWidth={3} /> : s.step}
                      </div>
                      <div className="mt-0.5">
                         <h4 className="font-black text-sm uppercase tracking-widest">{s.title}</h4>
                         <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-tighter ${step === s.step ? 'text-white/80' : 'text-slate-400'}`}>{s.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="mt-12 flex items-center gap-6 p-8 bg-slate-900 rounded-[32px] text-white shadow-2xl shadow-slate-900/20">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                 <ShieldCheck className="text-white" size={24} />
              </div>
              <div>
                 <p className="text-xs font-black uppercase tracking-widest opacity-60">Soporte 24/7</p>
                 <p className="text-sm font-bold mt-1">Estamos contigo en cada paso del registro.</p>
              </div>
           </div>
        </aside>

        {/* Form Content Area */}
        <div className="flex-1">
           <div className="bg-white rounded-[48px] p-12 border border-slate-200 shadow-2xl shadow-slate-200/50 min-h-[600px] flex flex-col">
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                
                {/* STEP 1: Identification */}
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
                     <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">Identificación</h2>
                     <p className="text-slate-400 font-bold mb-12">Cuéntanos sobre tu negocio.</p>
                     
                     <div className="space-y-10">
                        <div className="space-y-3">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Nombre Comercial</label>
                           <div className="relative">
                             <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                             <input type="text" placeholder="Ej: REZERVAME Beauty" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white focus:shadow-xl focus:shadow-[#ff5a5f]/5" required />
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Categoría Principal</label>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {['Barbería', 'Peluquería', 'Manicura', 'Masaje', 'Facial', 'Spa'].map((cat) => (
                                <button type="button" key={cat} className="p-6 rounded-[28px] border-2 border-slate-50 bg-slate-50/50 hover:bg-white hover:border-[#ff5a5f] hover:text-[#ff5a5f] hover:shadow-xl hover:shadow-[#ff5a5f]/5 transition-all text-sm font-black text-slate-500 uppercase tracking-widest text-center">
                                   {cat}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* STEP 2: Contact */}
                {step === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
                     <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">Contacto</h2>
                     <p className="text-slate-400 font-bold mb-12">¿Cómo podemos comunicarnos contigo?</p>
                     
                     <div className="space-y-10">
                        <div className="space-y-3">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Nombre del Dueño / Gerente</label>
                           <input type="text" placeholder="Ej: Richard Lucas" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white focus:shadow-xl focus:shadow-[#ff5a5f]/5" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Teléfono de Negocio</label>
                              <div className="relative">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                <input type="tel" placeholder="+507 0000-0000" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Correo Electrónico</label>
                              <div className="relative">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                <input type="email" placeholder="hola@tunegocio.com" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* STEP 3: Location */}
                {step === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
                     <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">Ubicación</h2>
                     <p className="text-slate-400 font-bold mb-12">¿Dónde está ubicado tu negocio?</p>
                     
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Dirección Física</label>
                           <div className="relative">
                              <MapPin className="absolute left-6 top-6 text-[#ff5a5f]" size={20} />
                              <textarea placeholder="Calle, Edificio, Local..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 h-32 focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all" required></textarea>
                           </div>
                        </div>

                        <div className="h-64 bg-slate-100 rounded-[32px] overflow-hidden border-2 border-white shadow-inner relative flex items-center justify-center group outline outline-4 outline-slate-100/50">
                           <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1000&fit=crop)'}}></div>
                           <div className="relative bg-white/90 backdrop-blur-md p-6 rounded-[28px] shadow-2xl border border-white flex flex-col items-center gap-4 group-hover:scale-105 transition-all">
                              <div className="w-12 h-12 bg-[#ff5a5f] rounded-full flex items-center justify-center text-white shadow-lg">
                                 <MapPin size={24} />
                              </div>
                              <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Ubicar en el mapa</span>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* STEP 4: Services */}
                {step === 4 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
                     <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">Tus Servicios</h2>
                     <p className="text-slate-400 font-bold mb-12">Agrega al menos un servicio para comenzar.</p>
                     
                     <div className="space-y-6">
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-10 flex flex-col items-center justify-center group hover:border-[#ff5a5f] hover:bg-[#ff5a5f]/5 transition-all cursor-pointer">
                           <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-400 group-hover:bg-[#ff5a5f] group-hover:text-white transition-all transform group-hover:rotate-12">
                              <Plus size={32} strokeWidth={3} />
                           </div>
                           <p className="mt-6 text-sm font-black text-slate-800 uppercase tracking-widest">Crear Nuevo Servicio</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-6 flex justify-between items-center group">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#ff5a5f] shadow-sm">
                                 <Scissors size={24} />
                              </div>
                              <div>
                                 <h4 className="font-black text-slate-800">Corte Clásico</h4>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">30 MIN • $25.00</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button type="button" className="p-3 text-slate-300 hover:text-slate-600 transition"><Camera size={18} /></button>
                              <button type="button" className="p-3 text-slate-300 hover:text-red-500 transition">✕</button>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* STEP 5: Final Review */}
                {step === 5 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
                     <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">Revisión Final</h2>
                     <p className="text-slate-400 font-bold mb-12">Verifica que todo esté correcto.</p>
                     
                     <div className="bg-slate-50/50 border border-slate-100 rounded-[40px] p-10 space-y-8 shadow-inner">
                        <div className="flex justify-between items-start pb-8 border-b border-white">
                           <div>
                              <h4 className="text-2xl font-black text-slate-800">REZERVAME Studio</h4>
                              <p className="text-sm font-bold text-[#ff5a5f] uppercase tracking-widest mt-1">Negocio de Estética</p>
                           </div>
                           <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest border-2 border-slate-200 px-4 py-2 rounded-xl transition-all">Editar</button>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dueño</p>
                              <p className="font-bold text-slate-700 mt-1">Richard Lucas</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                              <p className="font-bold text-slate-700 mt-1">+507 6899-0012</p>
                           </div>
                        </div>

                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                           <p className="font-bold text-slate-700 mt-1 leading-relaxed">Ave. Balboa, Edificio Soho Mall, Local 12-A, Ciudad de Panamá.</p>
                        </div>

                        <label className="flex items-center gap-4 cursor-pointer pt-6">
                           <input type="checkbox" required className="w-6 h-6 rounded-lg border-2 border-slate-200 text-[#ff5a5f] focus:ring-[#ff5a5f]" />
                           <span className="text-xs font-bold text-slate-500 leading-relaxed">Acepto los <a href="/terms" className="text-slate-900 underline">Términos y Condiciones</a> y la <a href="/privacy" className="text-slate-900 underline">Política de Privacidad</a> de REZERVAME.</span>
                        </label>
                     </div>
                  </div>
                )}

                {/* NAVIGATION BUTTONS */}
                <div className="flex justify-between items-center mt-12 pt-10 border-t border-slate-50">
                  {step > 1 ? (
                    <button type="button" onClick={prevStep} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-800 transition-all">
                      <ChevronLeft size={20} strokeWidth={3} /> Anterior
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 5 ? (
                    <button type="button" onClick={nextStep} className="bg-slate-900 text-white px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#ff5a5f] transition-all transform hover:-translate-y-1 shadow-2xl flex items-center gap-3">
                      Continuar <ChevronRight size={18} strokeWidth={3} />
                    </button>
                  ) : (
                    <button type="submit" className="bg-[#ff5a5f] text-white px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#e0484d] transition-all transform hover:-translate-y-1 shadow-2xl shadow-[#ff5a5f]/30 flex items-center gap-3 animate-pulse">
                      ¡UNIRME COMPLETAMENTE! <ArrowRight size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>

              </form>
           </div>
        </div>
          </>
        )}

      </div>
    </main>
  );
}
