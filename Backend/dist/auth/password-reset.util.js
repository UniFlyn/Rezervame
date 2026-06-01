"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = exports.PASSWORD_RESET_DEV_BYPASS = void 0;
exports.isPasswordResetBypassCode = isPasswordResetBypassCode;
exports.generateResetCode = generateResetCode;
exports.hashResetCode = hashResetCode;
exports.resetCodeExpiresAt = resetCodeExpiresAt;
const crypto_1 = require("crypto");
const password_util_1 = require("./password.util");
Object.defineProperty(exports, "hashPassword", { enumerable: true, get: function () { return password_util_1.hashPassword; } });
const CODE_TTL_MS = 15 * 60 * 1000;
exports.PASSWORD_RESET_DEV_BYPASS = '112233';
function isPasswordResetBypassCode(code) {
    return code.trim() === exports.PASSWORD_RESET_DEV_BYPASS;
}
function generateResetCode() {
    return String((0, crypto_1.randomInt)(100000, 1000000));
}
function hashResetCode(code) {
    return (0, crypto_1.createHash)('sha256').update(code.trim()).digest('hex');
}
function resetCodeExpiresAt(from = new Date()) {
    return new Date(from.getTime() + CODE_TTL_MS);
}
//# sourceMappingURL=password-reset.util.js.map