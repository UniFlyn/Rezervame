"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPostmarkError = formatPostmarkError;
exports.isValidEmailAddress = isValidEmailAddress;
function formatPostmarkError(err) {
    const raw = err instanceof Error ? err.message : String(err);
    try {
        const parsed = JSON.parse(raw);
        if (parsed.Message) {
            if (parsed.ErrorCode === 401) {
                return 'Invalid Postmark Server API token. Check Settings → Email or POSTMARK_API_KEY on the API server.';
            }
            if (parsed.ErrorCode === 406) {
                return `${parsed.Message} Remove the address from Postmark Suppressions or use a different inbox.`;
            }
            if (parsed.ErrorCode === 422) {
                return `${parsed.Message} Confirm the sender address is verified in Postmark (Sender Signatures).`;
            }
            return parsed.Message;
        }
    }
    catch {
    }
    if (/inactive/i.test(raw)) {
        return 'Recipient is on Postmark’s suppression list (hard bounce or spam complaint). Try another email or remove it in Postmark → Suppressions.';
    }
    if (/invalid.*api.*token/i.test(raw)) {
        return 'Invalid Postmark Server API token.';
    }
    return raw.slice(0, 500);
}
function isValidEmailAddress(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
//# sourceMappingURL=postmark-errors.util.js.map