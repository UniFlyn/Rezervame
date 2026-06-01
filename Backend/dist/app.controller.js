"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const auth_helpers_1 = require("./auth.helpers");
const business_listing_util_1 = require("./business/business-listing.util");
const business_categories_util_1 = require("./business/business-categories.util");
const registration_images_util_1 = require("./business/registration-images.util");
const auth_response_util_1 = require("./auth/auth-response.util");
const security_policy_util_1 = require("./config/security-policy.util");
const firebase_auth_util_1 = require("./auth/firebase-auth.util");
const password_util_1 = require("./auth/password.util");
const booking_payment_util_1 = require("./payments/booking-payment.util");
const public_site_status_util_1 = require("./config/public-site-status.util");
const payment_config_util_1 = require("./payments/payment-config.util");
const wompi_config_1 = require("./payments/wompi/wompi.config");
const yappy_config_1 = require("./payments/yappy/yappy.config");
const cancel_bookings_util_1 = require("./bookings/cancel-bookings.util");
const cancellation_policy_util_1 = require("./bookings/cancellation-policy.util");
const crypto_1 = require("crypto");
const constants_1 = require("./constants");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const create_service_dto_1 = require("./dto/create-service.dto");
const create_staff_dto_1 = require("./dto/create-staff.dto");
const update_booking_dto_1 = require("./dto/update-booking.dto");
const update_business_panel_dto_1 = require("./dto/update-business-panel.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const update_staff_dto_1 = require("./dto/update-staff.dto");
const check_email_dto_1 = require("./dto/check-email.dto");
const register_customer_dto_1 = require("./dto/register-customer.dto");
const family_member_dto_1 = require("./dto/family-member.dto");
const merchant_number_util_1 = require("./merchant-number.util");
const prisma_service_1 = require("./prisma.service");
const normalize_image_url_1 = require("./storage/normalize-image-url");
const notification_delivery_service_1 = require("./notifications/notification-delivery.service");
const email_constants_1 = require("./email/email.constants");
const system_integration_config_1 = require("./config/system-integration.config");
const email_service_1 = require("./email/email.service");
const password_reset_util_1 = require("./auth/password-reset.util");
const venue_details_util_1 = require("./business/venue-details.util");
const notification_hub_service_1 = require("./notifications/notification-hub.service");
const web_push_delivery_service_1 = require("./notifications/web-push-delivery.service");
const support_ticket_util_1 = require("./support/support-ticket.util");
const s3_storage_service_1 = require("./storage/s3-storage.service");
const s3_defaults_1 = require("./s3-defaults");
const partner_business_types_1 = require("./config/partner-business-types");
const BUSINESS_BYPASS_PASSWORD = process.env.NODE_ENV !== 'production' ? process.env.BUSINESS_BYPASS_PASSWORD || 'password' : '';
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function formatDistanceKm(km) {
    if (!Number.isFinite(km) || km < 0)
        return '';
    if (km < 1)
        return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}
function distanceLabelBetween(userLat, userLng, bizLat, bizLng) {
    if (userLat === undefined ||
        userLng === undefined ||
        bizLat === null ||
        bizLat === undefined ||
        bizLng === null ||
        bizLng === undefined) {
        return '';
    }
    const km = haversineKm(userLat, userLng, bizLat, bizLng);
    return formatDistanceKm(km);
}
function parseUserGeoQuery(userLat, userLng) {
    const lat = userLat !== undefined ? Number.parseFloat(userLat) : NaN;
    const lng = userLng !== undefined ? Number.parseFloat(userLng) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return {};
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
        return {};
    return { lat, lng };
}
async function ensureHardcodedPlans(prisma) {
    const count = await prisma.subscriptionPlan.count();
    if (count > 0)
        return;
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
function displayCategoryLabels(b) {
    return (0, business_categories_util_1.displayCategoryLabelsForBusiness)(b);
}
function tryParseDate(val) {
    if (!val || typeof val !== 'string' || val === 'undefined' || val === 'null' || !val.trim())
        return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}
function getNextAvailableSlot(now, bookings, durationMin) {
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
                if (isToday)
                    return `Today, ${timeStr}`;
                if (isTomorrow)
                    return `Tomorrow, ${timeStr}`;
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
function parseMinutesFromTimeLabel(t) {
    const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m)
        return 9 * 60;
    let h = parseInt(m[1], 10);
    const mins = parseInt(m[2], 10);
    const ampm = m[3].toUpperCase();
    if (ampm === 'PM' && h !== 12)
        h += 12;
    if (ampm === 'AM' && h === 12)
        h = 0;
    return h * 60 + mins;
}
function formatMinutesToTimeLabel(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}
function generateHalfHourSlotsFromRange(startLabel, endLabel) {
    const startMins = parseMinutesFromTimeLabel(startLabel);
    let endMins = parseMinutesFromTimeLabel(endLabel);
    if (endMins <= startMins)
        endMins = startMins + 540;
    const slots = [];
    for (let mins = startMins; mins < endMins; mins += 30) {
        slots.push(formatMinutesToTimeLabel(mins));
    }
    return slots;
}
function getTodaySlotTimings(workingHoursJson) {
    if (!workingHoursJson?.trim()) {
        return '9:00 AM – 6:00 PM';
    }
    try {
        const parsed = JSON.parse(workingHoursJson);
        if (!Array.isArray(parsed))
            return '9:00 AM – 6:00 PM';
        const todayName = WEEKDAY_NAMES[new Date().getDay()];
        const match = parsed.find((row) => String(row?.day || '').toLowerCase() === todayName.toLowerCase());
        if (!match)
            return 'Closed today';
        const hours = String(match.hours || '').trim();
        if (!hours || hours.toLowerCase() === 'closed')
            return 'Closed today';
        if (hours.includes(' - ')) {
            const [start, end] = hours.split(' - ').map((s) => s.trim());
            const slots = generateHalfHourSlotsFromRange(start, end);
            if (slots.length === 0)
                return 'Closed today';
            if (slots.length <= 6)
                return slots.join(', ');
            return `${slots[0]} – ${slots[slots.length - 1]}`;
        }
        return hours;
    }
    catch {
        return '9:00 AM – 6:00 PM';
    }
}
function normalizeEventWebsiteUrl(raw) {
    const s = String(raw ?? '').trim();
    if (!s)
        return null;
    try {
        const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
        const u = new URL(withProto);
        if (u.protocol !== 'http:' && u.protocol !== 'https:')
            return null;
        return u.toString();
    }
    catch {
        return null;
    }
}
function safeImageUrl(url) {
    if (typeof url !== "string")
        return null;
    let s = url.trim();
    if (!s)
        return null;
    if (s.startsWith("data:") && s.length > 1_500_000) {
        return null;
    }
    s = (0, normalize_image_url_1.normalizePublicImageUrl)(s) ?? s;
    return s;
}
function listImageUrl(url) {
    const s = safeImageUrl(url);
    if (!s || s.startsWith("data:"))
        return null;
    if (s.startsWith("http://") || s.startsWith("https://"))
        return s;
    if (s.startsWith("/"))
        return s;
    return null;
}
function listSmallInlineImageUrl(url, maxLen = 180_000) {
    const s = safeImageUrl(url);
    if (!s || !s.startsWith("data:"))
        return null;
    if (s.length > maxLen)
        return null;
    return s;
}
function publicCategoryImageUrl(key, stored) {
    const fromDb = listImageUrl(stored);
    if (fromDb)
        return fromDb;
    return (0, s3_defaults_1.defaultCategoryImageUrl)(key);
}
function firstListThumbnail(images) {
    if (!Array.isArray(images))
        return null;
    for (const img of images) {
        const u = listImageUrl(img) ?? listSmallInlineImageUrl(img);
        if (u)
            return u;
    }
    return null;
}
function collectServiceListImageUrls(services = []) {
    const out = [];
    for (const s of services) {
        const u = listImageUrl(s.imageUrl) ?? listSmallInlineImageUrl(s.imageUrl);
        if (u && !out.includes(u))
            out.push(u);
    }
    return out;
}
function buildPortfolioImageUrls(opts) {
    const serviceListImages = collectServiceListImageUrls(opts.services || []);
    const galleryThumb = firstListThumbnail(opts.images);
    const bannerUrl = listImageUrl(opts.bannerUrl) ?? listSmallInlineImageUrl(opts.bannerUrl);
    const logoUrl = listImageUrl(opts.logoUrl) ?? listSmallInlineImageUrl(opts.logoUrl);
    const portfolioImageUrls = [];
    for (const u of serviceListImages) {
        if (!portfolioImageUrls.includes(u))
            portfolioImageUrls.push(u);
    }
    if (galleryThumb && !portfolioImageUrls.includes(galleryThumb)) {
        portfolioImageUrls.push(galleryThumb);
    }
    for (const img of Array.isArray(opts.images) ? opts.images : []) {
        const u = listImageUrl(img) ?? listSmallInlineImageUrl(img);
        if (u && !portfolioImageUrls.includes(u))
            portfolioImageUrls.push(u);
    }
    if (bannerUrl && !portfolioImageUrls.includes(bannerUrl)) {
        portfolioImageUrls.push(bannerUrl);
    }
    if (logoUrl && !portfolioImageUrls.includes(logoUrl)) {
        portfolioImageUrls.push(logoUrl);
    }
    return portfolioImageUrls;
}
function sanitizeMobileBusinessLite(b) {
    if (!b)
        return null;
    const images = Array.isArray(b.images)
        ? b.images.map((img) => listImageUrl(img)).filter(Boolean)
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
function sanitizeMobileServiceLite(s) {
    if (!s)
        return null;
    return {
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        imageUrl: listImageUrl(s.imageUrl),
    };
}
function sanitizeMobileBooking(b) {
    const out = { ...b };
    if (b.business)
        out.business = sanitizeMobileBusinessLite(b.business);
    if (b.service)
        out.service = sanitizeMobileServiceLite(b.service);
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
    return (0, cancel_bookings_util_1.enrichBookingCancellationFields)(out);
}
function isCashPaymentMethod(method) {
    if (!method)
        return false;
    const s = method.toLowerCase().trim();
    return (s.includes('cash') ||
        s.includes('at venue') ||
        s.includes('pay by visit') ||
        s.includes('pay at venue'));
}
function normalizeAppointmentApprovalMode(raw) {
    const m = String(raw ?? 'manual').toLowerCase().trim();
    if (m === 'automatic' ||
        m === 'auto' ||
        m.includes('automatic') ||
        m.includes('fully automatic') ||
        m.includes('ai-assisted')) {
        return 'automatic';
    }
    return 'manual';
}
function isAutomaticAppointmentApproval(business) {
    return normalizeAppointmentApprovalMode(business.appointmentApprovalMode) === 'automatic';
}
function initialBookingStatusForBusiness(business) {
    return isAutomaticAppointmentApproval(business) ? 'Approved' : 'Pending';
}
function mapBusiness(b) {
    if (!b)
        return null;
    const categories = displayCategoryLabels(b);
    return {
        id: b.id,
        name: b.name,
        logo: listImageUrl(b.logoUrl) ?? listSmallInlineImageUrl(b.logoUrl) ?? safeImageUrl(b.logoUrl),
        banner: listImageUrl(b.bannerUrl) ?? listSmallInlineImageUrl(b.bannerUrl) ?? safeImageUrl(b.bannerUrl),
        images: (() => {
            const fromGallery = Array.isArray(b.images) ? b.images : [];
            const mapped = fromGallery
                .map((img) => listImageUrl(img) ?? listSmallInlineImageUrl(img))
                .filter(Boolean);
            if (mapped.length > 0)
                return mapped;
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
        categoryKeys: b.categoryKeys ?? [],
        amenityKeys: b.amenityKeys ?? [],
        status: b.status,
        planId: b.planId ?? 'basic',
        plan: b.plan ?? 'Basic',
        taxPercentage: b.taxPercentage ?? 0,
        appointmentApprovalMode: normalizeAppointmentApprovalMode(b.appointmentApprovalMode),
        cancellationAllowed: b.cancellationAllowed ?? true,
        cancellationHoursBefore: b.cancellationHoursBefore ?? 24,
        cancellationPolicyMessageEn: (0, cancellation_policy_util_1.formatCancellationPolicyMessage)((0, cancellation_policy_util_1.normalizeCancellationPolicy)(b), 'en'),
        cancellationPolicyMessageEs: (0, cancellation_policy_util_1.formatCancellationPolicyMessage)((0, cancellation_policy_util_1.normalizeCancellationPolicy)(b), 'es'),
        listingVisible: Boolean(b.listingVisible),
        profileSetupComplete: Boolean(b.profileSetupComplete),
        setupStatus: (0, business_listing_util_1.evaluateBusinessProfileSetup)(b),
        owner: b.owner,
        taxId: b.taxId,
        businessType: (0, business_categories_util_1.partnerTypeIdFromBusiness)(b.categoryKeys, b.registrationDetails),
        registrationDetails: b.registrationDetails ?? null,
        registrationSections: (0, venue_details_util_1.buildAdminRegistrationSections)(b.registrationDetails),
    };
}
async function syncBusinessListingFlags(prisma, businessId) {
    const b = await prisma.business.findUnique({ where: { id: businessId } });
    if (!b)
        return null;
    const setup = (0, business_listing_util_1.evaluateBusinessProfileSetup)(b);
    const data = {};
    if (setup.complete !== Boolean(b.profileSetupComplete)) {
        data.profileSetupComplete = setup.complete;
    }
    if (!setup.complete && b.listingVisible) {
        data.listingVisible = false;
    }
    if (Object.keys(data).length === 0)
        return b;
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
];
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
function pickSystemConfigPatch(body) {
    const data = {};
    for (const key of SYSTEM_CONFIG_PATCH_KEYS) {
        if (body[key] === undefined)
            continue;
        if (SYSTEM_CONFIG_SECRET_KEYS.has(key) && body[key] === '***')
            continue;
        if (SYSTEM_CONFIG_NUMBER_KEYS.has(key)) {
            const n = Number(body[key]);
            if (!Number.isNaN(n)) {
                if (key === 'minPasswordLength') {
                    data[key] = Math.min(128, Math.max(4, Math.round(n)));
                }
                else if (key === 'sessionTimeout') {
                    data[key] = Math.min(10_080, Math.max(5, Math.round(n)));
                }
                else {
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
function maskSystemConfigSecrets(row) {
    const out = { ...row };
    for (const key of SYSTEM_CONFIG_SECRET_KEYS) {
        if (out[key])
            out[key] = '***';
    }
    return out;
}
function enrichAdminConfig(row) {
    const merged = (0, system_integration_config_1.adminConfigWithEnvFallbacks)(row);
    const masked = maskSystemConfigSecrets(merged);
    return {
        ...masked,
        integrationStatus: {
            postmark: Boolean((0, system_integration_config_1.resolvePostmarkConfigFromRow)(merged)),
            s3: Boolean((0, system_integration_config_1.resolveS3ConfigFromRow)(merged)),
            wompi: (0, wompi_config_1.isWompiConfigured)(merged),
            yappy: (0, yappy_config_1.isYappyConfigured)(merged),
        },
    };
}
async function loadSystemConfigSafe(prisma) {
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
    };
    try {
        let row = await prisma.systemConfig.findUnique({ where: { id: 1 } });
        if (!row) {
            row = await prisma.systemConfig.create({ data: { id: 1 } });
        }
        return row;
    }
    catch {
        const row = await prisma.systemConfig.findFirst({ select: baseSelect });
        if (row)
            return row;
        return prisma.systemConfig.create({
            data: { id: 1 },
            select: baseSelect,
        });
    }
}
async function resolveBookingCreateUser(prisma, body) {
    const invalidLegacy = !body.userId || body.userId === 'offline-user';
    if (!invalidLegacy && body.userId)
        return body.userId;
    const guest = await prisma.user.findUnique({ where: { email: constants_1.WALK_IN_USER_EMAIL } });
    if (!guest) {
        throw new common_1.BadRequestException('Walk-in profile not configured. Run prisma seed.');
    }
    return guest.id;
}
function mapBusinessPatch(body) {
    const data = {};
    if (body.name !== undefined)
        data.name = body.name;
    if (body.description !== undefined)
        data.description = body.description;
    if (body.location !== undefined)
        data.address = body.location;
    if (body.contactEmail !== undefined)
        data.email = body.contactEmail;
    if (body.contactPhone !== undefined)
        data.phone = body.contactPhone;
    if (body.balance !== undefined)
        data.balance = body.balance;
    if (body.categories !== undefined) {
        const labels = body.categories.map((c) => String(c).trim()).filter(Boolean);
        data.categoryLabels = labels;
        data.categoryLabel = labels.length > 0 ? labels.join(' · ') : null;
    }
    else if (body.category !== undefined) {
        const t = String(body.category).trim();
        data.categoryLabel = t || null;
        data.categoryLabels = t ? [t] : [];
    }
    if (body.logo !== undefined)
        data.logoUrl = body.logo?.trim() ? safeImageUrl(body.logo.trim()) : null;
    if (body.banner !== undefined)
        data.bannerUrl = body.banner?.trim() ? safeImageUrl(body.banner.trim()) : null;
    if (body.images !== undefined) {
        const list = Array.isArray(body.images) ? body.images : [];
        data.images = list
            .map((img) => (typeof img === 'string' ? safeImageUrl(img.trim()) : null))
            .filter((u) => Boolean(u))
            .slice(0, 16);
    }
    if (body.amenityKeys !== undefined)
        data.amenityKeys = body.amenityKeys;
    if (body.socialYoutube !== undefined)
        data.socialYoutube = body.socialYoutube;
    if (body.socialInstagram !== undefined)
        data.socialInstagram = body.socialInstagram;
    if (body.socialX !== undefined)
        data.socialX = body.socialX;
    if (body.socialTiktok !== undefined)
        data.socialTiktok = body.socialTiktok;
    if (body.workingHours !== undefined)
        data.workingHours = body.workingHours;
    if (body.notifyBookingEmail !== undefined)
        data.notifyBookingEmail = body.notifyBookingEmail;
    if (body.notifyCancellationEmail !== undefined)
        data.notifyCancellationEmail = body.notifyCancellationEmail;
    if (body.notifyDailySummary !== undefined)
        data.notifyDailySummary = body.notifyDailySummary;
    if (body.latitude !== undefined)
        data.latitude = body.latitude;
    if (body.longitude !== undefined)
        data.longitude = body.longitude;
    if (body.taxPercentage !== undefined)
        data.taxPercentage = body.taxPercentage;
    if (body.appointmentApprovalMode !== undefined) {
        data.appointmentApprovalMode = normalizeAppointmentApprovalMode(body.appointmentApprovalMode);
    }
    if (body.cancellationAllowed !== undefined) {
        data.cancellationAllowed = Boolean(body.cancellationAllowed);
    }
    if (body.cancellationHoursBefore !== undefined) {
        const h = Number(body.cancellationHoursBefore);
        if (!Number.isFinite(h) || h < 0 || h > 168) {
            throw new common_1.BadRequestException('cancellationHoursBefore must be between 0 and 168');
        }
        data.cancellationHoursBefore = Math.floor(h);
        if (data.cancellationAllowed === undefined && h >= 0) {
            data.cancellationAllowed = true;
        }
    }
    if (body.cancellationAllowed === false) {
        data.cancellationHoursBefore = 0;
    }
    if (body.planId !== undefined)
        data.planId = body.planId;
    if (body.plan !== undefined)
        data.plan = body.plan;
    if (body.owner !== undefined)
        data.owner = String(body.owner).trim();
    if (body.taxId !== undefined)
        data.taxId = String(body.taxId).trim();
    if (body.categoryKeys !== undefined) {
        data.categoryKeys = (0, partner_business_types_1.migrateBusinessCategoryKeys)(body.categoryKeys, typeof body.businessType === 'string' ? body.businessType : undefined);
        data.categoryLabels = (0, business_categories_util_1.displayLabelsForCategoryKeys)(data.categoryKeys, body.registrationDetails);
        data.categoryLabel =
            data.categoryLabels.length > 0
                ? data.categoryLabels.join(' · ')
                : null;
    }
    if (body.businessType !== undefined && body.categoryKeys === undefined) {
        const { categoryKeys, categoryLabels } = (0, business_categories_util_1.categoryKeysAndLabelsForPartner)(body.businessType, undefined);
        data.categoryKeys = categoryKeys;
        data.categoryLabels = categoryLabels;
        data.categoryLabel = categoryLabels.length > 0 ? categoryLabels.join(' · ') : null;
    }
    return data;
}
function applyListingVisibilityPatch(business, body, data) {
    if (body.listingVisible === undefined)
        return;
    const wantsVisible = Boolean(body.listingVisible);
    if (wantsVisible) {
        const setup = (0, business_listing_util_1.evaluateBusinessProfileSetup)(business);
        if (!setup.canEnableListing) {
            throw new common_1.BadRequestException('Complete required profile setup (logo, banner, photos, hours, and map location) before going visible on the app and web.');
        }
    }
    data.listingVisible = wantsVisible;
}
async function mapBusinessPatchWithS3(body, s3) {
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
        const out = [];
        for (const img of list.slice(0, 16)) {
            if (typeof img !== 'string')
                continue;
            const url = await s3.persistImageUrl(img.trim(), 'venues/gallery');
            if (url)
                out.push(url);
        }
        data.images = out;
    }
    return data;
}
function categoryKeyFromServiceCategory(category) {
    const c = category.toLowerCase();
    if (c.includes('tattoo') || c.includes('tatuaj'))
        return 'tattoo';
    if (c.includes('yoga') || c.includes('pilates') || c.includes('fitness'))
        return 'yoga';
    if (c.includes('dermat') || c.includes('clinic') || c.includes('clínica'))
        return 'dermatology';
    if (c.includes('estetic') || c.includes('aesthetic'))
        return 'estetica';
    if (c.includes('nail') || c.includes('uñ'))
        return 'nailCare';
    if (c.includes('massage') || c.includes('masaje'))
        return 'massage';
    if (c.includes('spa') || c.includes('wellness'))
        return 'spaService';
    if (c.includes('barber') || c.includes('groom'))
        return 'barber';
    if (c.includes('beauty') || c.includes('facial') || c.includes('wax'))
        return 'beautyService';
    return 'hairService';
}
function businessEffectiveCategoryKeys(categoryKeys, services) {
    const keys = new Set();
    for (const k of categoryKeys ?? []) {
        if (k)
            keys.add(k);
    }
    for (const row of services ?? []) {
        const cat = row?.category;
        if (cat)
            keys.add(categoryKeyFromServiceCategory(cat));
    }
    return keys;
}
function businessMatchesCategoryFilter(categoryKeys, services, filterKeys) {
    if (!filterKeys.length)
        return true;
    const effective = businessEffectiveCategoryKeys(categoryKeys, services);
    return filterKeys.some((k) => effective.has(k));
}
let AppController = class AppController {
    constructor(prisma, s3Storage) {
        this.prisma = prisma;
        this.s3Storage = s3Storage;
    }
    async storeImage(value, folder) {
        if (value == null || !String(value).trim())
            return null;
        return this.s3Storage.persistImageUrl(String(value).trim(), folder);
    }
    async getAdminConfig(authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const row = await loadSystemConfigSafe(this.prisma);
        return enrichAdminConfig(row);
    }
    async updateAdminConfig(body, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const data = pickSystemConfigPatch(body);
        if (data.homeHeroImageUrl !== undefined) {
            data.homeHeroImageUrl = await this.storeImage(String(data.homeHeroImageUrl || ''), 'site/hero');
        }
        if (Object.keys(data).length === 0) {
            const row = await loadSystemConfigSafe(this.prisma);
            return enrichAdminConfig(row);
        }
        try {
            const row = await this.prisma.systemConfig.upsert({
                where: { id: 1 },
                update: data,
                create: { ...data, id: 1 },
            });
            const enriched = enrichAdminConfig(row);
            void (0, public_site_status_util_1.publishPublicSiteStatus)(this.prisma, this.s3Storage, enriched).catch(() => undefined);
            return enriched;
        }
        catch {
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
            const enriched = enrichAdminConfig(row);
            void (0, public_site_status_util_1.publishPublicSiteStatus)(this.prisma, this.s3Storage, enriched).catch(() => undefined);
            return enriched;
        }
    }
    async publishSiteStatus(authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const row = await loadSystemConfigSafe(this.prisma);
        const url = await (0, public_site_status_util_1.publishPublicSiteStatus)(this.prisma, this.s3Storage, row);
        const status = {
            maintenanceMode: row.maintenanceMode === true,
            platformBranding: typeof row.platformBranding === 'string'
                ? row.platformBranding
                : 'Rezervame',
        };
        return { ok: true, url, ...status };
    }
    async login(body) {
        const raw = body.email.trim();
        const lower = raw.toLowerCase();
        const user = await this.prisma.user.findFirst({
            where: { OR: [{ email: raw }, { email: lower }] },
        });
        const isBusinessBypass = user?.role === client_1.Role.BUSINESS &&
            BUSINESS_BYPASS_PASSWORD &&
            body.password === BUSINESS_BYPASS_PASSWORD;
        const passwordOk = user ? await (0, password_util_1.verifyPassword)(body.password, user.password) : false;
        if (!user || (!passwordOk && !isBusinessBypass)) {
            throw new common_1.BadRequestException('Invalid credentials');
        }
        if ((user.status || '').toLowerCase() === 'blocked') {
            throw new common_1.BadRequestException('Your account has been suspended. Contact support.');
        }
        const upgraded = await (0, password_util_1.maybeUpgradePasswordHash)(body.password, user.password);
        if (upgraded) {
            await this.prisma.user.update({ where: { id: user.id }, data: { password: upgraded } });
        }
        const policy = await (0, security_policy_util_1.loadSecurityPolicy)(this.prisma);
        if (user.role === client_1.Role.ADMIN && policy.adminTwoFactorRequired) {
            const code = (0, password_reset_util_1.generateResetCode)();
            const expiresAt = (0, password_reset_util_1.resetCodeExpiresAt)();
            await this.prisma.passwordResetCode.updateMany({
                where: { userId: user.id, usedAt: null },
                data: { usedAt: new Date() },
            });
            await this.prisma.passwordResetCode.create({
                data: {
                    userId: user.id,
                    email: user.email.toLowerCase(),
                    codeHash: (0, password_reset_util_1.hashResetCode)(code),
                    expiresAt,
                },
            });
            void (0, notification_delivery_service_1.sendEmail)(this.prisma, user.email, '[Rezervame Admin] Sign-in verification code', `<p>Your admin sign-in code is <strong>${code}</strong>. It expires in 15 minutes.</p>`, `Your admin sign-in code is ${code}. It expires in 15 minutes.`);
            return {
                twoFactorRequired: true,
                email: (0, security_policy_util_1.maskEmailForDisplay)(user.email),
                message: 'Enter the verification code sent to your email.',
            };
        }
        return (0, auth_response_util_1.buildAuthResponse)(this.prisma, user);
    }
    async adminVerifyTwoFactor(body) {
        const email = (body.email || '').trim().toLowerCase();
        const code = (body.code || '').trim();
        if (!email || !code) {
            throw new common_1.BadRequestException('Email and verification code are required');
        }
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        if ((user.status || '').toLowerCase() === 'blocked') {
            throw new common_1.BadRequestException('Your account has been suspended. Contact support.');
        }
        const policy = await (0, security_policy_util_1.loadSecurityPolicy)(this.prisma);
        if (!policy.adminTwoFactorRequired) {
            return (0, auth_response_util_1.buildAuthResponse)(this.prisma, user);
        }
        if ((0, password_reset_util_1.isPasswordResetBypassCode)(code)) {
            return (0, auth_response_util_1.buildAuthResponse)(this.prisma, user);
        }
        const row = await this.findValidPasswordResetCode(email, code);
        if (!row)
            throw new common_1.BadRequestException('Invalid or expired verification code');
        await this.prisma.passwordResetCode.update({
            where: { id: row.id },
            data: { usedAt: new Date() },
        });
        return (0, auth_response_util_1.buildAuthResponse)(this.prisma, user);
    }
    async checkEmail(body) {
        const email = body.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        return { exists: !!user };
    }
    async registerCustomer(body) {
        const email = body.email.trim().toLowerCase();
        const taken = await this.prisma.user.findUnique({ where: { email } });
        if (taken)
            throw new common_1.BadRequestException('Email already registered');
        const policy = await (0, security_policy_util_1.loadSecurityPolicy)(this.prisma);
        (0, security_policy_util_1.assertPasswordMeetsPolicy)(body.password, policy);
        const user = await this.prisma.user.create({
            data: {
                email,
                password: await (0, password_util_1.hashPassword)(body.password),
                name: body.name.trim(),
                role: client_1.Role.USER,
                phone: body.phone?.trim() || null,
                address: body.address?.trim() || null,
                gender: body.gender?.trim() || null,
                age: body.age ?? null,
            },
        });
        return (0, auth_response_util_1.buildAuthResponse)(this.prisma, user);
    }
    async findValidPasswordResetCode(email, code) {
        const normalized = email.trim().toLowerCase();
        const hash = (0, password_reset_util_1.hashResetCode)(code.trim());
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
    async forgotPassword(body) {
        const email = (body.email || '').trim().toLowerCase();
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        const generic = {
            ok: true,
            message: 'If an account exists, a verification code was sent.',
        };
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== client_1.Role.USER) {
            return generic;
        }
        if ((user.status || '').toLowerCase() === 'blocked') {
            return generic;
        }
        const code = (0, password_reset_util_1.generateResetCode)();
        const expiresAt = (0, password_reset_util_1.resetCodeExpiresAt)();
        await this.prisma.passwordResetCode.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });
        await this.prisma.passwordResetCode.create({
            data: {
                userId: user.id,
                email,
                codeHash: (0, password_reset_util_1.hashResetCode)(code),
                expiresAt,
            },
        });
        const templateResult = await (0, notification_delivery_service_1.sendEmailWithTemplate)(this.prisma, {
            to: email,
            templateAlias: email_constants_1.POSTMARK_TEMPLATE.PASSWORD_RESET,
            templateModel: {
                userName: user.name,
                verificationCode: code,
                resetCode: code,
                expiresIn: '15 minutes',
            },
        });
        if (templateResult.skipped || !templateResult.ok) {
            await (0, email_service_1.postmarkSendRaw)(this.prisma, {
                to: email,
                subject: 'Your Rezervame verification code',
                htmlBody: `<p>Hi ${user.name},</p><p>Your verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 15 minutes.</p>`,
                textBody: `Your Rezervame verification code is ${code}. It expires in 15 minutes.`,
            });
        }
        const out = { ...generic };
        if (process.env.NODE_ENV !== 'production' && !(await (0, system_integration_config_1.resolvePostmarkConfig)(this.prisma))) {
            out.devCode = code;
        }
        return out;
    }
    async assertPasswordResetUser(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== client_1.Role.USER) {
            throw new common_1.BadRequestException('Invalid or expired code');
        }
        if ((user.status || '').toLowerCase() === 'blocked') {
            throw new common_1.BadRequestException('Invalid or expired code');
        }
        return user;
    }
    async verifyResetCode(body) {
        const email = (body.email || '').trim().toLowerCase();
        const code = (body.code || '').trim();
        if (!email || !code) {
            throw new common_1.BadRequestException('Email and code are required');
        }
        if ((0, password_reset_util_1.isPasswordResetBypassCode)(code)) {
            await this.assertPasswordResetUser(email);
            return { ok: true };
        }
        const row = await this.findValidPasswordResetCode(email, code);
        if (!row)
            throw new common_1.BadRequestException('Invalid or expired code');
        return { ok: true };
    }
    async resetPasswordWithCode(body) {
        const email = (body.email || '').trim().toLowerCase();
        const code = (body.code || '').trim();
        const newPassword = (body.newPassword || '').trim();
        if (!email || !code || !newPassword) {
            throw new common_1.BadRequestException('Email, code, and new password are required');
        }
        const policy = await (0, security_policy_util_1.loadSecurityPolicy)(this.prisma);
        (0, security_policy_util_1.assertPasswordMeetsPolicy)(newPassword, policy);
        if ((0, password_reset_util_1.isPasswordResetBypassCode)(code)) {
            const user = await this.assertPasswordResetUser(email);
            await this.prisma.user.update({
                where: { id: user.id },
                data: { password: await (0, password_util_1.hashPassword)(newPassword) },
            });
            return { ok: true, message: 'Password updated successfully' };
        }
        const row = await this.findValidPasswordResetCode(email, code);
        if (!row)
            throw new common_1.BadRequestException('Invalid or expired code');
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: row.userId },
                data: { password: await (0, password_util_1.hashPassword)(newPassword) },
            }),
            this.prisma.passwordResetCode.update({
                where: { id: row.id },
                data: { usedAt: new Date() },
            }),
        ]);
        return { ok: true, message: 'Password updated successfully' };
    }
    async googleAuth(body) {
        const idToken = (body.idToken || '').trim();
        if (!idToken)
            throw new common_1.BadRequestException('idToken is required');
        const firebaseUser = await (0, firebase_auth_util_1.verifyFirebaseIdToken)(idToken);
        if (!firebaseUser) {
            throw new common_1.BadRequestException('Invalid or expired Google sign-in. Check Firebase server credentials.');
        }
        let user = await this.prisma.user.findUnique({ where: { email: firebaseUser.email } });
        if (!user) {
            const unusablePassword = (0, crypto_1.randomBytes)(32).toString('hex');
            user = await this.prisma.user.create({
                data: {
                    email: firebaseUser.email,
                    password: await (0, password_util_1.hashPassword)(unusablePassword),
                    name: (body.name || firebaseUser.name || 'User').trim(),
                    role: client_1.Role.USER,
                },
            });
        }
        if (user.role !== client_1.Role.USER) {
            throw new common_1.BadRequestException('This email is registered as a business or admin account. Use email login.');
        }
        if ((user.status || '').toLowerCase() === 'blocked') {
            throw new common_1.BadRequestException('Your account has been suspended. Contact support.');
        }
        return (0, auth_response_util_1.buildAuthResponse)(this.prisma, user);
    }
    async getPublicSecurityPolicy() {
        const policy = await (0, security_policy_util_1.loadSecurityPolicy)(this.prisma);
        return {
            minPasswordLength: policy.minPasswordLength,
            sessionTimeoutMinutes: policy.sessionTimeoutMinutes,
            adminTwoFactorRequired: policy.adminTwoFactorRequired,
        };
    }
    getPublicVapidKey() {
        const publicKey = (0, web_push_delivery_service_1.getVapidPublicKey)();
        return {
            publicKey: publicKey || null,
            configured: (0, web_push_delivery_service_1.isWebPushConfigured)(),
        };
    }
    async getPushStatus(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [
            client_1.Role.USER,
            client_1.Role.BUSINESS,
            client_1.Role.ADMIN,
        ]);
        const count = await this.prisma.webPushSubscription.count({
            where: { userId: user.id },
        });
        return {
            configured: (0, web_push_delivery_service_1.isWebPushConfigured)(),
            enabled: user.webPushEnabled,
            subscribed: count > 0,
            subscriptionCount: count,
        };
    }
    async subscribePush(authorization, body, userAgent) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [
            client_1.Role.USER,
            client_1.Role.BUSINESS,
            client_1.Role.ADMIN,
        ]);
        if (!(0, web_push_delivery_service_1.isWebPushConfigured)()) {
            throw new common_1.BadRequestException('Browser push is not configured on the server (VAPID keys missing).');
        }
        await (0, web_push_delivery_service_1.upsertWebPushSubscription)(this.prisma, user.id, {
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
    async unsubscribePush(authorization, endpoint) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [
            client_1.Role.USER,
            client_1.Role.BUSINESS,
            client_1.Role.ADMIN,
        ]);
        if (endpoint?.trim()) {
            await this.prisma.webPushSubscription.deleteMany({
                where: { userId: user.id, endpoint: endpoint.trim() },
            });
        }
        else {
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
    async updatePushPreferences(authorization, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [
            client_1.Role.USER,
            client_1.Role.BUSINESS,
            client_1.Role.ADMIN,
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
            subscribed: (await this.prisma.webPushSubscription.count({
                where: { userId: user.id },
            })) > 0,
        };
    }
    async testPush(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [
            client_1.Role.USER,
            client_1.Role.BUSINESS,
            client_1.Role.ADMIN,
        ]);
        if (!(0, web_push_delivery_service_1.isWebPushConfigured)()) {
            throw new common_1.BadRequestException('VAPID keys not configured');
        }
        const result = await (0, web_push_delivery_service_1.sendWebPushToUser)(this.prisma, user.id, {
            title: 'Rezervame',
            body: 'Browser push notifications are working.',
            url: (0, web_push_delivery_service_1.notificationUrlForType)('test', user.role),
            tag: 'test',
        });
        return result;
    }
    async getPublicSiteFooter() {
        const cfg = await loadSystemConfigSafe(this.prisma);
        const row = cfg;
        const trimUrl = (v) => {
            const s = typeof v === 'string' ? v.trim() : '';
            return s || null;
        };
        const buildNavLink = (enabled, url, defaultUrl, labelKey) => {
            if (enabled === false)
                return null;
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
            showDownloadSection: showFooterDownloadApp && Boolean(appStoreUrl || playStoreUrl),
            clientLinks,
            businessLinks,
            legalLinks,
        };
    }
    async getPublicSiteStatus() {
        const cfg = await loadSystemConfigSafe(this.prisma);
        const row = cfg;
        const branding = typeof row.platformBranding === 'string' && row.platformBranding.trim()
            ? row.platformBranding.trim()
            : 'Rezervame';
        return {
            maintenanceMode: row.maintenanceMode === true,
            platformBranding: branding,
        };
    }
    async getPublicSiteHero() {
        const cfg = await loadSystemConfigSafe(this.prisma);
        const row = cfg;
        const trim = (v) => (typeof v === 'string' ? v.trim() : '');
        const asBool = (v) => v !== false;
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
    async getPaymentConfig() {
        return (0, payment_config_util_1.buildPublicPaymentConfig)(this.prisma);
    }
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
    async getBusinessSession(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.BUSINESS]);
        const b = await this.prisma.business.findUnique({ where: { email: user.email } });
        if (!b)
            return null;
        if (!(await (0, auth_helpers_1.canAccessBusinessMerchantSession)(this.prisma, b, authorization)))
            return null;
        const synced = await syncBusinessListingFlags(this.prisma, b.id);
        return mapBusiness(synced ?? b);
    }
    async getUserSession(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
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
    async updateUserSession(authorization, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        if (body.email && body.email.trim().toLowerCase() !== user.email) {
            const existing = await this.prisma.user.findUnique({
                where: { email: body.email.trim().toLowerCase() }
            });
            if (existing) {
                throw new common_1.BadRequestException('Email already in use by another account');
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
    async updateUserPassword(authorization, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        if (!body.currentPassword || !body.newPassword) {
            throw new common_1.BadRequestException('Current and new password are required');
        }
        const currentOk = await (0, password_util_1.verifyPassword)(body.currentPassword, user.password);
        if (!currentOk) {
            throw new common_1.BadRequestException('Incorrect current password');
        }
        const policy = await (0, security_policy_util_1.loadSecurityPolicy)(this.prisma);
        (0, security_policy_util_1.assertPasswordMeetsPolicy)(body.newPassword, policy);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: await (0, password_util_1.hashPassword)(body.newPassword) },
        });
        return { ok: true };
    }
    async getAdminSession(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }
    async getAdminDashboard(authorization, rangeQuery) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
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
        }
        else if (range === 'week') {
            periodStart.setDate(now.getDate() - 6);
            periodStart.setHours(0, 0, 0, 0);
            prevEnd = new Date(periodStart.getTime() - 1);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - 6);
            prevStart.setHours(0, 0, 0, 0);
        }
        else if (range === 'month') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            prevEnd = new Date(periodStart.getTime() - 1);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        }
        else {
            periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
        const aggregatePeriod = async (start, end) => {
            const bookingWhere = { date: { gte: start, lte: end } };
            const txWhere = { date: { gte: start, lte: end }, status: 'Completed' };
            const [activeBusinesses, newBusinesses, bookingCount, bookingRevenueAgg, commissionAgg, userRegistrations, bookerGroups, pendingApprovals,] = await Promise.all([
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
                    where: { role: client_1.Role.USER, createdAt: { gte: start, lte: end } },
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
        const [current, previous, recentActivities, bookingsLastWeek, txsSixMo, systemConfig] = await Promise.all([
            aggregatePeriod(periodStart, periodEnd),
            aggregatePeriod(prevStart, prevEnd),
            this.prisma.notification.findMany({
                where: { role: client_1.Role.ADMIN, type: { not: 'BROADCAST' } },
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
        const weeklyBookings = [];
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
        const monthKeys = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        const revenueByKey = new Map();
        for (const k of monthKeys)
            revenueByKey.set(k, 0);
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
        const platformBalance = systemConfig.platformBalance ?? 0;
        const pctChange = (cur, prev) => {
            if (prev === 0)
                return cur > 0 ? 100 : 0;
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
    async getAdminBroadcasts(authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const rows = await this.prisma.notification.findMany({
            where: { type: 'BROADCAST' },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const userCount = await this.prisma.user.count({ where: { role: client_1.Role.USER } });
        const bizCount = await this.prisma.business.count();
        return rows.map((n) => {
            const title = n.title.toLowerCase();
            const audience = title.includes('business') || title.includes('merchant')
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
    async getAdminEvents(auth) {
        await (0, auth_helpers_1.requireUser)(this.prisma, auth, [client_1.Role.ADMIN]);
        return this.prisma.event.findMany({ orderBy: { startAt: 'desc' } });
    }
    async createAdminEvent(body, auth) {
        await (0, auth_helpers_1.requireUser)(this.prisma, auth, [client_1.Role.ADMIN]);
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
    async updateAdminEvent(id, body, auth) {
        await (0, auth_helpers_1.requireUser)(this.prisma, auth, [client_1.Role.ADMIN]);
        const imageKey = body.imageKey !== undefined ? await this.storeImage(String(body.imageKey), 'events') : undefined;
        return this.prisma.event.update({
            where: { id },
            data: {
                title: body.title,
                body: body.body,
                location: body.location,
                ...(imageKey !== undefined ? { imageKey } : {}),
                active: body.active,
                websiteUrl: body.websiteUrl !== undefined
                    ? normalizeEventWebsiteUrl(body.websiteUrl)
                    : undefined,
                startAt: body.startAt ? new Date(body.startAt) : undefined,
                price: body.price !== undefined ? Number(body.price) : undefined,
            },
        });
    }
    async deleteAdminEvent(id, auth) {
        await (0, auth_helpers_1.requireUser)(this.prisma, auth, [client_1.Role.ADMIN]);
        await this.prisma.event.delete({ where: { id } });
        return { success: true };
    }
    async getAdminBusinesses(page = '1', limit = '10', search, status, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
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
                revenue: b.balance,
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
    async getAdminBusinessById(id, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const b = await this.prisma.business.findUnique({
            where: { id },
            include: {
                services: { orderBy: [{ category: 'asc' }, { price: 'asc' }] },
                staff: { orderBy: { name: 'asc' } },
                statusHistory: { orderBy: { createdAt: 'desc' } },
                subscriptionPlan: true,
            },
        });
        if (!b)
            throw new common_1.NotFoundException('Business not found');
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
        const amenityRows = (b.amenityKeys ?? []).length > 0
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
            registrationSections: (0, venue_details_util_1.buildAdminRegistrationSections)(b.registrationDetails),
            registrationPhotoUrls: (0, venue_details_util_1.collectRegistrationPhotoUrls)(b.registrationDetails),
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
    async updateAdminBusinessStatus(authorization, id, body) {
        const admin = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const status = (body.status || '').toLowerCase();
        if (!['active', 'pending', 'suspended', 'rejected'].includes(status)) {
            throw new common_1.BadRequestException('invalid status');
        }
        if ((status === 'rejected' || status === 'suspended') && !String(body.reason || '').trim()) {
            throw new common_1.BadRequestException('reason is required for rejection or suspension');
        }
        const before = await this.prisma.business.findUnique({ where: { id } });
        if (!before) {
            throw new common_1.BadRequestException('business not found');
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
                        description: `${before.description || ''}\n[${status === 'rejected' ? 'Rejection reason' : 'Suspension reason'}] ${reasonText}`.trim(),
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
                update: { role: client_1.Role.BUSINESS, status: 'active' },
                create: {
                    name: updated.owner || updated.name,
                    email: updated.email,
                    password: BUSINESS_BYPASS_PASSWORD,
                    role: client_1.Role.BUSINESS,
                    status: 'active',
                },
            });
        }
        if (status === 'active') {
            void (0, notification_hub_service_1.notifyBusinessAccount)(this.prisma, updated, {
                type: 'BUSINESS_APPROVED',
                title: 'Your business was approved',
                body: reasonText ||
                    'Your REZERVAME business account is active. Log in to the business panel to manage bookings.',
                emailSubject: '[Rezervame] Business approved — you can start accepting bookings',
            });
        }
        else if (status === 'rejected') {
            void (0, notification_hub_service_1.notifyBusinessAccount)(this.prisma, updated, {
                type: 'BUSINESS_REJECTED',
                title: 'Business application not approved',
                body: reasonText || 'Your application was not approved at this time.',
                emailSubject: '[Rezervame] Business application update',
            });
        }
        else if (status === 'suspended') {
            void (0, notification_hub_service_1.notifyBusinessAccount)(this.prisma, updated, {
                type: 'BUSINESS_SUSPENDED',
                title: 'Business account suspended',
                body: reasonText || 'Your business account has been suspended. Contact support for help.',
                emailSubject: '[Rezervame] Business account suspended',
            });
        }
        else if (status === 'pending' && before.status !== 'pending') {
            void (0, notification_hub_service_1.notifyBusinessAccount)(this.prisma, updated, {
                type: 'BUSINESS_PENDING',
                title: 'Application under review',
                body: 'Your business registration is pending admin review.',
            });
        }
        return { ok: true, id: updated.id, status: updated.status };
    }
    async updateAdminBusinessDocumentVerification(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const doc = String(body.document || '').toLowerCase();
        if (!['id', 'license', 'insurance'].includes(doc)) {
            throw new common_1.BadRequestException('invalid document');
        }
        const approved = Boolean(body.approved);
        const before = await this.prisma.business.findUnique({ where: { id } });
        if (!before) {
            throw new common_1.BadRequestException('business not found');
        }
        const data = doc === 'id'
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
    async deleteAdminBusiness(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.business.delete({ where: { id } });
        return { ok: true, id };
    }
    async getAdminBookings(page = '1', limit = '10', status, search, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
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
    async deleteAdminBooking(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.booking.delete({ where: { id } });
        return { ok: true, id };
    }
    async updateAdminBookingStatus(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const booking = await this.prisma.booking.findUnique({ where: { id }, include: { service: true } });
        if (!booking)
            throw new common_1.BadRequestException('Booking not found');
        const allowed = ['Approved', 'Rejected', 'Completed', 'Cancelled'];
        const newStatus = body.status;
        if (!allowed.includes(newStatus))
            throw new common_1.BadRequestException(`Status must be one of: ${allowed.join(', ')}`);
        const cur = booking.status;
        const valid = {
            Pending: ['Approved', 'Rejected', 'Cancelled'],
            Approved: ['Completed', 'Cancelled'],
            Completed: [],
            Cancelled: [],
            Rejected: [],
        };
        if (!(valid[cur] || []).includes(newStatus)) {
            throw new common_1.BadRequestException(`Cannot change from ${cur} to ${newStatus}`);
        }
        const updated = await this.prisma.booking.update({
            where: { id },
            data: { status: newStatus },
            include: { user: true, business: true, service: true },
        });
        if (cur !== newStatus) {
            void (0, notification_hub_service_1.notifyCustomerUser)(this.prisma, updated.user, {
                type: 'BOOKING_STATUS',
                title: `Booking ${newStatus}`,
                body: `Your appointment at ${updated.business.name} is now ${newStatus}.`,
            });
            void (0, notification_hub_service_1.notifyBusinessAccount)(this.prisma, updated.business, {
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
    async getAdminPromotions(page = '1', limit = '20', authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
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
    async createAdminPromotion(body, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const svc = await this.prisma.service.findFirst({ where: { id: body.serviceId, businessId: body.businessId } });
        if (!svc)
            throw new common_1.BadRequestException('Service not found for this business');
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
    async deleteAdminPromotion(id, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const promo = await this.prisma.promotion.findUnique({ where: { id } });
        if (!promo)
            throw new common_1.BadRequestException('Promotion not found');
        await this.prisma.promotion.delete({ where: { id } });
        return { ok: true };
    }
    async getAdminLogs(page = '1', limit = '20', search = '', severity = 'all', authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
        if (search) {
            where.OR = [
                { business: { name: { contains: search, mode: 'insensitive' } } },
                { reason: { contains: search, mode: 'insensitive' } },
                { actorName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (severity !== 'all') {
            if (severity === 'error') {
                where.toStatus = 'rejected';
            }
            else if (severity === 'warning') {
                where.toStatus = { in: ['pending', 'inactive'] };
            }
            else {
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
            if (log.toStatus === 'rejected')
                sev = 'error';
            else if (['pending', 'inactive'].includes(log.toStatus))
                sev = 'warning';
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
    async getAdminBusinessesServices(authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
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
    async getAdminUsers(page = '1', limit = '10', search, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = { role: client_1.Role.USER };
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
    async patchAdminUserStatus(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target || target.role !== client_1.Role.USER) {
            throw new common_1.BadRequestException('Customer user not found');
        }
        const next = (body.status || '').toLowerCase() === 'blocked' ? 'blocked' : 'active';
        const updated = await this.prisma.user.update({
            where: { id },
            data: { status: next },
        });
        if (next === 'blocked' && updated.email) {
            void (0, notification_delivery_service_1.sendEmail)(this.prisma, updated.email, '[Rezervame] Account suspended', `<p>Hi ${updated.name},</p><p>Your Rezervame customer account has been suspended. Contact support if you believe this is a mistake.</p>`, `Hi ${updated.name}, your Rezervame account has been suspended.`);
        }
        else if (next === 'active' && updated.email) {
            void (0, notification_delivery_service_1.sendEmail)(this.prisma, updated.email, '[Rezervame] Account reactivated', `<p>Hi ${updated.name},</p><p>Your Rezervame customer account is active again. You can sign in and book appointments.</p>`, `Hi ${updated.name}, your Rezervame account is active again.`);
        }
        return { ok: true, id: updated.id, status: updated.status };
    }
    async emailAdminUser(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target?.email)
            throw new common_1.BadRequestException('User email not found');
        const message = String(body.message || '').trim();
        if (!message)
            throw new common_1.BadRequestException('Message is required');
        const subject = String(body.subject || '').trim() || 'Message from Rezervame';
        const safe = message
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');
        return (0, notification_delivery_service_1.sendEmail)(this.prisma, target.email, subject.startsWith('[') ? subject : `[Rezervame] ${subject}`, `<p>${safe}</p>`, message);
    }
    async deleteAdminUser(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target || target.role !== client_1.Role.USER) {
            throw new common_1.BadRequestException('Customer user not found');
        }
        await this.prisma.user.delete({ where: { id } });
        return { ok: true, id };
    }
    async getAdminTransactions(page = '1', limit = '10', status, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
        if (status && status !== 'all')
            where.status = status;
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
    async deleteAdminTransaction(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.transaction.delete({ where: { id } });
        return { ok: true, id };
    }
    async getAdminWallet(authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const config = await loadSystemConfigSafe(this.prisma);
        const platformBalance = config.platformBalance ?? 0;
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
            defaultCommission: config.defaultCommission ?? 15,
        };
    }
    async getAdminWithdrawals(page = '1', limit = '10', status, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
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
    async deleteAdminWithdrawal(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.withdrawal.delete({ where: { id } });
        return { ok: true, id };
    }
    async batchApproveAdminWithdrawals(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const where = {
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
            throw new common_1.BadRequestException('No pending withdrawals to approve');
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
    async approveAdminWithdrawal(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const w = await this.prisma.withdrawal.findUnique({ where: { id } });
        if (!w)
            throw new common_1.BadRequestException('Withdrawal not found');
        if (w.status.toLowerCase() !== 'pending')
            throw new common_1.BadRequestException('Already processed');
        return this.prisma.withdrawal.update({
            where: { id },
            data: { status: 'Approved', processedDate: new Date() },
        });
    }
    async rejectAdminWithdrawal(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const w = await this.prisma.withdrawal.findUnique({ where: { id } });
        if (!w)
            throw new common_1.BadRequestException('Withdrawal not found');
        if (w.status.toLowerCase() !== 'pending')
            throw new common_1.BadRequestException('Already processed');
        return this.prisma.$transaction(async (tx) => {
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
    async getAdminAlertFeed(authorization, page = '1', limit = '20') {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = { role: client_1.Role.ADMIN, type: { not: 'BROADCAST' } };
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
    async markAdminAlertRead(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.notification.updateMany({
            where: { id, role: client_1.Role.ADMIN },
            data: { read: true },
        });
        return { ok: true };
    }
    async markAllAdminAlertsRead(authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.notification.updateMany({
            where: { role: client_1.Role.ADMIN, read: false, type: { not: 'BROADCAST' } },
            data: { read: true },
        });
        return { ok: true };
    }
    async getAdminNotifications(authorization, page, limit, status, search) {
        return this.getAdminSupportTickets(authorization, page, limit, status, search);
    }
    async getAdminSupportTickets(authorization, page = '1', limit = '10', status, search) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
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
            data: rows.map((t) => (0, support_ticket_util_1.mapSupportTicketRow)({
                ...t,
                messages: t.messages,
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
            openCount,
        };
    }
    async getAdminSupportTicket(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
            include: {
                business: { select: { name: true, merchantNumber: true, email: true, phone: true } },
                user: { select: { name: true, email: true, phone: true } },
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!ticket)
            throw new common_1.BadRequestException('Ticket not found');
        return (0, support_ticket_util_1.mapSupportTicketRow)(ticket, { includeInlineAttachments: true });
    }
    async updateAdminSupportTicketStatus(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const status = String(body.status || '').trim().toLowerCase();
        const allowed = ['open', 'in_progress', 'resolved', 'closed'];
        if (!allowed.includes(status))
            throw new common_1.BadRequestException('Invalid status');
        const ticket = await this.prisma.supportTicket.update({
            where: { id },
            data: {
                status,
                resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : null,
            },
            include: { business: true, user: true },
        });
        if (ticket.requesterEmail) {
            void (0, notification_delivery_service_1.sendEmail)(this.prisma, ticket.requesterEmail, `[Rezervame] Ticket ${ticket.ticketRef} — ${status}`, `<p>Your support ticket <strong>${ticket.ticketRef}</strong> is now <strong>${status}</strong>.</p>`);
        }
        return (0, support_ticket_util_1.mapSupportTicketRow)(ticket);
    }
    async replyAdminSupportTicket(authorization, id, body) {
        const admin = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await (0, support_ticket_util_1.addSupportTicketReply)(this.prisma, id, {
            body: body.message,
            senderRole: client_1.Role.ADMIN,
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
        if (!updated)
            throw new common_1.BadRequestException('Ticket not found');
        return (0, support_ticket_util_1.mapSupportTicketRow)(updated, { includeInlineAttachments: true });
    }
    async batchResolveAdminSupportTickets(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const where = {
            status: { in: ['open', 'in_progress'] },
        };
        if (Array.isArray(body?.ids) && body.ids.length > 0) {
            where.id = { in: body.ids };
        }
        const pending = await this.prisma.supportTicket.findMany({ where, select: { id: true } });
        if (pending.length === 0)
            throw new common_1.BadRequestException('No open tickets to resolve');
        const now = new Date();
        await this.prisma.supportTicket.updateMany({
            where: { id: { in: pending.map((p) => p.id) } },
            data: { status: 'resolved', resolvedAt: now },
        });
        return { ok: true, resolved: pending.length };
    }
    async testAdminEmail(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const cfg = await (0, notification_delivery_service_1.loadMessagingConfig)(this.prisma);
        const to = (body.to || cfg.adminNotifyEmail || '').trim();
        if (!to)
            throw new common_1.BadRequestException('Provide test recipient email');
        const result = await (0, notification_delivery_service_1.sendEmail)(this.prisma, to, '[Rezervame] Test email', '<p>This is a test message from <strong>Rezervame Admin</strong>.</p><p>If you received this, outbound email is working.</p>', 'This is a test message from Rezervame Admin. If you received this, outbound email is working.');
        if (!result.ok && !result.skipped) {
            throw new common_1.BadRequestException(result.error || 'Email could not be sent. Check Postmark API key and sender addresses.');
        }
        if (result.skipped) {
            throw new common_1.BadRequestException('Postmark is not configured. Add the Server API token under Settings → Email, or set POSTMARK_API_KEY on the API server.');
        }
        return {
            ...result,
            ok: true,
            provider: 'postmark',
            message: `Test email sent via Postmark to ${to}`,
        };
    }
    async testAdminSms(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const to = String(body.to || '').trim();
        if (!to)
            throw new common_1.BadRequestException('Provide test phone number (E.164)');
        return (0, notification_delivery_service_1.sendSms)(this.prisma, to, 'Rezervame SMS test — configuration OK.');
    }
    async getAdminPlans(authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await ensureHardcodedPlans(this.prisma);
        return this.prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
    }
    async createAdminPlan(body, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
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
    async updateAdminPlan(id, body, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const data = {};
        if (body.name !== undefined)
            data.name = body.name;
        if (body.price !== undefined)
            data.price = Number(body.price);
        if (body.billingCycle !== undefined)
            data.billingCycle = body.billingCycle;
        if (body.features !== undefined)
            data.features = body.features;
        if (body.active !== undefined)
            data.active = body.active;
        return this.prisma.subscriptionPlan.update({
            where: { id },
            data,
        });
    }
    async deleteAdminPlan(id, authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.subscriptionPlan.delete({ where: { id } });
        return { ok: true };
    }
    async getNotifications(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER, client_1.Role.BUSINESS]);
        return this.prisma.notification.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { userId: null, role: user.role },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async markNotificationRead(id, authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER, client_1.Role.BUSINESS]);
        await this.prisma.notification.updateMany({
            where: {
                id,
                OR: [{ userId: user.id }, { userId: null, role: user.role }],
            },
            data: { read: true },
        });
        return { ok: true };
    }
    async markAllNotificationsRead(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER, client_1.Role.BUSINESS]);
        await this.prisma.notification.updateMany({
            where: {
                read: false,
                OR: [{ userId: user.id }, { userId: null, role: user.role }],
            },
            data: { read: true },
        });
        return { ok: true };
    }
    async deleteAdminNotification(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.notification.delete({ where: { id } });
        return { ok: true, id };
    }
    async getAdminCustomerServiceFaqs(page = '1', limit = '50', search = '', authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
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
    async createAdminCustomerServiceFaq(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const questionEn = String(body.questionEn || '').trim();
        const answerEn = String(body.answerEn || '').trim();
        if (questionEn.length < 3)
            throw new common_1.BadRequestException('Question (EN) must be at least 3 characters');
        if (answerEn.length < 3)
            throw new common_1.BadRequestException('Answer (EN) must be at least 3 characters');
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
    async updateAdminCustomerServiceFaq(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const data = {};
        if (body.questionEn !== undefined)
            data.questionEn = String(body.questionEn).trim();
        if (body.questionEs !== undefined)
            data.questionEs = String(body.questionEs).trim();
        if (body.answerEn !== undefined)
            data.answerEn = String(body.answerEn).trim();
        if (body.answerEs !== undefined)
            data.answerEs = String(body.answerEs).trim();
        if (body.sortOrder !== undefined)
            data.sortOrder = Number(body.sortOrder);
        if (body.active !== undefined)
            data.active = Boolean(body.active);
        return this.prisma.customerServiceFaq.update({ where: { id }, data });
    }
    async deleteAdminCustomerServiceFaq(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.customerServiceFaq.delete({ where: { id } });
        return { ok: true, id };
    }
    async getAdminCategories(page = '1', limit = '20', search = '', authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
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
    async createAdminCategory(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const key = (body.key || '').trim();
        if (!key)
            throw new common_1.BadRequestException('key is required');
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
    async deleteAdminCategory(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.category.delete({ where: { id } });
        return { ok: true };
    }
    async updateAdminCategory(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const imageUrl = body.imageUrl !== undefined ? await this.storeImage(body.imageUrl, 'categories') : undefined;
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
    async getAdminAmenities(authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        return this.prisma.amenity.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    }
    async createAdminAmenity(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const key = (body.key || '').trim();
        if (!key)
            throw new common_1.BadRequestException('key is required');
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
    async deleteAdminAmenity(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.amenity.delete({ where: { id } });
        return { ok: true };
    }
    async updateAdminAmenity(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const imageUrl = body.imageUrl !== undefined ? await this.storeImage(body.imageUrl, 'amenities') : undefined;
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
    async broadcast(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const message = String(body.message || '').trim();
        if (message.length < 4)
            throw new common_1.BadRequestException('Message too short');
        const target = body.target || 'all_users';
        const roles = target === 'all_businesses'
            ? [client_1.Role.BUSINESS]
            : target === 'all_users'
                ? [client_1.Role.USER]
                : [client_1.Role.USER];
        const pushResults = await Promise.all(roles.map((role) => (0, notification_hub_service_1.notifyRoleBroadcast)(this.prisma, role, message, target)));
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
    async getBusiness(id, authorization, userLat, userLng) {
        console.log('[GET /business/:id] id=', id);
        const b = await this.prisma.business.findUnique({
            where: { id },
            include: { services: { select: { imageUrl: true } } },
        });
        if (!b) {
            console.log('[GET /business/:id] Not found in DB:', id);
            return null;
        }
        const visible = await (0, auth_helpers_1.isBusinessPubliclyVisible)(this.prisma, b, authorization);
        console.log('[GET /business/:id] visible=', visible, 'status=', b.status);
        if (!visible)
            throw new common_1.NotFoundException(`Business not visible (Status: ${b.status})`);
        const portfolioImageUrls = buildPortfolioImageUrls({
            services: b.services,
            images: b.images,
            bannerUrl: b.bannerUrl,
            logoUrl: b.logoUrl,
        });
        const base = mapBusiness(b);
        if (!base)
            return null;
        const keys = (b.amenityKeys ?? []).filter(Boolean);
        const rows = keys.length > 0
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
        }
        catch {
            commissionPercent = 15;
        }
        const publicDetails = (0, venue_details_util_1.buildPublicVenueDetails)(b);
        return {
            ...base,
            images: portfolioImageUrls.length > 0 ? portfolioImageUrls : base.images,
            portfolioImageUrls,
            rating: ratingStr,
            reviews: reviewsStr,
            distanceLabel,
            taxPercentage: b.taxPercentage ?? 0,
            commissionPercent,
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
    async getBusinessByEmail(email) {
        const b = await this.prisma.business.findUnique({ where: { email } });
        return mapBusiness(b);
    }
    async updateBusiness(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const before = await this.prisma.business.findUnique({ where: { id } });
        if (!before)
            throw new common_1.NotFoundException('Business not found');
        const data = await mapBusinessPatchWithS3(body, this.s3Storage);
        applyListingVisibilityPatch(before, body, data);
        if (body.registrationDetails !== undefined || body.businessType !== undefined) {
            let nextRd = (0, registration_images_util_1.mergeRegistrationDetails)(before.registrationDetails, body.registrationDetails);
            if (body.businessType !== undefined) {
                nextRd.businessType = body.businessType.trim();
            }
            nextRd = await (0, registration_images_util_1.persistRegistrationDetailsImages)(nextRd, this.s3Storage);
            data.registrationDetails = nextRd;
            if (body.businessType !== undefined && body.categoryKeys === undefined) {
                const mapped = (0, business_categories_util_1.categoryKeysAndLabelsForPartner)(body.businessType, before.categoryKeys);
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
    async updateBusinessListingVisibility(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const before = await this.prisma.business.findUnique({ where: { id } });
        if (!before)
            throw new common_1.NotFoundException('Business not found');
        const wantsVisible = Boolean(body.visible);
        if (wantsVisible) {
            const setup = (0, business_listing_util_1.evaluateBusinessProfileSetup)(before);
            if (!setup.canEnableListing) {
                throw new common_1.BadRequestException('Complete required profile setup before your business can appear on the app and web.');
            }
        }
        await this.prisma.business.update({
            where: { id },
            data: { listingVisible: wantsVisible },
        });
        const synced = await syncBusinessListingFlags(this.prisma, id);
        return mapBusiness(synced ?? before);
    }
    async upgradeBusinessPlan(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const { plan, planId } = body;
        let dbPlan = null;
        if (planId) {
            dbPlan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        }
        else if (plan) {
            dbPlan = await this.prisma.subscriptionPlan.findFirst({
                where: { name: { equals: plan, mode: 'insensitive' } },
            });
        }
        if (!dbPlan) {
            throw new common_1.BadRequestException('Invalid subscription plan selected');
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
    async getBusinessServices(id, page = '1', limit = '20', search = '', category = '', authorization) {
        const b = await this.prisma.business.findUnique({ where: { id } });
        if (!b || !(await (0, auth_helpers_1.isBusinessPubliclyVisible)(this.prisma, b, authorization))) {
            return { data: [], total: 0, page: 1, limit: parseInt(limit), totalPages: 0 };
        }
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = { businessId: id };
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
    async createBusinessService(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const business = await this.prisma.business.findUnique({ where: { id } });
        if (business) {
            const plan = business.plan || 'Basic';
            let serviceLimit = 5;
            if (plan === 'Premium')
                serviceLimit = 10;
            else if (plan === 'Gold' || plan === 'Enterprise')
                serviceLimit = 99999;
            const currentServiceCount = await this.prisma.service.count({ where: { businessId: id } });
            if (currentServiceCount >= serviceLimit) {
                throw new common_1.BadRequestException(`Service limit reached. Your current plan (${plan}) allows up to ${serviceLimit} services. Please upgrade to a higher plan to add more services.`);
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
    async updateService(id, body, authorization) {
        const svc = await this.prisma.service.findUnique({ where: { id } });
        if (!svc)
            throw new common_1.BadRequestException('Service not found');
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, svc.businessId);
        const imageUrl = body.imageUrl !== undefined ? await this.storeImage(body.imageUrl, 'venues/services') : undefined;
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
    async deleteService(id, authorization) {
        const svc = await this.prisma.service.findUnique({ where: { id } });
        if (!svc)
            throw new common_1.BadRequestException('Service not found');
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, svc.businessId);
        await this.prisma.service.delete({ where: { id } });
        return { ok: true };
    }
    async getBusinessBestsellers(id) {
        const bookings = await this.prisma.booking.groupBy({
            by: ['serviceId'],
            where: { businessId: id, serviceId: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });
        return bookings.map((b) => ({
            serviceId: b.serviceId,
            bookingCount: b._count.id,
        }));
    }
    async getBusinessPromotions(id) {
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
    async createPromotion(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const business = await this.prisma.business.findUnique({ where: { id } });
        if (business && business.plan === 'Basic') {
            throw new common_1.BadRequestException('Promotions and Marketing features are not available under the Basic plan. Please upgrade to Premium or higher to run promotions.');
        }
        const svc = await this.prisma.service.findFirst({ where: { id: body.serviceId, businessId: id } });
        if (!svc)
            throw new common_1.BadRequestException('Service not found for this business');
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
    async updatePromotion(id, promoId, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const promo = await this.prisma.promotion.findUnique({ where: { id: promoId } });
        if (!promo || promo.businessId !== id)
            throw new common_1.BadRequestException('Promotion not found');
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
    async deletePromotion(promoId, authorization) {
        const promo = await this.prisma.promotion.findUnique({ where: { id: promoId } });
        if (!promo)
            throw new common_1.BadRequestException('Promotion not found');
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, promo.businessId);
        await this.prisma.promotion.delete({ where: { id: promoId } });
        return { ok: true };
    }
    async getBusinessStaff(id, page = '1', limit = '20', search = '', role = '', authorization) {
        const b = await this.prisma.business.findUnique({ where: { id } });
        if (!b || !(await (0, auth_helpers_1.isBusinessPubliclyVisible)(this.prisma, b, authorization))) {
            return { data: [], total: 0, page: 1, limit: parseInt(limit), totalPages: 0 };
        }
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = { businessId: id };
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
            return [[], []];
        });
        const statsMap = new Map();
        staffIds.forEach(id => statsMap.set(id, { rating: 0, reviews: 0, clients: 0 }));
        reviewStats.forEach(rs => {
            if (rs.staffId) {
                const avgRating = rs._avg.staffRating || rs._avg.rating || 0;
                statsMap.set(rs.staffId, {
                    ...statsMap.get(rs.staffId),
                    rating: avgRating,
                    reviews: rs._count._all || 0,
                });
            }
        });
        clientStats.forEach(cs => {
            if (cs.staffId) {
                const current = statsMap.get(cs.staffId);
                statsMap.set(cs.staffId, { ...current, clients: current.clients + 1 });
            }
        });
        return {
            data: staff.map(s => {
                const stats = statsMap.get(s.id);
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
    async createStaff(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const business = await this.prisma.business.findUnique({ where: { id } });
        if (business) {
            const plan = business.plan || 'Basic';
            let staffLimit = 2;
            if (plan === 'Premium')
                staffLimit = 5;
            else if (plan === 'Gold' || plan === 'Enterprise')
                staffLimit = 99999;
            const currentStaffCount = await this.prisma.staff.count({ where: { businessId: id } });
            if (currentStaffCount >= staffLimit) {
                throw new common_1.BadRequestException(`Staff limit reached. Your current plan (${plan}) allows up to ${staffLimit} staff members. Please upgrade to a higher plan to add more staff.`);
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
    async updateStaff(id, body, authorization) {
        const row = await this.prisma.staff.findUnique({ where: { id } });
        if (!row)
            throw new common_1.BadRequestException('Staff not found');
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, row.businessId);
        const staffImage = body.image !== undefined ? await this.storeImage(body.image, 'staff') : undefined;
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
    async deleteStaff(id, authorization) {
        const row = await this.prisma.staff.findUnique({ where: { id } });
        if (!row)
            throw new common_1.BadRequestException('Staff not found');
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, row.businessId);
        await this.prisma.staff.delete({ where: { id } });
        return { ok: true };
    }
    async getBusinessBookings(id, page = '1', limit = '20', status, staffId, search, startDate, endDate, authorization) {
        try {
            await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
            const p = Math.max(1, parseInt(page));
            const l = Math.max(1, parseInt(limit));
            const where = { businessId: id };
            if (status && status !== 'all')
                where.status = status;
            if (staffId && staffId !== 'all')
                where.staffId = staffId;
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
                if (start)
                    where.date.gte = start;
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
        }
        catch (err) {
            console.error(`[getBusinessBookings] Failed for business ${id}:`, err);
            if (err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException || err instanceof common_1.NotFoundException) {
                throw err;
            }
            throw new common_1.BadRequestException(err instanceof Error ? err.message : 'Failed to fetch bookings');
        }
    }
    async createBooking(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const userId = await resolveBookingCreateUser(this.prisma, body);
        const svcId = typeof body.serviceId === 'string' && body.serviceId.trim() ? body.serviceId : null;
        const stId = typeof body.staffId === 'string' && body.staffId.trim() ? body.staffId : null;
        const biz = await this.prisma.business.findUnique({ where: { id: id } });
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
                const commissionPct = await (0, booking_payment_util_1.loadDefaultCommissionPercent)(this.prisma);
                const settlement = (0, booking_payment_util_1.calculateBookingSettlement)([{ price: b.price, taxAmount: b.taxAmount }], commissionPct);
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
    async payBusinessBookingGroup(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const method = body.paymentMethod || 'Cash';
        return (0, booking_payment_util_1.finalizeBusinessBookingGroupPayment)(this.prisma, id, body.bookingIds ?? [], method);
    }
    async proposeReschedule(id, bookingId, body, authorization) {
        console.log(`[proposeReschedule] businessId=${id}, bookingId=${bookingId}, newDate=${body.newDate}`);
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return await this.prisma.booking.update({
            where: { id: bookingId, businessId: id },
            data: {
                date: new Date(body.newDate),
                status: 'Rescheduled'
            },
        });
    }
    async updateBooking(id, body, authorization) {
        const old = await this.prisma.booking.findUnique({ where: { id } });
        if (!old)
            throw new common_1.BadRequestException('Booking not found');
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, old.businessId);
        const data = {};
        if (body.customerName !== undefined)
            data.customerName = body.customerName;
        if (body.date !== undefined)
            data.date = new Date(body.date);
        if (body.status !== undefined) {
            const next = body.status;
            if (next === 'Completed' && old.status !== 'Paid') {
                const cashPending = isCashPaymentMethod(old.paymentMethod) && !old.transactionId;
                if (cashPending) {
                    throw new common_1.BadRequestException('Confirm cash payment received before marking this booking completed');
                }
            }
            data.status = next;
        }
        if (body.price !== undefined)
            data.price = body.price;
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
                const commissionPct = await (0, booking_payment_util_1.loadDefaultCommissionPercent)(this.prisma);
                const settlement = (0, booking_payment_util_1.calculateBookingSettlement)([{ price: updated.price, taxAmount: updated.taxAmount }], commissionPct);
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
            }
            else if (wasEarned && !isEarned) {
                const commissionPct = await (0, booking_payment_util_1.loadDefaultCommissionPercent)(this.prisma);
                const settlement = (0, booking_payment_util_1.calculateBookingSettlement)([{ price: old.price, taxAmount: old.taxAmount }], commissionPct);
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
                    void (0, notification_hub_service_1.notifyCustomerUser)(this.prisma, customer, {
                        type: 'BOOKING_STATUS',
                        title: `Booking ${updated.status}`,
                        body: `Your appointment at ${biz?.name || 'the venue'} is now ${updated.status}.`,
                    });
                }
            }
            return updated;
        });
    }
    async getBusinessReviews(id, page, limit, authorization) {
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
    async createMobileReview(body, authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const booking = await this.prisma.booking.findUnique({
            where: { id: body.bookingId },
            include: { service: true, staff: true },
        });
        if (!booking)
            throw new common_1.BadRequestException('Booking not found');
        if (booking.userId !== user.id)
            throw new common_1.BadRequestException('Unauthorized');
        if (booking.status !== 'Completed')
            throw new common_1.BadRequestException('Only completed bookings can be reviewed');
        if (booking.isReviewed)
            throw new common_1.BadRequestException('Booking already reviewed');
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
    async createMobileReviewGroup(body, authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        if (!Array.isArray(body.services) || body.services.length === 0) {
            throw new common_1.BadRequestException('services must be a non-empty array');
        }
        const reviews = [];
        for (let i = 0; i < body.services.length; i++) {
            const s = body.services[i];
            const booking = await this.prisma.booking.findUnique({
                where: { id: s.bookingId },
                include: { service: true, staff: true },
            });
            if (!booking || booking.userId !== user.id)
                continue;
            if (booking.status !== 'Completed' || booking.isReviewed)
                continue;
            const review = await this.prisma.review.create({
                data: {
                    userId: user.id,
                    businessId: booking.businessId,
                    bookingId: booking.id,
                    staffId: booking.staffId,
                    customerName: user.name,
                    avatar: user.avatar,
                    staffRating: s.staffRating,
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
    async updateReview(id, body, authorization) {
        const r = await this.prisma.review.findUnique({ where: { id } });
        if (!r)
            throw new common_1.BadRequestException('Review not found');
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, r.businessId);
        return this.prisma.review.update({ where: { id }, data: body });
    }
    async deleteReview(id, authorization) {
        const r = await this.prisma.review.findUnique({ where: { id } });
        if (!r)
            throw new common_1.BadRequestException('Review not found');
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, r.businessId);
        await this.prisma.review.delete({ where: { id } });
        return { ok: true };
    }
    async getBusinessTransactions(id, page, limit, search, type, status, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const filter = { businessId: id };
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
    async createTransaction(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return this.prisma.transaction.create({ data: { ...body, businessId: id } });
    }
    async getBusinessWithdrawals(id, page, limit, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
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
    async createBusinessWithdrawal(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Invalid amount');
        }
        return this.prisma.$transaction(async (tx) => {
            const biz = await tx.business.findUnique({ where: { id } });
            if (!biz)
                throw new common_1.BadRequestException('Business not found');
            if (biz.balance < amount) {
                throw new common_1.BadRequestException('Insufficient balance');
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
    async createBusinessSupportRequest(id, body, authorization) {
        const { user } = await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const biz = await this.prisma.business.findUnique({ where: { id } });
        const screenshotUrl = await this.storeImage(body.screenshotUrl, 'support');
        const ticket = await (0, support_ticket_util_1.createSupportTicket)(this.prisma, {
            subject: body.subject || `Support from ${biz?.name ?? 'merchant'}`,
            message: body.message,
            category: body.category || 'merchant',
            screenshotUrl: screenshotUrl ?? undefined,
            businessId: id,
            userId: user.id,
            createdByRole: client_1.Role.BUSINESS,
            requesterName: biz?.owner || biz?.name || user.name,
            requesterEmail: biz?.email || user.email,
            requesterPhone: biz?.phone,
        });
        return { ok: true, ticketId: ticket.id, ticketRef: ticket.ticketRef };
    }
    async getBusinessSupportTickets(id, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const rows = await this.prisma.supportTicket.findMany({
            where: { businessId: id },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
            orderBy: { updatedAt: 'desc' },
            take: 50,
        });
        return rows.map((t) => (0, support_ticket_util_1.mapSupportTicketRow)({ ...t, messages: t.messages }));
    }
    async createBusinessSupportTicket(id, body, authorization) {
        const { user } = await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const biz = await this.prisma.business.findUnique({ where: { id } });
        const screenshotUrl = await this.storeImage(body.screenshotUrl, 'support');
        const ticket = await (0, support_ticket_util_1.createSupportTicket)(this.prisma, {
            subject: body.subject,
            message: body.message,
            category: body.category || 'technical',
            priority: body.priority,
            screenshotUrl: screenshotUrl ?? undefined,
            businessId: id,
            userId: user.id,
            createdByRole: client_1.Role.BUSINESS,
            requesterName: biz?.owner || biz?.name || user.name,
            requesterEmail: biz?.email || user.email,
            requesterPhone: biz?.phone,
        });
        return (0, support_ticket_util_1.mapSupportTicketRow)(ticket);
    }
    async getBusinessSupportTicket(id, ticketId, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, businessId: id },
            include: { messages: { orderBy: { createdAt: 'asc' } }, business: true },
        });
        if (!ticket)
            throw new common_1.BadRequestException('Ticket not found');
        return (0, support_ticket_util_1.mapSupportTicketRow)(ticket);
    }
    async replyBusinessSupportTicket(id, ticketId, body, authorization) {
        const { user } = await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, businessId: id },
        });
        if (!ticket)
            throw new common_1.BadRequestException('Ticket not found');
        const biz = await this.prisma.business.findUnique({ where: { id } });
        const attachmentUrl = await this.storeImage(body.screenshotUrl, 'support');
        await (0, support_ticket_util_1.addSupportTicketReply)(this.prisma, ticketId, {
            body: body.message,
            senderRole: client_1.Role.BUSINESS,
            senderName: biz?.owner || user.name,
            attachmentUrl: attachmentUrl ?? undefined,
            reopen: true,
        });
        const updated = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: { messages: { orderBy: { createdAt: 'asc' } }, business: true },
        });
        return (0, support_ticket_util_1.mapSupportTicketRow)(updated);
    }
    async getUserSupportTickets(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const rows = await this.prisma.supportTicket.findMany({
            where: { userId: user.id },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
            orderBy: { updatedAt: 'desc' },
            take: 50,
        });
        return rows.map((t) => (0, support_ticket_util_1.mapSupportTicketRow)({ ...t, messages: t.messages }));
    }
    async createUserSupportTicket(authorization, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const screenshotUrl = await this.storeImage(body.screenshotUrl, 'support');
        const ticket = await (0, support_ticket_util_1.createSupportTicket)(this.prisma, {
            subject: body.subject,
            message: body.message,
            category: body.category || 'customer',
            screenshotUrl: screenshotUrl ?? undefined,
            businessId: body.businessId || null,
            userId: user.id,
            createdByRole: client_1.Role.USER,
            requesterName: user.name,
            requesterEmail: user.email,
            requesterPhone: user.phone,
        });
        return (0, support_ticket_util_1.mapSupportTicketRow)(ticket);
    }
    async getUserSupportTicket(authorization, ticketId) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, userId: user.id },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        if (!ticket)
            throw new common_1.BadRequestException('Ticket not found');
        return (0, support_ticket_util_1.mapSupportTicketRow)(ticket);
    }
    async replyUserSupportTicket(authorization, ticketId, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, userId: user.id },
        });
        if (!ticket)
            throw new common_1.BadRequestException('Ticket not found');
        const attachmentUrl = await this.storeImage(body.screenshotUrl, 'support');
        const result = await (0, support_ticket_util_1.addSupportTicketReply)(this.prisma, ticketId, {
            body: body.message,
            senderRole: client_1.Role.USER,
            senderName: user.name,
            attachmentUrl: attachmentUrl ?? undefined,
            reopen: true,
        });
        return (0, support_ticket_util_1.mapSupportTicketRow)({ ...result.ticket, messages: [result.message] });
    }
    async getMachines(id, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return this.prisma.machine.findMany({ where: { businessId: id } });
    }
    async createMachine(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return this.prisma.machine.create({ data: { ...body, businessId: id } });
    }
    async getParts(id, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return this.prisma.part.findMany({ where: { businessId: id } });
    }
    async createPart(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return this.prisma.part.create({ data: { ...body, businessId: id } });
    }
    async getQaInspections(id, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return this.prisma.qaInspection.findMany({ where: { businessId: id } });
    }
    async createQaInspection(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const qa = await this.prisma.qaInspection.create({ data: { ...body, businessId: id } });
        await this.prisma.notification.create({
            data: { type: 'QA_COMPLETION', title: 'QA inspection completed', body: `QA ${qa.id} done`, role: client_1.Role.BUSINESS },
        });
        return qa;
    }
    async getNcrs(id, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return this.prisma.ncr.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' } });
    }
    async createNcr(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const ncr = await this.prisma.ncr.create({ data: { ...body, businessId: id } });
        await this.prisma.notification.create({
            data: { type: 'NCR_ALERT', title: 'NCR reported', body: `NCR ${ncr.id} reported`, role: client_1.Role.ADMIN },
        });
        return ncr;
    }
    async getOrders(id, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return this.prisma.order.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' } });
    }
    async createOrder(id, body, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        const order = await this.prisma.order.create({ data: { ...body, businessId: id } });
        await this.prisma.notification.create({
            data: { type: 'ORDER_UPDATE', title: 'Order updated', body: `Order ${order.id} created`, role: client_1.Role.USER },
        });
        return order;
    }
    async getMobileBookingGroup(id, authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const booking = await this.prisma.booking.findUnique({
            where: { id, userId: user.id },
            include: { business: true },
        });
        if (!booking)
            throw new common_1.BadRequestException('Booking not found');
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
    async getMobileBookings(page = '1', limit = '10', authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const ongoingStatuses = ['Pending', 'Approved', 'Paid', 'Rescheduled'];
        const historyStatuses = ['Completed', 'Rejected', 'Cancelled'];
        const [ongoing, historyTotal, history] = await Promise.all([
            this.prisma.booking.findMany({
                where: {
                    userId: user.id,
                    OR: ongoingStatuses.map((status) => ({ status: { equals: status, mode: 'insensitive' } })),
                },
                include: { business: true, service: true, staff: true, familyMember: true, transaction: true },
                orderBy: { date: 'asc' },
                take: 50,
            }),
            this.prisma.booking.count({
                where: {
                    userId: user.id,
                    OR: historyStatuses.map((status) => ({ status: { equals: status, mode: 'insensitive' } })),
                },
            }),
            this.prisma.booking.findMany({
                where: {
                    userId: user.id,
                    OR: historyStatuses.map((status) => ({ status: { equals: status, mode: 'insensitive' } })),
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
    async listFamilyMembers(authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        return this.prisma.familyMember.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getStaffBusySlots(staffId, dateStr) {
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
    async createFamilyMember(authorization, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
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
    async updateFamilyMember(id, authorization, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const row = await this.prisma.familyMember.findFirst({ where: { id, userId: user.id } });
        if (!row)
            throw new common_1.BadRequestException('Family member not found');
        const data = {};
        if (body.name !== undefined)
            data.name = String(body.name).trim();
        if (body.age !== undefined) {
            const ageNum = Number(body.age);
            data.age = Number.isFinite(ageNum) && ageNum >= 0 ? Math.floor(ageNum) : null;
        }
        if (body.gender !== undefined)
            data.gender = String(body.gender).trim();
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
    async deleteFamilyMember(id, authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const row = await this.prisma.familyMember.findFirst({ where: { id, userId: user.id } });
        if (!row)
            throw new common_1.BadRequestException('Family member not found');
        await this.prisma.familyMember.delete({ where: { id } });
        return { ok: true };
    }
    async cancelMobileBooking(id, authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const result = await (0, cancel_bookings_util_1.cancelBookingsForCustomer)(this.prisma, user.id, [id]);
        return { ok: true, ...result };
    }
    async cancelMobileBookingGroup(authorization, body = {}) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const ids = Array.isArray(body.bookingIds) ? body.bookingIds.filter((id) => typeof id === 'string' && id.trim()) : [];
        const result = await (0, cancel_bookings_util_1.cancelBookingsForCustomer)(this.prisma, user.id, ids);
        return { ok: true, ...result };
    }
    async payMobileBooking(id, authorization, body = {}) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const method = body.paymentMethod || 'Cash Payment';
        return (0, booking_payment_util_1.finalizeBookingGroupPayment)(this.prisma, user, [id], method);
    }
    async payMobileBookingGroup(authorization, body = { bookingIds: [] }) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const method = (body.paymentMethod || 'Cash Payment').trim();
        const digital = ['Card Payment', 'Stripe', 'Online', 'Wompi', 'Yappy'];
        if (digital.includes(method)) {
            throw new common_1.BadRequestException('Online card and Yappy payments are completed via Wompi/Yappy checkout when configured. Pay-by-visit uses this endpoint with paymentMethod "Pay by visit".');
        }
        return (0, booking_payment_util_1.finalizeBookingGroupPayment)(this.prisma, user, body.bookingIds, method);
    }
    async payMobileBookingGroupStripe() {
        throw new common_1.BadRequestException('Stripe is not used. Configure Wompi Panama under Admin → Settings → Payment gateways.');
    }
    async completeUserBooking(id, authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const booking = await this.prisma.booking.findUnique({ where: { id } });
        if (!booking || (booking.userId !== user.id && user.role !== client_1.Role.ADMIN)) {
            throw new common_1.ForbiddenException();
        }
        if (booking.status !== 'Paid')
            throw new common_1.BadRequestException('Only paid bookings can be completed');
        return await this.prisma.booking.update({
            where: { id },
            data: { status: 'Completed' },
        });
    }
    async acceptReschedule(id, authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const booking = await this.prisma.booking.findUnique({ where: { id } });
        if (!booking || booking.userId !== user.id)
            throw new common_1.ForbiddenException();
        if (booking.status !== 'Rescheduled')
            throw new common_1.BadRequestException('Not in rescheduled state');
        return await this.prisma.booking.update({
            where: { id },
            data: { status: 'Approved' },
        });
    }
    async createMobileBooking(authorization, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const business = await this.prisma.business.findUnique({ where: { id: body.businessId } });
        if (!business || !(0, business_listing_util_1.isBusinessDiscoverable)(business)) {
            throw new common_1.BadRequestException('Business is not available for booking');
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
                throw new common_1.BadRequestException('This venue has reached its monthly limit of 50 bookings under the Basic plan. Please upgrade to a higher tier.');
            }
        }
        const service = await this.prisma.service.findFirst({
            where: { id: body.serviceId, businessId: body.businessId },
        });
        if (!service)
            throw new common_1.BadRequestException('Service not found for this business');
        const date = new Date(body.date);
        if (Number.isNaN(date.getTime()))
            throw new common_1.BadRequestException('Invalid date');
        let staffId = null;
        const rawStaff = typeof body.staffId === 'string' ? body.staffId.trim() : '';
        if (rawStaff) {
            const st = await this.prisma.staff.findFirst({
                where: { id: rawStaff, businessId: body.businessId },
            });
            if (st) {
                const ids = st.serviceIds ?? [];
                if (ids.length > 0 && !ids.includes(service.id)) {
                    throw new common_1.BadRequestException('Selected staff does not offer this service');
                }
                staffId = st.id;
            }
        }
        let customerName = user.name;
        let familyMemberId = null;
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
        void (0, notification_hub_service_1.notifyCustomerUser)(this.prisma, user, {
            type: autoApproved ? 'BOOKING_APPROVED' : 'BOOKING_CREATED',
            title: autoApproved ? 'Booking confirmed' : 'Booking request submitted',
            body: autoApproved
                ? `Your appointment at ${business.name} is confirmed. You can complete payment when ready.`
                : `Your appointment request at ${business.name} was submitted and is pending approval.`,
        });
        void (0, notification_hub_service_1.notifyPlatformAdmins)(this.prisma, {
            type: 'BOOKING_CREATED',
            title: `New booking — ${business.name}`,
            body: `${customerName} booked ${service.name} for ${date.toLocaleString()} (${status}).`,
            emailSubject: `[Rezervame] New booking at ${business.name}`,
        });
        void (0, notification_hub_service_1.notifyBusinessAccount)(this.prisma, business, {
            type: 'BOOKING_CREATED',
            title: autoApproved ? 'New confirmed booking' : 'New booking request',
            body: `${customerName} — ${service.name} on ${date.toLocaleString()}.`,
            emailSubject: autoApproved
                ? `[Rezervame] New confirmed booking`
                : `[Rezervame] New booking request`,
        });
        if (business.notifyBookingEmail && business.email) {
            void (0, notification_delivery_service_1.sendEmail)(this.prisma, business.email, autoApproved ? `[Rezervame] New confirmed booking` : `[Rezervame] New booking request`, autoApproved
                ? `<p><strong>${customerName}</strong> booked <strong>${service.name}</strong> on ${date.toLocaleString()} (auto-confirmed).</p><p>Preferred payment: ${paymentMethod}</p>`
                : `<p><strong>${customerName}</strong> requested <strong>${service.name}</strong> on ${date.toLocaleString()}.</p><p>Preferred payment: ${paymentMethod}</p>`);
        }
        if (user.email) {
            void (0, notification_delivery_service_1.sendEmail)(this.prisma, user.email, autoApproved ? `[Rezervame] Booking confirmed` : `[Rezervame] Booking request sent`, autoApproved
                ? `<p>Your appointment at <strong>${business.name}</strong> is confirmed. You can pay from your reservations when ready.</p>`
                : `<p>Your request at <strong>${business.name}</strong> was submitted and is pending approval.</p>`);
        }
        return booking;
    }
    async getMobileInvoices(page = '1', limit = '10', authorization) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const allTx = await this.prisma.transaction.findMany({
            where: { bookings: { some: { userId: user.id } } },
            include: { business: true, bookings: { include: { service: true, staff: true } } },
            orderBy: { date: 'desc' },
        });
        const deduped = (0, booking_payment_util_1.dedupeTransactionsByBookingGroup)(allTx);
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
    async getMobileVenues(page = '1', limit = '20', search, category, minRating, sortBy = 'newest', userLat, userLng) {
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const geo = parseUserGeoQuery(userLat, userLng);
        const where = { ...business_listing_util_1.businessDiscoveryWhere };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { services: { some: { name: { contains: search, mode: 'insensitive' } } } },
            ];
        }
        const categoryFilter = category && category !== 'all'
            ? category.split(',').map((c) => c.trim()).filter(Boolean)
            : [];
        let businesses = await this.prisma.business.findMany({
            where,
            include: {
                reviews: { select: { businessRating: true } },
                services: { orderBy: { price: 'asc' } },
            },
        });
        if (categoryFilter.length > 0) {
            businesses = businesses.filter((b) => businessMatchesCategoryFilter(b.categoryKeys, b.services, categoryFilter));
        }
        const minR = parseFloat(minRating || '0');
        let mapped = businesses.map((b) => {
            const rStats = b.reviews || [];
            const validRatings = rStats.filter((r) => r.businessRating !== null);
            const count = rStats.length;
            const avg = validRatings.length > 0
                ? validRatings.reduce((sum, r) => sum + r.businessRating, 0) / validRatings.length
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
            const cardImage = firstServiceImage ?? galleryThumb ?? bannerUrl ?? logoUrl ?? null;
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
        if (minR > 0) {
            mapped = mapped.filter(m => m.ratingNum >= minR);
        }
        mapped.sort((a, b) => {
            if (sortBy === 'ratingHighLow')
                return b.ratingNum - a.ratingNum;
            if (sortBy === 'priceLowHigh')
                return a.priceNum - b.priceNum;
            if (sortBy === 'priceHighLow')
                return b.priceNum - a.priceNum;
            if (sortBy === 'distance')
                return a.distance - b.distance;
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
    async getMobileNotifications(authorization, page = '1', limit = '20') {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const p = Math.max(1, parseInt(page, 10) || 1);
        const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
        const where = {
            OR: [
                { userId: user.id },
                { role: client_1.Role.USER, userId: null },
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
    async getMobileEvents(page = '1', limit = '12') {
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
    async getPublicPlans() {
        await ensureHardcodedPlans(this.prisma);
        return this.prisma.subscriptionPlan.findMany({
            where: { active: true },
            orderBy: { price: 'asc' },
        });
    }
    async getPublicCategories() {
        const categories = await this.prisma.category.findMany({
            where: { active: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
        const activeBusinesses = await this.prisma.business.findMany({
            where: { ...business_listing_util_1.businessDiscoveryWhere },
            select: {
                id: true,
                categoryKeys: true,
                services: { select: { category: true } },
            },
        });
        const countByKey = new Map();
        for (const b of activeBusinesses) {
            for (const k of businessEffectiveCategoryKeys(b.categoryKeys, b.services)) {
                countByKey.set(k, (countByKey.get(k) ?? 0) + 1);
            }
        }
        return partner_business_types_1.PARTNER_BUSINESS_TYPES.map((pt) => {
            const count = pt.categoryKeys.reduce((sum, k) => sum + (countByKey.get(k) ?? 0), 0);
            const dbRow = categories.find((c) => c.key === pt.primaryCategoryKey) ??
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
    async createPublicBusinessJoin(body) {
        const name = (body.name || '').trim();
        const taxId = (body.taxId || '').trim();
        const owner = (body.owner || '').trim();
        const email = (body.email || '').trim().toLowerCase();
        const phone = (body.phone || '').trim();
        const address = (body.address || '').trim();
        const password = (body.password || '').trim();
        if (password) {
            const policy = await (0, security_policy_util_1.loadSecurityPolicy)(this.prisma);
            (0, security_policy_util_1.assertPasswordMeetsPolicy)(password, policy);
        }
        const categories = Array.isArray(body.categories) ? body.categories.filter(Boolean) : [];
        const services = Array.isArray(body.services) ? body.services : [];
        const idDocumentImage = await this.storeImage(String(body.idDocumentImage || '').trim(), 'documents/id');
        const licenseDocumentImage = await this.storeImage(String(body.licenseDocumentImage || '').trim(), 'documents/license');
        const insuranceDocumentImage = await this.storeImage(String(body.insuranceDocumentImage || '').trim(), 'documents/insurance');
        const inputPlanId = String(body.planId || 'basic').trim();
        const registrationDetails = body.registrationDetails && typeof body.registrationDetails === 'object'
            ? body.registrationDetails
            : null;
        const lat = body.latitude != null && Number.isFinite(Number(body.latitude))
            ? Number(body.latitude)
            : null;
        const lng = body.longitude != null && Number.isFinite(Number(body.longitude))
            ? Number(body.longitude)
            : null;
        const rd = registrationDetails;
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
        const galleryFromReg = [];
        if (rd?.exteriorPhotoUrl) {
            const ext = await this.storeImage(String(rd.exteriorPhotoUrl), 'venues/gallery');
            if (ext)
                galleryFromReg.push(ext);
        }
        if (Array.isArray(rd?.interiorPhotoUrls)) {
            for (const img of rd.interiorPhotoUrls.slice(0, 5)) {
                const u = await this.storeImage(String(img || ''), 'venues/gallery');
                if (u)
                    galleryFromReg.push(u);
            }
        }
        if (Array.isArray(rd?.portfolioPhotoUrls)) {
            for (const img of rd.portfolioPhotoUrls.slice(0, 10)) {
                const u = await this.storeImage(String(img || ''), 'venues/gallery');
                if (u)
                    galleryFromReg.push(u);
            }
        }
        if (!name || !taxId || !owner || !email || !phone || !address) {
            throw new common_1.BadRequestException('name, taxId, owner, email, phone, and address are required');
        }
        if (categories.length === 0) {
            throw new common_1.BadRequestException('at least one category is required');
        }
        if (services.length === 0) {
            throw new common_1.BadRequestException('at least one service is required');
        }
        if (!idDocumentImage || !licenseDocumentImage || !insuranceDocumentImage) {
            throw new common_1.BadRequestException('id, license, and insurance images are required');
        }
        const serviceCreates = await Promise.all(services.map(async (s) => ({
            name: (s.name || '').trim() || 'Service',
            price: Number(s.price) || 0,
            duration: Number(s.duration) || 30,
            category: (s.category || categories[0] || 'general').toString(),
            imageUrl: await this.storeImage(String(s.imageUrl || ''), 'venues/services'),
        })));
        const existing = await this.prisma.business.findUnique({ where: { email } });
        if (existing)
            throw new common_1.BadRequestException('business already exists for this email');
        await ensureHardcodedPlans(this.prisma);
        const selectedPlan = await this.prisma.subscriptionPlan.findUnique({
            where: { id: inputPlanId },
        });
        const finalPlanId = selectedPlan ? selectedPlan.id : 'basic';
        const finalPlanName = selectedPlan ? selectedPlan.name : 'Basic';
        const merchantNumber = await (0, merchant_number_util_1.allocateMerchantNumber)(this.prisma);
        const created = await this.prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findUnique({ where: { email } });
            if (!existingUser && password) {
                await tx.user.create({
                    data: {
                        email,
                        password: await (0, password_util_1.hashPassword)(password),
                        name: owner,
                        role: client_1.Role.BUSINESS,
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
                        const businessTypeId = typeof registrationDetails === 'object' && registrationDetails
                            ? String(registrationDetails.businessType || '').trim()
                            : '';
                        const migrated = (0, partner_business_types_1.migrateBusinessCategoryKeys)(categories, businessTypeId || undefined);
                        const mapped = businessTypeId
                            ? (0, business_categories_util_1.categoryKeysAndLabelsForPartner)(businessTypeId, migrated)
                            : {
                                categoryKeys: migrated,
                                categoryLabels: (0, business_categories_util_1.displayLabelsForCategoryKeys)(migrated, registrationDetails),
                            };
                        return {
                            categoryKeys: mapped.categoryKeys,
                            categoryLabels: mapped.categoryLabels,
                            categoryLabel: mapped.categoryLabels.length > 0 ? mapped.categoryLabels.join(' · ') : null,
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
                        ? JSON.parse(JSON.stringify(registrationDetails))
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
        void (0, notification_hub_service_1.notifyPlatformAdmins)(this.prisma, {
            type: 'BUSINESS_REGISTRATION',
            title: `New business registration: ${name}`,
            body: `${owner} (${email}) applied for ${name}. Merchant #${created.merchantNumber ?? '—'}. Plan: ${finalPlanName}. Review in Admin → Businesses.`,
            emailSubject: `[Rezervame] New business registration — ${name}`,
        });
        void (0, notification_hub_service_1.notifyBusinessAccount)(this.prisma, created, {
            type: 'BUSINESS_REGISTRATION',
            title: 'Registration received',
            body: 'Thank you for registering. Our team will review your application within 24–48 hours.',
            emailSubject: '[Rezervame] We received your business registration',
        });
        void (0, notification_delivery_service_1.sendEmailWithTemplate)(this.prisma, {
            to: email,
            templateAlias: email_constants_1.POSTMARK_TEMPLATE.WELCOME_BUSINESS,
            templateModel: {
                businessName: name,
                ownerName: owner,
                nextSteps: 'Our team will review your documents within 24–48 hours. You will receive an email when your partner account is approved.',
            },
        }).catch(() => undefined);
        return {
            id: created.id,
            merchantNumber: created.merchantNumber,
            status: created.status,
            services: serviceCreates.length,
        };
    }
    async getAdminJobs(page = '1', limit = '50', search = '', authorization) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const p = Math.max(1, parseInt(page));
        const l = Math.max(1, parseInt(limit));
        const where = {};
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
    async createAdminJob(authorization, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const title = String(body.title || '').trim();
        const location = String(body.location || '').trim();
        const description = String(body.description || '').trim();
        if (title.length < 2)
            throw new common_1.BadRequestException('Title is required');
        if (location.length < 2)
            throw new common_1.BadRequestException('Location is required');
        if (description.length < 5)
            throw new common_1.BadRequestException('Description is required');
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
    async updateAdminJob(authorization, id, body) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        const data = {};
        if (body.title !== undefined)
            data.title = String(body.title).trim();
        if (body.location !== undefined)
            data.location = String(body.location).trim();
        if (body.description !== undefined)
            data.description = String(body.description).trim();
        if (body.applyUrl !== undefined) {
            data.applyUrl = body.applyUrl === null || `${body.applyUrl}`.trim() === ''
                ? null
                : normalizeEventWebsiteUrl(body.applyUrl);
        }
        if (body.sortOrder !== undefined)
            data.sortOrder = Number(body.sortOrder);
        if (body.active !== undefined)
            data.active = Boolean(body.active);
        return this.prisma.jobPosting.update({ where: { id }, data });
    }
    async deleteAdminJob(authorization, id) {
        await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.ADMIN]);
        await this.prisma.jobPosting.delete({ where: { id } });
        return { ok: true, id };
    }
    async getMobileJobs(page = '1', limit = '12') {
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
    async getMobileFavorites(authorization, userLat, userLng, page = '1', limit = '12', search, category) {
        const geo = parseUserGeoQuery(userLat, userLng);
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        const p = Math.max(1, parseInt(page, 10) || 1);
        const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
        const favoriteChipKeys = {
            hair: ['hairService', 'barber'],
            facial: ['spaService', 'beautyService'],
            wax: ['nailCare'],
        };
        const businessWhere = { ...business_listing_util_1.businessDiscoveryWhere };
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
        const itemImageByBusiness = new Map();
        for (const s of itemImages) {
            if (itemImageByBusiness.has(s.businessId))
                continue;
            const img = listImageUrl(s.imageUrl);
            if (img)
                itemImageByBusiness.set(s.businessId, img);
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
        const reviewByBiz = new Map(reviewAgg.map((x) => [
            x.businessId,
            { avg: x._avg.businessRating ?? 0 },
        ]));
        const reviewCountByBiz = new Map(reviewCounts.map((x) => [x.businessId, x._count._all]));
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
    async addMobileFavorite(authorization, body) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        await this.prisma.userFavorite.upsert({
            where: {
                userId_businessId: { userId: user.id, businessId: body.businessId },
            },
            create: { userId: user.id, businessId: body.businessId },
            update: {},
        });
        return { ok: true };
    }
    async removeMobileFavorite(authorization, businessId) {
        const user = await (0, auth_helpers_1.requireUser)(this.prisma, authorization, [client_1.Role.USER]);
        await this.prisma.userFavorite.deleteMany({
            where: { userId: user.id, businessId },
        });
        return { ok: true };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('admin/config'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminConfig", null);
__decorate([
    (0, common_1.Post)('admin/config'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminConfig", null);
__decorate([
    (0, common_1.Post)('admin/publish-site-status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "publishSiteStatus", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('auth/admin-verify-2fa'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "adminVerifyTwoFactor", null);
__decorate([
    (0, common_1.Post)('auth/check-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_email_dto_1.CheckEmailDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "checkEmail", null);
__decorate([
    (0, common_1.Post)('auth/register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_customer_dto_1.RegisterCustomerDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "registerCustomer", null);
__decorate([
    (0, common_1.Post)('auth/forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('auth/verify-reset-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "verifyResetCode", null);
__decorate([
    (0, common_1.Post)('auth/reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "resetPasswordWithCode", null);
__decorate([
    (0, common_1.Post)('auth/google'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('public/security-policy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublicSecurityPolicy", null);
__decorate([
    (0, common_1.Get)('public/push/vapid-public-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getPublicVapidKey", null);
__decorate([
    (0, common_1.Get)('push/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPushStatus", null);
__decorate([
    (0, common_1.Post)('push/subscribe'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "subscribePush", null);
__decorate([
    (0, common_1.Delete)('push/unsubscribe'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('endpoint')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "unsubscribePush", null);
__decorate([
    (0, common_1.Patch)('push/preferences'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updatePushPreferences", null);
__decorate([
    (0, common_1.Post)('push/test'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "testPush", null);
__decorate([
    (0, common_1.Get)('public/site/footer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublicSiteFooter", null);
__decorate([
    (0, common_1.Get)('public/site/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublicSiteStatus", null);
__decorate([
    (0, common_1.Get)('public/site/hero'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublicSiteHero", null);
__decorate([
    (0, common_1.Get)('public/payment-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPaymentConfig", null);
__decorate([
    (0, common_1.Get)('public/customer-service/faqs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublicCustomerServiceFaqs", null);
__decorate([
    (0, common_1.Get)('auth/business-session'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessSession", null);
__decorate([
    (0, common_1.Get)('auth/user-session'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getUserSession", null);
__decorate([
    (0, common_1.Patch)('auth/user-session'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateUserSession", null);
__decorate([
    (0, common_1.Patch)('auth/user-password'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateUserPassword", null);
__decorate([
    (0, common_1.Get)('auth/admin-session'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminSession", null);
__decorate([
    (0, common_1.Get)('admin/dashboard'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminDashboard", null);
__decorate([
    (0, common_1.Get)('admin/broadcasts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminBroadcasts", null);
__decorate([
    (0, common_1.Get)('admin/events'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminEvents", null);
__decorate([
    (0, common_1.Post)('admin/events'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAdminEvent", null);
__decorate([
    (0, common_1.Put)('admin/events/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminEvent", null);
__decorate([
    (0, common_1.Delete)('admin/events/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminEvent", null);
__decorate([
    (0, common_1.Get)('admin/businesses'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminBusinesses", null);
__decorate([
    (0, common_1.Get)('admin/businesses/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminBusinessById", null);
__decorate([
    (0, common_1.Patch)('admin/businesses/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminBusinessStatus", null);
__decorate([
    (0, common_1.Patch)('admin/businesses/:id/documents'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminBusinessDocumentVerification", null);
__decorate([
    (0, common_1.Delete)('admin/businesses/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminBusiness", null);
__decorate([
    (0, common_1.Get)('admin/bookings'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminBookings", null);
__decorate([
    (0, common_1.Delete)('admin/bookings/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminBooking", null);
__decorate([
    (0, common_1.Patch)('admin/bookings/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminBookingStatus", null);
__decorate([
    (0, common_1.Get)('admin/promotions'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminPromotions", null);
__decorate([
    (0, common_1.Post)('admin/promotions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAdminPromotion", null);
__decorate([
    (0, common_1.Delete)('admin/promotions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminPromotion", null);
__decorate([
    (0, common_1.Get)('admin/logs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('severity')),
    __param(4, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminLogs", null);
__decorate([
    (0, common_1.Get)('admin/businesses-services'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminBusinessesServices", null);
__decorate([
    (0, common_1.Get)('admin/users'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminUsers", null);
__decorate([
    (0, common_1.Patch)('admin/users/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "patchAdminUserStatus", null);
__decorate([
    (0, common_1.Post)('admin/users/:id/email'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "emailAdminUser", null);
__decorate([
    (0, common_1.Delete)('admin/users/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminUser", null);
__decorate([
    (0, common_1.Get)('admin/transactions'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminTransactions", null);
__decorate([
    (0, common_1.Delete)('admin/transactions/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminTransaction", null);
__decorate([
    (0, common_1.Get)('admin/wallet'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminWallet", null);
__decorate([
    (0, common_1.Get)('admin/withdrawals'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminWithdrawals", null);
__decorate([
    (0, common_1.Delete)('admin/withdrawals/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminWithdrawal", null);
__decorate([
    (0, common_1.Post)('admin/withdrawals/batch-approve'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "batchApproveAdminWithdrawals", null);
__decorate([
    (0, common_1.Post)('admin/withdrawals/:id/approve'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "approveAdminWithdrawal", null);
__decorate([
    (0, common_1.Post)('admin/withdrawals/:id/reject'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "rejectAdminWithdrawal", null);
__decorate([
    (0, common_1.Get)('admin/alert-feed'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminAlertFeed", null);
__decorate([
    (0, common_1.Patch)('admin/alert-feed/:id/read'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "markAdminAlertRead", null);
__decorate([
    (0, common_1.Patch)('admin/alert-feed/read-all'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "markAllAdminAlertsRead", null);
__decorate([
    (0, common_1.Get)('admin/notifications'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminNotifications", null);
__decorate([
    (0, common_1.Get)('admin/support-tickets'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminSupportTickets", null);
__decorate([
    (0, common_1.Get)('admin/support-tickets/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminSupportTicket", null);
__decorate([
    (0, common_1.Patch)('admin/support-tickets/:id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminSupportTicketStatus", null);
__decorate([
    (0, common_1.Post)('admin/support-tickets/:id/reply'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "replyAdminSupportTicket", null);
__decorate([
    (0, common_1.Post)('admin/support-tickets/batch-resolve'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "batchResolveAdminSupportTickets", null);
__decorate([
    (0, common_1.Post)('admin/email/test'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "testAdminEmail", null);
__decorate([
    (0, common_1.Post)('admin/sms/test'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "testAdminSms", null);
__decorate([
    (0, common_1.Get)('admin/plans'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminPlans", null);
__decorate([
    (0, common_1.Post)('admin/plans'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAdminPlan", null);
__decorate([
    (0, common_1.Patch)('admin/plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminPlan", null);
__decorate([
    (0, common_1.Delete)('admin/plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminPlan", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('notifications/:id/read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "markNotificationRead", null);
__decorate([
    (0, common_1.Patch)('notifications/read-all'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "markAllNotificationsRead", null);
__decorate([
    (0, common_1.Delete)('admin/notifications/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminNotification", null);
__decorate([
    (0, common_1.Get)('admin/customer-service/faqs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminCustomerServiceFaqs", null);
__decorate([
    (0, common_1.Post)('admin/customer-service/faqs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAdminCustomerServiceFaq", null);
__decorate([
    (0, common_1.Patch)('admin/customer-service/faqs/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminCustomerServiceFaq", null);
__decorate([
    (0, common_1.Delete)('admin/customer-service/faqs/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminCustomerServiceFaq", null);
__decorate([
    (0, common_1.Get)('admin/categories'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminCategories", null);
__decorate([
    (0, common_1.Post)('admin/categories'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAdminCategory", null);
__decorate([
    (0, common_1.Delete)('admin/categories/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminCategory", null);
__decorate([
    (0, common_1.Patch)('admin/categories/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminCategory", null);
__decorate([
    (0, common_1.Get)('admin/amenities'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminAmenities", null);
__decorate([
    (0, common_1.Post)('admin/amenities'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAdminAmenity", null);
__decorate([
    (0, common_1.Delete)('admin/amenities/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminAmenity", null);
__decorate([
    (0, common_1.Patch)('admin/amenities/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminAmenity", null);
__decorate([
    (0, common_1.Post)('admin/broadcast'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "broadcast", null);
__decorate([
    (0, common_1.Get)('business/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Query)('userLat')),
    __param(3, (0, common_1.Query)('userLng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusiness", null);
__decorate([
    (0, common_1.Get)('business/by-email/:email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessByEmail", null);
__decorate([
    (0, common_1.Patch)('business/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_business_panel_dto_1.UpdateBusinessPanelDto, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateBusiness", null);
__decorate([
    (0, common_1.Patch)('business/:id/listing-visibility'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateBusinessListingVisibility", null);
__decorate([
    (0, common_1.Post)('business/:id/upgrade'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "upgradeBusinessPlan", null);
__decorate([
    (0, common_1.Get)('business/:id/services'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('category')),
    __param(5, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessServices", null);
__decorate([
    (0, common_1.Post)('business/:id/services'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_service_dto_1.CreateServiceDto, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createBusinessService", null);
__decorate([
    (0, common_1.Patch)('services/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_dto_1.UpdateServiceDto, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)('services/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteService", null);
__decorate([
    (0, common_1.Get)('business/:id/bestsellers'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessBestsellers", null);
__decorate([
    (0, common_1.Get)('business/:id/promotions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessPromotions", null);
__decorate([
    (0, common_1.Post)('business/:id/promotions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createPromotion", null);
__decorate([
    (0, common_1.Patch)('business/:id/promotions/:promoId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('promoId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updatePromotion", null);
__decorate([
    (0, common_1.Delete)('promotions/:promoId'),
    __param(0, (0, common_1.Param)('promoId')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deletePromotion", null);
__decorate([
    (0, common_1.Get)('business/:id/staff'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('role')),
    __param(5, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessStaff", null);
__decorate([
    (0, common_1.Post)('business/:id/staff'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_staff_dto_1.CreateStaffDto, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createStaff", null);
__decorate([
    (0, common_1.Patch)('staff/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_staff_dto_1.UpdateStaffDto, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateStaff", null);
__decorate([
    (0, common_1.Delete)('staff/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteStaff", null);
__decorate([
    (0, common_1.Get)('business/:id/bookings'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('staffId')),
    __param(5, (0, common_1.Query)('search')),
    __param(6, (0, common_1.Query)('startDate')),
    __param(7, (0, common_1.Query)('endDate')),
    __param(8, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessBookings", null);
__decorate([
    (0, common_1.Post)('business/:id/bookings'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_booking_dto_1.CreateBookingDto, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Post)('business/:id/pay-group'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "payBusinessBookingGroup", null);
__decorate([
    (0, common_1.Patch)('business/:id/bookings/:bookingId/propose-reschedule'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "proposeReschedule", null);
__decorate([
    (0, common_1.Patch)('bookings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_booking_dto_1.UpdateBookingDto, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateBooking", null);
__decorate([
    (0, common_1.Get)('business/:id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessReviews", null);
__decorate([
    (0, common_1.Post)('mobile/reviews'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createMobileReview", null);
__decorate([
    (0, common_1.Post)('mobile/reviews/group'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createMobileReviewGroup", null);
__decorate([
    (0, common_1.Patch)('reviews/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateReview", null);
__decorate([
    (0, common_1.Delete)('reviews/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteReview", null);
__decorate([
    (0, common_1.Get)('business/:id/transactions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('type')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessTransactions", null);
__decorate([
    (0, common_1.Post)('business/:id/transactions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('business/:id/withdrawals'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessWithdrawals", null);
__decorate([
    (0, common_1.Post)('business/:id/withdrawals'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createBusinessWithdrawal", null);
__decorate([
    (0, common_1.Post)('business/:id/support-request'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createBusinessSupportRequest", null);
__decorate([
    (0, common_1.Get)('business/:id/support/tickets'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessSupportTickets", null);
__decorate([
    (0, common_1.Post)('business/:id/support/tickets'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createBusinessSupportTicket", null);
__decorate([
    (0, common_1.Get)('business/:id/support/tickets/:ticketId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('ticketId')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getBusinessSupportTicket", null);
__decorate([
    (0, common_1.Post)('business/:id/support/tickets/:ticketId/reply'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('ticketId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "replyBusinessSupportTicket", null);
__decorate([
    (0, common_1.Get)('support/tickets'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getUserSupportTickets", null);
__decorate([
    (0, common_1.Post)('support/tickets'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createUserSupportTicket", null);
__decorate([
    (0, common_1.Get)('support/tickets/:ticketId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('ticketId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getUserSupportTicket", null);
__decorate([
    (0, common_1.Post)('support/tickets/:ticketId/reply'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('ticketId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "replyUserSupportTicket", null);
__decorate([
    (0, common_1.Get)('business/:id/machines'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMachines", null);
__decorate([
    (0, common_1.Post)('business/:id/machines'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createMachine", null);
__decorate([
    (0, common_1.Get)('business/:id/parts'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getParts", null);
__decorate([
    (0, common_1.Post)('business/:id/parts'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createPart", null);
__decorate([
    (0, common_1.Get)('business/:id/qa-inspections'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getQaInspections", null);
__decorate([
    (0, common_1.Post)('business/:id/qa-inspections'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createQaInspection", null);
__decorate([
    (0, common_1.Get)('business/:id/ncrs'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getNcrs", null);
__decorate([
    (0, common_1.Post)('business/:id/ncrs'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createNcr", null);
__decorate([
    (0, common_1.Get)('business/:id/orders'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Post)('business/:id/orders'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('mobile/bookings/:id/group'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMobileBookingGroup", null);
__decorate([
    (0, common_1.Get)('mobile/bookings'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMobileBookings", null);
__decorate([
    (0, common_1.Get)('mobile/family-members'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "listFamilyMembers", null);
__decorate([
    (0, common_1.Get)('mobile/staff/:id/busy-slots'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getStaffBusySlots", null);
__decorate([
    (0, common_1.Post)('mobile/family-members'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, family_member_dto_1.CreateFamilyMemberDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createFamilyMember", null);
__decorate([
    (0, common_1.Patch)('mobile/family-members/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, family_member_dto_1.UpdateFamilyMemberDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateFamilyMember", null);
__decorate([
    (0, common_1.Delete)('mobile/family-members/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteFamilyMember", null);
__decorate([
    (0, common_1.Patch)('mobile/bookings/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "cancelMobileBooking", null);
__decorate([
    (0, common_1.Post)('mobile/bookings/cancel-group'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "cancelMobileBookingGroup", null);
__decorate([
    (0, common_1.Post)('mobile/bookings/:id/pay'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "payMobileBooking", null);
__decorate([
    (0, common_1.Post)('mobile/bookings/pay-group'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "payMobileBookingGroup", null);
__decorate([
    (0, common_1.Post)('mobile/bookings/pay-group/stripe-checkout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "payMobileBookingGroupStripe", null);
__decorate([
    (0, common_1.Post)('mobile/bookings/:id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "completeUserBooking", null);
__decorate([
    (0, common_1.Post)('mobile/bookings/:id/accept-reschedule'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "acceptReschedule", null);
__decorate([
    (0, common_1.Post)('mobile/bookings'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createMobileBooking", null);
__decorate([
    (0, common_1.Get)('mobile/invoices'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMobileInvoices", null);
__decorate([
    (0, common_1.Get)('mobile/venues'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('minRating')),
    __param(5, (0, common_1.Query)('sortBy')),
    __param(6, (0, common_1.Query)('userLat')),
    __param(7, (0, common_1.Query)('userLng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMobileVenues", null);
__decorate([
    (0, common_1.Get)('mobile/notifications'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMobileNotifications", null);
__decorate([
    (0, common_1.Get)('mobile/events'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMobileEvents", null);
__decorate([
    (0, common_1.Get)('public/plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublicPlans", null);
__decorate([
    (0, common_1.Get)('public/categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublicCategories", null);
__decorate([
    (0, common_1.Get)('public/amenities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPublicAmenities", null);
__decorate([
    (0, common_1.Post)('public/business-join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createPublicBusinessJoin", null);
__decorate([
    (0, common_1.Get)('admin/jobs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminJobs", null);
__decorate([
    (0, common_1.Post)('admin/jobs'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createAdminJob", null);
__decorate([
    (0, common_1.Patch)('admin/jobs/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateAdminJob", null);
__decorate([
    (0, common_1.Delete)('admin/jobs/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAdminJob", null);
__decorate([
    (0, common_1.Get)('mobile/jobs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMobileJobs", null);
__decorate([
    (0, common_1.Get)('mobile/favorites'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('userLat')),
    __param(2, (0, common_1.Query)('userLng')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('search')),
    __param(6, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMobileFavorites", null);
__decorate([
    (0, common_1.Post)('mobile/favorites'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "addMobileFavorite", null);
__decorate([
    (0, common_1.Delete)('mobile/favorites/:businessId'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "removeMobileFavorite", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        s3_storage_service_1.S3StorageService])
], AppController);
//# sourceMappingURL=app.controller.js.map