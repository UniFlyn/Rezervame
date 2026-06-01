import { apiGet } from "./api";

export type SecurityPolicy = {
  minPasswordLength: number;
  sessionTimeoutMinutes: number;
  adminTwoFactorRequired: boolean;
};

const DEFAULTS: SecurityPolicy = {
  minPasswordLength: 8,
  sessionTimeoutMinutes: 60,
  adminTwoFactorRequired: true,
};

let cached: SecurityPolicy | null = null;
let cachedAt = 0;
const CACHE_MS = 60_000;

export async function fetchSecurityPolicy(force = false): Promise<SecurityPolicy> {
  if (!force && cached && Date.now() - cachedAt < CACHE_MS) {
    return cached;
  }
  try {
    const data = await apiGet<Partial<SecurityPolicy>>("/public/security-policy");
    cached = {
      minPasswordLength:
        typeof data.minPasswordLength === "number" && data.minPasswordLength >= 4
          ? data.minPasswordLength
          : DEFAULTS.minPasswordLength,
      sessionTimeoutMinutes:
        typeof data.sessionTimeoutMinutes === "number" && data.sessionTimeoutMinutes >= 5
          ? data.sessionTimeoutMinutes
          : DEFAULTS.sessionTimeoutMinutes,
      adminTwoFactorRequired: data.adminTwoFactorRequired !== false,
    };
    cachedAt = Date.now();
    return cached;
  } catch {
    return { ...DEFAULTS };
  }
}

export function passwordTooShort(password: string, minLength: number): boolean {
  return password.trim().length < minLength;
}

export function passwordLengthMessage(minLength: number, language: "en" | "es" = "en"): string {
  if (language === "es") {
    return `La contraseña debe tener al menos ${minLength} caracteres.`;
  }
  return `Password must be at least ${minLength} characters.`;
}

const SESSION_EXPIRES_KEY = "rezervame_session_expires_at";
const BUSINESS_SESSION_EXPIRES_KEY = "rezervame_business_session_expires_at";

export function storeSessionExpiry(
  role: "USER" | "BUSINESS",
  sessionExpiresAt?: string | null,
): void {
  if (typeof window === "undefined" || !sessionExpiresAt) return;
  const key = role === "BUSINESS" ? BUSINESS_SESSION_EXPIRES_KEY : SESSION_EXPIRES_KEY;
  localStorage.setItem(key, sessionExpiresAt);
}

export function clearSessionExpiry(role?: "USER" | "BUSINESS"): void {
  if (typeof window === "undefined") return;
  if (!role || role === "USER") localStorage.removeItem(SESSION_EXPIRES_KEY);
  if (!role || role === "BUSINESS") localStorage.removeItem(BUSINESS_SESSION_EXPIRES_KEY);
}

export function isSessionExpired(role: "USER" | "BUSINESS"): boolean {
  if (typeof window === "undefined") return false;
  const key = role === "BUSINESS" ? BUSINESS_SESSION_EXPIRES_KEY : SESSION_EXPIRES_KEY;
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  const expires = Date.parse(raw);
  if (!Number.isFinite(expires)) return false;
  return Date.now() >= expires;
}
