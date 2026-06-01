"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPasswordHash = isPasswordHash;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.maybeUpgradePasswordHash = maybeUpgradePasswordHash;
const bcrypt = __importStar(require("bcrypt"));
const BCRYPT_ROUNDS = 12;
function isPasswordHash(stored) {
    return stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
}
async function hashPassword(plain) {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
}
async function verifyPassword(plain, stored) {
    if (!stored)
        return false;
    if (isPasswordHash(stored)) {
        return bcrypt.compare(plain, stored);
    }
    return plain === stored;
}
async function maybeUpgradePasswordHash(plain, stored) {
    if (isPasswordHash(stored))
        return null;
    if (plain !== stored)
        return null;
    return hashPassword(plain);
}
//# sourceMappingURL=password.util.js.map