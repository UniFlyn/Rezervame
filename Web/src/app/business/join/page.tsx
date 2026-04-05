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
      <main className="min-h-screen flex items-center justify-center p-6 lg:p-10 bg-slate-50/50 animate-in fade-in duration-700">
         <div className="bg-white max-w-2xl w-full rounded-[48px] p-12 lg:p-20 text-center shadow-2xl shadow-slate-200 border border-slate-100 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-green-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-green-100">
               <Check size={48} strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight leading-tight">
               ¡Solicitud Enviada!
            </h1>
            <p className="text-slate-500 font-bold text-lg mb-12 leading-relaxed px-4 lg:px-10">
               Gracias por unirte a REZERVAME. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo en las próximas 24-48 horas para activar tu cuenta de negocio.
            </p>
            <div className="bg-slate-50 rounded-[32px] p-8 mb-12 border border-slate-100 max-w-md mx-auto">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">PRÓXIMOS PASOS</h4>
               <ul className="text-left space-y-5">
                  <li className="flex items-center gap-4 text-slate-700 font-bold text-sm">
                     <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">1</span>
                     Verificación de documentos legales.
                  </li>
                  <li className="flex items-center gap-4 text-slate-700 font-bold text-sm">
                     <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">2</span>
                     Llamada de bienvenida y configuración de perfil.
                  </li>
                  <li className="flex items-center gap-4 text-slate-700 font-bold text-sm">
                     <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">3</span>
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
    <main className="min-h-screen bg-slate-50/30 py-12 px-6 lg:p-20 flex items-center justify-center relative overflow-hidden animate-in fade-in duration-700">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gradient-to-br from-[#ff5a5f]/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-gradient-to-tr from-slate-200/50 to-transparent rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 relative z-10 w-full items-stretch">
        
        {isLoginMode ? (
          <div className="w-full flex items-center justify-center animate-in zoom-in-95 duration-500">
            <div className="bg-white w-full max-w-md rounded-[48px] p-10 lg:p-14 border border-slate-200 shadow-2xl shadow-slate-200/60 relative">
              <div className="text-center mb-10">
                <span className="bg-[#ff5a5f] text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 inline-block shadow-lg shadow-[#ff5a5f]/20">Business Login</span>
                <h1 className="text-4xl font-black text-slate-900 mt-2 uppercase tracking-tight leading-tight">
                  Welcome Back
                </h1>
                <p className="text-slate-400 font-bold mt-4">Manage your appointments<br/>and customers.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Email address</label>
                   <div className="relative">
                     <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                     <input type="email" placeholder="admin@business.com" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Password</label>
                   <div className="relative">
                     <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                     <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                   </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white px-12 py-5 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-[#ff5a5f] transition-all transform hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3 mt-4">
                   Login to panel
                </button>
              </form>
              <div className="mt-10 text-center border-t border-slate-50 pt-8">
                 <button onClick={() => setIsLoginMode(false)} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-[#ff5a5f] transition-colors">
                   Don't have an account? <span className="text-[#ff5a5f] underline underline-offset-4 ml-1">Register Now</span>
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar / Progress */}
            <aside className="w-full lg:w-[400px] shrink-0 flex flex-col justify-center">
               <div className="mb-12">
                 <span className="bg-[#ff5a5f] text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 inline-block shadow-lg shadow-[#ff5a5f]/20">Business Portal</span>
                 <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mt-2 uppercase tracking-tight leading-tight">
                   Haz crecer tu negocio con <span className="text-[#ff5a5f]">REZERVAME</span>
                 </h1>
                 <p className="text-slate-400 font-bold text-lg mt-8 leading-relaxed mb-10 max-w-md">
                   Únete a la plataforma líder de reservas y gestiona tus clientes de forma profesional.
                 </p>
                 <button onClick={() => setIsLoginMode(true)} className="flex items-center gap-2 text-[#ff5a5f] font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors group">
                   Already have an account? <span className="underline underline-offset-4 ml-1 group-hover:no-underline font-black">Login</span>
                   <ChevronRight size={14} strokeWidth={3} />
                 </button>
               </div>

               <div className="bg-white rounded-[40px] p-8 lg:p-10 border border-slate-200 shadow-xl shadow-slate-200/40 relative">
                  <div className="space-y-4">
                     {[
                       { step: 1, title: 'Identificación', desc: 'Nombre y categoría' },
                       { step: 2, title: 'Contacto', desc: 'Dueño y comunicación' },
                       { step: 3, title: 'Ubicación', desc: 'Dirección de tu local' },
                       { step: 4, title: 'Servicios', desc: 'Tus especialidades' },
                       { step: 5, title: 'Finalizar', desc: 'Revisión y envío' }
                     ].map((s) => (
                       <div key={s.step} className={`flex items-center gap-5 p-4 rounded-[24px] transition-all duration-500 ${step === s.step ? 'bg-[#ff5a5f] text-white shadow-xl shadow-[#ff5a5f]/20 scale-[1.02]' : step > s.step ? 'bg-green-50 border border-green-100' : 'opacity-40'}`}>
                          <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${step === s.step ? 'bg-white text-[#ff5a5f]' : step > s.step ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             {step > s.step ? <Check size={16} strokeWidth={3} /> : s.step}
                          </div>
                          <div>
                             <h4 className="font-black text-[11px] uppercase tracking-widest">{s.title}</h4>
                             <p className={`text-[9px] font-bold mt-0.5 uppercase tracking-tighter opacity-70 ${step === s.step ? 'text-white' : 'text-slate-400'}`}>{s.desc}</p>
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
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Soporte 24/7</p>
                     <p className="text-sm font-bold mt-1">Estamos contigo en cada paso del registro.</p>
                  </div>
               </div>
            </aside>

            {/* Form Content Area */}
            <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-10 duration-700">
               <div className="bg-white rounded-[56px] p-10 lg:p-16 border border-slate-200 shadow-2xl shadow-slate-200/50 min-h-[650px] flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5a5f]/5 rounded-bl-[100px]"></div>
                  
                  <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative z-10">
                    
                    {/* STEP 1: Identification */}
                    {step === 1 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                         <div className="mb-12">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">Identificación</h2>
                            <p className="text-slate-400 font-bold text-lg">Cuéntanos sobre tu negocio.</p>
                         </div>
                         
                         <div className="space-y-12">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre Comercial</label>
                               <div className="relative group">
                                 <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                 <input type="text" placeholder="Ej: REZERVAME Beauty" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white focus:shadow-xl focus:shadow-[#ff5a5f]/5 placeholder:text-slate-300" required />
                               </div>
                            </div>

                            <div className="space-y-6">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Categoría Principal</label>
                               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {['Barbería', 'Peluquería', 'Manicura', 'Masaje', 'Facial', 'Spa'].map((cat) => (
                                    <button type="button" key={cat} className="p-6 rounded-[28px] border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#ff5a5f] hover:text-[#ff5a5f] hover:shadow-xl hover:shadow-[#ff5a5f]/5 transition-all text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] text-center">
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
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                         <div className="mb-12">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">Contacto</h2>
                            <p className="text-slate-400 font-bold text-lg">¿Cómo podemos comunicarnos contigo?</p>
                         </div>
                         
                         <div className="space-y-12">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre del Dueño / Gerente</label>
                               <input type="text" placeholder="Ej: Richard Lucas" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white focus:shadow-xl focus:shadow-[#ff5a5f]/5" required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Teléfono de Negocio</label>
                                  <div className="relative">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                    <input type="tel" placeholder="+507 0000-0000" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Correo Electrónico</label>
                                  <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                    <input type="email" placeholder="hola@tunegocio.com" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* STEP 3: Location */}
                    {step === 3 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                         <div className="mb-12">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">Ubicación</h2>
                            <p className="text-slate-400 font-bold text-lg">¿Dónde está ubicado tu negocio?</p>
                         </div>
                         
                         <div className="space-y-10">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Dirección Física</label>
                               <div className="relative">
                                  <MapPin className="absolute left-6 top-7 text-[#ff5a5f]" size={20} />
                                  <textarea placeholder="Calle, Edificio, Local..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 h-32 focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all resize-none" required></textarea>
                               </div>
                            </div>

                            <div className="h-64 bg-slate-100 rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-inner relative flex items-center justify-center group outline outline-8 outline-slate-100/50">
                               <div className="absolute inset-0 bg-cover bg-center opacity-40 grayscale" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1000&fit=crop)'}}></div>
                               <div className="relative bg-white/95 backdrop-blur-md px-10 py-6 rounded-[32px] shadow-2xl border border-white flex flex-col items-center gap-4 group-hover:scale-105 transition-all cursor-pointer">
                                  <div className="w-14 h-14 bg-[#ff5a5f] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#ff5a5f]/20">
                                     <MapPin size={28} />
                                  </div>
                                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Ubicar en el mapa</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* STEP 4: Services */}
                    {step === 4 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                         <div className="mb-12">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">Tus Servicios</h2>
                            <p className="text-slate-400 font-bold text-lg">Agrega tus servicios principales.</p>
                         </div>
                         
                         <div className="space-y-6">
                            <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] p-12 flex flex-col items-center justify-center group hover:border-[#ff5a5f] hover:bg-[#ff5a5f]/5 transition-all cursor-pointer">
                               <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center text-[#ff5a5f] shadow-xl group-hover:bg-[#ff5a5f] group-hover:text-white transition-all transform group-hover:rotate-12 duration-500">
                                  <Plus size={40} strokeWidth={3} />
                               </div>
                               <p className="mt-8 text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Crear Nuevo Servicio</p>
                            </div>

                            <div className="bg-white border-2 border-slate-50 rounded-[32px] p-6 flex justify-between items-center group hover:border-slate-100 transition-all shadow-sm">
                               <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#ff5a5f] shadow-inner">
                                     <Scissors size={28} />
                                  </div>
                                  <div>
                                     <h4 className="font-black text-lg text-slate-900">Corte Clásico</h4>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">30 MIN • $25.00</p>
                                  </div>
                               </div>
                               <div className="flex gap-4">
                                  <button type="button" className="p-4 text-slate-300 hover:text-slate-900 bg-slate-50 rounded-2xl transition-all"><Camera size={18} /></button>
                                  <button type="button" className="p-4 text-slate-300 hover:text-red-500 bg-slate-50 rounded-2xl transition-all">✕</button>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* STEP 5: Final Review */}
                    {step === 5 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                         <div className="mb-12">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">Revisión Final</h2>
                            <p className="text-slate-400 font-bold text-lg">Verifica que todo esté correcto.</p>
                         </div>
                         
                         <div className="bg-slate-50/50 border border-slate-100 rounded-[48px] p-10 lg:p-14 space-y-10 shadow-inner">
                            <div className="flex justify-between items-start pb-10 border-b border-white">
                               <div>
                                  <h4 className="text-3xl font-black text-slate-900">REZERVAME Studio</h4>
                                  <p className="text-xs font-black text-[#ff5a5f] uppercase tracking-[0.2em] mt-2">Negocio de Estética</p>
                               </div>
                               <button type="button" onClick={() => setStep(1)} className="text-[9px] font-black text-slate-400 hover:text-white hover:bg-slate-900 uppercase tracking-[0.2em] border-2 border-slate-200 px-6 py-3 rounded-2xl transition-all">Editar</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Dueño / Gerente</p>
                                  <p className="text-lg font-bold text-slate-800">Richard Lucas</p>
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Contacto Directo</p>
                                  <p className="text-lg font-bold text-slate-800">+507 6899-0012</p>
                               </div>
                            </div>

                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Dirección del Local</p>
                               <p className="text-lg font-bold text-slate-800 leading-relaxed">Ave. Balboa, Edificio Soho Mall, Local 12-A, Ciudad de Panamá.</p>
                            </div>

                            <label className="flex items-start gap-5 cursor-pointer pt-6 group">
                               <input type="checkbox" required className="w-7 h-7 rounded-lg border-2 border-slate-200 text-[#ff5a5f] focus:ring-[#ff5a5f] mt-1 shrink-0" />
                               <span className="text-sm font-bold text-slate-500 leading-relaxed group-hover:text-slate-800 transition-colors">
                                 Acepto los <a href="/terms" className="text-slate-900 underline underline-offset-4 font-black">Términos y Condiciones</a> y la <a href="/privacy" className="text-slate-900 underline underline-offset-4 font-black">Política de Privacidad</a> de REZERVAME.
                               </span>
                            </label>
                         </div>
                      </div>
                    )}

                    {/* NAVIGATION BUTTONS */}
                    <div className="flex justify-between items-center mt-12 pt-12 border-t border-slate-50">
                      {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-3 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-slate-900 transition-all group">
                          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} strokeWidth={3} /> Anterior
                        </button>
                      ) : (
                        <div />
                      )}

                      {step < 5 ? (
                        <button type="button" onClick={nextStep} className="bg-slate-900 text-white px-14 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#ff5a5f] transition-all transform hover:-translate-y-1 shadow-2xl flex items-center gap-3">
                          Continuar <ChevronRight size={20} strokeWidth={3} />
                        </button>
                      ) : (
                        <button type="submit" className="bg-[#ff5a5f] text-white px-14 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#e0484d] transition-all transform hover:-translate-y-1 shadow-2xl shadow-[#ff5a5f]/40 flex items-center gap-3 animate-pulse">
                          ¡UNIRME COMPLETAMENTE! <ArrowRight size={20} strokeWidth={3} />
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
