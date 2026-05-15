"use client";
import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, MapPin, Phone, Mail, 
  ChevronRight, ChevronLeft, Check, 
  Scissors, Camera, Plus, Star,
  ShieldCheck, ArrowRight, Sparkles
} from "lucide-react";
import { useI18n } from "../../../components/I18nProvider";
import { useBusinessStore } from "../../../store/businessStore";
import { useRouter } from "next/navigation";
import { fetchPublicCategories, type PublicCategory } from "@/lib/venueSearch";
import { apiPost } from "@/lib/api";
import { toastError, toastWarning } from "@/lib/toast";

type Step = 1 | 2 | 3 | 4 | 5;
type CategoryOption = { key: string; label: string; imageUrl?: string | null };
type ServiceDraft = {
  id: string;
  name: string;
  duration: string;
  price: string;
  category: string;
  imagePreviewUrl?: string;
};

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

export default function BusinessJoinPage() {
  const { language } = useI18n();
  const router = useRouter();
  const loginBusiness = useBusinessStore((state) => state.login);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [stepError, setStepError] = useState<string>("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [address, setAddress] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<PublicCategory[]>([]);
  const [locationMessage, setLocationMessage] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [services, setServices] = useState<ServiceDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [idDocumentImage, setIdDocumentImage] = useState("");
  const [licenseDocumentImage, setLicenseDocumentImage] = useState("");
  const [insuranceDocumentImage, setInsuranceDocumentImage] = useState("");

  const tx = language === "es"
    ? {
        successTitle: "¡Solicitud Enviada!",
        successDesc:
          "Gracias por unirte a REZERVAME. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo en las próximas 24-48 horas para activar tu cuenta de negocio.",
        nextSteps: "PRÓXIMOS PASOS",
        backHome: "Volver al inicio",
        heroTitle: "Haz crecer tu negocio con",
        heroSub: "Únete a la plataforma líder de reservas y gestiona tus clientes de forma profesional.",
        supportTag: "Soporte 24/7",
        supportDesc: "Estamos contigo en cada paso del registro.",
        alreadyHave: "Already have an account?",
        login: "Login",
        step1Title: "Identificación",
        step1Sub: "Cuéntanos sobre tu negocio.",
        businessName: "Nombre Comercial",
        businessNamePh: "Ej: REZERVAME Beauty",
        taxIdLabel: "Tax ID",
        taxIdPh: "Ej: RUC / NIT / EIN",
        mainCategory: "Categoría Principal",
        step2Title: "Contacto",
        step2Sub: "¿Cómo podemos comunicarnos contigo?",
        ownerLabel: "Nombre del Dueño / Gerente",
        ownerPh: "Ej: Richard Lucas",
        phoneLabel: "Teléfono de Negocio",
        phonePh: "+507 0000-0000",
        emailLabel: "Correo Electrónico",
        emailPh: "hola@tunegocio.com",
        step3Title: "Ubicación",
        step3Sub: "¿Dónde está ubicado tu negocio?",
        addressLabel: "Dirección Física",
        addressPh: "Calle, Edificio, Local...",
        locateMap: "Ubicar en el mapa",
        locating: "Ubicando...",
        step4Title: "Tus Servicios",
        step4Sub: "Agrega tus servicios principales.",
        createService: "Crear Nuevo Servicio",
        sampleService: "Corte Clásico",
        serviceNameLabel: "Nombre del servicio",
        serviceDurationLabel: "Duración (min)",
        servicePriceLabel: "Precio",
        serviceImageLabel: "Imagen",
        step5Title: "Revisión Final",
        step5Sub: "Verifica que todo esté correcto.",
        bizType: "Negocio de Estética",
        ownerReview: "Dueño / Gerente",
        contactReview: "Contacto Directo",
        addressReview: "Dirección del Local",
        termsPrefix: "Acepto los",
        terms: "Términos y Condiciones",
        and: "y la",
        privacy: "Política de Privacidad",
        previous: "Anterior",
        continue: "Continuar",
        submit: "¡UNIRME COMPLETAMENTE!",
        valStep1: "Completa el nombre del negocio, categorías y los 3 documentos requeridos.",
        docsLabel: "Documentos Legales",
        idDoc: "Copia de identificación",
        licenseDoc: "Copia de licencia",
        insuranceDoc: "Copia de seguro",
        uploadFile: "Subir imagen",
        valStep2: "Completa dueño, teléfono y correo electrónico válido.",
        valStep3: "Completa la dirección del negocio.",
        valStep4: "Agrega al menos un servicio válido.",
        valStep5: "Debes aceptar términos y privacidad para continuar.",
      }
    : {
        successTitle: "Request Submitted!",
        successDesc:
          "Thanks for joining REZERVAME. Our team will review your request and contact you in the next 24-48 hours to activate your business account.",
        nextSteps: "NEXT STEPS",
        backHome: "Back to home",
        heroTitle: "Grow your business with",
        heroSub: "Join the leading booking platform and manage your clients professionally.",
        supportTag: "24/7 SUPPORT",
        supportDesc: "We're with you at every registration step.",
        alreadyHave: "Already have an account?",
        login: "Login",
        step1Title: "Identification",
        step1Sub: "Tell us about your business.",
        businessName: "Business Name",
        businessNamePh: "e.g. REZERVAME Beauty",
        taxIdLabel: "Tax ID",
        taxIdPh: "e.g. RUC / NIT / EIN",
        mainCategory: "Main Category",
        step2Title: "Contact",
        step2Sub: "How can we reach you?",
        ownerLabel: "Owner / Manager Name",
        ownerPh: "e.g. Richard Lucas",
        phoneLabel: "Business Phone",
        phonePh: "+507 0000-0000",
        emailLabel: "Email Address",
        emailPh: "hello@yourbusiness.com",
        step3Title: "Location",
        step3Sub: "Where is your business located?",
        addressLabel: "Business Address",
        addressPh: "Street, building, unit...",
        locateMap: "Pin on map",
        locating: "Locating...",
        step4Title: "Your Services",
        step4Sub: "Add your core services.",
        createService: "Create New Service",
        sampleService: "Classic Haircut",
        serviceNameLabel: "Service name",
        serviceDurationLabel: "Duration (min)",
        servicePriceLabel: "Price",
        serviceImageLabel: "Image",
        step5Title: "Final Review",
        step5Sub: "Confirm everything is correct.",
        bizType: "Beauty business",
        ownerReview: "Owner / Manager",
        contactReview: "Direct Contact",
        addressReview: "Business Address",
        termsPrefix: "I accept REZERVAME",
        terms: "Terms and Conditions",
        and: "and",
        privacy: "Privacy Policy",
        previous: "Previous",
        continue: "Continue",
        submit: "COMPLETE REGISTRATION!",
        valStep1: "Fill business name, categories, and all 3 required documents.",
        docsLabel: "Legal Documents",
        idDoc: "ID copy",
        licenseDoc: "License copy",
        insuranceDoc: "Insurance copy",
        uploadFile: "Upload image",
        valStep2: "Fill owner, phone, and valid email.",
        valStep3: "Fill business address.",
        valStep4: "Add at least one valid service.",
        valStep5: "Accept terms and privacy to continue.",
      };

  const categoryOptions: CategoryOption[] = useMemo(
    () =>
      availableCategories.map((c) => ({
        key: c.key,
        label: language === "es" ? c.labelEs : c.labelEn,
        imageUrl: c.imageUrl || "",
      })),
    [availableCategories, language],
  );

  useEffect(() => {
    void fetchPublicCategories()
      .then((rows) => {
        setAvailableCategories(rows.filter((r) => r.active));
      })
      .catch(() => {
        setAvailableCategories([]);
        toastWarning(
          "Categories unavailable",
          "We could not load service categories. You can still continue if categories appear later.",
        );
      });
  }, []);

  useEffect(() => {
    if (step !== 3 || address.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      // Autocomplete disabled in static export to avoid local API routes.
      setAddressSuggestions([]);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [address, step]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    void loginBusiness(email, password).then((ok) => {
      if (ok) router.push("/business/dashboard");
      else toastError("Sign-in failed", "Check your email, password, and that this account is a business.");
    });
  };

  const nextStep = () => {
    if (step === 1) {
      if (
        !businessName.trim() ||
        !taxId.trim() ||
        selectedCategories.length === 0 ||
        !idDocumentImage ||
        !licenseDocumentImage ||
        !insuranceDocumentImage
      ) {
        setStepError(tx.valStep1);
        toastWarning("Validation", tx.valStep1);
        return;
      }
    }
    if (step === 2) {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail.trim());
      if (!ownerName.trim() || !businessPhone.trim() || !validEmail) {
        setStepError(tx.valStep2);
        toastWarning("Validation", tx.valStep2);
        return;
      }
    }
    if (step === 3 && !address.trim()) {
      setStepError(tx.valStep3);
      toastWarning("Validation", tx.valStep3);
      return;
    }
    if (step === 4) {
      const hasValid = services.some(
        (s) =>
          s.name.trim() &&
          Number(s.duration) > 0 &&
          Number.isFinite(Number(s.price)) &&
          Number(s.price) >= 0,
      );
      if (!hasValid) {
        setStepError(tx.valStep4);
        toastWarning("Validation", tx.valStep4);
        return;
      }
    }
    setStepError("");
    setStep((prev) => (prev + 1) as Step);
  };
  const prevStep = () => setStep((prev) => (prev - 1) as Step);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setStepError(tx.valStep5);
      toastWarning("Validation", tx.valStep5);
      return;
    }
    setStepError("");
    setIsSubmitting(true);
    void apiPost<{ id: string; status: string }>(
      "/public/business-join",
      {
        name: businessName,
        taxId: taxId.trim(),
        owner: ownerName,
        email: businessEmail,
        phone: businessPhone,
        address,
        categories: selectedCategories,
        idDocumentImage,
        licenseDocumentImage,
        insuranceDocumentImage,
        services: services
          .filter((s) => s.name.trim() && Number(s.duration) > 0)
          .map((s) => ({
            name: s.name.trim(),
            duration: Number(s.duration),
            price: Number(s.price),
            category: s.category || selectedCategories[0] || "hairService",
          })),
      },
    )
      .then(() => setIsSubmitted(true))
      .catch(() => {
        const msg = "Could not submit registration. Please check all fields and try again.";
        setStepError(msg);
        toastError("Registration failed", msg);
      })
      .finally(() => setIsSubmitting(false));
  };

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const pickLocation = () => {
    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported in this browser.";
      setLocationMessage(msg);
      toastWarning("Location", msg);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setAddress((prev) => prev || `${lat}, ${lng}`);
        setLocationMessage(`${lat}, ${lng}`);
        setIsLocating(false);
      },
      () => {
        const msg = "Location access denied or unavailable.";
        setLocationMessage(msg);
        toastWarning("Location", msg);
        setIsLocating(false);
      },
    );
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        duration: "30",
        price: "0",
        category: selectedCategories[0] || "hairService",
        imagePreviewUrl: "",
      },
    ]);
  };

  const updateService = (id: string, patch: Partial<ServiceDraft>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 lg:p-10 bg-slate-50/50 animate-in fade-in duration-700">
         <div className="bg-white max-w-2xl w-full rounded-[48px] p-12 lg:p-20 text-center shadow-2xl shadow-slate-200 border border-slate-100 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-green-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-green-100">
               <Check size={48} strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight leading-tight">
               {tx.successTitle}
            </h1>
            <p className="text-slate-500 font-bold text-lg mb-12 leading-relaxed px-4 lg:px-10">
               {tx.successDesc}
            </p>
            <div className="bg-slate-50 rounded-[32px] p-8 mb-12 border border-slate-100 max-w-md mx-auto">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{tx.nextSteps}</h4>
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
               {tx.backHome}
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
                     <input name="email" type="email" placeholder="admin@business.com" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2">Password</label>
                   <div className="relative">
                     <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                     <input name="password" type="password" placeholder="••••••••" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
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
                   {tx.heroTitle} <span className="text-[#ff5a5f]">REZERVAME</span>
                 </h1>
                 <p className="text-slate-400 font-bold text-lg mt-8 leading-relaxed mb-10 max-w-md">
                   {tx.heroSub}
                 </p>
                 <button onClick={() => setIsLoginMode(true)} className="flex items-center gap-2 text-[#ff5a5f] font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors group">
                   {tx.alreadyHave} <span className="underline underline-offset-4 ml-1 group-hover:no-underline font-black">{tx.login}</span>
                   <ChevronRight size={14} strokeWidth={3} />
                 </button>
               </div>

               <div className="bg-white rounded-[40px] p-8 lg:p-10 border border-slate-200 shadow-xl shadow-slate-200/40 relative">
                  <div className="space-y-4">
                     {[
                       { step: 1, title: language === "es" ? "Identificación" : "Identification", desc: language === "es" ? "Nombre y categoría" : "Name and category" },
                       { step: 2, title: language === "es" ? "Contacto" : "Contact", desc: language === "es" ? "Dueño y comunicación" : "Owner and communication" },
                       { step: 3, title: language === "es" ? "Ubicación" : "Location", desc: language === "es" ? "Dirección de tu local" : "Business address" },
                       { step: 4, title: language === "es" ? "Servicios" : "Services", desc: language === "es" ? "Tus especialidades" : "Your specialties" },
                       { step: 5, title: language === "es" ? "Finalizar" : "Finalize", desc: language === "es" ? "Revisión y envío" : "Review and submit" }
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
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{tx.supportTag}</p>
                     <p className="text-sm font-bold mt-1">{tx.supportDesc}</p>
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
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">{tx.step1Title}</h2>
                            <p className="text-slate-400 font-bold text-lg">{tx.step1Sub}</p>
                         </div>
                         
                         <div className="space-y-12">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{tx.businessName}</label>
                               <div className="relative group">
                                 <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                 <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} type="text" placeholder={tx.businessNamePh} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white focus:shadow-xl focus:shadow-[#ff5a5f]/5 placeholder:text-slate-300" required />
                               </div>
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{tx.taxIdLabel}</label>
                               <div className="relative group">
                                 <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                 <input value={taxId} onChange={(e) => setTaxId(e.target.value)} type="text" placeholder={tx.taxIdPh} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white focus:shadow-xl focus:shadow-[#ff5a5f]/5 placeholder:text-slate-300" required />
                               </div>
                            </div>

                            <div className="space-y-6">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{tx.mainCategory}</label>
                               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {categoryOptions.map((cat) => {
                                    const active = selectedCategories.includes(cat.key);
                                    return (
                                      <button
                                        type="button"
                                        key={cat.key}
                                        onClick={() => toggleCategory(cat.key)}
                                        className={`p-6 rounded-[28px] border-2 transition-all text-[11px] font-black uppercase tracking-[0.15em] text-center ${
                                          active
                                            ? "border-[#ff5a5f] bg-[#ff5a5f] text-white shadow-xl shadow-[#ff5a5f]/20"
                                            : "border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-white hover:border-[#ff5a5f] hover:text-[#ff5a5f] hover:shadow-xl hover:shadow-[#ff5a5f]/5"
                                        }`}
                                      >
                                        {cat.imageUrl ? (
                                          <img
                                            src={cat.imageUrl}
                                            alt={cat.label}
                                            className="mx-auto mb-2 h-10 w-10 rounded-full object-cover border border-white/30"
                                          />
                                        ) : null}
                                        {cat.label}
                                      </button>
                                    );
                                  })}
                               </div>
                            </div>

                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                {tx.docsLabel}
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                  {
                                    key: "id",
                                    title: tx.idDoc,
                                    value: idDocumentImage,
                                    setter: setIdDocumentImage,
                                  },
                                  {
                                    key: "license",
                                    title: tx.licenseDoc,
                                    value: licenseDocumentImage,
                                    setter: setLicenseDocumentImage,
                                  },
                                  {
                                    key: "insurance",
                                    title: tx.insuranceDoc,
                                    value: insuranceDocumentImage,
                                    setter: setInsuranceDocumentImage,
                                  },
                                ].map((doc) => (
                                  <div
                                    key={doc.key}
                                    className="rounded-3xl border-2 border-slate-100 bg-slate-50 p-4"
                                  >
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-3">
                                      {doc.title}
                                    </p>
                                    {doc.value ? (
                                      <img
                                        src={doc.value}
                                        alt={doc.title}
                                        className="w-full h-28 rounded-2xl object-cover border border-slate-200 mb-3"
                                      />
                                    ) : (
                                      <div className="w-full h-28 rounded-2xl border border-dashed border-slate-200 mb-3 flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        {tx.uploadFile}
                                      </div>
                                    )}
                                    <input
                                      id={`doc-${doc.key}`}
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) {
                                          doc.setter("");
                                          return;
                                        }
                                        void readFileAsDataUrl(file)
                                          .then((dataUrl) => doc.setter(dataUrl))
                                          .catch(() => doc.setter(""));
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        (
                                          document.getElementById(`doc-${doc.key}`) as
                                            | HTMLInputElement
                                            | null
                                        )?.click()
                                      }
                                      className="w-full rounded-2xl bg-white border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 hover:border-[#ff5a5f] hover:text-[#ff5a5f]"
                                    >
                                      {tx.uploadFile}
                                    </button>
                                  </div>
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
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">{tx.step2Title}</h2>
                            <p className="text-slate-400 font-bold text-lg">{tx.step2Sub}</p>
                         </div>
                         
                         <div className="space-y-12">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{tx.ownerLabel}</label>
                               <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} type="text" placeholder={tx.ownerPh} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white focus:shadow-xl focus:shadow-[#ff5a5f]/5" required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{tx.phoneLabel}</label>
                                  <div className="relative">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                    <input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} type="tel" placeholder={tx.phonePh} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{tx.emailLabel}</label>
                                  <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff5a5f]" size={20} />
                                    <input value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} type="email" placeholder={tx.emailPh} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 transition-all focus:outline-none focus:border-[#ff5a5f] focus:bg-white" required />
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
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">{tx.step3Title}</h2>
                            <p className="text-slate-400 font-bold text-lg">{tx.step3Sub}</p>
                         </div>
                         
                         <div className="space-y-10">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{tx.addressLabel}</label>
                               <div className="relative">
                                  <MapPin className="absolute left-6 top-7 text-[#ff5a5f]" size={20} />
                                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder={tx.addressPh} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 pl-16 font-bold text-slate-800 h-32 focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all resize-none" required></textarea>
                               </div>
                               {addressSuggestions.length > 0 ? (
                                 <div className="rounded-2xl border border-slate-200 bg-white p-2 space-y-1">
                                   {addressSuggestions.map((s) => (
                                     <button
                                       key={s}
                                       type="button"
                                       onClick={() => {
                                         setAddress(s);
                                         setAddressSuggestions([]);
                                       }}
                                       className="w-full text-left text-xs font-bold text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50"
                                     >
                                       {s}
                                     </button>
                                   ))}
                                 </div>
                               ) : null}
                            </div>

                            <div className="h-64 bg-slate-100 rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-inner relative flex items-center justify-center group outline outline-8 outline-slate-100/50">
                               {address ? (
                                 <iframe
                                   title="business-map"
                                   src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                                   className="absolute inset-0 w-full h-full border-0"
                                 />
                               ) : (
                                 <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 opacity-90" aria-hidden />
                               )}
                               <button type="button" onClick={pickLocation} className="relative bg-white/95 backdrop-blur-md px-10 py-6 rounded-[32px] shadow-2xl border border-white flex flex-col items-center gap-4 group-hover:scale-105 transition-all cursor-pointer">
                                  <div className="w-14 h-14 bg-[#ff5a5f] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#ff5a5f]/20">
                                     <MapPin size={28} />
                                  </div>
                                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">{isLocating ? tx.locating : tx.locateMap}</span>
                               </button>
                            </div>
                            {locationMessage ? (
                              <p className="text-xs font-bold text-slate-500">{locationMessage}</p>
                            ) : null}
                         </div>
                      </div>
                    )}

                    {/* STEP 4: Services */}
                    {step === 4 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                         <div className="mb-12">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">{tx.step4Title}</h2>
                            <p className="text-slate-400 font-bold text-lg">{tx.step4Sub}</p>
                         </div>
                         
                         <div className="space-y-6">
                            <button type="button" onClick={addService} className="w-full bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] p-12 flex flex-col items-center justify-center group hover:border-[#ff5a5f] hover:bg-[#ff5a5f]/5 transition-all cursor-pointer">
                               <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center text-[#ff5a5f] shadow-xl group-hover:bg-[#ff5a5f] group-hover:text-white transition-all transform group-hover:rotate-12 duration-500">
                                  <Plus size={40} strokeWidth={3} />
                               </div>
                               <p className="mt-8 text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">{tx.createService}</p>
                            </button>

                            {services.map((svc) => (
                              <div key={svc.id} className="bg-white border-2 border-slate-50 rounded-[32px] p-6 flex justify-between items-center group hover:border-slate-100 transition-all shadow-sm">
                                <div className="flex items-center gap-6 w-full">
                                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#ff5a5f] shadow-inner overflow-hidden">
                                    {svc.imagePreviewUrl ? (
                                      <img src={svc.imagePreviewUrl} alt={svc.name || "service"} className="w-full h-full object-cover" />
                                    ) : (
                                      <Scissors size={28} />
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
                                    <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{tx.serviceNameLabel}</p>
                                      <input
                                        value={svc.name}
                                        onChange={(e) => updateService(svc.id, { name: e.target.value })}
                                        placeholder={tx.sampleService}
                                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold w-full"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
                                        {language === "es" ? "Categoría" : "Category"}
                                      </p>
                                      <select
                                        value={svc.category}
                                        onChange={(e) => updateService(svc.id, { category: e.target.value })}
                                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold w-full min-h-[42px]"
                                      >
                                        {(selectedCategories.length ? selectedCategories : ["hairService"]).map((key) => (
                                          <option key={key} value={key}>
                                            {categoryOptions.find((c) => c.key === key)?.label ?? key}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{tx.serviceDurationLabel}</p>
                                      <input
                                        type="number"
                                        value={svc.duration}
                                        onChange={(e) => updateService(svc.id, { duration: e.target.value })}
                                        placeholder="30"
                                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold w-full"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{tx.servicePriceLabel}</p>
                                      <input
                                        type="number"
                                        value={svc.price}
                                        onChange={(e) => updateService(svc.id, { price: e.target.value })}
                                        placeholder="25"
                                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold w-full"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-4 ml-4">
                                  <input
                                    id={`service-image-${svc.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) {
                                        updateService(svc.id, { imagePreviewUrl: "" });
                                        return;
                                      }
                                      const previewUrl = URL.createObjectURL(file);
                                      updateService(svc.id, {
                                        imagePreviewUrl: previewUrl,
                                      });
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById(`service-image-${svc.id}`) as HTMLInputElement | null;
                                      input?.click();
                                    }}
                                    className="p-4 text-slate-300 hover:text-slate-900 bg-slate-50 rounded-2xl transition-all"
                                  >
                                    <Camera size={18} />
                                  </button>
                                  <button type="button" onClick={() => removeService(svc.id)} className="p-4 text-slate-300 hover:text-red-500 bg-slate-50 rounded-2xl transition-all">✕</button>
                                </div>
                              </div>
                            ))}
                            {services.some((s) => s.imagePreviewUrl) ? (
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{tx.serviceImageLabel}</p>
                                <div className="flex flex-wrap gap-3">
                                  {services
                                    .filter((s) => s.imagePreviewUrl)
                                    .map((s) => (
                                      <img key={s.id} src={s.imagePreviewUrl} alt={s.name || tx.sampleService} className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                                    ))}
                                </div>
                              </div>
                            ) : null}
                            {services.length === 0 ? (
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-500">
                                No services added yet. Click "{tx.createService}" to add one.
                              </div>
                            ) : null}
                         </div>
                      </div>
                    )}

                    {/* STEP 5: Final Review */}
                    {step === 5 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                         <div className="mb-12">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">{tx.step5Title}</h2>
                            <p className="text-slate-400 font-bold text-lg">{tx.step5Sub}</p>
                         </div>
                         
                         <div className="bg-slate-50/50 border border-slate-100 rounded-[48px] p-10 lg:p-14 space-y-10 shadow-inner">
                            <div className="flex justify-between items-start pb-10 border-b border-white">
                               <div>
                                  <h4 className="text-3xl font-black text-slate-900">{businessName || "REZERVAME Studio"}</h4>
                                  <p className="text-xs font-black text-[#ff5a5f] uppercase tracking-[0.2em] mt-2">{tx.bizType}</p>
                               </div>
                               <button type="button" onClick={() => setStep(1)} className="text-[9px] font-black text-slate-400 hover:text-white hover:bg-slate-900 uppercase tracking-[0.2em] border-2 border-slate-200 px-6 py-3 rounded-2xl transition-all">Editar</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{tx.ownerReview}</p>
                                  <p className="text-lg font-bold text-slate-800">{ownerName || "—"}</p>
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{tx.contactReview}</p>
                                  <p className="text-lg font-bold text-slate-800">{businessPhone || "—"}</p>
                               </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{tx.taxIdLabel}</p>
                                 <p className="text-lg font-bold text-slate-800">{taxId || "—"}</p>
                              </div>
                            </div>

                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{tx.addressReview}</p>
                               <p className="text-lg font-bold text-slate-800 leading-relaxed">{address || "—"}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {selectedCategories.map((key) => {
                                const label = categoryOptions.find((c) => c.key === key)?.label || key;
                                return (
                                  <span key={key} className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {label}
                                  </span>
                                );
                              })}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[
                                { title: tx.idDoc, value: idDocumentImage },
                                { title: tx.licenseDoc, value: licenseDocumentImage },
                                { title: tx.insuranceDoc, value: insuranceDocumentImage },
                              ].map((doc) => (
                                <div key={doc.title} className="rounded-2xl border border-slate-200 bg-white p-3">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">
                                    {doc.title}
                                  </p>
                                  {doc.value ? (
                                    <img src={doc.value} alt={doc.title} className="w-full h-24 object-cover rounded-xl" />
                                  ) : (
                                    <p className="text-xs font-bold text-slate-400">—</p>
                                  )}
                                </div>
                              ))}
                            </div>

                            <label className="flex items-start gap-5 cursor-pointer pt-6 group">
                               <input checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} type="checkbox" required className="w-7 h-7 rounded-lg border-2 border-slate-200 text-[#ff5a5f] focus:ring-[#ff5a5f] mt-1 shrink-0" />
                               <span className="text-sm font-bold text-slate-500 leading-relaxed group-hover:text-slate-800 transition-colors">
                                 {tx.termsPrefix} <a href="/terms" className="text-slate-900 underline underline-offset-4 font-black">{tx.terms}</a> {tx.and} <a href="/privacy" className="text-slate-900 underline underline-offset-4 font-black">{tx.privacy}</a> REZERVAME.
                               </span>
                            </label>
                         </div>
                      </div>
                    )}

                    {/* NAVIGATION BUTTONS */}
                    <div className="flex justify-between items-center mt-12 pt-12 border-t border-slate-50">
                      {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-3 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-slate-900 transition-all group">
                          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} strokeWidth={3} /> {tx.previous}
                        </button>
                      ) : (
                        <div />
                      )}

                      {step < 5 ? (
                        <button type="button" onClick={nextStep} className="bg-slate-900 text-white px-14 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#ff5a5f] transition-all transform hover:-translate-y-1 shadow-2xl flex items-center gap-3">
                          {tx.continue} <ChevronRight size={20} strokeWidth={3} />
                        </button>
                      ) : (
                        <button type="submit" disabled={isSubmitting} className="bg-[#ff5a5f] text-white px-14 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#e0484d] transition-all transform hover:-translate-y-1 shadow-2xl shadow-[#ff5a5f]/40 flex items-center gap-3 animate-pulse disabled:opacity-60">
                          {isSubmitting ? "Submitting..." : tx.submit} <ArrowRight size={20} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                    {stepError ? (
                      <p className="mt-4 text-sm font-bold text-rose-600">{stepError}</p>
                    ) : null}

                  </form>
               </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
