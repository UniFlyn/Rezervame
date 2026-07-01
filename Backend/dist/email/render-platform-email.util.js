"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPlatformEmail = renderPlatformEmail;
const email_constants_1 = require("./email.constants");
const email_layout_util_1 = require("./email-layout.util");
function str(model, key, fallback = '') {
    const v = model[key];
    return v == null ? fallback : String(v).trim();
}
function genericNotification(model) {
    const title = str(model, 'title', 'Notification');
    const body = str(model, 'body', '');
    const recipientName = str(model, 'recipientName', str(model, 'userName', 'there'));
    const subject = str(model, 'subject', `[Rezervame] ${title}`);
    const html = (0, email_layout_util_1.wrapEmailLayout)({
        headline: title,
        intro: `Hi ${recipientName},`,
        bodyHtml: (0, email_layout_util_1.emailParagraph)(body),
        cta: model.ctaUrl
            ? { label: str(model, 'ctaLabel', 'View details'), url: str(model, 'ctaUrl') }
            : undefined,
    });
    return {
        subject,
        html,
        text: `Hi ${recipientName}, ${body}`,
        postmarkAlias: 'generic-notification',
    };
}
const RENDERERS = {
    'password-reset': (model) => {
        const userName = str(model, 'userName', 'there');
        const code = str(model, 'verificationCode', str(model, 'resetCode'));
        const expiresIn = str(model, 'expiresIn', '15 minutes');
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            preheader: `Your Rezervame verification code is ${code}`,
            headline: 'Reset your password',
            intro: `Hi ${userName}, use this code to reset your Rezervame password.`,
            bodyHtml: `${(0, email_layout_util_1.emailCodeBox)(code, 'Verification code')}${(0, email_layout_util_1.emailMuted)(`This code expires in ${expiresIn}. If you did not request this, you can ignore this email.`)}`,
        });
        return {
            subject: 'Your Rezervame verification code',
            html,
            text: `Hi ${userName}, your Rezervame verification code is ${code}. It expires in ${expiresIn}.`,
            postmarkAlias: email_constants_1.POSTMARK_TEMPLATE.PASSWORD_RESET,
        };
    },
    'admin-sign-in-code': (model) => {
        const code = str(model, 'code');
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            preheader: `Admin sign-in code ${code}`,
            headline: 'Admin sign-in verification',
            intro: 'Use this code to finish signing in to Rezervame Admin.',
            bodyHtml: `${(0, email_layout_util_1.emailCodeBox)(code, 'Sign-in code')}${(0, email_layout_util_1.emailMuted)('This code expires in 15 minutes.')}`,
        });
        return {
            subject: '[Rezervame Admin] Sign-in verification code',
            html,
            text: `Your admin sign-in code is ${code}. It expires in 15 minutes.`,
            postmarkAlias: 'admin-sign-in-code',
        };
    },
    'welcome-client': (model) => {
        const userName = str(model, 'customerName', str(model, 'userName', 'there'));
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: 'Welcome to Rezervame',
            intro: `Hi ${userName}, your account is ready.`,
            bodyHtml: `${(0, email_layout_util_1.emailParagraph)('Discover salons, spas, and wellness venues near you. Book appointments in a few taps and manage everything from your profile.')}${emailCtaWrap(model)}`,
        });
        return {
            subject: 'Welcome to Rezervame',
            html,
            text: `Hi ${userName}, welcome to Rezervame. Book your next appointment today.`,
            postmarkAlias: email_constants_1.POSTMARK_TEMPLATE.WELCOME_CLIENT,
        };
    },
    'welcome-business': (model) => {
        const businessName = str(model, 'businessName');
        const ownerName = str(model, 'ownerName', 'there');
        const nextSteps = str(model, 'nextSteps', 'Our team will review your application within 24–48 hours.');
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: 'Registration received',
            intro: `Hi ${ownerName}, thanks for registering ${businessName} on Rezervame.`,
            bodyHtml: (0, email_layout_util_1.emailParagraph)(nextSteps),
        });
        return {
            subject: '[Rezervame] We received your business registration',
            html,
            text: `Hi ${ownerName}, we received your registration for ${businessName}. ${nextSteps}`,
            postmarkAlias: email_constants_1.POSTMARK_TEMPLATE.WELCOME_BUSINESS,
        };
    },
    'booking-confirmation': (model) => bookingEmail(model, true),
    'booking-request-sent': (model) => bookingEmail(model, false),
    'booking-cancelled-client': (model) => {
        const userName = str(model, 'customerName', str(model, 'userName', 'there'));
        const businessName = str(model, 'businessName');
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: 'Booking cancelled',
            intro: `Hi ${userName}, your cancellation was processed.`,
            bodyHtml: (0, email_layout_util_1.emailParagraph)(`Your appointment at ${businessName} has been cancelled.`),
        });
        return {
            subject: '[Rezervame] Your booking was cancelled',
            html,
            text: `Hi ${userName}, your booking at ${businessName} was cancelled.`,
            postmarkAlias: email_constants_1.POSTMARK_TEMPLATE.BOOKING_CANCELLED_BY_BUSINESS,
        };
    },
    'booking-cancelled-business': (model) => {
        const businessName = str(model, 'businessName');
        const count = str(model, 'count', '1');
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: 'Customer cancellation',
            bodyHtml: (0, email_layout_util_1.emailParagraph)(`A customer cancelled ${count} booking(s) at ${businessName}.`),
        });
        return {
            subject: '[Rezervame] Booking cancelled',
            html,
            text: `A customer cancelled booking(s) at ${businessName}.`,
            postmarkAlias: email_constants_1.POSTMARK_TEMPLATE.BOOKING_CANCELLED_BY_CLIENT,
        };
    },
    'booking-reminder-24h': (model) => reminderEmail(model, '24 hours'),
    'booking-reminder-1h': (model) => reminderEmail(model, '1 hour'),
    'payment-receipt': (model) => {
        const userName = str(model, 'customerName', str(model, 'userName', 'there'));
        const amount = str(model, 'amount');
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: 'Payment confirmed',
            intro: `Hi ${userName}, we received your payment.`,
            bodyHtml: `${(0, email_layout_util_1.emailDetailsTable)([
                { label: 'Amount', value: amount },
                { label: 'Method', value: str(model, 'paymentMethod') },
                { label: 'Booking', value: str(model, 'bookingCode') },
            ])}${(0, email_layout_util_1.emailParagraph)('Thank you for booking with Rezervame.')}`,
        });
        return {
            subject: '[Rezervame] Payment confirmed',
            html,
            text: `Hi ${userName}, your payment of ${amount} was successful.`,
            postmarkAlias: email_constants_1.POSTMARK_TEMPLATE.PAYMENT_RECEIPT,
        };
    },
    'payment-received-business': (model) => {
        const businessName = str(model, 'businessName');
        const amount = str(model, 'amount');
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: 'Payment received',
            bodyHtml: (0, email_layout_util_1.emailParagraph)(`A customer paid ${amount} for booking(s) at ${businessName}.`),
        });
        return {
            subject: `[Rezervame] Payment received — ${amount}`,
            html,
            text: `Payment of ${amount} received at ${businessName}.`,
            postmarkAlias: email_constants_1.POSTMARK_TEMPLATE.PAYMENT_RECEIPT,
        };
    },
    'account-suspended': (model) => accountStatusEmail(model, 'suspended'),
    'account-reactivated': (model) => accountStatusEmail(model, 'reactivated'),
    'support-ticket-update': (model) => {
        const ticketRef = str(model, 'ticketRef');
        const status = str(model, 'status');
        const message = str(model, 'message', `Your ticket ${ticketRef} was updated.`);
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: `Ticket ${ticketRef}`,
            bodyHtml: `${(0, email_layout_util_1.emailParagraph)(message)}${(0, email_layout_util_1.emailDetailsTable)([{ label: 'Status', value: status }])}`,
        });
        return {
            subject: `[Rezervame] Ticket ${ticketRef} — ${status}`,
            html,
            text: message,
            postmarkAlias: 'support-ticket-update',
        };
    },
    'generic-notification': genericNotification,
    'admin-test': (model) => {
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: 'Test email successful',
            bodyHtml: (0, email_layout_util_1.emailParagraph)('This is a test message from Rezervame Admin. If you received this, outbound email is working.'),
        });
        return {
            subject: '[Rezervame] Test email',
            html,
            text: 'This is a test message from Rezervame Admin. Outbound email is working.',
            postmarkAlias: 'admin-test',
        };
    },
    'business-approved': (model) => businessStatusEmail(model, 'approved', 'Business approved', email_constants_1.POSTMARK_TEMPLATE.BUSINESS_APPROVED),
    'business-rejected': (model) => businessStatusEmail(model, 'rejected', 'Application update', email_constants_1.POSTMARK_TEMPLATE.BUSINESS_REJECTED),
    'business-suspended': (model) => businessStatusEmail(model, 'suspended', 'Account suspended', 'business-suspended'),
    'admin-user-message': (model) => {
        const subject = str(model, 'subject', 'Message from Rezervame');
        const message = str(model, 'message');
        const userName = str(model, 'userName', 'there');
        const html = (0, email_layout_util_1.wrapEmailLayout)({
            headline: subject.replace(/^\[Rezervame\]\s*/i, ''),
            intro: `Hi ${userName},`,
            bodyHtml: `<div style="font-size:15px;line-height:1.65;color:#334155;">${message.replace(/\n/g, '<br/>')}</div>`,
        });
        return {
            subject: subject.startsWith('[') ? subject : `[Rezervame] ${subject}`,
            html,
            text: (0, email_layout_util_1.stripHtml)(message),
            postmarkAlias: 'generic-notification',
        };
    },
};
function emailCtaWrap(model) {
    const url = str(model, 'ctaUrl', str(model, 'dashboardLink', 'https://rezervame-web.web.app'));
    if (!url)
        return '';
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 8px;"><tr><td style="border-radius:12px;background:#ff5a5f;"><a href="${url}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Book now</a></td></tr></table>`;
}
function bookingEmail(model, confirmed) {
    const userName = str(model, 'customerName', str(model, 'userName', 'there'));
    const businessName = str(model, 'businessName');
    const serviceName = str(model, 'serviceName');
    const date = str(model, 'date');
    const time = str(model, 'time');
    const address = str(model, 'address');
    const paymentMethod = str(model, 'paymentMethod');
    const headline = confirmed ? 'Booking confirmed' : 'Request submitted';
    const intro = confirmed
        ? `Hi ${userName}, your appointment at ${businessName} is confirmed.`
        : `Hi ${userName}, your appointment request at ${businessName} was submitted and is pending approval.`;
    const html = (0, email_layout_util_1.wrapEmailLayout)({
        headline,
        intro,
        bodyHtml: `${(0, email_layout_util_1.emailDetailsTable)([
            { label: 'Venue', value: businessName },
            { label: 'Service', value: serviceName },
            { label: 'Date', value: date },
            { label: 'Time', value: time },
            { label: 'Address', value: address },
            { label: 'Payment', value: paymentMethod },
            { label: 'Reference', value: str(model, 'bookingCode') },
        ])}${confirmed ? (0, email_layout_util_1.emailParagraph)('You can complete payment from your reservations when ready.') : (0, email_layout_util_1.emailMuted)('We will notify you when the venue approves your request.')}`,
        cta: { label: 'View reservations', url: 'https://rezervame-web.web.app/profile?tab=bookings' },
    });
    return {
        subject: confirmed ? '[Rezervame] Booking confirmed' : '[Rezervame] Booking request sent',
        html,
        text: `${intro} ${serviceName} on ${date} at ${time}.`,
        postmarkAlias: confirmed
            ? email_constants_1.POSTMARK_TEMPLATE.BOOKING_CONFIRMATION
            : 'booking-request-sent',
    };
}
function reminderEmail(model, windowLabel) {
    const userName = str(model, 'customerName', str(model, 'userName', 'there'));
    const html = (0, email_layout_util_1.wrapEmailLayout)({
        headline: `Reminder — ${windowLabel} to go`,
        intro: `Hi ${userName}, this is a friendly reminder about your upcoming appointment.`,
        bodyHtml: (0, email_layout_util_1.emailDetailsTable)([
            { label: 'Venue', value: str(model, 'businessName') },
            { label: 'Service', value: str(model, 'serviceName') },
            { label: 'Date', value: str(model, 'date') },
            { label: 'Time', value: str(model, 'time') },
            { label: 'Address', value: str(model, 'address') },
            { label: 'Reference', value: str(model, 'bookingCode') },
        ]),
    });
    const alias = windowLabel === '1 hour'
        ? email_constants_1.POSTMARK_TEMPLATE.BOOKING_REMINDER_1H
        : email_constants_1.POSTMARK_TEMPLATE.BOOKING_REMINDER_24H;
    return {
        subject: `[Rezervame] Appointment reminder (${windowLabel})`,
        html,
        text: `Reminder: appointment at ${str(model, 'businessName')} on ${str(model, 'date')} ${str(model, 'time')}.`,
        postmarkAlias: alias,
    };
}
function accountStatusEmail(model, kind) {
    const userName = str(model, 'userName', 'there');
    const suspended = kind === 'suspended';
    const html = (0, email_layout_util_1.wrapEmailLayout)({
        headline: suspended ? 'Account suspended' : 'Account reactivated',
        intro: `Hi ${userName},`,
        bodyHtml: (0, email_layout_util_1.emailParagraph)(suspended
            ? 'Your Rezervame customer account has been suspended. Contact support if you believe this is a mistake.'
            : 'Your Rezervame customer account is active again. You can sign in and book appointments.'),
    });
    return {
        subject: suspended ? '[Rezervame] Account suspended' : '[Rezervame] Account reactivated',
        html,
        text: suspended
            ? `Hi ${userName}, your Rezervame account has been suspended.`
            : `Hi ${userName}, your Rezervame account is active again.`,
        postmarkAlias: suspended ? 'account-suspended' : 'account-reactivated',
    };
}
function businessStatusEmail(model, _kind, headline, postmarkAlias) {
    const ownerName = str(model, 'ownerName', str(model, 'recipientName', 'there'));
    const businessName = str(model, 'businessName');
    const body = str(model, 'body');
    const html = (0, email_layout_util_1.wrapEmailLayout)({
        headline,
        intro: `Hi ${ownerName},`,
        bodyHtml: `${(0, email_layout_util_1.emailParagraph)(body)}${emailCtaWrap({ dashboardLink: 'https://rezervame-web.web.app/business/login' })}`,
    });
    return {
        subject: str(model, 'subject', `[Rezervame] ${headline}`),
        html,
        text: `Hi ${ownerName}, ${body}`,
        postmarkAlias,
    };
}
function renderPlatformEmail(template, model) {
    const render = RENDERERS[template] ?? RENDERERS['generic-notification'];
    return render(model);
}
//# sourceMappingURL=render-platform-email.util.js.map