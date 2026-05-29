/** Postmark template aliases — create matching templates in the Postmark dashboard. */
export const POSTMARK_TEMPLATE = {
  BOOKING_CONFIRMATION: 'booking-confirmation',
  BOOKING_REMINDER_24H: 'booking-reminder-24h',
  BOOKING_REMINDER_1H: 'booking-reminder-1h',
  BOOKING_CANCELLED_BY_CLIENT: 'booking-cancelled-by-client',
  BOOKING_CANCELLED_BY_BUSINESS: 'booking-cancelled-by-business',
  BOOKING_MODIFIED: 'booking-modified',
  BOOKING_NOSHOW: 'booking-noshow',
  PAYMENT_RECEIPT: 'payment-receipt',
  PAYMENT_REFUND: 'payment-refund',
  WELCOME_CLIENT: 'welcome-client',
  WELCOME_BUSINESS: 'welcome-business',
  PASSWORD_RESET: 'password-reset',
  EMAIL_VERIFICATION: 'email-verification',
  BUSINESS_APPROVED: 'business-approved',
  BUSINESS_REJECTED: 'business-rejected',
  REVIEW_REQUEST: 'review-request',
} as const;

export type PostmarkTemplateAlias = (typeof POSTMARK_TEMPLATE)[keyof typeof POSTMARK_TEMPLATE];

export const POSTMARK_FROM = {
  NOREPLY: 'noreply@rezervame.com',
  SUPPORT: 'soporte@rezervame.com',
  NOTIFICATIONS: 'notificaciones@rezervame.com',
} as const;
