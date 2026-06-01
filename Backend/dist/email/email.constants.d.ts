export declare const POSTMARK_TEMPLATE: {
    readonly BOOKING_CONFIRMATION: "booking-confirmation";
    readonly BOOKING_REMINDER_24H: "booking-reminder-24h";
    readonly BOOKING_REMINDER_1H: "booking-reminder-1h";
    readonly BOOKING_CANCELLED_BY_CLIENT: "booking-cancelled-by-client";
    readonly BOOKING_CANCELLED_BY_BUSINESS: "booking-cancelled-by-business";
    readonly BOOKING_MODIFIED: "booking-modified";
    readonly BOOKING_NOSHOW: "booking-noshow";
    readonly PAYMENT_RECEIPT: "payment-receipt";
    readonly PAYMENT_REFUND: "payment-refund";
    readonly WELCOME_CLIENT: "welcome-client";
    readonly WELCOME_BUSINESS: "welcome-business";
    readonly PASSWORD_RESET: "password-reset";
    readonly EMAIL_VERIFICATION: "email-verification";
    readonly BUSINESS_APPROVED: "business-approved";
    readonly BUSINESS_REJECTED: "business-rejected";
    readonly REVIEW_REQUEST: "review-request";
};
export type PostmarkTemplateAlias = (typeof POSTMARK_TEMPLATE)[keyof typeof POSTMARK_TEMPLATE];
export declare const POSTMARK_FROM: {
    readonly NOREPLY: "noreply@rezervame.com";
    readonly SUPPORT: "soporte@rezervame.com";
    readonly NOTIFICATIONS: "notificaciones@rezervame.com";
};
