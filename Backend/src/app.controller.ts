import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  NotFoundException,
  ForbiddenException,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Business, Prisma, Role } from '@prisma/client';
import {
  canAccessBusinessMerchantSession,
  isBusinessPubliclyVisible,
  requireBusinessOwner,
  requireUser,
} from './auth.helpers';
import {
  businessDiscoveryWhere,
  evaluateBusinessProfileSetup,
  isBusinessDiscoverable,
} from './business/business-listing.util';
import {
  categoryKeysAndLabelsForPartner,
  displayCategoryLabelsForBusiness,
  displayLabelsForCategoryKeys,
  partnerTypeIdFromBusiness,
} from './business/business-categories.util';
import {
  mergeRegistrationDetails,
  persistRegistrationDetailsImages,
} from './business/registration-images.util';
import { buildAuthResponse } from './auth/auth-response.util';
import {
  assertPasswordMeetsPolicy,
  loadSecurityPolicy,
  maskEmailForDisplay,
} from './config/security-policy.util';
import { verifyFirebaseIdToken } from './auth/firebase-auth.util';
import { hashPassword, maybeUpgradePasswordHash, verifyPassword } from './auth/password.util';
import {
  finalizeBookingGroupPayment,
  finalizeBusinessBookingGroupPayment,
  calculateBookingSettlement,
  loadDefaultCommissionPercent,
  dedupeTransactionsByBookingGroup,
} from './payments/booking-payment.util';
import { publishPublicSiteStatus } from './config/public-site-status.util';
import { buildPublicPaymentConfig } from './payments/payment-config.util';
import { isWompiConfigured } from './payments/wompi/wompi.config';
import { isYappyConfigured } from './payments/yappy/yappy.config';
import { cancelBookingsForCustomer, enrichBookingCancellationFields } from './bookings/cancel-bookings.util';
import { formatCancellationPolicyMessage, normalizeCancellationPolicy } from './bookings/cancellation-policy.util';
import { randomBytes } from 'crypto';
import { WALK_IN_USER_EMAIL } from './constants';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateBusinessPanelDto } from './dto/update-business-panel.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CreateFamilyMemberDto, UpdateFamilyMemberDto } from './dto/family-member.dto';
import { allocateMerchantNumber } from './merchant-number.util';
import { PrismaService } from './prisma.service';
import { normalizePublicImageUrl } from './storage/normalize-image-url';
import {
  sendPlatformEmail,
  sendSms,
  loadMessagingConfig,
} from './notifications/notification-delivery.service';
import {
  adminConfigWithEnvFallbacks,
  resolvePostmarkConfig,
  resolvePostmarkConfigFromRow,
  resolveS3ConfigFromRow,
} from './config/system-integration.config';
import { formatPostmarkError, isValidEmailAddress } from './email/postmark-errors.util';
import { readPostmarkConfigFromEnv } from './email/postmark.config';
import {
  generateResetCode,
  hashResetCode,
  isPasswordResetBypassCode,
  resetCodeExpiresAt,
} from './auth/password-reset.util';
import {
  buildAdminRegistrationSections,
  buildPublicVenueDetails,
  collectRegistrationPhotoUrls,
} from './business/venue-details.util';
import {
  notifyBusinessAccount,
  notifyCustomerUser,
  notifyPlatformAdmins,
  notifyRoleBroadcast,
} from './notifications/notification-hub.service';
import {
  getVapidPublicKey as readVapidPublicKey,
  isWebPushConfigured,
  notificationUrlForType,
  sendWebPushToUser,
  upsertWebPushSubscription,
} from './notifications/web-push-delivery.service';
import {
  addSupportTicketReply,
  createSupportTicket,
  mapSupportTicketRow,
} from './support/support-ticket.util';
import { S3StorageService } from './storage/s3-storage.service';
import { defaultCategoryImageUrl } from './s3-defaults';
import {
  migrateBusinessCategoryKeys,
  PARTNER_BUSINESS_TYPES,
} from './config/partner-business-types';

const BUSINESS_BYPASS_PASSWORD =
  process.env.NODE_ENV !== 'production' ? process.env.BUSINESS_BYPASS_PASSWORD || 'password' : '';

/** Haversine distance in kilometers (WGS84). */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Human-readable distance for UI lists. */
function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function distanceLabelBetween(
  userLat: number | undefined,
  userLng: number | undefined,
  bizLat: number | null | undefined,
  bizLng: number | null | undefined,
): string {
  if (
    userLat === undefined ||
    userLng === undefined ||
    bizLat === null ||
    bizLat === undefined ||
    bizLng === null ||
    bizLng === undefined
  ) {
    return '';
  }
  const km = haversineKm(userLat, userLng, bizLat, bizLng);
  return formatDistanceKm(km);
}

function parseUserGeoQuery(userLat?: string, userLng?: string): { lat?: number; lng?: number } {
  const lat = userLat !== undefined ? Number.parseFloat(userLat) : NaN;
  const lng = userLng !== undefined ? Number.parseFloat(userLng) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return {};
  return { lat, lng };
}

async function ensureHardcodedPlans(prisma: any) {
  const count = await prisma.subscriptionPlan.count();
  if (count > 0) return;

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      billingCycle: 'monthly',
      features: ['Up to 50 bookings/month', 'Basic business profile', 'Email support'],
      active: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 29.0,
      billingCycle: 'monthly',
      features: ['Unlimited bookings', 'Marketing & Promotions', 'Advanced Analytics', '24/7 Priority support'],
      active: true,
    },
    {
      id: 'gold',
      name: 'Gold',
      price: 29.99,
      billingCycle: 'monthly',
      features: ['Unlimited Staff', 'Unlimited Service'],
      active: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.create({
      data: plan,
    });
  }
}

/** Human-facing category labels for listings (array + joined string for legacy clients). */
function displayCategoryLabels(b: Business): string[] {
  return displayCategoryLabelsForBusiness(b);
}

function tryParseDate(val?: string): Date | null {
  if (!val || typeof val !== 'string' || val === 'undefined' || val === 'null' || !val.trim()) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function getNextAvailableSlot(now: Date, bookings: any[], durationMin: number): string {
  const startHour = 9;
  const endHour = 18;
  let current = new Date(now);
  if (current.getHours() < startHour) {
    current.setHours(startHour, 0, 0, 0);
  }
  for (let d = 0; d < 7; d++) {
    const dayStart = new Date(current);
    dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(current);
    dayEnd.setHours(endHour, 0, 0, 0);
    let slot = new Date(Math.max(current.getTime(), dayStart.getTime()));
    while (slot.getTime() + durationMin * 60000 <= dayEnd.getTime()) {
      const isBooked = bookings.some(b => {
        const bStart = new Date(b.date).getTime();
        const bEnd = bStart + (b.service?.duration || 30) * 60000;
        const sStart = slot.getTime();
        const sEnd = sStart + durationMin * 60000;
        return (sStart < bEnd && sEnd > bStart);
      });
      if (!isBooked) {
        const today = new Date();
        const isToday = slot.getDate() === today.getDate() && slot.getMonth() === today.getMonth();
        const isTomorrow = slot.getDate() === (today.getDate() + 1) && slot.getMonth() === today.getMonth();
        const timeStr = slot.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        if (isToday) return `Today, ${timeStr}`;
        if (isTomorrow) return `Tomorrow, ${timeStr}`;
        return slot.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${timeStr}`;
      }
      slot = new Date(slot.getTime() + 30 * 60000);
    }
    current.setDate(current.getDate() + 1);
    current.setHours(startHour, 0, 0, 0);
  }
  return 'No slots';
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseMinutesFromTimeLabel(t: string): number {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 9 * 60;
  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + mins;
}

function formatMinutesToTimeLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function generateHalfHourSlotsFromRange(startLabel: string, endLabel: string): string[] {
  const startMins = parseMinutesFromTimeLabel(startLabel);
  let endMins = parseMinutesFromTimeLabel(endLabel);
  if (endMins <= startMins) endMins = startMins + 540;
  const slots: string[] = [];
  for (let mins = startMins; mins < endMins; mins += 30) {
    slots.push(formatMinutesToTimeLabel(mins));
  }
  return slots;
}

/** Today's bookable slot times from business profile working hours (JSON). */
function getTodaySlotTimings(workingHoursJson?: string | null): string {
  if (!workingHoursJson?.trim()) {
    return '9:00 AM – 6:00 PM';
  }
  try {
    const parsed = JSON.parse(workingHoursJson);
    if (!Array.isArray(parsed)) return '9:00 AM – 6:00 PM';
    const todayName = WEEKDAY_NAMES[new Date().getDay()];
    const match = parsed.find(
      (row: { day?: string }) => String(row?.day || '').toLowerCase() === todayName.toLowerCase(),
    );
    if (!match) return 'Closed today';
    const hours = String(match.hours || '').trim();
    if (!hours || hours.toLowerCase() === 'closed') return 'Closed today';
    if (hours.includes(' - ')) {
      const [start, end] = hours.split(' - ').map((s: string) => s.trim());
      const slots = generateHalfHourSlotsFromRange(start, end);
      if (slots.length === 0) return 'Closed today';
      if (slots.length <= 6) return slots.join(', ');
      return `${slots[0]} – ${slots[slots.length - 1]}`;
    }
    return hours;
  } catch {
    return '9:00 AM – 6:00 PM';
  }
}

/** Optional public event / registration link — https only. */
function normalizeEventWebsiteUrl(raw: unknown): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Web business panel shape (Prisma uses address/email/phone). */
function safeImageUrl(url: any): string | null {
  if (typeof url !== "string") return null;
  let s = url.trim();
  if (!s) return null;
  // Inline images stored on Business rows — allow up to ~1.5MB base64 in DB/JSON responses.
  if (s.startsWith("data:") && s.length > 1_500_000) {
    return null;
  }
  s = normalizePublicImageUrl(s) ?? s;
  return s;
}

/** List/search APIs: never embed base64 — keeps payloads small and pages load fast. */
function listImageUrl(url: any): string | null {
  const s = safeImageUrl(url);
  if (!s || s.startsWith("data:")) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  // Relative upload paths — Web and Mobile resolve against API origin.
  if (s.startsWith("/")) return s;
  return null;
}

/**
 * Controlled inline-data fallback for list/search cards.
 * Keeps payload bounded while still showing image when business has no http(s) URL yet.
 */
function listSmallInlineImageUrl(url: any, maxLen = 180_000): string | null {
  const s = safeImageUrl(url);
  if (!s || !s.startsWith("data:")) return null;
  if (s.length > maxLen) return null;
  return s;
}

/** Default category tile images when Admin/DB has no http(s) URL (S3 bucket). */
function publicCategoryImageUrl(key: string, stored: unknown): string | null {
  const fromDb = listImageUrl(stored);
  if (fromDb) return fromDb;
  return defaultCategoryImageUrl(key);
}

/** First HTTP gallery image for list cards — never embed base64 in list/search payloads. */
function firstListThumbnail(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  for (const img of images) {
    const u = listImageUrl(img) ?? listSmallInlineImageUrl(img);
    if (u) return u;
  }
  return null;
}

function collectServiceListImageUrls(services: { imageUrl?: string | null }[] = []) {
  const out: string[] = [];
  for (const s of services) {
    const u = listImageUrl(s.imageUrl) ?? listSmallInlineImageUrl(s.imageUrl);
    if (u && !out.includes(u)) out.push(u);
  }
  return out;
}

/** Gallery for venue cards and detail: service images, business gallery, banner, logo. */
function buildPortfolioImageUrls(opts: {
  services?: { imageUrl?: string | null }[];
  images?: unknown;
  bannerUrl?: unknown;
  logoUrl?: unknown;
}): string[] {
  const serviceListImages = collectServiceListImageUrls(opts.services || []);
  const galleryThumb = firstListThumbnail(opts.images);
  const bannerUrl = listImageUrl(opts.bannerUrl) ?? listSmallInlineImageUrl(opts.bannerUrl);
  const logoUrl = listImageUrl(opts.logoUrl) ?? listSmallInlineImageUrl(opts.logoUrl);
  const portfolioImageUrls: string[] = [];
  for (const u of serviceListImages) {
    if (!portfolioImageUrls.includes(u)) portfolioImageUrls.push(u);
  }
  if (galleryThumb && !portfolioImageUrls.includes(galleryThumb)) {
    portfolioImageUrls.push(galleryThumb);
  }
  for (const img of Array.isArray(opts.images) ? opts.images : []) {
    const u = listImageUrl(img) ?? listSmallInlineImageUrl(img);
    if (u && !portfolioImageUrls.includes(u)) portfolioImageUrls.push(u);
  }
  if (bannerUrl && !portfolioImageUrls.includes(bannerUrl)) {
    portfolioImageUrls.push(bannerUrl);
  }
  if (logoUrl && !portfolioImageUrls.includes(logoUrl)) {
    portfolioImageUrls.push(logoUrl);
  }
  return portfolioImageUrls;
}

function sanitizeMobileBusinessLite(b: any) {
  if (!b) return null;
  const images = Array.isArray(b.images)
    ? b.images.map((img: unknown) => listImageUrl(img)).filter(Boolean)
    : [];
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    phone: b.phone,
    email: b.email,
    taxPercentage: b.taxPercentage,
    logoUrl: listImageUrl(b.logoUrl),
    bannerUrl: listImageUrl(b.bannerUrl),
    categoryKeys: b.categoryKeys,
    latitude: b.latitude ?? null,
    longitude: b.longitude ?? null,
    images,
    appointmentApprovalMode: b.appointmentApprovalMode,
    cancellationAllowed: b.cancellationAllowed ?? true,
    cancellationHoursBefore: b.cancellationHoursBefore ?? 24,
  };
}

function sanitizeMobileServiceLite(s: any) {
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration,
    imageUrl: listImageUrl(s.imageUrl),
  };
}

/** Strip inline/base64 images from mobile booking payloads (keeps list responses fast). */
function sanitizeMobileBooking(b: any) {
  const out = { ...b };
  if (b.business) out.business = sanitizeMobileBusinessLite(b.business);
  if (b.service) out.service = sanitizeMobileServiceLite(b.service);
  if (b.staff) {
    out.staff = {
      id: b.staff.id,
      name: b.staff.name,
      role: b.staff.role,
    };
  }
  if (b.familyMember) {
    out.familyMember = {
      id: b.familyMember.id,
      name: b.familyMember.name,
    };
  }
  if (b.transaction) {
    out.transaction = {
      id: b.transaction.id,
      paymentMethod: b.transaction.paymentMethod,
      amount: b.transaction.amount,
    };
  }
  return enrichBookingCancellationFields(out);
}

function isCashPaymentMethod(method: string | null | undefined): boolean {
  if (!method) return false;
  const s = method.toLowerCase().trim();
  return (
    s.includes('cash') ||
    s.includes('at venue') ||
    s.includes('pay by visit') ||
    s.includes('pay at venue')
  );
}

function normalizeAppointmentApprovalMode(raw: string | null | undefined): 'manual' | 'automatic' {
  const m = String(raw ?? 'manual').toLowerCase().trim();
  if (
    m === 'automatic' ||
    m === 'auto' ||
    m.includes('automatic') ||
    m.includes('fully automatic') ||
    m.includes('ai-assisted')
  ) {
    return 'automatic';
  }
  return 'manual';
}

function isAutomaticAppointmentApproval(business: {
  appointmentApprovalMode?: string | null;
}): boolean {
  return normalizeAppointmentApprovalMode(business.appointmentApprovalMode) === 'automatic';
}

function initialBookingStatusForBusiness(business: {
  appointmentApprovalMode?: string | null;
}): 'Pending' | 'Approved' {
  return isAutomaticAppointmentApproval(business) ? 'Approved' : 'Pending';
}

function mapBusiness(b: Business | null) {
  if (!b) return null;
  const categories = displayCategoryLabels(b);
  return {
    id: b.id,
    name: b.name,
    logo: listImageUrl(b.logoUrl) ?? listSmallInlineImageUrl(b.logoUrl) ?? safeImageUrl(b.logoUrl),
    banner: listImageUrl(b.bannerUrl) ?? listSmallInlineImageUrl(b.bannerUrl) ?? safeImageUrl(b.bannerUrl),
    images: (() => {
      const fromGallery = Array.isArray((b as any).images) ? (b as any).images : [];
      const mapped = fromGallery
        .map((img: unknown) => listImageUrl(img) ?? listSmallInlineImageUrl(img))
        .filter(Boolean) as string[];
      if (mapped.length > 0) return mapped;
      const banner = listImageUrl(b.bannerUrl) ?? listSmallInlineImageUrl(b.bannerUrl);
      return banner ? [banner] : [];
    })(),
    description: b.description,
    category: categories.join(' · '),
    categories,
    location: b.address,
    latitude: b.latitude ?? null,
    longitude: b.longitude ?? null,
    contactEmail: b.email,
    contactPhone: b.phone,
    balance: b.balance,
    revenue: b.revenue,
    socialYoutube: b.socialYoutube || '',
    socialInstagram: b.socialInstagram || '',
    socialX: b.socialX || '',
    socialTiktok: b.socialTiktok || '',
    workingHours: b.workingHours || '',
    notifyBookingEmail: b.notifyBookingEmail,
    notifyCancellationEmail: b.notifyCancellationEmail,
    notifyDailySummary: b.notifyDailySummary,
    /** Same keys as business signup (`Category.key`) — used to scope service types in the panel. */
    categoryKeys: b.categoryKeys ?? [],
    amenityKeys: b.amenityKeys ?? [],
    status: b.status,
    planId: b.planId ?? 'basic',
    plan: b.plan ?? 'Basic',
    taxPercentage: b.taxPercentage ?? 0,
    appointmentApprovalMode: normalizeAppointmentApprovalMode(b.appointmentApprovalMode),
    cancellationAllowed: b.cancellationAllowed ?? true,
    cancellationHoursBefore: b.cancellationHoursBefore ?? 24,
    cancellationPolicyMessageEn: formatCancellationPolicyMessage(
      normalizeCancellationPolicy(b),
      'en',
    ),
    cancellationPolicyMessageEs: formatCancellationPolicyMessage(
      normalizeCancellationPolicy(b),
      'es',
    ),
    listingVisible: Boolean(b.listingVisible),
    profileSetupComplete: Boolean(b.profileSetupComplete),
    setupStatus: evaluateBusinessProfileSetup(b),
    owner: b.owner,
    taxId: b.taxId,
    businessType: partnerTypeIdFromBusiness(b.categoryKeys, b.registrationDetails),
    registrationDetails: b.registrationDetails ?? null,
    registrationSections: buildAdminRegistrationSections(b.registrationDetails),
  };
}

async function syncBusinessListingFlags(prisma: PrismaService, businessId: string) {
  const b = await prisma.business.findUnique({ where: { id: businessId } });
  if (!b) return null;
  const setup = evaluateBusinessProfileSetup(b);
  const data: Prisma.BusinessUpdateInput = {};
  if (setup.complete !== Boolean(b.profileSetupComplete)) {
    data.profileSetupComplete = setup.complete;
  }
  if (!setup.complete && b.listingVisible) {
    data.listingVisible = false;
  }
  if (Object.keys(data).length === 0) return b;
  return prisma.business.update({ where: { id: businessId }, data });
}

const SYSTEM_CONFIG_PATCH_KEYS = [
  'platformBranding',
  'defaultCommission',
  'slotHoldTime',
  'approvalMode',
  'twoFactorMandatory',
  'minPasswordLength',
  'sessionTimeout',
  'maintenanceMode',
  'databaseRetention',
  'googleMapsApiKey',
  'wompiEnabled',
  'wompiPublicKey',
  'wompiPrivateKey',
  'wompiEnv',
  'wompiWebhookSecret',
  'yappyEnabled',
  'yappyMerchantId',
  'yappySecretToken',
  'cashPayEnabled',
  'cardPayEnabled',
  'postmarkApiKey',
  'postmarkFromEmail',
  'postmarkReplyTo',
  'postmarkMessageStream',
  'postmarkWebhookToken',
  's3Region',
  's3BucketName',
  's3PublicBaseUrl',
  's3UploadPrefix',
  's3AccessKeyId',
  's3SecretAccessKey',
  'emailEnabled',
  'smsEnabled',
  'smtpHost',
  'smtpPort',
  'smtpSecure',
  'smtpUser',
  'smtpPass',
  'emailFrom',
  'adminNotifyEmail',
  'twilioAccountSid',
  'twilioAuthToken',
  'twilioFromNumber',
  'notifyNewTicketEmail',
  'notifyNewTicketSms',
  'socialFacebookUrl',
  'socialInstagramUrl',
  'socialLinkedinUrl',
  'appStoreUrl',
  'playStoreUrl',
  'showFooterDownloadApp',
  'footerAboutUrl',
  'showFooterAbout',
  'footerJobsUrl',
  'showFooterJobs',
  'footerPrivacyUrl',
  'showFooterPrivacy',
  'footerTermsUrl',
  'showFooterTerms',
  'footerHowUrl',
  'showFooterHow',
  'footerSupportUrl',
  'showFooterSupport',
  'footerEventsUrl',
  'showFooterEvents',
  'footerJoinUrl',
  'showFooterJoin',
  'footerBizLoginUrl',
  'showFooterBizLogin',
  'footerPricingUrl',
  'showFooterPricing',
  'footerBizSupportUrl',
  'showFooterBizSupport',
  'homeHeroEnabled',
  'homeHeroTitle',
  'homeHeroSubtitle',
  'homeHeroDealText',
  'homeHeroImageUrl',
  'homeHeroCtaText',
  'homeHeroCtaUrl',
  'updatedBy',
] as const;

const SYSTEM_CONFIG_BOOLEAN_KEYS = new Set([
  'twoFactorMandatory',
  'maintenanceMode',
  'wompiEnabled',
  'yappyEnabled',
  'cashPayEnabled',
  'cardPayEnabled',
  'emailEnabled',
  'smsEnabled',
  'smtpSecure',
  'notifyNewTicketEmail',
  'notifyNewTicketSms',
  'showFooterDownloadApp',
  'showFooterAbout',
  'showFooterJobs',
  'showFooterPrivacy',
  'showFooterTerms',
  'showFooterHow',
  'showFooterSupport',
  'showFooterEvents',
  'showFooterJoin',
  'showFooterBizLogin',
  'showFooterPricing',
  'showFooterBizSupport',
  'homeHeroEnabled',
]);

const SYSTEM_CONFIG_NUMBER_KEYS = new Set([
  'defaultCommission',
  'slotHoldTime',
  'minPasswordLength',
  'sessionTimeout',
  'databaseRetention',
  'smtpPort',
]);

const SYSTEM_CONFIG_SECRET_KEYS = new Set([
  'smtpPass',
  'twilioAuthToken',
  'wompiPrivateKey',
  'wompiWebhookSecret',
  'yappySecretToken',
  'postmarkApiKey',
  'postmarkWebhookToken',
  's3SecretAccessKey',
  's3AccessKeyId',
]);

function pickSystemConfigPatch(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of SYSTEM_CONFIG_PATCH_KEYS) {
    if (body[key] === undefined) continue;
    if (SYSTEM_CONFIG_SECRET_KEYS.has(key) && body[key] === '***') continue;
    if (SYSTEM_CONFIG_NUMBER_KEYS.has(key)) {
      const n = Number(body[key]);
      if (!Number.isNaN(n)) {
        if (key === 'minPasswordLength') {
          data[key] = Math.min(128, Math.max(4, Math.round(n)));
        } else if (key === 'sessionTimeout') {
          data[key] = Math.min(10_080, Math.max(5, Math.round(n)));
        } else {
          data[key] = n;
        }
      }
      continue;
    }
    if (SYSTEM_CONFIG_BOOLEAN_KEYS.has(key)) {
      data[key] = Boolean(body[key]);
      continue;
    }
    data[key] = body[key];
  }
  return data;
}

function maskSystemConfigSecrets(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  for (const key of SYSTEM_CONFIG_SECRET_KEYS) {
    if (out[key]) out[key] = '***';
  }
  return out;
}

function enrichAdminConfig(row: Record<string, unknown>): Record<string, unknown> {
  const merged = adminConfigWithEnvFallbacks(row);
  const masked = maskSystemConfigSecrets(merged);
  return {
    ...masked,
    integrationStatus: {
      postmark: Boolean(resolvePostmarkConfigFromRow(merged)),
      s3: Boolean(resolveS3ConfigFromRow(merged)),
      wompi: isWompiConfigured(merged as Record<string, unknown>),
      yappy: isYappyConfigured(merged as Record<string, unknown>),
    },
  };
}

async function loadSystemConfigSafe(prisma: PrismaService) {
  const baseSelect = {
    id: true,
    platformBranding: true,
    defaultCommission: true,
    platformBalance: true,
    slotHoldTime: true,
    approvalMode: true,
    twoFactorMandatory: true,
    minPasswordLength: true,
    sessionTimeout: true,
    maintenanceMode: true,
    databaseRetention: true,
    updatedAt: true,
    updatedBy: true,
  } as const;
  try {
    let row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await prisma.systemConfig.create({ data: { id: 1 } });
    }
    return row;
  } catch {
    const row = await prisma.systemConfig.findFirst({ select: baseSelect });
    if (row) return row;
    return prisma.systemConfig.create({
      data: { id: 1 },
      select: baseSelect,
    });
  }
}

async function resolveBookingCreateUser(prisma: PrismaService, body: CreateBookingDto): Promise<string> {
  const invalidLegacy = !body.userId || body.userId === 'offline-user';
  if (!invalidLegacy && body.userId) return body.userId;
  const guest = await prisma.user.findUnique({ where: { email: WALK_IN_USER_EMAIL } });
  if (!guest) {
    throw new BadRequestException('Walk-in profile not configured. Run prisma seed.');
  }
  return guest.id;
}

function mapBusinessPatch(body: UpdateBusinessPanelDto): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.location !== undefined) data.address = body.location;
  if (body.contactEmail !== undefined) data.email = body.contactEmail;
  if (body.contactPhone !== undefined) data.phone = body.contactPhone;
  if (body.balance !== undefined) data.balance = body.balance;
  if (body.categories !== undefined) {
    const labels = body.categories.map((c) => String(c).trim()).filter(Boolean);
    data.categoryLabels = labels;
    data.categoryLabel = labels.length > 0 ? labels.join(' · ') : null;
  } else if (body.category !== undefined) {
    const t = String(body.category).trim();
    data.categoryLabel = t || null;
    data.categoryLabels = t ? [t] : [];
  }
  if (body.logo !== undefined) data.logoUrl = body.logo?.trim() ? safeImageUrl(body.logo.trim()) : null;
  if (body.banner !== undefined) data.bannerUrl = body.banner?.trim() ? safeImageUrl(body.banner.trim()) : null;
  if (body.images !== undefined) {
    const list = Array.isArray(body.images) ? body.images : [];
    data.images = list
      .map((img) => (typeof img === 'string' ? safeImageUrl(img.trim()) : null))
      .filter((u): u is string => Boolean(u))
      .slice(0, 16);
  }
  if (body.amenityKeys !== undefined) data.amenityKeys = body.amenityKeys;
  if (body.socialYoutube !== undefined) data.socialYoutube = body.socialYoutube;
  if (body.socialInstagram !== undefined) data.socialInstagram = body.socialInstagram;
  if (body.socialX !== undefined) data.socialX = body.socialX;
  if (body.socialTiktok !== undefined) data.socialTiktok = body.socialTiktok;
  if (body.workingHours !== undefined) data.workingHours = body.workingHours;
  if (body.notifyBookingEmail !== undefined) data.notifyBookingEmail = body.notifyBookingEmail;
  if (body.notifyCancellationEmail !== undefined) data.notifyCancellationEmail = body.notifyCancellationEmail;
  if (body.notifyDailySummary !== undefined) data.notifyDailySummary = body.notifyDailySummary;
  if (body.latitude !== undefined) data.latitude = body.latitude;
  if (body.longitude !== undefined) data.longitude = body.longitude;
  if (body.taxPercentage !== undefined) data.taxPercentage = body.taxPercentage;
  if (body.appointmentApprovalMode !== undefined) {
    data.appointmentApprovalMode = normalizeAppointmentApprovalMode(body.appointmentApprovalMode);
  }
  if (body.cancellationAllowed !== undefined) {
    data.cancellationAllowed = Boolean(body.cancellationAllowed);
  }
  if (body.cancellationHoursBefore !== undefined) {
    const h = Number(body.cancellationHoursBefore);
    if (!Number.isFinite(h) || h < 0 || h > 168) {
      throw new BadRequestException('cancellationHoursBefore must be between 0 and 168');
    }
    data.cancellationHoursBefore = Math.floor(h);
    if (data.cancellationAllowed === undefined && h >= 0) {
      data.cancellationAllowed = true;
    }
  }
  if (body.cancellationAllowed === false) {
    data.cancellationHoursBefore = 0;
  }
  if (body.planId !== undefined) data.planId = body.planId;
  if (body.plan !== undefined) data.plan = body.plan;
  if (body.owner !== undefined) data.owner = String(body.owner).trim();
  if (body.taxId !== undefined) data.taxId = String(body.taxId).trim();
  if (body.categoryKeys !== undefined) {
    data.categoryKeys = migrateBusinessCategoryKeys(
      body.categoryKeys,
      typeof body.businessType === 'string' ? body.businessType : undefined,
    );
    data.categoryLabels = displayLabelsForCategoryKeys(
      data.categoryKeys as string[],
      body.registrationDetails,
    );
    data.categoryLabel =
      (data.categoryLabels as string[]).length > 0
        ? (data.categoryLabels as string[]).join(' · ')
        : null;
  }
  if (body.businessType !== undefined && body.categoryKeys === undefined) {
    const { categoryKeys, categoryLabels } = categoryKeysAndLabelsForPartner(
      body.businessType,
      undefined,
    );
    data.categoryKeys = categoryKeys;
    data.categoryLabels = categoryLabels;
    data.categoryLabel = categoryLabels.length > 0 ? categoryLabels.join(' · ') : null;
  }
  return data;
}

function applyListingVisibilityPatch(
  business: Business,
  body: UpdateBusinessPanelDto,
  data: Record<string, unknown>,
) {
  if (body.listingVisible === undefined) return;
  const wantsVisible = Boolean(body.listingVisible);
  if (wantsVisible) {
    const setup = evaluateBusinessProfileSetup(business);
    if (!setup.canEnableListing) {
      throw new BadRequestException(
        'Complete required profile setup (logo, banner, photos, hours, and map location) before going visible on the app and web.',
      );
    }
  }
  data.listingVisible = wantsVisible;
}

async function mapBusinessPatchWithS3(
  body: UpdateBusinessPanelDto,
  s3: S3StorageService,
): Promise<Record<string, unknown>> {
  const data = mapBusinessPatch(body);
  if (body.logo !== undefined) {
    data.logoUrl = body.logo?.trim()
      ? await s3.persistImageUrl(body.logo.trim(), 'venues/logos')
      : null;
  }
  if (body.banner !== undefined) {
    data.bannerUrl = body.banner?.trim()
      ? await s3.persistImageUrl(body.banner.trim(), 'venues/banners')
      : null;
  }
  if (body.images !== undefined) {
    const list = Array.isArray(body.images) ? body.images : [];
    const out: string[] = [];
    for (const img of list.slice(0, 16)) {
      if (typeof img !== 'string') continue;
      const url = await s3.persistImageUrl(img.trim(), 'venues/gallery');
      if (url) out.push(url);
    }
    data.images = out;
  }
  return data;
}

/** Maps seeded [Service.category] text to Mobile/Web category keys. */
function categoryKeyFromServiceCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('tattoo') || c.includes('tatuaj')) return 'tattoo';
  if (c.includes('yoga') || c.includes('pilates') || c.includes('fitness')) return 'yoga';
  if (c.includes('dermat') || c.includes('clinic') || c.includes('clínica')) return 'dermatology';
  if (c.includes('estetic') || c.includes('aesthetic')) return 'estetica';
  if (c.includes('nail') || c.includes('uñ')) return 'nailCare';
  if (c.includes('massage') || c.includes('masaje')) return 'massage';
  if (c.includes('spa') || c.includes('wellness')) return 'spaService';
  if (c.includes('barber') || c.includes('groom')) return 'barber';
  if (c.includes('beauty') || c.includes('facial') || c.includes('wax')) return 'beautyService';
  return 'hairService';
}

/** Category keys used for home counts and `/mobile/venues?category=` — business tags + service categories. */
function businessEffectiveCategoryKeys(
  categoryKeys: string[] | null | undefined,
  services: { category: string }[] | null | undefined,
): Set<string> {
  const keys = new Set<string>();
  for (const k of categoryKeys ?? []) {
    if (k) keys.add(k);
  }
  for (const row of services ?? []) {
    const cat = row?.category;
    if (cat) keys.add(categoryKeyFromServiceCategory(cat));
  }
  return keys;
}

function businessMatchesCategoryFilter(
  categoryKeys: string[] | null | undefined,
  services: { category: string }[] | null | undefined,
  filterKeys: string[],
): boolean {
  if (!filterKeys.length) return true;
  const effective = businessEffectiveCategoryKeys(categoryKeys, services);
  return filterKeys.some((k) => effective.has(k));
}

@Controller('api')
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Storage: S3StorageService,
  ) {}

  /** Upload data-URL images to S3 when configured; pass through https URLs. */
  private async storeImage(value: string | null | undefined, folder: string): Promise<string | null> {
    if (value == null || !String(value).trim()) return null;
    return this.s3Storage.persistImageUrl(String(value).trim(), folder);
  }

  @Get('admin/config')
  async getAdminConfig(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const row = await loadSystemConfigSafe(this.prisma);
    return enrichAdminConfig(row as Record<string, unknown>);
  }

  @Post('admin/config')
  async updateAdminConfig(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const data = pickSystemConfigPatch(body);
    if (data.homeHeroImageUrl !== undefined) {
      data.homeHeroImageUrl = await this.storeImage(String(data.homeHeroImageUrl || ''), 'site/hero');
    }
    if (Object.keys(data).length === 0) {
      const row = await loadSystemConfigSafe(this.prisma);
      return enrichAdminConfig(row as Record<string, unknown>);
    }
    try {
      const row = await this.prisma.systemConfig.upsert({
        where: { id: 1 },
        update: data,
        create: { ...data, id: 1 },
      });
      const enriched = enrichAdminConfig(row as Record<string, unknown>);
      void publishPublicSiteStatus(this.prisma, this.s3Storage, enriched).catch(() => undefined);
      return enriched;
    } catch {
      const patch = pickSystemConfigPatch(body);
      for (const key of SYSTEM_CONFIG_SECRET_KEYS) {
        delete patch[key];
      }
      delete patch.googleMapsApiKey;
      const row = await this.prisma.systemConfig.upsert({
        where: { id: 1 },
        update: patch,
        create: { ...patch, id: 1 },
      });
      const enriched = enrichAdminConfig(row as Record<string, unknown>);
      void publishPublicSiteStatus(this.prisma, this.s3Storage, enriched).catch(() => undefined);
      return enriched;
    }
  }

  @Post('admin/publish-site-status')
  async publishSiteStatus(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const row = await loadSystemConfigSafe(this.prisma);
    const url = await publishPublicSiteStatus(
      this.prisma,
      this.s3Storage,
      row as Record<string, unknown>,
    );
    const status = {
      maintenanceMode: (row as { maintenanceMode?: boolean }).maintenanceMode === true,
      platformBranding:
        typeof (row as { platformBranding?: string }).platformBranding === 'string'
          ? (row as { platformBranding: string }).platformBranding
          : 'Rezervame',
    };
    return { ok: true, url, ...status };
  }


  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    const raw = body.email.trim();
    const lower = raw.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: raw }, { email: lower }] },
    });
    const isBusinessBypass =
      user?.role === Role.BUSINESS &&
      BUSINESS_BYPASS_PASSWORD &&
      body.password === BUSINESS_BYPASS_PASSWORD;
    const passwordOk = user ? await verifyPassword(body.password, user.password) : false;
    if (!user || (!passwordOk && !isBusinessBypass)) {
      throw new BadRequestException('Invalid credentials');
    }
    if ((user.status || '').toLowerCase() === 'blocked') {
      throw new BadRequestException('Your account has been suspended. Contact support.');
    }
    const upgraded = await maybeUpgradePasswordHash(body.password, user.password);
    if (upgraded) {
      await this.prisma.user.update({ where: { id: user.id }, data: { password: upgraded } });
    }
    const policy = await loadSecurityPolicy(this.prisma);
    if (user.role === Role.ADMIN && policy.adminTwoFactorRequired) {
      const code = generateResetCode();
      const expiresAt = resetCodeExpiresAt();
      await this.prisma.passwordResetCode.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await this.prisma.passwordResetCode.create({
        data: {
          userId: user.id,
          email: user.email.toLowerCase(),
          codeHash: hashResetCode(code),
          expiresAt,
        },
      });
      void sendPlatformEmail(this.prisma, {
        to: user.email,
        template: 'admin-sign-in-code',
        model: { code },
      });
      return {
        twoFactorRequired: true,
        email: maskEmailForDisplay(user.email),
        message: 'Enter the verification code sent to your email.',
      };
    }
    return buildAuthResponse(this.prisma, user);
  }

  @Post('auth/admin-verify-2fa')
  async adminVerifyTwoFactor(@Body() body: { email?: string; code?: string }) {
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();
    if (!email || !code) {
      throw new BadRequestException('Email and verification code are required');
    }
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.ADMIN) {
      throw new BadRequestException('Invalid verification code');
    }
    if ((user.status || '').toLowerCase() === 'blocked') {
      throw new BadRequestException('Your account has been suspended. Contact support.');
    }
    const policy = await loadSecurityPolicy(this.prisma);
    if (!policy.adminTwoFactorRequired) {
      return buildAuthResponse(this.prisma, user);
    }
    if (isPasswordResetBypassCode(code)) {
      return buildAuthResponse(this.prisma, user);
    }
    const row = await this.findValidPasswordResetCode(email, code);
    if (!row) throw new BadRequestException('Invalid or expired verification code');
    await this.prisma.passwordResetCode.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    return buildAuthResponse(this.prisma, user);
  }

  @Post('auth/check-email')
  async checkEmail(@Body() body: CheckEmailDto) {
    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    return { exists: !!user };
  }

  @Post('auth/register')
  async registerCustomer(@Body() body: RegisterCustomerDto) {
    const email = body.email.trim().toLowerCase();
    const taken = await this.prisma.user.findUnique({ where: { email } });
    if (taken) throw new BadRequestException('Email already registered');
    const policy = await loadSecurityPolicy(this.prisma);
    assertPasswordMeetsPolicy(body.password, policy);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: await hashPassword(body.password),
        name: body.name.trim(),
        role: Role.USER,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        gender: body.gender?.trim() || null,
        age: body.age ?? null,
      },
    });
    void sendPlatformEmail(this.prisma, {
      to: email,
      template: 'welcome-client',
      model: { userName: user.name, customerName: user.name },
    }).catch(() => undefined);
    return buildAuthResponse(this.prisma, user);
  }

  private async findValidPasswordResetCode(email: string, code: string) {
    const normalized = email.trim().toLowerCase();
    const hash = hashResetCode(code.trim());
    const now = new Date();
    return this.prisma.passwordResetCode.findFirst({
      where: {
        email: normalized,
        codeHash: hash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('auth/forgot-password')
  async forgotPassword(@Body() body: { email?: string }) {
    const email = (body.email || '').trim().toLowerCase();
    if (!email) throw new BadRequestException('Email is required');

    const generic = {
      ok: true,
      message: 'If an account exists, a verification code was sent.',
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.USER) {
      return generic;
    }
    if ((user.status || '').toLowerCase() === 'blocked') {
      return generic;
    }

    const code = generateResetCode();
    const expiresAt = resetCodeExpiresAt();

    await this.prisma.passwordResetCode.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        email,
        codeHash: hashResetCode(code),
        expiresAt,
      },
    });

    void sendPlatformEmail(this.prisma, {
      to: email,
      template: 'password-reset',
      model: {
        userName: user.name,
        verificationCode: code,
        resetCode: code,
        expiresIn: '15 minutes',
      },
    });

    const out: Record<string, unknown> = { ...generic };
    if (process.env.NODE_ENV !== 'production' && !(await resolvePostmarkConfig(this.prisma))) {
      out.devCode = code;
    }
    return out;
  }

  private async assertPasswordResetUser(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== Role.USER) {
      throw new BadRequestException('Invalid or expired code');
    }
    if ((user.status || '').toLowerCase() === 'blocked') {
      throw new BadRequestException('Invalid or expired code');
    }
    return user;
  }

  @Post('auth/verify-reset-code')
  async verifyResetCode(@Body() body: { email?: string; code?: string }) {
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();
    if (!email || !code) {
      throw new BadRequestException('Email and code are required');
    }
    if (isPasswordResetBypassCode(code)) {
      await this.assertPasswordResetUser(email);
      return { ok: true };
    }
    const row = await this.findValidPasswordResetCode(email, code);
    if (!row) throw new BadRequestException('Invalid or expired code');
    return { ok: true };
  }

  @Post('auth/reset-password')
  async resetPasswordWithCode(
    @Body() body: { email?: string; code?: string; newPassword?: string },
  ) {
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();
    const newPassword = (body.newPassword || '').trim();
    if (!email || !code || !newPassword) {
      throw new BadRequestException('Email, code, and new password are required');
    }
    const policy = await loadSecurityPolicy(this.prisma);
    assertPasswordMeetsPolicy(newPassword, policy);

    if (isPasswordResetBypassCode(code)) {
      const user = await this.assertPasswordResetUser(email);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(newPassword) },
      });
      return { ok: true, message: 'Password updated successfully' };
    }

    const row = await this.findValidPasswordResetCode(email, code);
    if (!row) throw new BadRequestException('Invalid or expired code');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { password: await hashPassword(newPassword) },
      }),
      this.prisma.passwordResetCode.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true, message: 'Password updated successfully' };
  }

  @Post('auth/google')
  async googleAuth(@Body() body: { idToken: string; name?: string }) {
    const idToken = (body.idToken || '').trim();
    if (!idToken) throw new BadRequestException('idToken is required');
    const firebaseUser = await verifyFirebaseIdToken(idToken);
    if (!firebaseUser) {
      throw new BadRequestException('Invalid or expired Google sign-in. Check Firebase server credentials.');
    }
    let user = await this.prisma.user.findUnique({ where: { email: firebaseUser.email } });
    if (!user) {
      const unusablePassword = randomBytes(32).toString('hex');
      user = await this.prisma.user.create({
        data: {
          email: firebaseUser.email,
          password: await hashPassword(unusablePassword),
          name: (body.name || firebaseUser.name || 'User').trim(),
          role: Role.USER,
        },
      });
    }
    if (user.role !== Role.USER) {
      throw new BadRequestException('This email is registered as a business or admin account. Use email login.');
    }
    if ((user.status || '').toLowerCase() === 'blocked') {
      throw new BadRequestException('Your account has been suspended. Contact support.');
    }
    return buildAuthResponse(this.prisma, user);
  }

  @Get('public/security-policy')
  async getPublicSecurityPolicy() {
    const policy = await loadSecurityPolicy(this.prisma);
    return {
      minPasswordLength: policy.minPasswordLength,
      sessionTimeoutMinutes: policy.sessionTimeoutMinutes,
      adminTwoFactorRequired: policy.adminTwoFactorRequired,
    };
  }

  @Get('public/push/vapid-public-key')
  getPublicVapidKey() {
    const publicKey = readVapidPublicKey();
    return {
      publicKey: publicKey || null,
      configured: isWebPushConfigured(),
    };
  }

  @Get('push/status')
  async getPushStatus(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [
      Role.USER,
      Role.BUSINESS,
      Role.ADMIN,
    ]);
    const count = await this.prisma.webPushSubscription.count({
      where: { userId: user.id },
    });
    return {
      configured: isWebPushConfigured(),
      enabled: user.webPushEnabled,
      subscribed: count > 0,
      subscriptionCount: count,
    };
  }

  @Post('push/subscribe')
  async subscribePush(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    },
    @Headers('user-agent') userAgent?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [
      Role.USER,
      Role.BUSINESS,
      Role.ADMIN,
    ]);
    if (!isWebPushConfigured()) {
      throw new BadRequestException(
        'Browser push is not configured on the server (VAPID keys missing).',
      );
    }
    await upsertWebPushSubscription(this.prisma, user.id, {
      endpoint: body.endpoint,
      keys: body.keys,
      userAgent,
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { webPushEnabled: true },
    });
    return { ok: true };
  }

  @Delete('push/unsubscribe')
  async unsubscribePush(
    @Headers('authorization') authorization?: string,
    @Query('endpoint') endpoint?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [
      Role.USER,
      Role.BUSINESS,
      Role.ADMIN,
    ]);
    if (endpoint?.trim()) {
      await this.prisma.webPushSubscription.deleteMany({
        where: { userId: user.id, endpoint: endpoint.trim() },
      });
    } else {
      await this.prisma.webPushSubscription.deleteMany({
        where: { userId: user.id },
      });
    }
    const remaining = await this.prisma.webPushSubscription.count({
      where: { userId: user.id },
    });
    if (remaining === 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { webPushEnabled: false },
      });
    }
    return { ok: true };
  }

  @Patch('push/preferences')
  async updatePushPreferences(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { enabled?: boolean },
  ) {
    const user = await requireUser(this.prisma, authorization, [
      Role.USER,
      Role.BUSINESS,
      Role.ADMIN,
    ]);
    if (body.enabled === false) {
      await this.prisma.webPushSubscription.deleteMany({
        where: { userId: user.id },
      });
      await this.prisma.user.update({
        where: { id: user.id },
        data: { webPushEnabled: false },
      });
      return { enabled: false, subscribed: false };
    }
    if (body.enabled === true) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { webPushEnabled: true },
      });
      const count = await this.prisma.webPushSubscription.count({
        where: { userId: user.id },
      });
      return { enabled: true, subscribed: count > 0 };
    }
    return {
      enabled: user.webPushEnabled,
      subscribed:
        (await this.prisma.webPushSubscription.count({
          where: { userId: user.id },
        })) > 0,
    };
  }

  @Post('push/test')
  async testPush(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [
      Role.USER,
      Role.BUSINESS,
      Role.ADMIN,
    ]);
    if (!isWebPushConfigured()) {
      throw new BadRequestException('VAPID keys not configured');
    }
    const result = await sendWebPushToUser(this.prisma, user.id, {
      title: 'Rezervame',
      body: 'Browser push notifications are working.',
      url: notificationUrlForType('test', user.role),
      tag: 'test',
    });
    return result;
  }

  @Get('public/site/footer')
  async getPublicSiteFooter() {
    const cfg = await loadSystemConfigSafe(this.prisma);
    const row = cfg as Record<string, unknown>;
    const trimUrl = (v: unknown) => {
      const s = typeof v === 'string' ? v.trim() : '';
      return s || null;
    };
    const buildNavLink = (
      enabled: unknown,
      url: unknown,
      defaultUrl: string,
      labelKey: string,
    ) => {
      if (enabled === false) return null;
      const href = trimUrl(url) || defaultUrl;
      return {
        labelKey,
        url: href,
        external: /^https?:\/\//i.test(href),
      };
    };
    const showFooterDownloadApp = row.showFooterDownloadApp !== false;
    const appStoreUrl = trimUrl(row.appStoreUrl);
    const playStoreUrl = trimUrl(row.playStoreUrl);
    const clientLinks = [
      showFooterDownloadApp
        ? buildNavLink(true, null, '/download', 'footerDownload')
        : null,
      buildNavLink(row.showFooterHow, row.footerHowUrl, '/how-it-works', 'footerHow'),
      buildNavLink(row.showFooterSupport, row.footerSupportUrl, '/customer-service', 'footerSupport'),
      buildNavLink(row.showFooterEvents, row.footerEventsUrl, '/events', 'footerEvents'),
    ].filter(Boolean);
    const businessLinks = [
      buildNavLink(row.showFooterJoin, row.footerJoinUrl, '/business/join', 'footerJoin'),
      buildNavLink(row.showFooterBizLogin, row.footerBizLoginUrl, '/business/login', 'footerApp'),
      buildNavLink(row.showFooterPricing, row.footerPricingUrl, '/pricing', 'footerPrices'),
      buildNavLink(row.showFooterBizSupport, row.footerBizSupportUrl, '/business/support', 'footerSupportBiz'),
    ].filter(Boolean);
    const legalLinks = [
      buildNavLink(row.showFooterAbout, row.footerAboutUrl, '/about', 'footerAboutUs'),
      buildNavLink(row.showFooterJobs, row.footerJobsUrl, '/jobs', 'footerJobs'),
      buildNavLink(row.showFooterPrivacy, row.footerPrivacyUrl, '/privacy', 'footerPrivacy'),
      buildNavLink(row.showFooterTerms, row.footerTermsUrl, '/terms', 'footerTerms'),
    ].filter(Boolean);
    return {
      socialFacebookUrl: trimUrl(row.socialFacebookUrl),
      socialInstagramUrl: trimUrl(row.socialInstagramUrl),
      socialLinkedinUrl: trimUrl(row.socialLinkedinUrl),
      appStoreUrl,
      playStoreUrl,
      showFooterDownloadApp,
      showDownloadSection:
        showFooterDownloadApp && Boolean(appStoreUrl || playStoreUrl),
      clientLinks,
      businessLinks,
      legalLinks,
    };
  }

  @Get('public/site/status')
  async getPublicSiteStatus() {
    const cfg = await loadSystemConfigSafe(this.prisma);
    const row = cfg as Record<string, unknown>;
    const branding =
      typeof row.platformBranding === 'string' && row.platformBranding.trim()
        ? row.platformBranding.trim()
        : 'Rezervame';
    return {
      maintenanceMode: row.maintenanceMode === true,
      platformBranding: branding,
    };
  }

  @Get('public/site/hero')
  async getPublicSiteHero() {
    const cfg = await loadSystemConfigSafe(this.prisma);
    const row = cfg as Record<string, unknown>;
    const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    const asBool = (v: unknown) => v !== false;
    const imageRaw = trim(row.homeHeroImageUrl);
    const ctaUrlRaw = trim(row.homeHeroCtaUrl);
    return {
      enabled: asBool(row.homeHeroEnabled),
      title: trim(row.homeHeroTitle) || null,
      subtitle: trim(row.homeHeroSubtitle) || null,
      dealText: trim(row.homeHeroDealText) || null,
      imageUrl: imageRaw ? safeImageUrl(imageRaw) : null,
      ctaText: trim(row.homeHeroCtaText) || null,
      ctaUrl: ctaUrlRaw || null,
      ctaExternal: /^https?:\/\//i.test(ctaUrlRaw),
    };
  }

  @Get('public/payment-config')
  async getPaymentConfig() {
    return buildPublicPaymentConfig(this.prisma);
  }

  @Get('public/customer-service/faqs')
  async getPublicCustomerServiceFaqs() {
    const rows = await this.prisma.customerServiceFaq.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((f) => ({
      id: f.id,
      questionEn: f.questionEn,
      questionEs: f.questionEs,
      answerEn: f.answerEn,
      answerEs: f.answerEs,
      sortOrder: f.sortOrder,
    }));
  }

  /** Current merchant profile — no persisted client snapshot; call after login or on panel load. */
  @Get('auth/business-session')
  async getBusinessSession(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.BUSINESS]);
    const b = await this.prisma.business.findUnique({ where: { email: user.email } });
    if (!b) return null;
    if (!(await canAccessBusinessMerchantSession(this.prisma, b, authorization))) return null;
    const synced = await syncBusinessListingFlags(this.prisma, b.id);
    return mapBusiness(synced ?? b);
  }

  /** Current customer profile for web/mobile clients holding a USER session token. */
  @Get('auth/user-session')
  async getUserSession(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      avatar: user.avatar ?? null,
      address: user.address ?? '',
      gender: user.gender ?? '',
      age: user.age ?? null,
      webPushEnabled: user.webPushEnabled,
    };
  }

  @Patch('auth/user-session')
  async updateUserSession(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { name?: string; phone?: string; email?: string; avatar?: string; gender?: string }
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    
    // Check if new email is already taken by someone else
    if (body.email && body.email.trim().toLowerCase() !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: body.email.trim().toLowerCase() }
      });
      if (existing) {
        throw new BadRequestException('Email already in use by another account');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
        ...(body.email !== undefined ? { email: body.email.trim().toLowerCase() } : {}),
        ...(body.avatar !== undefined
          ? { avatar: await this.storeImage(body.avatar, 'avatars') }
          : {}),
        ...(body.gender !== undefined ? { gender: body.gender.trim() || null } : {}),
      }
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone ?? '',
      avatar: updatedUser.avatar ?? null,
      address: updatedUser.address ?? '',
      gender: updatedUser.gender ?? '',
      age: updatedUser.age ?? null,
      webPushEnabled: updatedUser.webPushEnabled,
    };
  }

  @Patch('auth/user-password')
  async updateUserPassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { currentPassword?: string; newPassword?: string }
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Current and new password are required');
    }

    const currentOk = await verifyPassword(body.currentPassword, user.password);
    if (!currentOk) {
      throw new BadRequestException('Incorrect current password');
    }

    const policy = await loadSecurityPolicy(this.prisma);
    assertPasswordMeetsPolicy(body.newPassword, policy);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(body.newPassword) },
    });

    return { ok: true };
  }

  /** Validates admin token for the Admin SPA — no role cached in localStorage. */
  @Get('auth/admin-session')
  async getAdminSession(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.ADMIN]);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  @Get('admin/dashboard')
  async getAdminDashboard(
    @Headers('authorization') authorization?: string,
    @Query('range') rangeQuery?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const range = ['day', 'week', 'month', 'ytd'].includes(String(rangeQuery || '').toLowerCase())
      ? String(rangeQuery).toLowerCase()
      : 'ytd';
    const now = new Date();

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    let periodStart = new Date(now);
    let periodEnd = endOfToday;
    let prevStart = new Date(now);
    let prevEnd = new Date(now);

    if (range === 'day') {
      periodStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(periodStart.getTime() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      periodStart.setDate(now.getDate() - 6);
      periodStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(periodStart.getTime() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);
      prevStart.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      prevEnd = new Date(periodStart.getTime() - 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    } else {
      periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );
    }

    const aggregatePeriod = async (start: Date, end: Date) => {
      const bookingWhere = { date: { gte: start, lte: end } };
      const txWhere = { date: { gte: start, lte: end }, status: 'Completed' };
      const [
        activeBusinesses,
        newBusinesses,
        bookingCount,
        bookingRevenueAgg,
        commissionAgg,
        userRegistrations,
        bookerGroups,
        pendingApprovals,
      ] = await Promise.all([
        this.prisma.business.count({ where: { status: 'active' } }),
        this.prisma.business.count({
          where: { joinedDate: { gte: start, lte: end } },
        }),
        this.prisma.booking.count({ where: bookingWhere }),
        this.prisma.booking.aggregate({
          where: bookingWhere,
          _sum: { price: true },
        }),
        this.prisma.transaction.aggregate({
          where: txWhere,
          _sum: { commissionAmount: true },
        }),
        this.prisma.user.count({
          where: { role: Role.USER, createdAt: { gte: start, lte: end } },
        }),
        this.prisma.booking.groupBy({
          by: ['userId'],
          where: bookingWhere,
        }),
        this.prisma.business.count({ where: { status: 'pending' } }),
      ]);
      const bookings = bookingCount;
      const grossBookingValue = bookingRevenueAgg._sum.price ?? 0;
      const revenue = commissionAgg._sum.commissionAmount ?? 0;
      const distinctBookers = bookerGroups.length;
      const avgBookingValue = bookings > 0 ? grossBookingValue / bookings : 0;
      const bookingsPerCustomer = distinctBookers > 0 ? bookings / distinctBookers : 0;
      const revenuePerCustomer = distinctBookers > 0 ? revenue / distinctBookers : 0;
      const customersPerBooking = bookings > 0 ? distinctBookers / bookings : 0;
      return {
        businesses: activeBusinesses,
        newBusinesses,
        users: userRegistrations,
        bookings,
        revenue,
        pendingApprovals,
        avgBookingValue,
        distinctBookers,
        bookingsPerCustomer,
        revenuePerCustomer,
        customersPerBooking,
      };
    };

    const startOfRollingWeek = new Date(now);
    startOfRollingWeek.setDate(now.getDate() - 6);
    startOfRollingWeek.setHours(0, 0, 0, 0);

    const [current, previous, recentActivities, bookingsLastWeek, txsSixMo, systemConfig] =
      await Promise.all([
        aggregatePeriod(periodStart, periodEnd),
        aggregatePeriod(prevStart, prevEnd),
        this.prisma.notification.findMany({
          where: { role: Role.ADMIN, type: { not: 'BROADCAST' } },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        this.prisma.booking.findMany({
          where: { date: { gte: startOfRollingWeek } },
          select: { date: true },
        }),
        this.prisma.transaction.findMany({
          where: {
            date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
            status: 'Completed',
          },
          select: { date: true, commissionAmount: true },
        }),
        loadSystemConfigSafe(this.prisma),
      ]);

    const weeklyBookings: { day: string; bookings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const count = bookingsLastWeek.filter((b) => b.date >= d && b.date < dayEnd).length;
      weeklyBookings.push({ day: label, bookings: count });
    }

    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const revenueByKey = new Map<string, number>();
    for (const k of monthKeys) revenueByKey.set(k, 0);
    for (const t of txsSixMo) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (revenueByKey.has(key)) {
        revenueByKey.set(key, (revenueByKey.get(key) ?? 0) + (t.commissionAmount ?? 0));
      }
    }
    const revenueChart = monthKeys.map((k) => {
      const [y, m] = k.split('-').map(Number);
      const dt = new Date(y, m - 1, 1);
      return {
        month: dt.toLocaleDateString('en-US', { month: 'short' }),
        amount: revenueByKey.get(k) ?? 0,
      };
    });

    const platformBalance = (systemConfig as { platformBalance?: number }).platformBalance ?? 0;

    const pctChange = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };

    return {
      range,
      stats: {
        businesses: current.businesses,
        newBusinesses: current.newBusinesses,
        users: current.users,
        bookings: current.bookings,
        revenue: current.revenue,
        pendingApprovals: current.pendingApprovals,
        avgBookingValue: current.avgBookingValue,
        bookingsPerCustomer: current.bookingsPerCustomer,
        revenuePerCustomer: current.revenuePerCustomer,
        customersPerBooking: current.customersPerBooking,
        distinctBookers: current.distinctBookers,
        platformBalance,
      },
      previous: {
        businesses: previous.businesses,
        newBusinesses: previous.newBusinesses,
        users: previous.users,
        bookings: previous.bookings,
        revenue: previous.revenue,
        pendingApprovals: previous.pendingApprovals,
        avgBookingValue: previous.avgBookingValue,
        bookingsPerCustomer: previous.bookingsPerCustomer,
        revenuePerCustomer: previous.revenuePerCustomer,
        customersPerBooking: previous.customersPerBooking,
        distinctBookers: previous.distinctBookers,
      },
      changes: {
        businesses: pctChange(current.newBusinesses, previous.newBusinesses),
        bookings: pctChange(current.bookings, previous.bookings),
        revenue: pctChange(current.revenue, previous.revenue),
        users: pctChange(current.users, previous.users),
        avgBookingValue: pctChange(current.avgBookingValue, previous.avgBookingValue),
        bookingsPerCustomer: pctChange(current.bookingsPerCustomer, previous.bookingsPerCustomer),
        revenuePerCustomer: pctChange(current.revenuePerCustomer, previous.revenuePerCustomer),
        customersPerBooking: pctChange(current.customersPerBooking, previous.customersPerBooking),
        pendingApprovals: pctChange(current.pendingApprovals, previous.pendingApprovals),
      },
      charts: {
        weeklyBookings,
        revenue: revenueChart,
      },
      recentActivities: recentActivities.map((n) => ({
        id: n.id,
        user: n.title,
        message: n.body,
        timestamp: n.createdAt,
        type: n.type,
        title: n.title,
      })),
    };
  }

  @Get('admin/broadcasts')
  async getAdminBroadcasts(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const rows = await this.prisma.notification.findMany({
      where: { type: 'BROADCAST' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const userCount = await this.prisma.user.count({ where: { role: Role.USER } });
    const bizCount = await this.prisma.business.count();
    return rows.map((n) => {
      const title = n.title.toLowerCase();
      const audience =
        title.includes('business') || title.includes('merchant')
          ? 'All Businesses'
          : title.includes('user')
            ? 'All Users'
            : 'All Users';
      const reach = audience.includes('Business') ? bizCount : userCount;
      return {
        id: n.id,
        audience,
        status: 'Sent',
        reach,
        readRate: '—',
        sentAt: n.createdAt.toISOString(),
        summary: n.body.slice(0, 120),
      };
    });
  }

  @Get('admin/events')
  async getAdminEvents(@Headers('authorization') auth?: string) {
    await requireUser(this.prisma, auth, [Role.ADMIN]);
    return this.prisma.event.findMany({ orderBy: { startAt: 'desc' } });
  }

  @Post('admin/events')
  async createAdminEvent(@Body() body: any, @Headers('authorization') auth?: string) {
    await requireUser(this.prisma, auth, [Role.ADMIN]);
    const imageKey = body.imageKey != null ? await this.storeImage(String(body.imageKey), 'events') : null;
    return this.prisma.event.create({
      data: {
        title: body.title,
        body: body.body,
        startAt: new Date(body.startAt),
        location: body.location,
        price: Number(body.price),
        imageKey,
        websiteUrl: normalizeEventWebsiteUrl(body.websiteUrl),
        active: body.active !== undefined ? body.active : true,
      },
    });
  }

  @Put('admin/events/:id')
  async updateAdminEvent(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    await requireUser(this.prisma, auth, [Role.ADMIN]);
    const imageKey =
      body.imageKey !== undefined ? await this.storeImage(String(body.imageKey), 'events') : undefined;
    return this.prisma.event.update({
      where: { id },
      data: {
        title: body.title,
        body: body.body,
        location: body.location,
        ...(imageKey !== undefined ? { imageKey } : {}),
        active: body.active,
        websiteUrl:
          body.websiteUrl !== undefined
            ? normalizeEventWebsiteUrl(body.websiteUrl)
            : undefined,
        startAt: body.startAt ? new Date(body.startAt) : undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
      },
    });
  }

  @Delete('admin/events/:id')
  async deleteAdminEvent(@Param('id') id: string, @Headers('authorization') auth?: string) {
    await requireUser(this.prisma, auth, [Role.ADMIN]);
    await this.prisma.event.delete({ where: { id } });
    return { success: true };
  }

  @Get('admin/businesses')
  async getAdminBusinesses(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { owner: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        include: { bookings: true, statusHistory: true },
        orderBy: { joinedDate: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: items.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        description: b.description,
        merchantNumber: b.merchantNumber,
        taxId: b.taxId,
        owner: b.owner,
        email: b.email,
        phone: b.phone,
        categoryKeys: b.categoryKeys,
        status: b.status,
        listingVisible: Boolean(b.listingVisible),
        profileSetupComplete: Boolean(b.profileSetupComplete),
        revenue: b.balance, // Using balance as a proxy or if there's a totalRevenue field
        joinedDate: b.joinedDate,
        rejectionReason: b.rejectionReason,
        idDocumentImage: safeImageUrl(b.idDocumentImage),
        licenseDocumentImage: safeImageUrl(b.licenseDocumentImage),
        insuranceDocumentImage: safeImageUrl(b.insuranceDocumentImage),
        documents: {
          id_verified: b.idVerified,
          license_verified: b.licenseVerified,
          insurance_verified: b.insuranceVerified,
        },
        statusHistory: b.statusHistory,
        registrationDetails: b.registrationDetails ?? null,
        workingHours: b.workingHours ?? null,
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Get('admin/businesses/:id')
  async getAdminBusinessById(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const b = await this.prisma.business.findUnique({
      where: { id },
      include: {
        services: { orderBy: [{ category: 'asc' }, { price: 'asc' }] },
        staff: { orderBy: { name: 'asc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        subscriptionPlan: true,
      },
    });
    if (!b) throw new NotFoundException('Business not found');
    const reviewCount = await this.prisma.review.count({ where: { businessId: id } });

    const loginUser = await this.prisma.user.findUnique({
      where: { email: b.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const amenityRows =
      (b.amenityKeys ?? []).length > 0
        ? await this.prisma.amenity.findMany({
            where: { key: { in: b.amenityKeys }, active: true },
            orderBy: [{ sortOrder: 'asc' }, { labelEn: 'asc' }],
          })
        : [];

    const categories = displayCategoryLabels(b);

    return {
      id: b.id,
      merchantNumber: b.merchantNumber,
      name: b.name,
      owner: b.owner,
      email: b.email,
      phone: b.phone,
      address: b.address,
      description: b.description,
      taxId: b.taxId,
      status: b.status,
      listingVisible: Boolean(b.listingVisible),
      profileSetupComplete: Boolean(b.profileSetupComplete),
      revenue: b.revenue,
      balance: b.balance,
      joinedDate: b.joinedDate,
      rejectionReason: b.rejectionReason,
      categoryKeys: b.categoryKeys,
      categoryLabels: categories,
      amenityKeys: b.amenityKeys,
      amenities: amenityRows.map((a) => ({
        key: a.key,
        labelEn: a.labelEn,
        labelEs: a.labelEs,
      })),
      latitude: b.latitude,
      longitude: b.longitude,
      logoUrl: safeImageUrl(b.logoUrl),
      bannerUrl: safeImageUrl(b.bannerUrl),
      images: (b.images ?? []).map((img) => safeImageUrl(img)).filter(Boolean),
      socialYoutube: b.socialYoutube,
      socialInstagram: b.socialInstagram,
      socialX: b.socialX,
      socialTiktok: b.socialTiktok,
      workingHours: b.workingHours,
      taxPercentage: b.taxPercentage,
      plan: b.plan,
      planId: b.planId,
      planName: b.subscriptionPlan?.name ?? b.plan,
      appointmentApprovalMode: b.appointmentApprovalMode,
      cancellationAllowed: b.cancellationAllowed,
      cancellationHoursBefore: b.cancellationHoursBefore,
      notifyBookingEmail: b.notifyBookingEmail,
      notifyCancellationEmail: b.notifyCancellationEmail,
      notifyDailySummary: b.notifyDailySummary,
      idDocumentImage: safeImageUrl(b.idDocumentImage),
      licenseDocumentImage: safeImageUrl(b.licenseDocumentImage),
      insuranceDocumentImage: safeImageUrl(b.insuranceDocumentImage),
      documents: {
        id_verified: b.idVerified,
        license_verified: b.licenseVerified,
        insurance_verified: b.insuranceVerified,
      },
      statusHistory: b.statusHistory,
      registrationDetails: b.registrationDetails ?? null,
      registrationSections: buildAdminRegistrationSections(b.registrationDetails),
      registrationPhotoUrls: collectRegistrationPhotoUrls(b.registrationDetails),
      loginAccount: loginUser
        ? {
            id: loginUser.id,
            name: loginUser.name,
            email: loginUser.email,
            phone: loginUser.phone,
            role: loginUser.role,
            status: loginUser.status,
            createdAt: loginUser.createdAt,
          }
        : null,
      services: b.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        category: s.category,
        imageUrl: safeImageUrl(s.imageUrl),
      })),
      staff: b.staff.map((st) => ({
        id: st.id,
        name: st.name,
        role: st.role,
        skills: st.skills,
        availability: st.availability,
        image: safeImageUrl(st.image),
        bio: st.bio,
        experienceYears: st.experienceYears,
      })),
      reviewCount,
    };
  }

  @Patch('admin/businesses/:id/status')
  async updateAdminBusinessStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'pending' | 'suspended' | 'rejected'; reason?: string },
  ) {
    const admin = await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const status = (body.status || '').toLowerCase();
    if (!['active', 'pending', 'suspended', 'rejected'].includes(status)) {
      throw new BadRequestException('invalid status');
    }
    if ((status === 'rejected' || status === 'suspended') && !String(body.reason || '').trim()) {
      throw new BadRequestException('reason is required for rejection or suspension');
    }
    const before = await this.prisma.business.findUnique({ where: { id } });
    if (!before) {
      throw new BadRequestException('business not found');
    }
    const reasonText = String(body.reason || '').trim();
    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        status,
        ...(status === 'active'
          ? {
              idVerified: true,
              licenseVerified: true,
              insuranceVerified: true,
              rejectionReason: null,
              ...((before.status || '').toLowerCase() !== 'active'
                ? { listingVisible: false, profileSetupComplete: false }
                : {}),
            }
          : { listingVisible: false }),
        ...((status === 'rejected' || status === 'suspended') && reasonText
          ? {
              rejectionReason: reasonText,
              description: `${before.description || ''}\n[${
                status === 'rejected' ? 'Rejection reason' : 'Suspension reason'
              }] ${reasonText}`.trim(),
            }
          : {}),
        ...(status === 'active' && reasonText
          ? {
              description: `${before.description || ''}\n[Reactivation note] ${reasonText}`.trim(),
            }
          : {}),
      },
    });
    if (before.status !== updated.status || reasonText) {
      await this.prisma.businessStatusHistory.create({
        data: {
          businessId: updated.id,
          fromStatus: before.status,
          toStatus: updated.status,
          reason: reasonText || null,
          actorId: admin.id,
          actorName: admin.name,
          actorRole: admin.role,
        },
      });
    }
    if (status === 'active') {
      await this.prisma.user.upsert({
        where: { email: updated.email },
        update: { role: Role.BUSINESS, status: 'active' },
        create: {
          name: updated.owner || updated.name,
          email: updated.email,
          password: BUSINESS_BYPASS_PASSWORD,
          role: Role.BUSINESS,
          status: 'active',
        },
      });
    }
    if (status === 'active') {
      void notifyBusinessAccount(this.prisma, updated, {
        type: 'BUSINESS_APPROVED',
        title: 'Your business was approved',
        body:
          reasonText ||
          'Your REZERVAME business account is active. Log in to the business panel to manage bookings.',
        emailSubject: '[Rezervame] Business approved — you can start accepting bookings',
        emailTemplate: 'business-approved',
        emailModel: {
          businessName: updated.name,
          ownerName: updated.owner || updated.name,
          body:
            reasonText ||
            'Your REZERVAME business account is active. Log in to the business panel to manage bookings.',
        },
      });
    } else if (status === 'rejected') {
      void notifyBusinessAccount(this.prisma, updated, {
        type: 'BUSINESS_REJECTED',
        title: 'Business application not approved',
        body: reasonText || 'Your application was not approved at this time.',
        emailSubject: '[Rezervame] Business application update',
        emailTemplate: 'business-rejected',
        emailModel: {
          businessName: updated.name,
          ownerName: updated.owner || updated.name,
          body: reasonText || 'Your application was not approved at this time.',
        },
      });
    } else if (status === 'suspended') {
      void notifyBusinessAccount(this.prisma, updated, {
        type: 'BUSINESS_SUSPENDED',
        title: 'Business account suspended',
        body: reasonText || 'Your business account has been suspended. Contact support for help.',
        emailSubject: '[Rezervame] Business account suspended',
        emailTemplate: 'business-suspended',
        emailModel: {
          businessName: updated.name,
          ownerName: updated.owner || updated.name,
          body: reasonText || 'Your business account has been suspended. Contact support for help.',
        },
      });
    } else if (status === 'pending' && before.status !== 'pending') {
      void notifyBusinessAccount(this.prisma, updated, {
        type: 'BUSINESS_PENDING',
        title: 'Application under review',
        body: 'Your business registration is pending admin review.',
      });
    }

    return { ok: true, id: updated.id, status: updated.status };
  }

  @Patch('admin/businesses/:id/documents')
  async updateAdminBusinessDocumentVerification(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { document: 'id' | 'license' | 'insurance'; approved: boolean },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const doc = String(body.document || '').toLowerCase();
    if (!['id', 'license', 'insurance'].includes(doc)) {
      throw new BadRequestException('invalid document');
    }
    const approved = Boolean(body.approved);
    const before = await this.prisma.business.findUnique({ where: { id } });
    if (!before) {
      throw new BadRequestException('business not found');
    }
    const data =
      doc === 'id'
        ? { idVerified: approved }
        : doc === 'license'
          ? { licenseVerified: approved }
          : { insuranceVerified: approved };
    const updated = await this.prisma.business.update({ where: { id }, data });
    return {
      ok: true,
      id: updated.id,
      documents: {
        id_verified: updated.idVerified,
        license_verified: updated.licenseVerified,
        insurance_verified: updated.insuranceVerified,
      },
    };
  }

  @Delete('admin/businesses/:id')
  async deleteAdminBusiness(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.business.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/bookings')
  async getAdminBookings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = {};
    if (status && status !== 'all') {
      where.status = { equals: status, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: { user: true, business: true, service: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: bookings.map((b) => ({
        id: b.id,
        user: b.customerName || b.user.name,
        email: b.user.email,
        business: b.business.name,
        businessId: b.businessId,
        service: b.service?.name || '—',
        date: b.date,
        amount: b.price,
        status: b.status.toLowerCase(),
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Delete('admin/bookings/:id')
  async deleteAdminBooking(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.booking.delete({ where: { id } });
    return { ok: true, id };
  }

  @Patch('admin/bookings/:id/status')
  async updateAdminBookingStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { service: true } });
    if (!booking) throw new BadRequestException('Booking not found');
    const allowed = ['Approved', 'Rejected', 'Completed', 'Cancelled'];
    const newStatus = body.status;
    if (!allowed.includes(newStatus)) throw new BadRequestException(`Status must be one of: ${allowed.join(', ')}`);
    // Enforce valid transitions
    const cur = booking.status;
    const valid: Record<string, string[]> = {
      Pending: ['Approved', 'Rejected', 'Cancelled'],
      Approved: ['Completed', 'Cancelled'],
      Completed: [],
      Cancelled: [],
      Rejected: [],
    };
    if (!(valid[cur] || []).includes(newStatus)) {
      throw new BadRequestException(`Cannot change from ${cur} to ${newStatus}`);
    }
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: newStatus },
      include: { user: true, business: true, service: true },
    });

    if (cur !== newStatus) {
      void notifyCustomerUser(this.prisma, updated.user, {
        type: 'BOOKING_STATUS',
        title: `Booking ${newStatus}`,
        body: `Your appointment at ${updated.business.name} is now ${newStatus}.`,
      });
      void notifyBusinessAccount(this.prisma, updated.business, {
        type: 'BOOKING_STATUS',
        title: `Booking ${newStatus}`,
        body: `${updated.customerName} — ${updated.service?.name || 'service'} is now ${newStatus}.`,
      });
    }

    return {
      ok: true,
      id: updated.id,
      status: updated.status.toLowerCase(),
      user: updated.customerName || updated.user.name,
      email: updated.user.email,
      business: updated.business.name,
      date: updated.date,
      amount: updated.price,
      service: updated.service?.name || null,
    };
  }

  /* ─── Admin Promotions ─── */
  @Get('admin/promotions')
  async getAdminPromotions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const [total, promos] = await Promise.all([
      this.prisma.promotion.count(),
      this.prisma.promotion.findMany({
        include: { service: true, business: true },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    const data = promos.map((p) => ({
      id: p.id,
      businessId: p.businessId,
      businessName: p.business.name,
      serviceId: p.serviceId,
      serviceName: p.service.name,
      servicePrice: p.service.price,
      discountPercent: p.discountPercent,
      discountedPrice: parseFloat((p.service.price * (1 - p.discountPercent / 100)).toFixed(2)),
      label: p.label,
      active: p.active,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      createdAt: p.createdAt,
    }));

    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('admin/promotions')
  async createAdminPromotion(
    @Body() body: { businessId: string; serviceId: string; discountPercent: number; label?: string; endsAt?: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const svc = await this.prisma.service.findFirst({ where: { id: body.serviceId, businessId: body.businessId } });
    if (!svc) throw new BadRequestException('Service not found for this business');
    return this.prisma.promotion.create({
      data: {
        businessId: body.businessId,
        serviceId: body.serviceId,
        discountPercent: body.discountPercent || 10,
        label: body.label || null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
      include: { service: true, business: true },
    });
  }

  @Delete('admin/promotions/:id')

  async deleteAdminPromotion(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new BadRequestException('Promotion not found');
    await this.prisma.promotion.delete({ where: { id } });
    return { ok: true };
  }

  /* ─── Admin: logs ─── */
  @Get('admin/logs')
  async getAdminLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @Query('severity') severity: string = 'all',
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const where: any = {};
    if (search) {
      where.OR = [
        { business: { name: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
        { actorName: { contains: search, mode: 'insensitive' } },
      ];
    }
    // severity mapping: error if rejected, warning if status changes to pending/inactive, info otherwise
    if (severity !== 'all') {
      if (severity === 'error') {
        where.toStatus = 'rejected';
      } else if (severity === 'warning') {
        where.toStatus = { in: ['pending', 'inactive'] };
      } else {
        where.toStatus = { notIn: ['rejected', 'pending', 'inactive'] };
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.businessStatusHistory.count({ where }),
      this.prisma.businessStatusHistory.findMany({
        where,
        include: { business: true },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    const data = items.map((log) => {
      let sev = 'info';
      if (log.toStatus === 'rejected') sev = 'error';
      else if (['pending', 'inactive'].includes(log.toStatus)) sev = 'warning';

      return {
        id: log.id,
        source: log.actorName || 'System',
        message: `Business "${log.business.name}" status changed from ${log.fromStatus || 'N/A'} to ${log.toStatus}. ${log.reason || ''}`,
        severity: sev,
        timestamp: log.createdAt,
      };
    });

    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  /* ─── Admin: list businesses with services for dropdown ─── */
  @Get('admin/businesses-services')
  async getAdminBusinessesServices(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const businesses = await this.prisma.business.findMany({
      select: {
        id: true,
        name: true,
        services: { select: { id: true, name: true, price: true, category: true } },
      },
      orderBy: { name: 'asc' },
    });
    return businesses;
  }

  @Get('admin/users')
  async getAdminUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = { role: Role.USER };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { 
          bookings: {
            include: {
              business: true,
              service: true,
              staff: true,
            },
          },
          reviews: {
            include: {
              business: true,
            },
          },
          favorites: {
            include: {
              business: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        address: u.address,
        gender: u.gender,
        age: u.age,
        status: u.status,
        joinedDate: u.createdAt,
        bookingsCount: u.bookings.length,
        bookings: u.bookings.map((b) => ({
          id: b.id,
          date: b.date,
          status: b.status,
          price: b.price,
          taxAmount: b.taxAmount,
          serviceName: b.service?.name || 'Service',
          businessName: b.business?.name || 'Business',
          staffName: b.staff?.name || 'Any Staff',
        })),
        reviews: u.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          date: r.date,
          serviceName: r.serviceName,
          staffName: r.staffName,
          businessName: r.business?.name || 'Business',
        })),
        favorites: u.favorites.map((f) => ({
          id: f.id,
          businessName: f.business?.name || 'Business',
        })),
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Patch('admin/users/:id/status')
  async patchAdminUserStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== Role.USER) {
      throw new BadRequestException('Customer user not found');
    }
    const next = (body.status || '').toLowerCase() === 'blocked' ? 'blocked' : 'active';
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: next },
    });
    if (next === 'blocked' && updated.email) {
      void sendPlatformEmail(this.prisma, {
        to: updated.email,
        template: 'account-suspended',
        model: { userName: updated.name },
      });
    } else if (next === 'active' && updated.email) {
      void sendPlatformEmail(this.prisma, {
        to: updated.email,
        template: 'account-reactivated',
        model: { userName: updated.name },
      });
    }
    return { ok: true, id: updated.id, status: updated.status };
  }

  @Post('admin/users/:id/email')
  async emailAdminUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { subject?: string; message?: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target?.email) throw new BadRequestException('User email not found');
    const message = String(body.message || '').trim();
    if (!message) throw new BadRequestException('Message is required');
    const subject = String(body.subject || '').trim() || 'Message from Rezervame';
    const safe = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    return sendPlatformEmail(this.prisma, {
      to: target.email,
      template: 'admin-user-message',
      subject: subject.startsWith('[') ? subject : `[Rezervame] ${subject}`,
      model: {
        userName: target.name,
        subject: subject.startsWith('[') ? subject : `[Rezervame] ${subject}`,
        message: safe,
      },
    });
  }

  @Delete('admin/users/:id')
  async deleteAdminUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== Role.USER) {
      throw new BadRequestException('Customer user not found');
    }
    await this.prisma.user.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/transactions')
  async getAdminTransactions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const [total, tx] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        include: { business: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: tx.map((t) => ({
        id: t.id,
        business: t.business.name,
        amount: t.amount,
        date: t.date,
        status: t.status.toLowerCase(),
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Delete('admin/transactions/:id')
  async deleteAdminTransaction(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.transaction.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/wallet')
  async getAdminWallet(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const config = await loadSystemConfigSafe(this.prisma);
    const platformBalance = (config as { platformBalance?: number }).platformBalance ?? 0;
    const commissionAgg = await this.prisma.transaction.aggregate({
      _sum: { commissionAmount: true },
    });
    const pendingWithdrawals = await this.prisma.withdrawal.aggregate({
      where: { status: { equals: 'Pending', mode: 'insensitive' } },
      _sum: { amount: true },
    });
    return {
      platformBalance: Number(platformBalance.toFixed(2)),
      totalCommissionRecorded: Number((commissionAgg._sum.commissionAmount ?? 0).toFixed(2)),
      pendingMerchantWithdrawals: Number((pendingWithdrawals._sum.amount ?? 0).toFixed(2)),
      defaultCommission: (config as { defaultCommission?: number }).defaultCommission ?? 15,
    };
  }

  @Get('admin/withdrawals')
  async getAdminWithdrawals(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = {};
    if (status && status !== 'all') {
      where.status = { equals: status, mode: 'insensitive' };
    }

    const [total, w, pendingTotal, pendingCount] = await Promise.all([
      this.prisma.withdrawal.count({ where }),
      this.prisma.withdrawal.findMany({
        where,
        include: { business: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: { equals: 'Pending', mode: 'insensitive' } },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.count({
        where: { status: { equals: 'Pending', mode: 'insensitive' } },
      }),
    ]);

    return {
      data: w.map((it) => ({
        id: it.id,
        amount: it.amount,
        balance: it.business.balance,
        status: it.status.toLowerCase(),
        date: it.date,
        processedDate: it.processedDate,
        businessId: it.businessId,
        merchantNumber: it.business.merchantNumber ?? null,
        business: it.business.name,
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      totalPendingAmount: pendingTotal._sum.amount || 0,
      pendingCount,
    };
  }

  @Delete('admin/withdrawals/:id')
  async deleteAdminWithdrawal(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.withdrawal.delete({ where: { id } });
    return { ok: true, id };
  }

  @Post('admin/withdrawals/batch-approve')
  async batchApproveAdminWithdrawals(
    @Headers('authorization') authorization: string | undefined,
    @Body() body?: { ids?: string[] },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);

    const where: {
      status: { equals: string; mode: 'insensitive' };
      id?: { in: string[] };
    } = {
      status: { equals: 'Pending', mode: 'insensitive' },
    };
    if (Array.isArray(body?.ids) && body.ids.length > 0) {
      where.id = { in: body.ids };
    }

    const pending = await this.prisma.withdrawal.findMany({
      where,
      select: { id: true, amount: true },
    });
    if (pending.length === 0) {
      throw new BadRequestException('No pending withdrawals to approve');
    }

    const now = new Date();
    await this.prisma.withdrawal.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { status: 'Approved', processedDate: now },
    });

    const totalAmount = pending.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return {
      ok: true,
      approved: pending.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      ids: pending.map((p) => p.id),
    };
  }

  @Post('admin/withdrawals/:id/approve')
  async approveAdminWithdrawal(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const w = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!w) throw new BadRequestException('Withdrawal not found');
    if (w.status.toLowerCase() !== 'pending') throw new BadRequestException('Already processed');

    return this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'Approved', processedDate: new Date() },
    });
  }

  @Post('admin/withdrawals/:id/reject')
  async rejectAdminWithdrawal(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const w = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!w) throw new BadRequestException('Withdrawal not found');
    if (w.status.toLowerCase() !== 'pending') throw new BadRequestException('Already processed');

    return this.prisma.$transaction(async (tx) => {
      // Revert balance
      await tx.business.update({
        where: { id: w.businessId },
        data: { balance: { increment: w.amount } },
      });
      return tx.withdrawal.update({
        where: { id },
        data: { status: 'Rejected', processedDate: new Date() },
      });
    });
  }

  @Get('admin/alert-feed')
  async getAdminAlertFeed(
    @Headers('authorization') authorization?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const where = { role: Role.ADMIN, type: { not: 'BROADCAST' } };
    const [total, rows, unread] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.notification.count({ where: { ...where, read: false } }),
    ]);
    return {
      data: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      unread,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Patch('admin/alert-feed/:id/read')
  async markAdminAlertRead(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.notification.updateMany({
      where: { id, role: Role.ADMIN },
      data: { read: true },
    });
    return { ok: true };
  }

  @Patch('admin/alert-feed/read-all')
  async markAllAdminAlertsRead(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.notification.updateMany({
      where: { role: Role.ADMIN, read: false, type: { not: 'BROADCAST' } },
      data: { read: true },
    });
    return { ok: true };
  }

  /** Legacy alias — support tickets list (see also /admin/alert-feed for platform alerts). */
  @Get('admin/notifications')
  async getAdminNotifications(
    @Headers('authorization') authorization?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.getAdminSupportTickets(authorization, page, limit, status, search);
  }

  @Get('admin/support-tickets')
  async getAdminSupportTickets(
    @Headers('authorization') authorization?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const where: {
      status?: { equals: string; mode: 'insensitive' };
      OR?: Array<Record<string, unknown>>;
    } = {};
    if (status && status !== 'all') {
      where.status = { equals: status, mode: 'insensitive' };
    }
    const q = (search || '').trim();
    if (q) {
      where.OR = [
        { ticketRef: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { requesterName: { contains: q, mode: 'insensitive' } },
        { requesterEmail: { contains: q, mode: 'insensitive' } },
        { business: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const [total, rows, openCount] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        include: {
          business: { select: { name: true, merchantNumber: true, email: true } },
          user: { select: { name: true, email: true } },
          messages: { orderBy: { createdAt: 'asc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['open', 'in_progress', 'Open', 'In_progress', 'IN_PROGRESS'] } },
      }),
    ]);
    return {
      data: rows.map((t) =>
        mapSupportTicketRow({
          ...t,
          messages: t.messages,
        }),
      ),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      openCount,
    };
  }

  @Get('admin/support-tickets/:id')
  async getAdminSupportTicket(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        business: { select: { name: true, merchantNumber: true, email: true, phone: true } },
        user: { select: { name: true, email: true, phone: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) throw new BadRequestException('Ticket not found');
    return mapSupportTicketRow(ticket, { includeInlineAttachments: true });
  }

  @Patch('admin/support-tickets/:id/status')
  async updateAdminSupportTicketStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const status = String(body.status || '').trim().toLowerCase();
    const allowed = ['open', 'in_progress', 'resolved', 'closed'];
    if (!allowed.includes(status)) throw new BadRequestException('Invalid status');
    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : null,
      },
      include: { business: true, user: true },
    });
    if (ticket.requesterEmail) {
      void sendPlatformEmail(this.prisma, {
        to: ticket.requesterEmail,
        template: 'support-ticket-update',
        model: {
          ticketRef: ticket.ticketRef,
          status,
          message: `Your support ticket ${ticket.ticketRef} is now ${status}.`,
        },
      });
    }
    return mapSupportTicketRow(ticket);
  }

  @Post('admin/support-tickets/:id/reply')
  async replyAdminSupportTicket(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    const admin = await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await addSupportTicketReply(this.prisma, id, {
      body: body.message,
      senderRole: Role.ADMIN,
      senderName: admin.name,
    });
    const updated = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        business: { select: { name: true, merchantNumber: true, email: true, phone: true } },
        user: { select: { name: true, email: true, phone: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!updated) throw new BadRequestException('Ticket not found');
    return mapSupportTicketRow(updated, { includeInlineAttachments: true });
  }

  @Post('admin/support-tickets/batch-resolve')
  async batchResolveAdminSupportTickets(
    @Headers('authorization') authorization: string | undefined,
    @Body() body?: { ids?: string[] },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const where: { status: { in: string[] }; id?: { in: string[] } } = {
      status: { in: ['open', 'in_progress'] },
    };
    if (Array.isArray(body?.ids) && body.ids.length > 0) {
      where.id = { in: body.ids };
    }
    const pending = await this.prisma.supportTicket.findMany({ where, select: { id: true } });
    if (pending.length === 0) throw new BadRequestException('No open tickets to resolve');
    const now = new Date();
    await this.prisma.supportTicket.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { status: 'resolved', resolvedAt: now },
    });
    return { ok: true, resolved: pending.length };
  }

  @Post('admin/email/test')
  async testAdminEmail(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { to?: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const cfg = await loadMessagingConfig(this.prisma);
    const postmark = await resolvePostmarkConfig(this.prisma);
    const to = (body.to || cfg.adminNotifyEmail || '').trim().toLowerCase();
    if (!to) throw new BadRequestException('Enter a test recipient email address.');
    if (!isValidEmailAddress(to)) {
      throw new BadRequestException('Enter a valid email address (e.g. you@gmail.com).');
    }

    if (!postmark) {
      throw new BadRequestException(
        'Postmark is not configured. Add the Server API token under Settings → Email, or set POSTMARK_API_KEY on the API server.',
      );
    }

    const result = await sendPlatformEmail(this.prisma, {
      to,
      template: 'admin-test',
      model: {},
    });

    if (!result.ok && !result.skipped) {
      throw new BadRequestException(
        result.error || 'Email could not be sent. Check Postmark API key and sender addresses.',
      );
    }
    if (result.skipped) {
      throw new BadRequestException(
        'Postmark is not configured. Add the Server API token under Settings → Email, or set POSTMARK_API_KEY on the API server.',
      );
    }

    const configSource = readPostmarkConfigFromEnv()?.apiKey ? 'server_env' : 'admin_settings';

    return {
      ...result,
      ok: true,
      provider: 'postmark',
      to,
      from: postmark.fromEmail,
      messageStream: postmark.messageStream,
      configSource,
      message: `Test email accepted by Postmark for ${to}. Check inbox and spam. Message ID: ${result.messageId || 'n/a'}`,
    };
  }

  @Get('admin/email/recent')
  async getAdminEmailRecent(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const postmark = await resolvePostmarkConfig(this.prisma);
    const configSource = readPostmarkConfigFromEnv()?.apiKey ? 'server_env' : 'admin_settings';
    let recent: Array<{
      id: string;
      recipient: string;
      subject: string | null;
      status: string;
      error: string | null;
      meta: string | null;
      createdAt: Date;
    }> = [];
    try {
      recent = await this.prisma.notificationDelivery.findMany({
        where: { channel: { in: ['email', 'email_webhook'] } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          recipient: true,
          subject: true,
          status: true,
          error: true,
          meta: true,
          createdAt: true,
        },
      });
    } catch {
      recent = [];
    }
    return {
      configured: Boolean(postmark),
      from: postmark?.fromEmail ?? null,
      replyTo: postmark?.replyTo ?? null,
      messageStream: postmark?.messageStream ?? null,
      configSource,
      recent,
    };
  }

  @Post('admin/sms/test')
  async testAdminSms(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { to?: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const to = String(body.to || '').trim();
    if (!to) throw new BadRequestException('Provide test phone number (E.164)');
    return sendSms(this.prisma, to, 'Rezervame SMS test — configuration OK.');
  }

  @Get('admin/plans')
  async getAdminPlans(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await ensureHardcodedPlans(this.prisma);
    return this.prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
  }

  @Post('admin/plans')
  async createAdminPlan(@Body() body: any, @Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    return this.prisma.subscriptionPlan.create({
      data: {
        name: body.name,
        price: Number(body.price),
        billingCycle: body.billingCycle || 'monthly',
        features: Array.isArray(body.features) ? body.features : [],
        active: body.active !== undefined ? body.active : true,
      },
    });
  }

  @Patch('admin/plans/:id')
  async updateAdminPlan(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.billingCycle !== undefined) data.billingCycle = body.billingCycle;
    if (body.features !== undefined) data.features = body.features;
    if (body.active !== undefined) data.active = body.active;

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });
  }

  @Delete('admin/plans/:id')
  async deleteAdminPlan(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { ok: true };
  }
  
  @Get('notifications')
  async getNotifications(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER, Role.BUSINESS]);
    return this.prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id },
          { userId: null, role: user.role as Role },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER, Role.BUSINESS]);
    await this.prisma.notification.updateMany({
      where: {
        id,
        OR: [{ userId: user.id }, { userId: null, role: user.role as Role }],
      },
      data: { read: true },
    });
    return { ok: true };
  }

  @Patch('notifications/read-all')
  async markAllNotificationsRead(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER, Role.BUSINESS]);
    await this.prisma.notification.updateMany({
      where: {
        read: false,
        OR: [{ userId: user.id }, { userId: null, role: user.role as Role }],
      },
      data: { read: true },
    });
    return { ok: true };
  }

  @Delete('admin/notifications/:id')
  async deleteAdminNotification(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.notification.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/customer-service/faqs')
  async getAdminCustomerServiceFaqs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('search') search: string = '',
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const where: {
      OR?: Array<Record<string, unknown>>;
    } = {};
    const q = search.trim();
    if (q) {
      where.OR = [
        { questionEn: { contains: q, mode: 'insensitive' } },
        { questionEs: { contains: q, mode: 'insensitive' } },
        { answerEn: { contains: q, mode: 'insensitive' } },
        { answerEs: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await Promise.all([
      this.prisma.customerServiceFaq.count({ where }),
      this.prisma.customerServiceFaq.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip: (p - 1) * l,
        take: l,
      }),
    ]);
    return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Post('admin/customer-service/faqs')
  async createAdminCustomerServiceFaq(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      questionEn: string;
      questionEs?: string;
      answerEn: string;
      answerEs?: string;
      sortOrder?: number;
      active?: boolean;
    },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const questionEn = String(body.questionEn || '').trim();
    const answerEn = String(body.answerEn || '').trim();
    if (questionEn.length < 3) throw new BadRequestException('Question (EN) must be at least 3 characters');
    if (answerEn.length < 3) throw new BadRequestException('Answer (EN) must be at least 3 characters');
    const questionEs = String(body.questionEs || questionEn).trim();
    const answerEs = String(body.answerEs || answerEn).trim();
    return this.prisma.customerServiceFaq.create({
      data: {
        questionEn,
        questionEs,
        answerEn,
        answerEs,
        sortOrder: body.sortOrder ?? 0,
        active: body.active !== false,
      },
    });
  }

  @Patch('admin/customer-service/faqs/:id')
  async updateAdminCustomerServiceFaq(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: {
      questionEn?: string;
      questionEs?: string;
      answerEn?: string;
      answerEs?: string;
      sortOrder?: number;
      active?: boolean;
    },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const data: Record<string, unknown> = {};
    if (body.questionEn !== undefined) data.questionEn = String(body.questionEn).trim();
    if (body.questionEs !== undefined) data.questionEs = String(body.questionEs).trim();
    if (body.answerEn !== undefined) data.answerEn = String(body.answerEn).trim();
    if (body.answerEs !== undefined) data.answerEs = String(body.answerEs).trim();
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.active !== undefined) data.active = Boolean(body.active);
    return this.prisma.customerServiceFaq.update({ where: { id }, data });
  }

  @Delete('admin/customer-service/faqs/:id')
  async deleteAdminCustomerServiceFaq(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.customerServiceFaq.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/categories')
  async getAdminCategories(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { labelEn: { contains: search, mode: 'insensitive' } },
        { labelEs: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [total, categories] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip: (p - 1) * l,
        take: l,
      }),
    ]);
    return {
      data: categories,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('admin/categories')
  async createAdminCategory(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { key: string; labelEn: string; labelEs: string; imageUrl?: string; active?: boolean; sortOrder?: number },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const key = (body.key || '').trim();
    if (!key) throw new BadRequestException('key is required');
    const imageUrl = await this.storeImage(body.imageUrl, 'categories');
    return this.prisma.category.upsert({
      where: { key },
      update: {
        labelEn: body.labelEn?.trim() || key,
        labelEs: body.labelEs?.trim() || key,
        imageUrl,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
      create: {
        key,
        labelEn: body.labelEn?.trim() || key,
        labelEs: body.labelEs?.trim() || key,
        imageUrl,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  @Delete('admin/categories/:id')
  async deleteAdminCategory(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  @Patch('admin/categories/:id')
  async updateAdminCategory(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { labelEn?: string; labelEs?: string; imageUrl?: string; active?: boolean; sortOrder?: number },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const imageUrl =
      body.imageUrl !== undefined ? await this.storeImage(body.imageUrl, 'categories') : undefined;
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(body.labelEn !== undefined ? { labelEn: body.labelEn.trim() } : {}),
        ...(body.labelEs !== undefined ? { labelEs: body.labelEs.trim() } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });
  }

  @Get('admin/amenities')
  async getAdminAmenities(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    return this.prisma.amenity.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  @Post('admin/amenities')
  async createAdminAmenity(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      key: string;
      labelEn: string;
      labelEs: string;
      descriptionEn?: string;
      descriptionEs?: string;
      imageUrl?: string;
      active?: boolean;
      sortOrder?: number;
    },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const key = (body.key || '').trim();
    if (!key) throw new BadRequestException('key is required');
    const imageUrl = await this.storeImage(body.imageUrl, 'amenities');
    return this.prisma.amenity.upsert({
      where: { key },
      update: {
        labelEn: body.labelEn?.trim() || key,
        labelEs: body.labelEs?.trim() || key,
        descriptionEn: (body.descriptionEn || '').trim() || null,
        descriptionEs: (body.descriptionEs || '').trim() || null,
        imageUrl,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
      create: {
        key,
        labelEn: body.labelEn?.trim() || key,
        labelEs: body.labelEs?.trim() || key,
        descriptionEn: (body.descriptionEn || '').trim() || null,
        descriptionEs: (body.descriptionEs || '').trim() || null,
        imageUrl,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  @Delete('admin/amenities/:id')
  async deleteAdminAmenity(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.amenity.delete({ where: { id } });
    return { ok: true };
  }

  @Patch('admin/amenities/:id')
  async updateAdminAmenity(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: {
      labelEn?: string;
      labelEs?: string;
      descriptionEn?: string;
      descriptionEs?: string;
      imageUrl?: string;
      active?: boolean;
      sortOrder?: number;
    },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const imageUrl =
      body.imageUrl !== undefined ? await this.storeImage(body.imageUrl, 'amenities') : undefined;
    return this.prisma.amenity.update({
      where: { id },
      data: {
        ...(body.labelEn !== undefined ? { labelEn: body.labelEn.trim() } : {}),
        ...(body.labelEs !== undefined ? { labelEs: body.labelEs.trim() } : {}),
        ...(body.descriptionEn !== undefined
          ? { descriptionEn: String(body.descriptionEn || '').trim() || null }
          : {}),
        ...(body.descriptionEs !== undefined
          ? { descriptionEs: String(body.descriptionEs || '').trim() || null }
          : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });
  }

  @Post('admin/broadcast')
  async broadcast(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { message: string; target: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const message = String(body.message || '').trim();
    if (message.length < 4) throw new BadRequestException('Message too short');
    const target = body.target || 'all_users';
    const roles: Role[] =
      target === 'all_businesses'
        ? [Role.BUSINESS]
        : target === 'all_users'
          ? [Role.USER]
          : [Role.USER];
    const pushResults = await Promise.all(
      roles.map((role) =>
        notifyRoleBroadcast(this.prisma, role, message, target),
      ),
    );
    const pushSent = pushResults.reduce((n, r) => n + r.pushSent, 0);
    const pushFailed = pushResults.reduce((n, r) => n + r.pushFailed, 0);
    const pushRecipients = pushResults.reduce((n, r) => n + r.pushRecipients, 0);
    return {
      id: 'broadcast',
      status: 'sent',
      roles,
      push: { sent: pushSent, failed: pushFailed, recipients: pushRecipients },
    };
  }

  @Get('business/:id')
  async getBusiness(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Query('userLat') userLat?: string,
    @Query('userLng') userLng?: string,
  ) {
    console.log('[GET /business/:id] id=', id);
    const b = await this.prisma.business.findUnique({
      where: { id },
      include: { services: { select: { imageUrl: true } } },
    });
    if (!b) {
      console.log('[GET /business/:id] Not found in DB:', id);
      return null;
    }
    const visible = await isBusinessPubliclyVisible(this.prisma, b, authorization);
    console.log('[GET /business/:id] visible=', visible, 'status=', b.status);
    if (!visible) throw new NotFoundException(`Business not visible (Status: ${b.status})`);
    const portfolioImageUrls = buildPortfolioImageUrls({
      services: b.services,
      images: b.images,
      bannerUrl: b.bannerUrl,
      logoUrl: b.logoUrl,
    });
    const base = mapBusiness(b);
    if (!base) return null;
    const keys = (b.amenityKeys ?? []).filter(Boolean);
    const rows =
      keys.length > 0
        ? await this.prisma.amenity.findMany({
            where: { key: { in: keys }, active: true },
            orderBy: [{ sortOrder: 'asc' }, { labelEn: 'asc' }],
          })
        : [];
    const rv = await this.prisma.review.aggregate({
      where: { businessId: id },
      _avg: { businessRating: true },
      _count: true,
    });
    const ratingStr = rv._count > 0 && rv._avg.businessRating != null ? Number(rv._avg.businessRating).toFixed(1) : '0';
    const totalReviews = await this.prisma.review.count({ where: { businessId: id } });
    const reviewsStr = String(totalReviews);
    const geo = parseUserGeoQuery(userLat, userLng);
    const distanceLabel = distanceLabelBetween(geo.lat, geo.lng, b.latitude, b.longitude);
    
    let commissionPercent = 15;
    try {
      const adminConfig = await this.prisma.systemConfig.findFirst({
        select: { defaultCommission: true },
      });
      commissionPercent = adminConfig?.defaultCommission ?? 15;
    } catch {
      commissionPercent = 15;
    }

    const publicDetails = buildPublicVenueDetails(b);

    return {
      ...base,
      images: portfolioImageUrls.length > 0 ? portfolioImageUrls : base.images,
      portfolioImageUrls,
      rating: ratingStr,
      reviews: reviewsStr,
      distanceLabel,
      taxPercentage: b.taxPercentage ?? 0,
      commissionPercent,
      /** @deprecated Use commissionPercent (% of subtotal), not a flat fee. */
      serviceFee: commissionPercent,
      venueDetailSections: publicDetails.sections,
      registrationPhotoUrls: publicDetails.photoUrls,
      amenities: rows.map((a) => ({
        key: a.key,
        labelEn: a.labelEn,
        labelEs: a.labelEs,
        descriptionEn: a.descriptionEn,
        descriptionEs: a.descriptionEs,
      })),
    };
  }

  @Get('business/by-email/:email')
  async getBusinessByEmail(@Param('email') email: string) {
    const b = await this.prisma.business.findUnique({ where: { email } });
    return mapBusiness(b);
  }

  @Patch('business/:id')
  async updateBusiness(
    @Param('id') id: string,
    @Body() body: UpdateBusinessPanelDto,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const before = await this.prisma.business.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Business not found');
    const data = await mapBusinessPatchWithS3(body, this.s3Storage);
    applyListingVisibilityPatch(before, body, data);

    if (body.registrationDetails !== undefined || body.businessType !== undefined) {
      let nextRd = mergeRegistrationDetails(before.registrationDetails, body.registrationDetails);
      if (body.businessType !== undefined) {
        nextRd.businessType = body.businessType.trim();
      }
      nextRd = await persistRegistrationDetailsImages(nextRd, this.s3Storage);
      data.registrationDetails = nextRd as Prisma.InputJsonValue;
      if (body.businessType !== undefined && body.categoryKeys === undefined) {
        const mapped = categoryKeysAndLabelsForPartner(body.businessType, before.categoryKeys);
        data.categoryKeys = mapped.categoryKeys;
        data.categoryLabels = mapped.categoryLabels;
        data.categoryLabel =
          mapped.categoryLabels.length > 0 ? mapped.categoryLabels.join(' · ') : null;
      }
    }

    await this.prisma.business.update({ where: { id }, data });
    const synced = await syncBusinessListingFlags(this.prisma, id);
    return mapBusiness(synced ?? before);
  }

  @Patch('business/:id/listing-visibility')
  async updateBusinessListingVisibility(
    @Param('id') id: string,
    @Body() body: { visible?: boolean },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const before = await this.prisma.business.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Business not found');
    const wantsVisible = Boolean(body.visible);
    if (wantsVisible) {
      const setup = evaluateBusinessProfileSetup(before);
      if (!setup.canEnableListing) {
        throw new BadRequestException(
          'Complete required profile setup before your business can appear on the app and web.',
        );
      }
    }
    await this.prisma.business.update({
      where: { id },
      data: { listingVisible: wantsVisible },
    });
    const synced = await syncBusinessListingFlags(this.prisma, id);
    return mapBusiness(synced ?? before);
  }

  @Post('business/:id/upgrade')
  async upgradeBusinessPlan(
    @Param('id') id: string,
    @Body() body: { plan?: string; planId?: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const { plan, planId } = body;

    let dbPlan = null;
    if (planId) {
      dbPlan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    } else if (plan) {
      dbPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { name: { equals: plan, mode: 'insensitive' } },
      });
    }

    if (!dbPlan) {
      throw new BadRequestException('Invalid subscription plan selected');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return this.prisma.business.update({
      where: { id },
      data: { 
        plan: dbPlan.name, 
        planId: dbPlan.id, 
        planExpires: expiresAt 
      },
    });
  }

  @Get('business/:id/services')
  async getBusinessServices(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @Query('category') category: string = '',
    @Headers('authorization') authorization?: string,
  ) {
    const b = await this.prisma.business.findUnique({ where: { id } });
    if (!b || !(await isBusinessPubliclyVisible(this.prisma, b, authorization))) {
      return { data: [], total: 0, page: 1, limit: parseInt(limit), totalPages: 0 };
    }
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const where: any = { businessId: id };
    if (search.trim()) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category.trim() && category !== 'all') {
      where.category = category;
    }

    const [total, services] = await Promise.all([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (p - 1) * l,
        take: l,
        include: { promotions: { where: { active: true } } },
      }),
    ]);

    return {
      data: services.map(s => ({
        ...s,
        imageUrl: safeImageUrl(s.imageUrl)
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('business/:id/services')
  async createBusinessService(
    @Param('id') id: string,
    @Body() body: CreateServiceDto,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (business) {
      const plan = business.plan || 'Basic';
      let serviceLimit = 5; // Basic default
      if (plan === 'Premium') serviceLimit = 10;
      else if (plan === 'Gold' || plan === 'Enterprise') serviceLimit = 99999;

      const currentServiceCount = await this.prisma.service.count({ where: { businessId: id } });
      if (currentServiceCount >= serviceLimit) {
        throw new BadRequestException(
          `Service limit reached. Your current plan (${plan}) allows up to ${serviceLimit} services. Please upgrade to a higher plan to add more services.`,
        );
      }
    }
    const imageUrl = await this.storeImage(body.imageUrl, 'venues/services');
    return this.prisma.service.create({
      data: {
        businessId: id,
        name: body.name,
        price: body.price,
        duration: body.duration,
        category: body.category,
        imageUrl,
      },
    });
  }

  @Patch('services/:id')
  async updateService(
    @Param('id') id: string,
    @Body() body: UpdateServiceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc) throw new BadRequestException('Service not found');
    await requireBusinessOwner(this.prisma, authorization, svc.businessId);
    const imageUrl =
      body.imageUrl !== undefined ? await this.storeImage(body.imageUrl, 'venues/services') : undefined;
    return this.prisma.service.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.duration !== undefined ? { duration: body.duration } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      },
    });
  }

  @Delete('services/:id')
  async deleteService(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc) throw new BadRequestException('Service not found');
    await requireBusinessOwner(this.prisma, authorization, svc.businessId);
    await this.prisma.service.delete({ where: { id } });
    return { ok: true };
  }

  /* ─── Bestsellers: services ranked by booking count ─── */
  @Get('business/:id/bestsellers')
  async getBusinessBestsellers(@Param('id') id: string) {
    const bookings = await this.prisma.booking.groupBy({
      by: ['serviceId'],
      where: { businessId: id, serviceId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    // Return serviceId → count map
    return bookings.map((b) => ({
      serviceId: b.serviceId,
      bookingCount: b._count.id,
    }));
  }

  /* ─── Promotions: public listing ─── */
  @Get('business/:id/promotions')
  async getBusinessPromotions(@Param('id') id: string) {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        businessId: id,
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: { service: { select: { id: true, name: true, price: true, imageUrl: true, duration: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ─── Promotions CRUD for business owner ─── */
  @Post('business/:id/promotions')
  async createPromotion(
    @Param('id') id: string,
    @Body() body: { serviceId: string; discountPercent: number; label?: string; endsAt?: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (business && business.plan === 'Basic') {
      throw new BadRequestException(
        'Promotions and Marketing features are not available under the Basic plan. Please upgrade to Premium or higher to run promotions.',
      );
    }
    // Validate service belongs to this business
    const svc = await this.prisma.service.findFirst({ where: { id: body.serviceId, businessId: id } });
    if (!svc) throw new BadRequestException('Service not found for this business');
    return this.prisma.promotion.create({
      data: {
        businessId: id,
        serviceId: body.serviceId,
        discountPercent: body.discountPercent || 10,
        label: body.label || null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
      include: { service: true },
    });
  }

  @Patch('business/:id/promotions/:promoId')
  async updatePromotion(
    @Param('id') id: string,
    @Param('promoId') promoId: string,
    @Body() body: { discountPercent?: number; label?: string; endsAt?: string; active?: boolean },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const promo = await this.prisma.promotion.findUnique({ where: { id: promoId } });
    if (!promo || promo.businessId !== id) throw new BadRequestException('Promotion not found');
    return this.prisma.promotion.update({
      where: { id: promoId },
      data: {
        discountPercent: body.discountPercent !== undefined ? body.discountPercent : undefined,
        label: body.label !== undefined ? body.label : undefined,
        endsAt: body.endsAt !== undefined ? (body.endsAt ? new Date(body.endsAt) : null) : undefined,
        active: body.active !== undefined ? body.active : undefined,
      },
      include: { service: true },
    });
  }

  @Delete('promotions/:promoId')
  async deletePromotion(
    @Param('promoId') promoId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const promo = await this.prisma.promotion.findUnique({ where: { id: promoId } });
    if (!promo) throw new BadRequestException('Promotion not found');
    await requireBusinessOwner(this.prisma, authorization, promo.businessId);
    await this.prisma.promotion.delete({ where: { id: promoId } });
    return { ok: true };
  }

  @Get('business/:id/staff')
  async getBusinessStaff(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @Query('role') role: string = '',
    @Headers('authorization') authorization?: string,
  ) {
    const b = await this.prisma.business.findUnique({ where: { id } });
    if (!b || !(await isBusinessPubliclyVisible(this.prisma, b, authorization))) {
      return { data: [], total: 0, page: 1, limit: parseInt(limit), totalPages: 0 };
    }

    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const where: any = { businessId: id };
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role.trim() && role !== 'all') {
      where.role = role;
    }

    const [total, staff] = await Promise.all([
      this.prisma.staff.count({ where }),
      this.prisma.staff.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    // Gather stats for the staff members in the current page
    const staffIds = staff.map(s => s.id);
    const [reviewStats, clientStats] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['staffId'],
        where: { staffId: { in: staffIds } },
        _avg: { staffRating: true, rating: true },
        _count: { _all: true },
      }),
      this.prisma.booking.findMany({
        where: {
          staffId: { in: staffIds },
          userId: { not: '' },
          status: { notIn: ['cancelled', 'CANCELLED', 'rejected', 'REJECTED'] },
        },
        select: { staffId: true, userId: true },
        distinct: ['staffId', 'userId'],
      }),
    ]).catch(err => {
      console.error('[getBusinessStaff] Stats fetch failed:', err);
      return [[], []]; // Fallback to empty stats on error
    });

    const statsMap = new Map<string, { rating: number; reviews: number; clients: number }>();
    staffIds.forEach(id => statsMap.set(id, { rating: 0, reviews: 0, clients: 0 }));
    
    reviewStats.forEach(rs => {
      if (rs.staffId) {
        // Use staffRating as primary, fallback to service rating
        const avgRating = rs._avg.staffRating || rs._avg.rating || 0;
        statsMap.set(rs.staffId, {
          ...statsMap.get(rs.staffId)!,
          rating: avgRating,
          reviews: rs._count._all || 0,
        });
      }
    });

    clientStats.forEach(cs => {
      if (cs.staffId) {
        const current = statsMap.get(cs.staffId)!;
        statsMap.set(cs.staffId, { ...current, clients: current.clients + 1 });
      }
    });

    return {
      data: staff.map(s => {
        const stats = statsMap.get(s.id)!;
        return {
          ...s,
          image: safeImageUrl(s.image),
          experienceYears: s.experienceYears ?? 0,
          rating: Number(stats.rating.toFixed(1)),
          reviews: stats.reviews,
          clients: stats.clients,
        };
      }),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('business/:id/staff')
  async createStaff(
    @Param('id') id: string,
    @Body() body: CreateStaffDto,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (business) {
      const plan = business.plan || 'Basic';
      let staffLimit = 2; // Basic default
      if (plan === 'Premium') staffLimit = 5;
      else if (plan === 'Gold' || plan === 'Enterprise') staffLimit = 99999;

      const currentStaffCount = await this.prisma.staff.count({ where: { businessId: id } });
      if (currentStaffCount >= staffLimit) {
        throw new BadRequestException(
          `Staff limit reached. Your current plan (${plan}) allows up to ${staffLimit} staff members. Please upgrade to a higher plan to add more staff.`,
        );
      }
    }
    const staffImage = body.image !== undefined ? await this.storeImage(body.image, 'staff') : undefined;
    const created = await this.prisma.staff.create({
      data: {
        businessId: id,
        name: body.name,
        role: body.role,
        skills: body.skills ?? [],
        serviceIds: body.serviceIds ?? [],
        availability: body.availability,
        image: staffImage ?? undefined,
        bio: body.bio ?? null,
        experienceYears: body.experienceYears ?? 0,
      },
    });
    return { ...created, image: safeImageUrl(created.image) };
  }

  @Patch('staff/:id')
  async updateStaff(
    @Param('id') id: string,
    @Body() body: UpdateStaffDto,
    @Headers('authorization') authorization?: string,
  ) {
    const row = await this.prisma.staff.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('Staff not found');
    await requireBusinessOwner(this.prisma, authorization, row.businessId);
    const staffImage =
      body.image !== undefined ? await this.storeImage(body.image, 'staff') : undefined;
    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.skills !== undefined ? { skills: body.skills } : {}),
        ...(body.serviceIds !== undefined ? { serviceIds: body.serviceIds } : {}),
        ...(body.availability !== undefined ? { availability: body.availability } : {}),
        ...(staffImage !== undefined ? { image: staffImage } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.experienceYears !== undefined ? { experienceYears: body.experienceYears } : {}),
      },
    });
    return { ...updated, image: safeImageUrl(updated.image) };
  }

  @Delete('staff/:id')
  async deleteStaff(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const row = await this.prisma.staff.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('Staff not found');
    await requireBusinessOwner(this.prisma, authorization, row.businessId);
    await this.prisma.staff.delete({ where: { id } });
    return { ok: true };
  }

  @Get('business/:id/bookings')
  async getBusinessBookings(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Headers('authorization') authorization?: string,
  ) {
    try {
      await requireBusinessOwner(this.prisma, authorization, id);
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit));
      
      const where: any = { businessId: id };
      if (status && status !== 'all') where.status = status;
      if (staffId && staffId !== 'all') where.staffId = staffId;
      
      if (search && search.trim()) {
        where.OR = [
          { customerName: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const start = tryParseDate(startDate);
      const end = tryParseDate(endDate);

      if (start || end) {
        where.date = {};
        if (start) where.date.gte = start;
        if (end) {
          const e = new Date(end);
          e.setHours(23, 59, 59, 999);
          where.date.lte = e;
        }
      }

      const [total, bookings] = await Promise.all([
        this.prisma.booking.count({ where }),
        this.prisma.booking.findMany({
          where,
          include: { service: true, staff: true, user: true, familyMember: true, transaction: true },
          orderBy: { date: 'desc' },
          skip: (p - 1) * l,
          take: l,
        }),
      ]);

      return {
        data: bookings,
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      };
    } catch (err) {
      console.error(`[getBusinessBookings] Failed for business ${id}:`, err);
      if (err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException(err instanceof Error ? err.message : 'Failed to fetch bookings');
    }
  }

  @Post('business/:id/bookings')
  async createBooking(
    @Param('id') id: string,
    @Body() body: CreateBookingDto,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const userId = await resolveBookingCreateUser(this.prisma, body);
    const svcId = typeof body.serviceId === 'string' && body.serviceId.trim() ? body.serviceId : null;
    const stId = typeof body.staffId === 'string' && body.staffId.trim() ? body.staffId : null;

    const biz = await this.prisma.business.findUnique({ where: { id: id! } });
    const taxP = biz?.taxPercentage ?? 0;

    return this.prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          businessId: id,
          userId,
          customerName: body.customerName,
          date: new Date(body.date),
          status: body.status,
          price: body.price,
          taxAmount: (body.price * taxP) / 100,
          serviceId: svcId,
          staffId: stId,
        },
      });

      const earningStatuses = ['Completed', 'Paid'];
      if (earningStatuses.includes(b.status)) {
        const commissionPct = await loadDefaultCommissionPercent(this.prisma);
        const settlement = calculateBookingSettlement(
          [{ price: b.price, taxAmount: b.taxAmount }],
          commissionPct,
        );
        await tx.business.update({
          where: { id },
          data: {
            balance: { increment: settlement.businessCredit },
            revenue: { increment: settlement.customerTotal },
          },
        });
        if (settlement.commissionAmount > 0) {
          await tx.systemConfig.upsert({
            where: { id: 1 },
            update: { platformBalance: { increment: settlement.commissionAmount } },
            create: { id: 1, platformBalance: settlement.commissionAmount },
          });
        }
      }
      return b;
    });
  }

  @Post('business/:id/pay-group')
  async payBusinessBookingGroup(
    @Param('id') id: string,
    @Body() body: { bookingIds: string[]; paymentMethod?: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const method = body.paymentMethod || 'Cash';
    return finalizeBusinessBookingGroupPayment(
      this.prisma,
      id,
      body.bookingIds ?? [],
      method,
    );
  }

  @Patch('business/:id/bookings/:bookingId/propose-reschedule')
  async proposeReschedule(
    @Param('id') id: string,
    @Param('bookingId') bookingId: string,
    @Body() body: { newDate: string },
    @Headers('authorization') authorization?: string,
  ) {
    console.log(`[proposeReschedule] businessId=${id}, bookingId=${bookingId}, newDate=${body.newDate}`);
    await requireBusinessOwner(this.prisma, authorization, id);
    return await this.prisma.booking.update({
      where: { id: bookingId, businessId: id },
      data: { 
        date: new Date(body.newDate),
        status: 'Rescheduled' 
      },
    });
  }



  @Patch('bookings/:id')
  async updateBooking(
    @Param('id') id: string,
    @Body() body: UpdateBookingDto,
    @Headers('authorization') authorization?: string,
  ) {
    const old = await this.prisma.booking.findUnique({ where: { id } });
    if (!old) throw new BadRequestException('Booking not found');
    await requireBusinessOwner(this.prisma, authorization, old.businessId);

    const data: Record<string, unknown> = {};
    if (body.customerName !== undefined) data.customerName = body.customerName;
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.status !== undefined) {
      const next = body.status;
      if (next === 'Completed' && old.status !== 'Paid') {
        const cashPending =
          isCashPaymentMethod(old.paymentMethod) && !old.transactionId;
        if (cashPending) {
          throw new BadRequestException(
            'Confirm cash payment received before marking this booking completed',
          );
        }
      }
      data.status = next;
    }
    if (body.price !== undefined) data.price = body.price;
    if (body.serviceId !== undefined) {
      data.serviceId =
        typeof body.serviceId === 'string' && body.serviceId.trim() ? body.serviceId : null;
    }
    if (body.staffId !== undefined) {
      data.staffId = typeof body.staffId === 'string' && body.staffId.trim() ? body.staffId : null;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({ where: { id }, data });

      const earningStatuses = ['Completed', 'Paid'];
      const wasEarned = old.status && earningStatuses.includes(old.status);
      const isEarned = updated.status && earningStatuses.includes(updated.status);

      if (!wasEarned && isEarned) {
        const commissionPct = await loadDefaultCommissionPercent(this.prisma);
        const settlement = calculateBookingSettlement(
          [{ price: updated.price, taxAmount: updated.taxAmount }],
          commissionPct,
        );
        await tx.business.update({
          where: { id: updated.businessId },
          data: {
            balance: { increment: settlement.businessCredit },
            revenue: { increment: settlement.customerTotal },
          },
        });
        if (settlement.commissionAmount > 0) {
          await tx.systemConfig.upsert({
            where: { id: 1 },
            update: { platformBalance: { increment: settlement.commissionAmount } },
            create: { id: 1, platformBalance: settlement.commissionAmount },
          });
        }
      } else if (wasEarned && !isEarned) {
        const commissionPct = await loadDefaultCommissionPercent(this.prisma);
        const settlement = calculateBookingSettlement(
          [{ price: old.price, taxAmount: old.taxAmount }],
          commissionPct,
        );
        await tx.business.update({
          where: { id: updated.businessId },
          data: {
            balance: { decrement: settlement.businessCredit },
            revenue: { decrement: settlement.customerTotal },
          },
        });
        if (settlement.commissionAmount > 0) {
          await tx.systemConfig.upsert({
            where: { id: 1 },
            update: { platformBalance: { decrement: settlement.commissionAmount } },
            create: { id: 1, platformBalance: 0 },
          });
        }
      }
      if (body.status !== undefined && old.status !== updated.status) {
        const customer = await this.prisma.user.findUnique({
          where: { id: updated.userId },
          select: { id: true, email: true, phone: true },
        });
        const biz = await this.prisma.business.findUnique({
          where: { id: updated.businessId },
          select: { name: true, email: true, owner: true, phone: true },
        });
        if (customer) {
          void notifyCustomerUser(this.prisma, customer, {
            type: 'BOOKING_STATUS',
            title: `Booking ${updated.status}`,
            body: `Your appointment at ${biz?.name || 'the venue'} is now ${updated.status}.`,
          });
        }
      }

      return updated;
    });
  }


  @Get('business/:id/reviews')
  async getBusinessReviews(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const p = Math.max(1, Number(page || 1));
    const l = Math.max(1, Number(limit || 10));

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { businessId: id },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.review.count({ where: { businessId: id } }),
    ]);

    return {
      data: reviews,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('mobile/reviews')
  async createMobileReview(
    @Body() body: { 
      bookingId: string; 
      staffRating: number; 
      businessRating: number; 
      serviceRating?: number;
      comment: string 
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { service: true, staff: true },
    });
    if (!booking) throw new BadRequestException('Booking not found');
    if (booking.userId !== user.id) throw new BadRequestException('Unauthorized');
    if (booking.status !== 'Completed') throw new BadRequestException('Only completed bookings can be reviewed');
    if (booking.isReviewed) throw new BadRequestException('Booking already reviewed');

    const review = await this.prisma.review.create({
      data: {
        userId: user.id,
        businessId: booking.businessId,
        bookingId: booking.id,
        staffId: booking.staffId,
        customerName: user.name,
        avatar: user.avatar,
        staffRating: body.staffRating,
        businessRating: body.businessRating,
        rating: body.serviceRating ?? body.businessRating,
        comment: body.comment,
        serviceName: booking.service?.name || 'Service',
        staffName: booking.staff?.name || 'Staff',
        status: 'Approved',
      },
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { isReviewed: true },
    });

    return review;
  }

  @Post('mobile/reviews/group')
  async createMobileReviewGroup(
    @Body() body: { 
      businessRating: number; 
      comment: string;
      services: { bookingId: string; serviceRating: number; staffRating: number; comment?: string }[]
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    if (!Array.isArray(body.services) || body.services.length === 0) {
      throw new BadRequestException('services must be a non-empty array');
    }

    const reviews = [];
    for (let i = 0; i < body.services.length; i++) {
      const s = body.services[i];
      const booking = await this.prisma.booking.findUnique({
        where: { id: s.bookingId },
        include: { service: true, staff: true },
      });
      if (!booking || booking.userId !== user.id) continue;
      if (booking.status !== 'Completed' || booking.isReviewed) continue;

      const review = await this.prisma.review.create({
        data: {
          userId: user.id,
          businessId: booking.businessId,
          bookingId: booking.id,
          staffId: booking.staffId,
          customerName: user.name,
          avatar: user.avatar,
          staffRating: s.staffRating,
          // Only store business rating and top-level comment on the first review to avoid duplication in venue list
          businessRating: i === 0 ? body.businessRating : null,
          rating: s.serviceRating, 
          comment: i === 0 ? body.comment : (s.comment || ''),
          serviceName: booking.service?.name || 'Service',
          staffName: booking.staff?.name || 'Staff',
          status: 'Approved',
        },
      });

      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { isReviewed: true },
      });
      reviews.push(review);
    }

    return { ok: true, count: reviews.length };
  }

  @Patch('reviews/:id')
  async updateReview(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new BadRequestException('Review not found');
    await requireBusinessOwner(this.prisma, authorization, r.businessId);
    return this.prisma.review.update({ where: { id }, data: body });
  }

  @Delete('reviews/:id')
  async deleteReview(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new BadRequestException('Review not found');
    await requireBusinessOwner(this.prisma, authorization, r.businessId);
    await this.prisma.review.delete({ where: { id } });
    return { ok: true };
  }

  @Get('business/:id/transactions')
  async getBusinessTransactions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);

    const filter: any = { businessId: id };
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { bookingId: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { staffMember: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (page) {
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit || '10'));
      const [data, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where: filter,
          orderBy: { date: 'desc' },
          skip: (p - 1) * l,
          take: l,
        }),
        this.prisma.transaction.count({ where: filter }),
      ]);
      return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
    }

    return this.prisma.transaction.findMany({ where: filter, orderBy: { date: 'desc' } });
  }

  @Post('business/:id/transactions')
  async createTransaction(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.transaction.create({ data: { ...(body as object), businessId: id } as any });
  }

  @Get('business/:id/withdrawals')
  async getBusinessWithdrawals(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);

    if (page) {
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit || '10'));
      const [data, total] = await Promise.all([
        this.prisma.withdrawal.findMany({
          where: { businessId: id },
          orderBy: { date: 'desc' },
          skip: (p - 1) * l,
          take: l,
        }),
        this.prisma.withdrawal.count({ where: { businessId: id } }),
      ]);
      return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
    }

    return this.prisma.withdrawal.findMany({
      where: { businessId: id },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  @Post('business/:id/withdrawals')
  async createBusinessWithdrawal(
    @Param('id') id: string,
    @Body() body: { amount: number },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    return this.prisma.$transaction(async (tx) => {
      const biz = await tx.business.findUnique({ where: { id } });
      if (!biz) throw new BadRequestException('Business not found');
      if (biz.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }
      const newBal = Number((biz.balance - amount).toFixed(2));
      const w = await tx.withdrawal.create({
        data: {
          businessId: id,
          amount,
          balance: newBal,
          status: 'Pending',
        },
      });
      await tx.business.update({ where: { id }, data: { balance: newBal } });
      
      // Also create a Transaction record for the history view
      await tx.transaction.create({
        data: {
          businessId: id,
          amount,
          type: 'Withdrawal',
          status: 'Completed',
          description: `Withdrawal request #${w.id.slice(-6).toUpperCase()}`,
          date: new Date(),
        }
      });
      
      return w;
    });
  }

  @Post('business/:id/support-request')
  async createBusinessSupportRequest(
    @Param('id') id: string,
    @Body() body: { message: string; subject?: string; category?: string; screenshotUrl?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const { user } = await requireBusinessOwner(this.prisma, authorization, id);
    const biz = await this.prisma.business.findUnique({ where: { id } });
    const screenshotUrl = await this.storeImage(body.screenshotUrl, 'support');
    const ticket = await createSupportTicket(this.prisma, {
      subject: body.subject || `Support from ${biz?.name ?? 'merchant'}`,
      message: body.message,
      category: body.category || 'merchant',
      screenshotUrl: screenshotUrl ?? undefined,
      businessId: id,
      userId: user.id,
      createdByRole: Role.BUSINESS,
      requesterName: biz?.owner || biz?.name || user.name,
      requesterEmail: biz?.email || user.email,
      requesterPhone: biz?.phone,
    });
    return { ok: true, ticketId: ticket.id, ticketRef: ticket.ticketRef };
  }

  @Get('business/:id/support/tickets')
  async getBusinessSupportTickets(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const rows = await this.prisma.supportTicket.findMany({
      where: { businessId: id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return rows.map((t) => mapSupportTicketRow({ ...t, messages: t.messages }));
  }

  @Post('business/:id/support/tickets')
  async createBusinessSupportTicket(
    @Param('id') id: string,
    @Body()
    body: {
      subject: string;
      message: string;
      category?: string;
      priority?: string;
      screenshotUrl?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const { user } = await requireBusinessOwner(this.prisma, authorization, id);
    const biz = await this.prisma.business.findUnique({ where: { id } });
    const screenshotUrl = await this.storeImage(body.screenshotUrl, 'support');
    const ticket = await createSupportTicket(this.prisma, {
      subject: body.subject,
      message: body.message,
      category: body.category || 'technical',
      priority: body.priority,
      screenshotUrl: screenshotUrl ?? undefined,
      businessId: id,
      userId: user.id,
      createdByRole: Role.BUSINESS,
      requesterName: biz?.owner || biz?.name || user.name,
      requesterEmail: biz?.email || user.email,
      requesterPhone: biz?.phone,
    });
    return mapSupportTicketRow(ticket);
  }

  @Get('business/:id/support/tickets/:ticketId')
  async getBusinessSupportTicket(
    @Param('id') id: string,
    @Param('ticketId') ticketId: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, businessId: id },
      include: { messages: { orderBy: { createdAt: 'asc' } }, business: true },
    });
    if (!ticket) throw new BadRequestException('Ticket not found');
    return mapSupportTicketRow(ticket);
  }

  @Post('business/:id/support/tickets/:ticketId/reply')
  async replyBusinessSupportTicket(
    @Param('id') id: string,
    @Param('ticketId') ticketId: string,
    @Body() body: { message: string; screenshotUrl?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const { user } = await requireBusinessOwner(this.prisma, authorization, id);
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, businessId: id },
    });
    if (!ticket) throw new BadRequestException('Ticket not found');
    const biz = await this.prisma.business.findUnique({ where: { id } });
    const attachmentUrl = await this.storeImage(body.screenshotUrl, 'support');
    await addSupportTicketReply(this.prisma, ticketId, {
      body: body.message,
      senderRole: Role.BUSINESS,
      senderName: biz?.owner || user.name,
      attachmentUrl: attachmentUrl ?? undefined,
      reopen: true,
    });
    const updated = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: 'asc' } }, business: true },
    });
    return mapSupportTicketRow(updated!);
  }

  @Get('support/tickets')
  async getUserSupportTickets(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const rows = await this.prisma.supportTicket.findMany({
      where: { userId: user.id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return rows.map((t) => mapSupportTicketRow({ ...t, messages: t.messages }));
  }

  @Post('support/tickets')
  async createUserSupportTicket(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      subject: string;
      message: string;
      category?: string;
      screenshotUrl?: string;
      businessId?: string;
    },
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const screenshotUrl = await this.storeImage(body.screenshotUrl, 'support');
    const ticket = await createSupportTicket(this.prisma, {
      subject: body.subject,
      message: body.message,
      category: body.category || 'customer',
      screenshotUrl: screenshotUrl ?? undefined,
      businessId: body.businessId || null,
      userId: user.id,
      createdByRole: Role.USER,
      requesterName: user.name,
      requesterEmail: user.email,
      requesterPhone: user.phone,
    });
    return mapSupportTicketRow(ticket);
  }

  @Get('support/tickets/:ticketId')
  async getUserSupportTicket(
    @Headers('authorization') authorization: string | undefined,
    @Param('ticketId') ticketId: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId: user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new BadRequestException('Ticket not found');
    return mapSupportTicketRow(ticket);
  }

  @Post('support/tickets/:ticketId/reply')
  async replyUserSupportTicket(
    @Headers('authorization') authorization: string | undefined,
    @Param('ticketId') ticketId: string,
    @Body() body: { message: string; screenshotUrl?: string },
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId: user.id },
    });
    if (!ticket) throw new BadRequestException('Ticket not found');
    const attachmentUrl = await this.storeImage(body.screenshotUrl, 'support');
    const result = await addSupportTicketReply(this.prisma, ticketId, {
      body: body.message,
      senderRole: Role.USER,
      senderName: user.name,
      attachmentUrl: attachmentUrl ?? undefined,
      reopen: true,
    });
    return mapSupportTicketRow({ ...result.ticket, messages: [result.message] });
  }

  @Get('business/:id/machines')
  async getMachines(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.machine.findMany({ where: { businessId: id } });
  }

  @Post('business/:id/machines')
  async createMachine(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.machine.create({ data: { ...(body as object), businessId: id } as any });
  }

  @Get('business/:id/parts')
  async getParts(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.part.findMany({ where: { businessId: id } });
  }

  @Post('business/:id/parts')
  async createPart(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.part.create({ data: { ...(body as object), businessId: id } as any });
  }

  @Get('business/:id/qa-inspections')
  async getQaInspections(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.qaInspection.findMany({ where: { businessId: id } });
  }

  @Post('business/:id/qa-inspections')
  async createQaInspection(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const qa = await this.prisma.qaInspection.create({ data: { ...(body as object), businessId: id } as any });
    await this.prisma.notification.create({
      data: { type: 'QA_COMPLETION', title: 'QA inspection completed', body: `QA ${qa.id} done`, role: Role.BUSINESS },
    });
    return qa;
  }

  @Get('business/:id/ncrs')
  async getNcrs(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.ncr.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' } });
  }

  @Post('business/:id/ncrs')
  async createNcr(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const ncr = await this.prisma.ncr.create({ data: { ...(body as object), businessId: id } as any });
    await this.prisma.notification.create({
      data: { type: 'NCR_ALERT', title: 'NCR reported', body: `NCR ${ncr.id} reported`, role: Role.ADMIN },
    });
    return ncr;
  }

  @Get('business/:id/orders')
  async getOrders(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.order.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' } });
  }

  @Post('business/:id/orders')
  async createOrder(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const order = await this.prisma.order.create({ data: { ...(body as object), businessId: id } as any });
    await this.prisma.notification.create({
      data: { type: 'ORDER_UPDATE', title: 'Order updated', body: `Order ${order.id} created`, role: Role.USER },
    });
    return order;
  }

  @Get('mobile/bookings/:id/group')
  async getMobileBookingGroup(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findUnique({
      where: { id, userId: user.id },
      include: { business: true },
    });
    if (!booking) throw new BadRequestException('Booking not found');

    const dayStart = new Date(booking.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(booking.date);
    dayEnd.setHours(23, 59, 59, 999);

    const groupWhere = booking.bookingGroupId
      ? { userId: user.id, bookingGroupId: booking.bookingGroupId }
      : {
          userId: user.id,
          businessId: booking.businessId,
          date: { gte: dayStart, lte: dayEnd },
        };

    const group = await this.prisma.booking.findMany({
      where: groupWhere,
      include: { business: true, service: true, staff: true, familyMember: true, transaction: true },
      orderBy: { date: 'asc' },
    });
    return group.map(sanitizeMobileBooking);
  }

  @Get('mobile/bookings')
  async getMobileBookings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    // For mobile, we usually want ongoing and history separately.
    // We'll paginate the history, and keep ongoing (usually few) as is or limited.
    const ongoingStatuses = ['Pending', 'Approved', 'Paid', 'Rescheduled'];
    const historyStatuses = ['Completed', 'Rejected', 'Cancelled'];
    const [ongoing, historyTotal, history] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          userId: user.id,
          OR: ongoingStatuses.map((status) => ({ status: { equals: status, mode: 'insensitive' as const } })),
        },
        include: { business: true, service: true, staff: true, familyMember: true, transaction: true },
        orderBy: { date: 'asc' },
        take: 50,
      }),
      this.prisma.booking.count({
        where: {
          userId: user.id,
          OR: historyStatuses.map((status) => ({ status: { equals: status, mode: 'insensitive' as const } })),
        },
      }),
      this.prisma.booking.findMany({
        where: {
          userId: user.id,
          OR: historyStatuses.map((status) => ({ status: { equals: status, mode: 'insensitive' as const } })),
        },
        include: { business: true, service: true, staff: true, familyMember: true, transaction: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      ongoing: ongoing.map(sanitizeMobileBooking),
      history: {
        data: history.map(sanitizeMobileBooking),
        total: historyTotal,
        page: p,
        limit: l,
        totalPages: Math.ceil(historyTotal / l),
      },
    };
  }

  @Get('mobile/family-members')
  async listFamilyMembers(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    return this.prisma.familyMember.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get('mobile/staff/:id/busy-slots')
  async getStaffBusySlots(
    @Param('id') staffId: string,
    @Query('date') dateStr: string,
  ) {
    const dayStart = new Date(dateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateStr);
    dayEnd.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        staffId,
        status: { notIn: ['Cancelled', 'Rejected'] },
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: { service: true },
    });

    return bookings.map((b) => {
      const start = new Date(b.date);
      const duration = b.service?.duration || 30;
      const end = new Date(start.getTime() + duration * 60000);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
      };
    });
  }

  @Post('mobile/family-members')
  async createFamilyMember(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateFamilyMemberDto,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    return this.prisma.familyMember.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        age: body.age ?? null,
        gender: body.gender.trim(),
        email: body.email?.trim() || null,
      },
    });
  }

  @Patch('mobile/family-members/:id')
  async updateFamilyMember(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: UpdateFamilyMemberDto,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const row = await this.prisma.familyMember.findFirst({ where: { id, userId: user.id } });
    if (!row) throw new BadRequestException('Family member not found');
    const data: {
      name?: string;
      age?: number | null;
      gender?: string;
      email?: string | null;
    } = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.age !== undefined) {
      const ageNum = Number(body.age);
      data.age = Number.isFinite(ageNum) && ageNum >= 0 ? Math.floor(ageNum) : null;
    }
    if (body.gender !== undefined) data.gender = String(body.gender).trim();
    if (body.email !== undefined) {
      const rawEmail = body.email;
      data.email =
        rawEmail === null || rawEmail === undefined
          ? null
          : String(rawEmail).trim() || null;
    }
    return this.prisma.familyMember.update({
      where: { id },
      data,
    });
  }

  @Delete('mobile/family-members/:id')
  async deleteFamilyMember(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const row = await this.prisma.familyMember.findFirst({ where: { id, userId: user.id } });
    if (!row) throw new BadRequestException('Family member not found');
    await this.prisma.familyMember.delete({ where: { id } });
    return { ok: true };
  }

  @Patch('mobile/bookings/:id/cancel')
  async cancelMobileBooking(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const result = await cancelBookingsForCustomer(this.prisma, user.id, [id]);
    return { ok: true, ...result };
  }

  @Post('mobile/bookings/cancel-group')
  async cancelMobileBookingGroup(
    @Headers('authorization') authorization?: string,
    @Body() body: { bookingIds?: string[] } = {},
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const ids = Array.isArray(body.bookingIds) ? body.bookingIds.filter((id) => typeof id === 'string' && id.trim()) : [];
    const result = await cancelBookingsForCustomer(this.prisma, user.id, ids);
    return { ok: true, ...result };
  }

  @Post('mobile/bookings/:id/pay')
  async payMobileBooking(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Body() body: { paymentMethod?: string } = {},
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const method = body.paymentMethod || 'Cash Payment';
    return finalizeBookingGroupPayment(this.prisma, user, [id], method);
  }

  /** Pay for a GROUP of bookings (pay-by-visit / in-person). Wompi/Yappy use provider checkout when wired. */
  @Post('mobile/bookings/pay-group')
  async payMobileBookingGroup(
    @Headers('authorization') authorization?: string,
    @Body() body: { bookingIds: string[]; paymentMethod?: string; businessId?: string } = { bookingIds: [] },
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const method = (body.paymentMethod || 'Cash Payment').trim();
    const digital = ['Card Payment', 'Stripe', 'Online', 'Wompi', 'Yappy'];
    if (digital.includes(method)) {
      throw new BadRequestException(
        'Online card and Yappy payments are completed via Wompi/Yappy checkout when configured. Pay-by-visit uses this endpoint with paymentMethod "Pay by visit".',
      );
    }
    return finalizeBookingGroupPayment(this.prisma, user, body.bookingIds, method);
  }

  /** @deprecated Stripe removed for Panama — use Wompi when checkout is enabled */
  @Post('mobile/bookings/pay-group/stripe-checkout')
  async payMobileBookingGroupStripe() {
    throw new BadRequestException(
      'Stripe is not used. Configure Wompi Panama under Admin → Settings → Payment gateways.',
    );
  }

  @Post('mobile/bookings/:id/complete')
  async completeUserBooking(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || (booking.userId !== user.id && user.role !== Role.ADMIN)) {
      throw new ForbiddenException();
    }
    if (booking.status !== 'Paid') throw new BadRequestException('Only paid bookings can be completed');
    return await this.prisma.booking.update({
      where: { id },
      data: { status: 'Completed' },
    });
  }

  @Post('mobile/bookings/:id/accept-reschedule')
  async acceptReschedule(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.userId !== user.id) throw new ForbiddenException();
    if (booking.status !== 'Rescheduled') throw new BadRequestException('Not in rescheduled state');
    return await this.prisma.booking.update({
      where: { id },
      data: { status: 'Approved' },
    });
  }

  @Post('mobile/bookings')
  async createMobileBooking(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: {
      businessId: string;
      serviceId: string;
      date: string;
      staffId?: string;
      familyMemberId?: string;
      paymentMethod?: string;
      bookingGroupId?: string;
    },
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const business = await this.prisma.business.findUnique({ where: { id: body.businessId } });
    if (!business || !isBusinessDiscoverable(business)) {
      throw new BadRequestException('Business is not available for booking');
    }

    if (business.plan === 'Basic') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthlyBookingCount = await this.prisma.booking.count({
        where: {
          businessId: body.businessId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });
      if (monthlyBookingCount >= 50) {
        throw new BadRequestException(
          'This venue has reached its monthly limit of 50 bookings under the Basic plan. Please upgrade to a higher tier.',
        );
      }
    }
    const service = await this.prisma.service.findFirst({
      where: { id: body.serviceId, businessId: body.businessId },
    });
    if (!service) throw new BadRequestException('Service not found for this business');
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');
    let staffId: string | null = null;
    const rawStaff = typeof body.staffId === 'string' ? body.staffId.trim() : '';
    if (rawStaff) {
      const st = await this.prisma.staff.findFirst({
        where: { id: rawStaff, businessId: body.businessId },
      });
      if (st) {
        const ids = st.serviceIds ?? [];
        if (ids.length > 0 && !ids.includes(service.id)) {
          throw new BadRequestException('Selected staff does not offer this service');
        }
        staffId = st.id;
      }
    }

    let customerName = user.name;
    let familyMemberId: string | null = null;
    const rawFm = typeof body.familyMemberId === 'string' ? body.familyMemberId.trim() : '';
    if (rawFm) {
      const fm = await this.prisma.familyMember.findFirst({
        where: { id: rawFm, userId: user.id },
      });
      if (fm) {
        familyMemberId = fm.id;
        customerName = fm.name;
      }
    }
    const activePromotion = await this.prisma.promotion.findFirst({
      where: {
        serviceId: service.id,
        active: true,
        startsAt: { lte: new Date() },
        OR: [
          { endsAt: null },
          { endsAt: { gte: new Date() } }
        ]
      }
    });

    const finalPrice = activePromotion 
      ? service.price * (1 - activePromotion.discountPercent / 100)
      : service.price;

    const status = initialBookingStatusForBusiness(business);
    const taxPercentage = business.taxPercentage || 0;
    const taxAmount = (finalPrice * taxPercentage) / 100;
    const autoApproved = status === 'Approved';

    const rawPaymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
    const paymentMethod = rawPaymentMethod || 'Online';

    const rawGroupId = typeof body.bookingGroupId === 'string' ? body.bookingGroupId.trim() : '';
    const bookingGroupId = rawGroupId.length > 0 ? rawGroupId : null;

    const booking = await this.prisma.booking.create({
      data: {
        userId: user.id,
        businessId: body.businessId,
        serviceId: service.id,
        staffId,
        familyMemberId,
        customerName,
        date,
        status,
        price: finalPrice,
        taxAmount,
        paymentMethod,
        bookingGroupId,
      },
    });

    const dateLabel = date.toLocaleDateString('es-PA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeLabel = date.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });
    const bookingCode = `RZV-${date.getFullYear()}-${booking.id.slice(0, 4).toUpperCase()}`;
    const bookingModel = {
      customerName,
      userName: user.name,
      businessName: business.name,
      serviceName: service.name,
      date: dateLabel,
      time: timeLabel,
      address: business.address || '',
      paymentMethod,
      bookingCode,
    };

    void notifyCustomerUser(this.prisma, user, {
      type: autoApproved ? 'BOOKING_APPROVED' : 'BOOKING_CREATED',
      title: autoApproved ? 'Booking confirmed' : 'Booking request submitted',
      body: autoApproved
        ? `Your appointment at ${business.name} is confirmed. You can complete payment when ready.`
        : `Your appointment request at ${business.name} was submitted and is pending approval.`,
      emailTemplate: autoApproved ? 'booking-confirmation' : 'booking-request-sent',
      emailModel: bookingModel,
    });

    void notifyPlatformAdmins(this.prisma, {
      type: 'BOOKING_CREATED',
      title: `New booking — ${business.name}`,
      body: `${customerName} booked ${service.name} for ${date.toLocaleString()} (${status}).`,
      emailSubject: `[Rezervame] New booking at ${business.name}`,
    });

    void notifyBusinessAccount(this.prisma, business, {
      type: 'BOOKING_CREATED',
      title: autoApproved ? 'New confirmed booking' : 'New booking request',
      body: `${customerName} — ${service.name} on ${dateLabel} at ${timeLabel}.`,
      emailSubject: autoApproved
        ? `[Rezervame] New confirmed booking`
        : `[Rezervame] New booking request`,
      emailTemplate: autoApproved ? 'booking-confirmation' : 'booking-request-sent',
      emailModel: { ...bookingModel, customerName, userName: business.owner || business.name },
      sendEmail: business.notifyBookingEmail !== false,
    });

    return booking;
  }

  @Get('mobile/invoices')
  async getMobileInvoices(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const allTx = await this.prisma.transaction.findMany({
      where: { bookings: { some: { userId: user.id } } },
      include: { business: true, bookings: { include: { service: true, staff: true } } },
      orderBy: { date: 'desc' },
    });
    const deduped = dedupeTransactionsByBookingGroup(allTx);
    const total = deduped.length;
    const tx = deduped.slice((p - 1) * l, p * l);

    const data = tx.map((t) => {
      const logo = (t.business.logoUrl || '').trim();
      const banner = (t.business.bannerUrl || '').trim();
      const venueImageUrl = logo || banner || null;
      
      const lines = t.bookings.length > 0 
        ? t.bookings.map(b => ({ 
            title: b.service?.name || 'Service', 
            amount: b.price,
            professional: b.staff?.name || '—'
          }))
        : [{ title: t.description || t.paymentMethod, amount: t.amount, professional: t.staffMember || '—' }];

      return {
        id: t.id,
        bookingId: t.bookingId,
        number: `RZV-${t.date.getFullYear()}-${t.id.slice(0, 4).toUpperCase()}`,
        venueName: t.business.name,
        issuedDate: t.date,
        subtotal: t.amount - (t.taxAmount || 0),
        amount: t.amount,
        taxAmount: t.taxAmount || 0,
        taxPercentage: t.business?.taxPercentage || 0,
        total: t.amount,
        status: t.status,
        locationLine: t.business.address,
        venueImageUrl,
        paymentMethod: t.paymentMethod,
        lines,
      };
    });

    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Get('mobile/venues')
  async getMobileVenues(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minRating') minRating?: string,
    @Query('sortBy') sortBy: string = 'newest',
    @Query('userLat') userLat?: string,
    @Query('userLng') userLng?: string,
  ) {
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const geo = parseUserGeoQuery(userLat, userLng);

    const where: any = { ...businessDiscoveryWhere };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { services: { some: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const categoryFilter =
      category && category !== 'all'
        ? category.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

    // Fetch businesses with their reviews to calculate ratings for filtering
    let businesses = await this.prisma.business.findMany({
      where,
      include: {
        reviews: { select: { businessRating: true } },
        services: { orderBy: { price: 'asc' } },
      },
    });

    if (categoryFilter.length > 0) {
      businesses = businesses.filter((b) =>
        businessMatchesCategoryFilter(b.categoryKeys, b.services, categoryFilter),
      );
    }

    const minR = parseFloat(minRating || '0');

    let mapped = businesses.map((b: any) => {
      const rStats = b.reviews || [];
      const validRatings = rStats.filter((r: any) => r.businessRating !== null);
      const count = rStats.length;
      const avg = validRatings.length > 0 
        ? validRatings.reduce((sum: number, r: any) => sum + r.businessRating, 0) / validRatings.length 
        : 0;
      const minPrice = b.services?.[0]?.price ?? 0;
      const serviceListImages = collectServiceListImageUrls(b.services || []);
      const firstServiceImage = serviceListImages[0] ?? null;
      const galleryThumb = firstListThumbnail(b.images);

      const distance = haversineKm(geo?.lat ?? 0, geo?.lng ?? 0, b.latitude ?? 0, b.longitude ?? 0);
      const bannerUrl = listImageUrl(b.bannerUrl) ?? listSmallInlineImageUrl(b.bannerUrl);
      const logoUrl = listImageUrl(b.logoUrl) ?? listSmallInlineImageUrl(b.logoUrl);
      const portfolioImageUrls = buildPortfolioImageUrls({
        services: b.services,
        images: b.images,
        bannerUrl: b.bannerUrl,
        logoUrl: b.logoUrl,
      });
      const cardImage =
        firstServiceImage ?? galleryThumb ?? bannerUrl ?? logoUrl ?? null;

      return {
        id: b.id,
        businessId: b.id,
        name: b.name,
        categoryKey: Array.from(businessEffectiveCategoryKeys(b.categoryKeys, b.services))[0] ?? 'barber',
        categoryKeys: Array.from(businessEffectiveCategoryKeys(b.categoryKeys, b.services)),
        rating: avg.toFixed(1),
        reviews: String(count),
        price: minPrice.toFixed(2),
        lat: b.latitude ?? 0,
        lng: b.longitude ?? 0,
        serviceName: b.services?.[0]?.name ?? null,
        serviceDurationMinutes: b.services?.[0]?.duration ?? null,
        serviceImageUrl: firstServiceImage,
        imageUrl: cardImage,
        bannerUrl,
        logoUrl,
        portfolioImageUrls,
        locationLabel: b.address.split(',')[0],
        distanceLabel: distanceLabelBetween(geo.lat, geo.lng, b.latitude, b.longitude),
        distance,
        ratingNum: avg,
        priceNum: minPrice,
        todaySlotTimings: getTodaySlotTimings(b.workingHours),
      };
    });

    // Filter by rating
    if (minR > 0) {
      mapped = mapped.filter(m => m.ratingNum >= minR);
    }

    // Sort
    mapped.sort((a, b) => {
      if (sortBy === 'ratingHighLow') return b.ratingNum - a.ratingNum;
      if (sortBy === 'priceLowHigh') return a.priceNum - b.priceNum;
      if (sortBy === 'priceHighLow') return b.priceNum - a.priceNum;
      if (sortBy === 'distance') return a.distance - b.distance;
      return 0;
    });

    const total = mapped.length;
    const paginated = mapped.slice((p - 1) * l, p * l);

    return {
      data: paginated,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Get('mobile/notifications')
  async getMobileNotifications(
    @Headers('authorization') authorization?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const where = {
      OR: [
        { userId: user.id },
        { role: Role.USER, userId: null },
        { type: 'BROADCAST' },
      ],
    };
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.notification.count({ where }),
    ]);
    const data = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    }));
    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: total > 0 ? Math.ceil(total / l) : 0,
    };
  }

  @Get('mobile/events')
  async getMobileEvents(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const where = { active: true };
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { startAt: 'asc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.event.count({ where }),
    ]);
    const data = events.map((e) => ({
      id: e.id,
      title: e.title,
      body: e.body,
      startAt: e.startAt,
      location: e.location,
      price: e.price,
      imageKey: e.imageKey,
      websiteUrl: e.websiteUrl,
    }));
    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: total > 0 ? Math.ceil(total / l) : 0,
    };
  }

  @Get('public/plans')
  async getPublicPlans() {
    await ensureHardcodedPlans(this.prisma);
    return this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
  }

  @Get('public/categories')
  async getPublicCategories() {
    const categories = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const activeBusinesses = await this.prisma.business.findMany({
      where: { ...businessDiscoveryWhere },
      select: {
        id: true,
        categoryKeys: true,
        services: { select: { category: true } },
      },
    });
    const countByKey = new Map<string, number>();
    for (const b of activeBusinesses) {
      for (const k of businessEffectiveCategoryKeys(b.categoryKeys, b.services)) {
        countByKey.set(k, (countByKey.get(k) ?? 0) + 1);
      }
    }
    return PARTNER_BUSINESS_TYPES.map((pt) => {
      const count = pt.categoryKeys.reduce((sum, k) => sum + (countByKey.get(k) ?? 0), 0);
      const dbRow =
        categories.find((c) => c.key === pt.primaryCategoryKey) ??
        categories.find((c) => pt.categoryKeys.includes(c.key));
      return {
        id: pt.id,
        partnerTypeId: pt.id,
        key: pt.primaryCategoryKey,
        filterParam: pt.categoryKeys.join(','),
        labelEn: dbRow?.labelEn ?? pt.labelEn,
        labelEs: dbRow?.labelEs ?? pt.labelEs,
        imageUrl: publicCategoryImageUrl(pt.primaryCategoryKey, dbRow?.imageUrl),
        active: true,
        sortOrder: pt.sortOrder,
        activeBusinessCount: count,
      };
    });
  }

  @Get('public/amenities')
  async getPublicAmenities() {
    return this.prisma.amenity.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        key: true,
        labelEn: true,
        labelEs: true,
        descriptionEn: true,
        descriptionEs: true,
        imageUrl: true,
        sortOrder: true,
      },
    });
  }

  @Post('public/business-join')
  async createPublicBusinessJoin(
    @Body()
    body: {
      name: string;
      taxId: string;
      owner: string;
      email: string;
      phone: string;
      address: string;
      categories: string[];
      services: Array<{
        name: string;
        price: number;
        duration: number;
        category?: string;
        imageUrl?: string;
      }>;
      idDocumentImage?: string;
      licenseDocumentImage?: string;
      insuranceDocumentImage?: string;
      password?: string;
      planId?: string;
      latitude?: number | null;
      longitude?: number | null;
      registrationDetails?: Record<string, unknown>;
    },
  ) {
    const name = (body.name || '').trim();
    const taxId = (body.taxId || '').trim();
    const owner = (body.owner || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();
    const address = (body.address || '').trim();
    const password = (body.password || '').trim();
    if (password) {
      const policy = await loadSecurityPolicy(this.prisma);
      assertPasswordMeetsPolicy(password, policy);
    }
    const categories = Array.isArray(body.categories) ? body.categories.filter(Boolean) : [];
    const services = Array.isArray(body.services) ? body.services : [];
    const idDocumentImage = await this.storeImage(String(body.idDocumentImage || '').trim(), 'documents/id');
    const licenseDocumentImage = await this.storeImage(
      String(body.licenseDocumentImage || '').trim(),
      'documents/license',
    );
    const insuranceDocumentImage = await this.storeImage(
      String(body.insuranceDocumentImage || '').trim(),
      'documents/insurance',
    );
    const inputPlanId = String(body.planId || 'basic').trim();
    const registrationDetails =
      body.registrationDetails && typeof body.registrationDetails === 'object'
        ? body.registrationDetails
        : null;
    const lat =
      body.latitude != null && Number.isFinite(Number(body.latitude))
        ? Number(body.latitude)
        : null;
    const lng =
      body.longitude != null && Number.isFinite(Number(body.longitude))
        ? Number(body.longitude)
        : null;
    const rd = registrationDetails as {
      openTime?: string;
      closeTime?: string;
      operatingDays?: string[];
      exteriorPhotoUrl?: string;
      interiorPhotoUrls?: string[];
      portfolioPhotoUrls?: string[];
    } | null;
    const workingHoursFromReg = rd
      ? [
          Array.isArray(rd.operatingDays) && rd.operatingDays.length
            ? `Days: ${rd.operatingDays.join(', ')}`
            : '',
          rd.openTime && rd.closeTime ? `Hours: ${rd.openTime}–${rd.closeTime}` : '',
        ]
          .filter(Boolean)
          .join(' | ')
      : '';
    const galleryFromReg: string[] = [];
    if (rd?.exteriorPhotoUrl) {
      const ext = await this.storeImage(String(rd.exteriorPhotoUrl), 'venues/gallery');
      if (ext) galleryFromReg.push(ext);
    }
    if (Array.isArray(rd?.interiorPhotoUrls)) {
      for (const img of rd.interiorPhotoUrls.slice(0, 5)) {
        const u = await this.storeImage(String(img || ''), 'venues/gallery');
        if (u) galleryFromReg.push(u);
      }
    }
    if (Array.isArray(rd?.portfolioPhotoUrls)) {
      for (const img of rd.portfolioPhotoUrls.slice(0, 10)) {
        const u = await this.storeImage(String(img || ''), 'venues/gallery');
        if (u) galleryFromReg.push(u);
      }
    }

    if (!name || !taxId || !owner || !email || !phone || !address) {
      throw new BadRequestException('name, taxId, owner, email, phone, and address are required');
    }
    if (categories.length === 0) {
      throw new BadRequestException('at least one category is required');
    }
    if (services.length === 0) {
      throw new BadRequestException('at least one service is required');
    }
    if (!idDocumentImage || !licenseDocumentImage || !insuranceDocumentImage) {
      throw new BadRequestException('id, license, and insurance images are required');
    }

    const serviceCreates = await Promise.all(
      services.map(async (s) => ({
        name: (s.name || '').trim() || 'Service',
        price: Number(s.price) || 0,
        duration: Number(s.duration) || 30,
        category: (s.category || categories[0] || 'general').toString(),
        imageUrl: await this.storeImage(String((s as { imageUrl?: string }).imageUrl || ''), 'venues/services'),
      })),
    );

    const existing = await this.prisma.business.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('business already exists for this email');

    await ensureHardcodedPlans(this.prisma);
    const selectedPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: inputPlanId },
    });
    const finalPlanId = selectedPlan ? selectedPlan.id : 'basic';
    const finalPlanName = selectedPlan ? selectedPlan.name : 'Basic';

    const merchantNumber = await allocateMerchantNumber(this.prisma);
    
    // Create Business and User in a transaction
    const created = await this.prisma.$transaction(async (tx) => {
      // Create User first if it doesn't exist
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (!existingUser && password) {
        await tx.user.create({
          data: {
            email,
            password: await hashPassword(password),
            name: owner,
            role: Role.BUSINESS,
          },
        });
      }

      const biz = await tx.business.create({
        data: {
          merchantNumber,
          name,
          owner,
          email,
          phone,
          address,
          ...(() => {
            const businessTypeId =
              typeof registrationDetails === 'object' && registrationDetails
                ? String((registrationDetails as { businessType?: string }).businessType || '').trim()
                : '';
            const migrated = migrateBusinessCategoryKeys(categories, businessTypeId || undefined);
            const mapped = businessTypeId
              ? categoryKeysAndLabelsForPartner(businessTypeId, migrated)
              : {
                  categoryKeys: migrated,
                  categoryLabels: displayLabelsForCategoryKeys(migrated, registrationDetails),
                };
            return {
              categoryKeys: mapped.categoryKeys,
              categoryLabels: mapped.categoryLabels,
              categoryLabel:
                mapped.categoryLabels.length > 0 ? mapped.categoryLabels.join(' · ') : null,
            };
          })(),
          description: `Categories: ${categories.join(', ')}`,
          taxId,
          status: 'pending',
          idVerified: false,
          licenseVerified: false,
          insuranceVerified: false,
          idDocumentImage,
          licenseDocumentImage,
          insuranceDocumentImage,
          plan: finalPlanName,
          planId: finalPlanId,
          latitude: lat,
          longitude: lng,
          workingHours: workingHoursFromReg || undefined,
          images: galleryFromReg,
          registrationDetails: registrationDetails
            ? (JSON.parse(JSON.stringify(registrationDetails)) as Prisma.InputJsonValue)
            : undefined,
          listingVisible: false,
          profileSetupComplete: false,
          services: {
            create: serviceCreates,
          },
        },
        include: { services: true },
      });

      await tx.businessStatusHistory.create({
        data: {
          businessId: biz.id,
          fromStatus: null,
          toStatus: biz.status,
          reason: 'Created from public business join form',
          actorName: 'System',
        },
      });

      return biz;
    });

    void notifyPlatformAdmins(this.prisma, {
      type: 'BUSINESS_REGISTRATION',
      title: `New business registration: ${name}`,
      body: `${owner} (${email}) applied for ${name}. Merchant #${created.merchantNumber ?? '—'}. Plan: ${finalPlanName}. Review in Admin → Businesses.`,
      emailSubject: `[Rezervame] New business registration — ${name}`,
    });

    void notifyBusinessAccount(this.prisma, created, {
      type: 'BUSINESS_REGISTRATION',
      title: 'Registration received',
      body: 'Thank you for registering. Our team will review your application within 24–48 hours.',
      emailSubject: '[Rezervame] We received your business registration',
    });

    void sendPlatformEmail(this.prisma, {
      to: email,
      template: 'welcome-business',
      model: {
        businessName: name,
        ownerName: owner,
        nextSteps:
          'Our team will review your documents within 24–48 hours. You will receive an email when your partner account is approved.',
      },
    }).catch(() => undefined);

    return {
      id: created.id,
      merchantNumber: created.merchantNumber,
      status: created.status,
      services: serviceCreates.length,
    };
  }

  @Get('admin/jobs')
  async getAdminJobs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('search') search: string = '',
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const where: { OR?: Array<Record<string, unknown>> } = {};
    const q = search.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [total, data] = await Promise.all([
      this.prisma.jobPosting.count({ where }),
      this.prisma.jobPosting.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (p - 1) * l,
        take: l,
      }),
    ]);
    return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Post('admin/jobs')
  async createAdminJob(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      title: string;
      location: string;
      description: string;
      applyUrl?: string;
      sortOrder?: number;
      active?: boolean;
    },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const title = String(body.title || '').trim();
    const location = String(body.location || '').trim();
    const description = String(body.description || '').trim();
    if (title.length < 2) throw new BadRequestException('Title is required');
    if (location.length < 2) throw new BadRequestException('Location is required');
    if (description.length < 5) throw new BadRequestException('Description is required');
    return this.prisma.jobPosting.create({
      data: {
        title,
        location,
        description,
        applyUrl: normalizeEventWebsiteUrl(body.applyUrl),
        sortOrder: body.sortOrder ?? 0,
        active: body.active !== false,
      },
    });
  }

  @Patch('admin/jobs/:id')
  async updateAdminJob(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      location?: string;
      description?: string;
      applyUrl?: string | null;
      sortOrder?: number;
      active?: boolean;
    },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.location !== undefined) data.location = String(body.location).trim();
    if (body.description !== undefined) data.description = String(body.description).trim();
    if (body.applyUrl !== undefined) {
      data.applyUrl = body.applyUrl === null || `${body.applyUrl}`.trim() === ''
        ? null
        : normalizeEventWebsiteUrl(body.applyUrl);
    }
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);
    if (body.active !== undefined) data.active = Boolean(body.active);
    return this.prisma.jobPosting.update({ where: { id }, data });
  }

  @Delete('admin/jobs/:id')
  async deleteAdminJob(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.jobPosting.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('mobile/jobs')
  async getMobileJobs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
  ) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const where = { active: true };
    const [data, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.jobPosting.count({ where }),
    ]);
    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: total > 0 ? Math.ceil(total / l) : 0,
    };
  }

  @Get('mobile/favorites')
  async getMobileFavorites(
    @Headers('authorization') authorization?: string,
    @Query('userLat') userLat?: string,
    @Query('userLng') userLng?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    const geo = parseUserGeoQuery(userLat, userLng);
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

    const favoriteChipKeys: Record<string, string[]> = {
      hair: ['hairService', 'barber'],
      facial: ['spaService', 'beautyService'],
      wax: ['nailCare'],
    };

    const businessWhere: any = { ...businessDiscoveryWhere };
    const q = search?.trim();
    if (q) {
      businessWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }
    const chip = category?.trim().toLowerCase();
    if (chip && chip !== 'all') {
      const keys = favoriteChipKeys[chip];
      if (keys?.length) {
        businessWhere.categoryKeys = { hasSome: keys };
      }
    }

    const favWhere = { userId: user.id, business: businessWhere };
    const [rows, total] = await Promise.all([
      this.prisma.userFavorite.findMany({
        where: favWhere,
        include: { business: true },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.userFavorite.count({ where: favWhere }),
    ]);
    if (rows.length === 0) {
      return { data: [], total, page: p, limit: l, totalPages: total > 0 ? Math.ceil(total / l) : 0 };
    }
    const businessIds = rows.map((r) => r.businessId);
    const itemImages = await this.prisma.service.findMany({
      where: { businessId: { in: businessIds } },
      orderBy: [{ price: 'asc' }, { name: 'asc' }],
      select: { businessId: true, imageUrl: true },
    });
    const itemImageByBusiness = new Map<string, string | null>();
    for (const s of itemImages) {
      if (itemImageByBusiness.has(s.businessId)) continue;
      const img = listImageUrl(s.imageUrl);
      if (img) itemImageByBusiness.set(s.businessId, img);
    }
    const [reviewAgg, reviewCounts, minPrices] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['businessId'],
        where: { businessId: { in: businessIds }, businessRating: { not: null } },
        _avg: { businessRating: true },
      }),
      this.prisma.review.groupBy({
        by: ['businessId'],
        where: { businessId: { in: businessIds } },
        _count: { _all: true },
      }),
      this.prisma.service.groupBy({
        by: ['businessId'],
        where: { businessId: { in: businessIds } },
        _min: { price: true },
      }),
    ]);
    const reviewByBiz = new Map(
      reviewAgg.map((x) => [
        x.businessId,
        { avg: x._avg.businessRating ?? 0 },
      ]),
    );
    const reviewCountByBiz = new Map(
      reviewCounts.map((x) => [x.businessId, x._count._all]),
    );
    const minPriceByBiz = new Map(minPrices.map((p) => [p.businessId, p._min.price ?? 0]));
    const data = rows.map((r) => {
      const b = r.business;
      const rv = reviewByBiz.get(b.id);
      const ratingNum = rv?.avg != null ? Number(rv.avg.toFixed(1)) : 0;
      const reviewsCount = reviewCountByBiz.get(b.id) ?? 0;
      const minSvc = minPriceByBiz.get(b.id) ?? 0;
      const imageUrl = itemImageByBusiness.get(b.id) ?? null;
      const bizLat = b.latitude ?? null;
      const bizLng = b.longitude ?? null;
      const distanceLabel = distanceLabelBetween(geo.lat, geo.lng, bizLat, bizLng);
      const bannerUrl = listImageUrl(b.bannerUrl);
      const logoUrl = listImageUrl(b.logoUrl);
      const serviceImageUrl = listImageUrl(imageUrl);
      return {
        id: r.id,
        businessId: b.id,
        name: b.name,
        categoryKey: (b.categoryKeys && b.categoryKeys[0]) || 'beautyService',
        categoryKeys: b.categoryKeys ?? [],
        rating: String(ratingNum),
        reviews: String(reviewsCount),
        price: `$${Number(minSvc || 0).toFixed(2)}`,
        lat: bizLat ?? 0,
        lng: bizLng ?? 0,
        imageUrl: serviceImageUrl,
        serviceImageUrl,
        logoUrl,
        bannerUrl,
        unsplashImgId: null,
        locationLabel: b.address,
        distanceLabel,
      };
    });
    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: total > 0 ? Math.ceil(total / l) : 0,
    };
  }

  @Post('mobile/favorites')
  async addMobileFavorite(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { businessId: string },
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    await this.prisma.userFavorite.upsert({
      where: {
        userId_businessId: { userId: user.id, businessId: body.businessId },
      },
      create: { userId: user.id, businessId: body.businessId },
      update: {},
    });
    return { ok: true };
  }

  @Delete('mobile/favorites/:businessId')
  async removeMobileFavorite(
    @Headers('authorization') authorization: string | undefined,
    @Param('businessId') businessId: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    await this.prisma.userFavorite.deleteMany({
      where: { userId: user.id, businessId },
    });
    return { ok: true };
  }
}
