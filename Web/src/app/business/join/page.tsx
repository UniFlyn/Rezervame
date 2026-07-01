"use client";
import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, MapPin, Phone, Mail, 
  ChevronRight, ChevronLeft, Check, 
  Scissors, Camera, Plus,
  ShieldCheck, ArrowRight
} from "lucide-react";
import { useI18n } from "../../../components/I18nProvider";
import { useBusinessStore } from "../../../store/businessStore";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchPublicCategories, type PublicCategory } from "@/lib/venueSearch";
import { apiPost } from "@/lib/api";
import { resolveApiBase } from "@/lib/apiBase";
import { compressImageFile } from "@/lib/compressImage";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import {
  BankPayoutFields,
  ExtraDocumentUpload,
  LocationDetailFields,
  LocationRegionFields,
  OperationsStepFields,
  OwnerIdentityFields,
  type JoinExtendedState,
} from "@/components/business/BusinessJoinExtendedFields";
import { partnerTypeById } from "@/lib/partnerBusinessTypes";
import { BusinessTypePicker } from "@/components/business/BusinessTypePicker";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const TOTAL_STEPS = 9;

const fieldInput =
  "w-full bg-[var(--rz-gray-050)] border border-[var(--rz-gray-200)] rounded-2xl px-4 py-3.5 text-sm font-semibold text-[var(--rz-navy-800)] transition-all focus:outline-none focus:border-[#ff5757] focus:bg-white focus:ring-2 focus:ring-[#ff5757]/10 placeholder:text-[var(--rz-gray-500)]";
const fieldLabel = "text-[11px] font-bold text-[var(--rz-gray-500)] uppercase tracking-wide";
type CategoryOption = { key: string; label: string; imageUrl?: string | null };
type ServiceDraft = {
  id: string;
  name: string;
  duration: string;
  price: string;
  category: string;
  imagePreviewUrl?: string;
};

const DOC_IMAGE_OPTS = { maxWidth: 1400, maxHeight: 1400, maxBytes: 450_000 };
const SERVICE_IMAGE_OPTS = { maxWidth: 800, maxHeight: 800, maxBytes: 280_000 };

export default function BusinessJoinPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("basic");
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [uploadingServiceId, setUploadingServiceId] = useState<string | null>(null);
  const [exteriorPhoto, setExteriorPhoto] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [extended, setExtended] = useState<JoinExtendedState>({
    businessType: "",
    country: "PA",
    state: "",
    city: "",
    yearsOperating: "",
    locationAccess: "",
    buildingName: "",
    floor: "",
    localNumber: "",
    locationReferences: "",
    specialDirections: "",
    parking: "",
    personType: "natural",
    companyName: "",
    companyType: "",
    ownerId: "",
    ownerPhone: "",
    ownerEmail: "",
    bank: "",
    accountType: "",
    accountNumber: "",
    accountHolder: "",
    offeredServices: [],
    priceRange: "",
    openTime: "09:00",
    closeTime: "18:00",
    operatingDays: ["lunes", "martes", "miercoles", "jueves", "viernes"],
    appointments: "",
    staffCount: "",
    additionalInfo: "",
    marketingOptIn: false,
    latitude: null,
    longitude: null,
  });

  const tx = {
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
    uploading: "Uploading…",
    uploadOk: "Image ready",
    uploadFail: "Could not process this image. Use JPG or PNG under 10MB.",
    valStep2: "Fill owner, phone, and valid email.",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm Password",
    valStep2Password: "Passwords must match and be at least 6 characters.",
    valStep3: "Fill business address.",
    valStep4: "Add at least one valid service.",
    valStep5: "Accept terms and privacy to continue.",
  } as const;

  const lang = language === "es" ? "es" : "en";

  const stepMeta = useMemo(
    () => [
      { step: 1 as Step, title: lang === "es" ? "Negocio" : "Business", desc: lang === "es" ? "Nombre y tipo" : "Name & type" },
      { step: 2 as Step, title: lang === "es" ? "Contacto" : "Contact", desc: lang === "es" ? "Teléfono y email" : "Phone & email" },
      { step: 3 as Step, title: lang === "es" ? "Ubicación" : "Location", desc: lang === "es" ? "Dirección y mapa" : "Address & map" },
      { step: 4 as Step, title: lang === "es" ? "Detalles" : "Details", desc: lang === "es" ? "Acceso y estacionamiento" : "Access & parking" },
      { step: 5 as Step, title: lang === "es" ? "Titular" : "Owner", desc: lang === "es" ? "Identidad legal" : "Legal identity" },
      { step: 6 as Step, title: lang === "es" ? "Cuenta" : "Account", desc: lang === "es" ? "Banco y contraseña" : "Bank & password" },
      { step: 7 as Step, title: lang === "es" ? "Operación" : "Operations", desc: lang === "es" ? "Plan y horarios" : "Plan & hours" },
      { step: 8 as Step, title: lang === "es" ? "Servicios" : "Services", desc: lang === "es" ? "Tu menú" : "Your menu" },
      { step: 9 as Step, title: lang === "es" ? "Finalizar" : "Finish", desc: lang === "es" ? "Documentos y envío" : "Docs & submit" },
    ],
    [lang],
  );

  const categoryOptions: CategoryOption[] = useMemo(
    () =>
      availableCategories.map((c) => ({
        key: c.key,
        label: c.labelEn,
        imageUrl: c.imageUrl || "",
      })),
    [availableCategories, language],
  );

  useEffect(() => {
    const fromUrl = partnerTypeById(searchParams.get("type"));
    if (!fromUrl) return;
    setExtended((d) => ({ ...d, businessType: fromUrl.id }));
    setSelectedCategories(fromUrl.categoryKeys);
  }, [searchParams]);

  useEffect(() => {
    void import("@/lib/securityPolicy").then(({ fetchSecurityPolicy }) =>
      fetchSecurityPolicy().then((p) => setMinPasswordLength(p.minPasswordLength)),
    );
  }, []);

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

    const API_BASE = resolveApiBase();
    fetch(`${API_BASE}/public/plans`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error("Plans failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
        } else {
          throw new Error("No plans");
        }
      })
      .catch(() => {
        setPlans([
          {
            id: 'basic',
            name: 'Basic',
            price: 0,
            billingCycle: 'monthly',
            features: ['Up to 50 bookings/month', 'Basic business profile', 'Email support'],
          },
          {
            id: 'premium',
            name: 'Premium',
            price: 29.0,
            billingCycle: 'monthly',
            features: ['Unlimited bookings', 'Marketing & Promotions', 'Advanced Analytics', '24/7 Priority support'],
          },
          {
            id: 'gold',
            name: 'Gold',
            price: 29.99,
            billingCycle: 'monthly',
            features: ['Unlimited Staff', 'Unlimited Service'],
          },
        ]);
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
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail.trim());
    const passValid =
      password.length >= minPasswordLength && password === confirmPassword;
    const hasValidService = services.some(
      (s) =>
        s.name.trim() &&
        Number(s.duration) > 0 &&
        Number.isFinite(Number(s.price)) &&
        Number(s.price) >= 0,
    );

    if (step === 1) {
      if (!businessName.trim() || !extended.businessType || selectedCategories.length === 0) {
        const err =
          lang === "es"
            ? "Indica el nombre del negocio y elige un tipo."
            : "Enter your business name and choose a type.";
        setStepError(err);
        toastWarning("Validation", err);
        return;
      }
    }
    if (step === 2) {
      if (!businessPhone.trim() || !validEmail) {
        setStepError(tx.valStep2);
        toastWarning("Validation", tx.valStep2);
        return;
      }
    }
    if (step === 3) {
      if (
        !address.trim() ||
        !extended.country ||
        !extended.state.trim() ||
        !extended.city.trim()
      ) {
        setStepError(tx.valStep3);
        toastWarning("Validation", tx.valStep3);
        return;
      }
    }
    if (step === 4) {
      if (!extended.yearsOperating || !extended.locationAccess) {
        const err =
          lang === "es" ? "Indica años en operación y acceso al local." : "Select years operating and location access.";
        setStepError(err);
        toastWarning("Validation", err);
        return;
      }
    }
    if (step === 5) {
      if (
        !taxId.trim() ||
        !ownerName.trim() ||
        !extended.ownerId.trim() ||
        (extended.personType === "juridica" && !extended.companyName.trim())
      ) {
        setStepError(tx.valStep2);
        toastWarning("Validation", tx.valStep2);
        return;
      }
    }
    if (step === 6) {
      if (
        !extended.bank ||
        !extended.accountType ||
        !extended.accountNumber.trim() ||
        !extended.accountHolder.trim() ||
        !passValid
      ) {
        const err = !passValid ? tx.valStep2Password : tx.valStep2;
        setStepError(err);
        toastWarning("Validation", err);
        return;
      }
    }
    if (step === 7) {
      if (
        !extended.openTime ||
        !extended.closeTime ||
        extended.operatingDays.length === 0 ||
        !extended.appointments
      ) {
        const err =
          lang === "es" ? "Completa horarios y tipo de citas." : "Complete hours and appointment type.";
        setStepError(err);
        toastWarning("Validation", err);
        return;
      }
    }
    if (step === 8) {
      if (!hasValidService && extended.offeredServices.length === 0) {
        setStepError(tx.valStep4);
        toastWarning("Validation", tx.valStep4);
        return;
      }
    }
    setStepError("");
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS) as Step);
  };
  const prevStep = () => setStep((prev) => Math.max(1, prev - 1) as Step);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setStepError(tx.valStep5);
      toastWarning("Validation", tx.valStep5);
      return;
    }
    if (!idDocumentImage || !licenseDocumentImage || !insuranceDocumentImage) {
      setStepError(tx.valStep1);
      toastWarning("Validation", tx.valStep1);
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
        password,
        planId: selectedPlanId,
        latitude: extended.latitude,
        longitude: extended.longitude,
        registrationDetails: {
          ...extended,
          ownerPhone: extended.ownerPhone || businessPhone,
          ownerEmail: extended.ownerEmail || businessEmail,
          marketingOptIn,
          exteriorPhotoUrl: exteriorPhoto || undefined,
        },
        services: services
          .filter((s) => s.name.trim() && Number(s.duration) > 0)
          .map((s) => ({
            name: s.name.trim(),
            duration: Number(s.duration),
            price: Number(s.price),
            category: s.category || selectedCategories[0] || "hairService",
            imageUrl:
              s.imagePreviewUrl?.startsWith("data:image/") ? s.imagePreviewUrl : undefined,
          })),
      },
    )
      .then(() => setIsSubmitted(true))
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : "Could not submit registration. Please check all fields and try again.";
        setStepError(msg);
        toastError("Registration failed", msg);
      })
      .finally(() => setIsSubmitting(false));
  };

  async function handleDocImageUpload(
    file: File,
    setter: (url: string) => void,
    docKey: string,
    inputEl: HTMLInputElement | null,
  ) {
    if (!file.type.startsWith("image/")) {
      toastError("Invalid file", "Please choose a JPG or PNG image.");
      return;
    }
    setUploadingDocKey(docKey);
    try {
      const dataUrl = await compressImageFile(file, DOC_IMAGE_OPTS);
      setter(dataUrl);
      toastSuccess("Document uploaded", "Preview updated — continue when all three are added.");
    } catch (err) {
      setter("");
      toastError("Upload failed", err instanceof Error ? err.message : tx.uploadFail);
    } finally {
      setUploadingDocKey(null);
      if (inputEl) inputEl.value = "";
    }
  }

  async function handleServiceImageUpload(
    serviceId: string,
    file: File,
    inputEl: HTMLInputElement | null,
  ) {
    if (!file.type.startsWith("image/")) {
      toastError("Invalid file", "Please choose a JPG or PNG image.");
      return;
    }
    setUploadingServiceId(serviceId);
    try {
      const dataUrl = await compressImageFile(file, SERVICE_IMAGE_OPTS);
      updateService(serviceId, { imagePreviewUrl: dataUrl });
      toastSuccess("Service image added");
    } catch (err) {
      updateService(serviceId, { imagePreviewUrl: "" });
      toastError("Upload failed", err instanceof Error ? err.message : tx.uploadFail);
    } finally {
      setUploadingServiceId(null);
      if (inputEl) inputEl.value = "";
    }
  }

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
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setExtended((d) => ({ ...d, latitude: lat, longitude: lng }));
        setAddress((prev) => prev || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setLocationMessage(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
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
      <main className="min-h-screen flex items-center justify-center p-6 lg:p-10 bg-[#f7f8fa]/50 animate-in fade-in duration-700">
         <div className="bg-white max-w-2xl w-full rounded-[48px] p-12 lg:p-20 text-center shadow-2xl shadow-[color:var(--rz-gray-200)] border border-[var(--rz-gray-100)] animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-green-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-green-100">
               <Check size={48} strokeWidth={3} />
            </div>
            <h1 className="text-4xl font-black text-[var(--rz-navy)] mb-6 uppercase tracking-tight leading-tight">
               {tx.successTitle}
            </h1>
            <p className="text-[var(--rz-gray-500)] font-bold text-lg mb-12 leading-relaxed px-4 lg:px-10">
               {tx.successDesc}
            </p>
            <div className="bg-[var(--rz-gray-050)] rounded-[32px] p-8 mb-12 border border-[var(--rz-gray-100)] max-w-md mx-auto">
               <h4 className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-[0.2em] mb-6">{tx.nextSteps}</h4>
               <ul className="text-left space-y-5">
                  <li className="flex items-center gap-4 text-[var(--rz-gray-700)] font-bold text-sm">
                     <span className="w-8 h-8 rounded-xl bg-[var(--rz-navy)] text-white flex items-center justify-center text-xs shrink-0">1</span>
                     Verificación de documentos legales.
                  </li>
                  <li className="flex items-center gap-4 text-[var(--rz-gray-700)] font-bold text-sm">
                     <span className="w-8 h-8 rounded-xl bg-[var(--rz-navy)] text-white flex items-center justify-center text-xs shrink-0">2</span>
                     Llamada de bienvenida y configuración de perfil.
                  </li>
                  <li className="flex items-center gap-4 text-[var(--rz-gray-700)] font-bold text-sm">
                     <span className="w-8 h-8 rounded-xl bg-[var(--rz-navy)] text-white flex items-center justify-center text-xs shrink-0">3</span>
                     Activación del panel de administración.
                  </li>
               </ul>
            </div>
            <a href="/" className="inline-block bg-[#ff5757] text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-[#d83b3b] transition-all transform hover:-translate-y-1 shadow-2xl shadow-[#ff5757]/30">
               {tx.backHome}
            </a>
         </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--rz-gray-050)] via-white to-[var(--rz-gray-050)] py-8 px-4 sm:px-6 lg:py-10">
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#ff5757]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        
        {isLoginMode ? (
          <div className="w-full flex items-center justify-center py-8">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 border border-[var(--rz-gray-200)] shadow-xl relative">
              <div className="text-center mb-8">
                <span className="bg-[#ff5757] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">Business Login</span>
                <h1 className="text-3xl font-bold text-[var(--rz-navy)]">Welcome back</h1>
                <p className="text-[var(--rz-gray-500)] text-sm mt-2">Manage your appointments and customers.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                   <label className={fieldLabel}>Email address</label>
                   <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff5757]" size={18} />
                     <input name="email" type="email" placeholder="admin@business.com" className={`${fieldInput} pl-11`} required />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={fieldLabel}>Password</label>
                   <div className="relative">
                     <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff5757]" size={18} />
                     <input name="password" type="password" placeholder="••••••••" className={`${fieldInput} pl-11`} required />
                   </div>
                </div>
                <button type="submit" className="w-full bg-[var(--rz-navy)] text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-[#ff5757] transition-colors mt-2">
                   Login to panel
                </button>
              </form>
              <div className="mt-8 text-center border-t border-[var(--rz-gray-100)] pt-6">
                 <button onClick={() => setIsLoginMode(false)} className="text-xs font-semibold text-[var(--rz-gray-500)] hover:text-[#ff5757]">
                   Don&apos;t have an account? <span className="text-[#ff5757] underline ml-1">Register now</span>
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-10 items-start">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-8 space-y-6">
               <div>
                 <span className="bg-[#ff5757] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block">Business Portal</span>
                 <h1 className="text-2xl lg:text-3xl font-bold text-[var(--rz-navy)] mt-4 leading-tight">
                   {tx.heroTitle} <span className="text-[#ff5757]">REZERVAME</span>
                 </h1>
                 <p className="text-[var(--rz-gray-500)] text-sm mt-3 leading-relaxed">{tx.heroSub}</p>
                 <button onClick={() => setIsLoginMode(true)} className="mt-4 text-xs font-semibold text-[#ff5757] hover:text-[var(--rz-navy)] transition-colors">
                   {tx.alreadyHave} {tx.login} →
                 </button>
               </div>

               <div className="hidden lg:block bg-white rounded-2xl p-4 border border-[var(--rz-gray-200)] shadow-sm">
                  <div className="space-y-1">
                     {stepMeta.map((s) => (
                       <div key={s.step} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${step === s.step ? "bg-[#ff5757] text-white" : step > s.step ? "bg-emerald-50 text-emerald-800" : "text-[var(--rz-gray-500)]"}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${step === s.step ? "bg-white text-[#ff5757]" : step > s.step ? "bg-emerald-500 text-white" : "bg-[var(--rz-gray-100)] text-[var(--rz-gray-500)]"}`}>
                             {step > s.step ? <Check size={14} strokeWidth={3} /> : s.step}
                          </div>
                          <div className="min-w-0">
                             <h4 className="font-bold text-xs truncate">{s.title}</h4>
                             <p className={`text-[10px] truncate ${step === s.step ? "text-white/80" : "text-[var(--rz-gray-500)]"}`}>{s.desc}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="hidden lg:flex items-center gap-3 p-4 bg-[var(--rz-navy)] rounded-2xl text-white">
                  <ShieldCheck className="shrink-0" size={20} />
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{tx.supportTag}</p>
                     <p className="text-xs font-medium mt-0.5">{tx.supportDesc}</p>
                  </div>
               </div>
            </aside>

            {/* Form */}
            <div className="min-w-0">
               <div className="mb-4 lg:hidden">
                 <div className="flex items-center justify-between text-xs font-semibold text-[var(--rz-gray-500)] mb-2">
                   <span>{stepMeta[step - 1]?.title}</span>
                   <span>{step} / {TOTAL_STEPS}</span>
                 </div>
                 <div className="h-1.5 bg-[var(--rz-gray-200)] rounded-full overflow-hidden">
                   <div className="h-full bg-[#ff5757] rounded-full transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
                 </div>
               </div>

               <div className="bg-white rounded-3xl border border-[var(--rz-gray-200)] shadow-xl shadow-[color:rgba(231,234,239,0.4)] flex flex-col max-h-[min(780px,calc(100vh-5rem))] overflow-hidden">
                  <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-6 sm:px-8 sm:py-7">
                    {step === 1 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{tx.step1Title}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{tx.step1Sub}</p>
                        </div>
                        <div className="space-y-2">
                          <label className={fieldLabel}>{tx.businessName}</label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff5757]" size={18} />
                            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} type="text" placeholder={tx.businessNamePh} className={`${fieldInput} pl-11`} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={fieldLabel}>{t("joinBusinessTypeLabel")}</label>
                          <p className="text-xs text-[var(--rz-gray-500)]">{t("joinBusinessTypeSub")}</p>
                          <BusinessTypePicker
                            compact
                            lang={lang}
                            selectedId={extended.businessType}
                            t={t}
                            onSelect={(id, categoryKeys) => {
                              setExtended((d) => ({ ...d, businessType: id }));
                              setSelectedCategories(categoryKeys);
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{tx.step2Title}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{tx.step2Sub}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={fieldLabel}>{tx.phoneLabel}</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff5757]" size={18} />
                              <input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} type="tel" placeholder={tx.phonePh} className={`${fieldInput} pl-11`} required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className={fieldLabel}>{tx.emailLabel}</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff5757]" size={18} />
                              <input value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} type="email" placeholder={tx.emailPh} className={`${fieldInput} pl-11`} required />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{tx.step3Title}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{tx.step3Sub}</p>
                        </div>
                        <LocationRegionFields lang={lang} details={extended} setDetails={setExtended} />
                        <div className="space-y-2">
                          <label className={fieldLabel}>{tx.addressLabel}</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-[#ff5757]" size={18} />
                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder={tx.addressPh} className={`${fieldInput} pl-11 min-h-[88px] resize-none pt-3.5`} required />
                          </div>
                        </div>
                        <div className="h-36 bg-[var(--rz-gray-100)] rounded-2xl overflow-hidden border border-[var(--rz-gray-200)] relative flex items-center justify-center">
                          {address ? (
                            <iframe title="business-map" src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} className="absolute inset-0 w-full h-full border-0" />
                          ) : null}
                          <button type="button" onClick={pickLocation} className="relative bg-white/95 backdrop-blur px-4 py-2.5 rounded-xl shadow border border-white flex items-center gap-2 text-xs font-semibold text-[var(--rz-navy-800)]">
                            <MapPin size={16} className="text-[#ff5757]" />
                            {isLocating ? tx.locating : tx.locateMap}
                          </button>
                        </div>
                        {locationMessage ? <p className="text-xs text-[var(--rz-gray-500)]">{locationMessage}</p> : null}
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{lang === "es" ? "Detalles del local" : "Venue details"}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{lang === "es" ? "Acceso, estacionamiento y referencias" : "Access, parking, and landmarks"}</p>
                        </div>
                        <LocationDetailFields lang={lang} details={extended} setDetails={setExtended} />
                      </div>
                    )}

                    {step === 5 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{tx.ownerLabel}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{lang === "es" ? "Datos del titular y RUC" : "Owner identity and tax ID"}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={fieldLabel}>{tx.taxIdLabel}</label>
                            <input value={taxId} onChange={(e) => setTaxId(e.target.value)} type="text" placeholder={tx.taxIdPh} className={fieldInput} required />
                          </div>
                          <div className="space-y-2">
                            <label className={fieldLabel}>{tx.ownerLabel}</label>
                            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} type="text" placeholder={tx.ownerPh} className={fieldInput} required />
                          </div>
                        </div>
                        <OwnerIdentityFields lang={lang} details={extended} setDetails={setExtended} />
                      </div>
                    )}

                    {step === 6 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{lang === "es" ? "Cuenta y seguridad" : "Account & security"}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{lang === "es" ? "Banco para pagos y contraseña de acceso" : "Payout bank and login password"}</p>
                        </div>
                        <BankPayoutFields lang={lang} details={extended} setDetails={setExtended} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={fieldLabel}>{tx.passwordLabel}</label>
                            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className={fieldInput} required />
                          </div>
                          <div className="space-y-2">
                            <label className={fieldLabel}>{tx.confirmPasswordLabel}</label>
                            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" className={fieldInput} required />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 7 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{lang === "es" ? "Plan y horarios" : "Plan & hours"}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{lang === "es" ? "Elige tu plan y cuándo atiendes" : "Choose your plan and operating hours"}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {plans.map((p) => {
                            const isSelected = selectedPlanId === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPlanId(p.id)}
                                className={`rounded-2xl border p-4 text-left transition-all ${isSelected ? "border-[#ff5757] bg-[#ff5757]/5 ring-2 ring-[#ff5757]/15" : "border-[var(--rz-gray-200)] hover:border-[var(--rz-gray-300)]"}`}
                              >
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-[#ff5757] text-white" : "bg-[var(--rz-gray-100)] text-[var(--rz-gray-500)]"}`}>{p.name}</span>
                                <p className="text-xl font-bold text-[var(--rz-navy)] mt-2">${p.price.toFixed(2)}<span className="text-xs text-[var(--rz-gray-500)] font-normal">/mo</span></p>
                              </button>
                            );
                          })}
                        </div>
                        <OperationsStepFields lang={lang} details={extended} setDetails={setExtended} />
                      </div>
                    )}

                    {step === 8 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{tx.step4Title}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{tx.step4Sub}</p>
                        </div>
                        <button type="button" onClick={addService} className="w-full border-2 border-dashed border-[var(--rz-gray-200)] rounded-2xl py-6 flex flex-col items-center gap-2 hover:border-[#ff5757] hover:bg-[#ff5757]/5 transition-colors">
                          <Plus size={24} className="text-[#ff5757]" />
                          <span className="text-xs font-bold text-[var(--rz-gray-700)] uppercase tracking-wide">{tx.createService}</span>
                        </button>
                        {services.map((svc) => (
                          <div key={svc.id} className="rounded-2xl border border-[var(--rz-gray-200)] p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[var(--rz-gray-100)] rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-[#ff5757]">
                                {svc.imagePreviewUrl ? <img src={svc.imagePreviewUrl} alt="" className="w-full h-full object-cover" /> : <Scissors size={20} />}
                              </div>
                              <input value={svc.name} onChange={(e) => updateService(svc.id, { name: e.target.value })} placeholder={tx.sampleService} className={`${fieldInput} flex-1`} />
                              <button type="button" onClick={() => removeService(svc.id)} className="text-[var(--rz-gray-500)] hover:text-red-500 px-2">✕</button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="number" value={svc.duration} onChange={(e) => updateService(svc.id, { duration: e.target.value })} placeholder="30 min" className={fieldInput} />
                              <input type="number" value={svc.price} onChange={(e) => updateService(svc.id, { price: e.target.value })} placeholder="$25" className={fieldInput} />
                              <select value={svc.category} onChange={(e) => updateService(svc.id, { category: e.target.value })} className={fieldInput}>
                                {(selectedCategories.length ? selectedCategories : ["hairService"]).map((key) => (
                                  <option key={key} value={key}>{categoryOptions.find((c) => c.key === key)?.label ?? key}</option>
                                ))}
                              </select>
                            </div>
                            <input id={`service-image-${svc.id}`} type="file" accept="image/*" className="hidden" disabled={uploadingServiceId === svc.id} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleServiceImageUpload(svc.id, file, e.currentTarget); }} />
                            <button type="button" disabled={uploadingServiceId === svc.id} onClick={() => document.getElementById(`service-image-${svc.id}`)?.click()} className="text-xs font-semibold text-[#ff5757] flex items-center gap-1">
                              <Camera size={14} /> {tx.serviceImageLabel}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {step === 9 && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-2xl font-bold text-[var(--rz-navy)]">{tx.step5Title}</h2>
                          <p className="text-sm text-[var(--rz-gray-500)] mt-1">{tx.step5Sub}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { key: "id", title: tx.idDoc, value: idDocumentImage, setter: setIdDocumentImage },
                            { key: "license", title: tx.licenseDoc, value: licenseDocumentImage, setter: setLicenseDocumentImage },
                            { key: "insurance", title: tx.insuranceDoc, value: insuranceDocumentImage, setter: setInsuranceDocumentImage },
                          ].map((doc) => (
                            <ExtraDocumentUpload key={doc.key} title={doc.title} value={doc.value} uploading={uploadingDocKey === doc.key} uploadLabel={tx.uploadFile} okLabel={tx.uploadOk} onPick={(file, inputEl) => void handleDocImageUpload(file, doc.setter, doc.key, inputEl)} />
                          ))}
                          <ExtraDocumentUpload title={lang === "es" ? "Foto exterior" : "Exterior photo"} hint={lang === "es" ? "Opcional" : "Optional"} value={exteriorPhoto} uploading={uploadingDocKey === "exterior"} uploadLabel={tx.uploadFile} okLabel={tx.uploadOk} onPick={(file, inputEl) => void handleDocImageUpload(file, setExteriorPhoto, "exterior", inputEl)} />
                        </div>
                        <div className="rounded-2xl bg-[var(--rz-gray-050)] border border-[var(--rz-gray-100)] p-5 space-y-4">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="text-lg font-bold text-[var(--rz-navy)]">{businessName || "—"}</h4>
                              <p className="text-xs font-semibold text-[#ff5757] mt-1">
                                {extended.businessType ? t(`${partnerTypeById(extended.businessType)?.labelKey ?? "partnersTypeSalon"}Title`) : tx.bizType}
                              </p>
                            </div>
                            <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)]">{lang === "es" ? "Editar" : "Edit"}</button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><p className="text-xs text-[var(--rz-gray-500)]">{tx.ownerReview}</p><p className="font-semibold">{ownerName || "—"}</p></div>
                            <div><p className="text-xs text-[var(--rz-gray-500)]">{tx.contactReview}</p><p className="font-semibold">{businessPhone || "—"}</p></div>
                            <div><p className="text-xs text-[var(--rz-gray-500)]">{tx.addressReview}</p><p className="font-semibold line-clamp-2">{address || "—"}</p></div>
                            <div><p className="text-xs text-[var(--rz-gray-500)]">Plan</p><p className="font-semibold text-[#ff5757]">{plans.find((p) => p.id === selectedPlanId)?.name || "Basic"}</p></div>
                          </div>
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} type="checkbox" className="mt-1 rounded border-[var(--rz-gray-300)] text-[#ff5757] focus:ring-[#ff5757]" />
                          <span className="text-sm text-[var(--rz-gray-600)]">{lang === "es" ? "Quiero recibir consejos y promociones para socios (opcional)." : "Send me partner tips and promotions (optional)."}</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} type="checkbox" required className="mt-1 rounded border-[var(--rz-gray-300)] text-[#ff5757] focus:ring-[#ff5757]" />
                          <span className="text-sm text-[var(--rz-gray-600)]">
                            {tx.termsPrefix} <a href="/terms" className="text-[var(--rz-navy)] underline font-semibold">{tx.terms}</a> {tx.and} <a href="/privacy" className="text-[var(--rz-navy)] underline font-semibold">{tx.privacy}</a>.
                          </span>
                        </label>
                      </div>
                    )}
                    </div>

                    <div className="shrink-0 flex justify-between items-center gap-4 px-5 py-4 sm:px-8 border-t border-[var(--rz-gray-100)] bg-white">
                      {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-2 text-sm font-semibold text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)]">
                          <ChevronLeft size={18} /> {tx.previous}
                        </button>
                      ) : <div />}

                      {step < TOTAL_STEPS ? (
                        <button type="button" onClick={nextStep} className="bg-[var(--rz-navy)] text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-[#ff5757] transition-colors flex items-center gap-2">
                          {tx.continue} <ChevronRight size={18} />
                        </button>
                      ) : (
                        <button type="submit" disabled={isSubmitting} className="bg-[#ff5757] text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-[#d83b3b] transition-colors flex items-center gap-2 disabled:opacity-60">
                          {isSubmitting ? "Submitting..." : tx.submit} <ArrowRight size={18} />
                        </button>
                      )}
                    </div>
                    {stepError ? <p className="px-8 pb-4 text-sm font-semibold text-rose-600">{stepError}</p> : null}

                  </form>
               </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
