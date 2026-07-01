export type PlatformEmailTemplate = 'password-reset' | 'admin-sign-in-code' | 'welcome-client' | 'welcome-business' | 'booking-confirmation' | 'booking-request-sent' | 'booking-cancelled-client' | 'booking-cancelled-business' | 'booking-reminder-24h' | 'booking-reminder-1h' | 'payment-receipt' | 'payment-received-business' | 'account-suspended' | 'account-reactivated' | 'support-ticket-update' | 'generic-notification' | 'admin-test' | 'business-approved' | 'business-rejected' | 'business-suspended' | 'admin-user-message';
export type RenderedPlatformEmail = {
    subject: string;
    html: string;
    text: string;
    postmarkAlias: string;
};
export declare function renderPlatformEmail(template: PlatformEmailTemplate, model: Record<string, unknown>): RenderedPlatformEmail;
