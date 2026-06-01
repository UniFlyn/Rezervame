/** Partner registration options (aligned with rezervame-registro.html, not a copy of that UI). */

export const BUSINESS_TYPE_OPTIONS = [
  { value: "salon", labelEn: "Beauty salon", labelEs: "Salón de belleza", emoji: "💇‍♀️" },
  { value: "barberia", labelEn: "Barbershop", labelEs: "Barbería", emoji: "✂️" },
  { value: "nails", labelEn: "Nail salon", labelEs: "Salón de uñas", emoji: "💅" },
  { value: "tattoo", labelEn: "Tattoo studio", labelEs: "Estudio de tatuajes", emoji: "🎨" },
  { value: "spa", labelEn: "Spa / massage", labelEs: "Spa / masajes", emoji: "💆" },
  { value: "estetica", labelEn: "Aesthetics center", labelEs: "Centro de estética", emoji: "✨" },
  { value: "dermatologo", labelEn: "Dermatology / clinic", labelEs: "Dermatología / clínica", emoji: "🩺" },
  { value: "yoga", labelEn: "Yoga & fitness", labelEs: "Yoga y fitness", emoji: "🧘" },
  { value: "otro", labelEn: "Other", labelEs: "Otro", emoji: "🏢" },
] as const;

export const COUNTRY_OPTIONS = [
  { value: "PA", labelEn: "Panama", labelEs: "Panamá" },
  { value: "US", labelEn: "United States", labelEs: "Estados Unidos" },
  { value: "MX", labelEn: "Mexico", labelEs: "México" },
  { value: "CO", labelEn: "Colombia", labelEs: "Colombia" },
  { value: "CR", labelEn: "Costa Rica", labelEs: "Costa Rica" },
  { value: "OTHER", labelEn: "Other", labelEs: "Otro" },
] as const;

export const YEARS_OPERATING_OPTIONS = [
  { value: "new", labelEn: "Opening soon / new", labelEs: "Por abrir / nuevo" },
  { value: "under-1", labelEn: "Less than 1 year", labelEs: "Menos de 1 año" },
  { value: "1-3", labelEn: "1–3 years", labelEs: "1–3 años" },
  { value: "3-5", labelEn: "3–5 years", labelEs: "3–5 años" },
  { value: "5+", labelEn: "5+ years", labelEs: "5+ años" },
] as const;

export const LOCATION_ACCESS_OPTIONS = [
  { value: "frente-calle", labelEn: "Street-level / storefront", labelEs: "Frente a calle" },
  { value: "edificio", labelEn: "Inside a building / mall", labelEs: "Dentro de edificio / plaza" },
  { value: "dificil-acceso", labelEn: "Hard to find / needs directions", labelEs: "Difícil acceso" },
] as const;

export const PARKING_OPTIONS = [
  { value: "si", labelEn: "On-site parking", labelEs: "Estacionamiento propio" },
  { value: "no", labelEn: "No parking", labelEs: "Sin estacionamiento" },
  { value: "calle", labelEn: "Street parking", labelEs: "Estacionamiento en calle" },
] as const;

export const PERSON_TYPE_OPTIONS = [
  { value: "natural", labelEn: "Individual", labelEs: "Persona natural" },
  { value: "juridica", labelEn: "Company / legal entity", labelEs: "Persona jurídica" },
] as const;

export const COMPANY_TYPE_OPTIONS = [
  { value: "sa", labelEn: "Corporation (S.A.)", labelEs: "Sociedad anónima" },
  { value: "srl", labelEn: "LLC (S.R.L.)", labelEs: "Sociedad de responsabilidad limitada" },
  { value: "individual", labelEn: "Sole proprietorship", labelEs: "Empresa individual" },
  { value: "other", labelEn: "Other", labelEs: "Otro" },
] as const;

export const BANK_OPTIONS = [
  { value: "bgeneral", labelEn: "Banco General", labelEs: "Banco General" },
  { value: "banistmo", labelEn: "Banistmo", labelEs: "Banistmo" },
  { value: "bac", labelEn: "BAC", labelEs: "BAC" },
  { value: "global", labelEn: "Global Bank", labelEs: "Global Bank" },
  { value: "scotiabank", labelEn: "Scotiabank", labelEs: "Scotiabank" },
  { value: "other", labelEn: "Other bank", labelEs: "Otro banco" },
] as const;

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "ahorros", labelEn: "Savings", labelEs: "Ahorros" },
  { value: "corriente", labelEn: "Checking", labelEs: "Corriente" },
] as const;

export const OFFERED_SERVICE_OPTIONS = [
  { value: "corte-cabello", labelEn: "Haircuts & styling", labelEs: "Corte y peinado" },
  { value: "coloracion", labelEn: "Coloring", labelEs: "Coloración" },
  { value: "manicura-pedicura", labelEn: "Manicure & pedicure", labelEs: "Manicura y pedicura" },
  { value: "masajes", labelEn: "Massage", labelEs: "Masajes" },
  { value: "faciales", labelEn: "Facials", labelEs: "Faciales" },
  { value: "depilacion", labelEn: "Hair removal", labelEs: "Depilación" },
  { value: "maquillaje", labelEn: "Makeup", labelEs: "Maquillaje" },
  { value: "barberia", labelEn: "Barber / grooming", labelEs: "Barbería" },
  { value: "tatuajes", labelEn: "Tattoos / piercings", labelEs: "Tatuajes / piercings" },
  { value: "cejas-pestanas", labelEn: "Brows & lashes", labelEs: "Cejas y pestañas" },
  { value: "otros", labelEn: "Other", labelEs: "Otros" },
] as const;

export const PRICE_RANGE_OPTIONS = [
  { value: "budget", labelEn: "Budget ($)", labelEs: "Económico ($)" },
  { value: "mid", labelEn: "Mid-range ($$)", labelEs: "Medio ($$)" },
  { value: "premium", labelEn: "Premium ($$$)", labelEs: "Premium ($$$)" },
  { value: "luxury", labelEn: "Luxury ($$$$)", labelEs: "Lujo ($$$$)" },
] as const;

export const WEEKDAY_OPTIONS = [
  { value: "lunes", labelEn: "Mon", labelEs: "Lun" },
  { value: "martes", labelEn: "Tue", labelEs: "Mar" },
  { value: "miercoles", labelEn: "Wed", labelEs: "Mié" },
  { value: "jueves", labelEn: "Thu", labelEs: "Jue" },
  { value: "viernes", labelEn: "Fri", labelEs: "Vie" },
  { value: "sabado", labelEn: "Sat", labelEs: "Sáb" },
  { value: "domingo", labelEn: "Sun", labelEs: "Dom" },
] as const;

export const APPOINTMENT_MODE_OPTIONS = [
  { value: "solo-cita", labelEn: "By appointment only", labelEs: "Solo con cita" },
  { value: "walk-in", labelEn: "Walk-ins welcome", labelEs: "Acepto walk-ins" },
  { value: "ambos", labelEn: "Both", labelEs: "Ambos" },
] as const;

export const STAFF_COUNT_OPTIONS = [
  { value: "1", labelEn: "Just me", labelEs: "Solo yo" },
  { value: "2-3", labelEn: "2–3 people", labelEs: "2 a 3 personas" },
  { value: "4-6", labelEn: "4–6 people", labelEs: "4 a 6 personas" },
  { value: "7-10", labelEn: "7–10 people", labelEs: "7 a 10 personas" },
  { value: "10+", labelEn: "10+ people", labelEs: "Más de 10" },
] as const;

export type BusinessRegistrationDetails = {
  businessType?: string;
  country?: string;
  state?: string;
  city?: string;
  yearsOperating?: string;
  locationAccess?: string;
  buildingName?: string;
  floor?: string;
  localNumber?: string;
  locationReferences?: string;
  specialDirections?: string;
  parking?: string;
  latitude?: number | null;
  longitude?: number | null;
  personType?: string;
  companyName?: string;
  companyType?: string;
  ownerId?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  bank?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
  offeredServices?: string[];
  priceRange?: string;
  openTime?: string;
  closeTime?: string;
  operatingDays?: string[];
  appointments?: string;
  staffCount?: string;
  additionalInfo?: string;
  marketingOptIn?: boolean;
  exteriorPhotoUrl?: string;
  interiorPhotoUrls?: string[];
  portfolioPhotoUrls?: string[];
  bankProofUrl?: string;
};

export function buildWorkingHoursSummary(details: BusinessRegistrationDetails): string {
  const days = details.operatingDays?.length ? details.operatingDays.join(", ") : "";
  const hours =
    details.openTime && details.closeTime ? `${details.openTime}–${details.closeTime}` : "";
  return [days, hours].filter(Boolean).join(" | ");
}

export function labelForOption<T extends { value: string; labelEn: string; labelEs: string }>(
  options: readonly T[],
  value: string,
  lang: "en" | "es",
): string {
  const row = options.find((o) => o.value === value);
  if (!row) return value;
  return lang === "es" ? row.labelEs : row.labelEn;
}
