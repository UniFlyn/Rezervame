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
exports.signSessionToken = signSessionToken;
exports.verifySessionToken = verifySessionToken;
exports.userIdFromLegacyToken = userIdFromLegacyToken;
const jwt = __importStar(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'rezervame-dev-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
function signSessionToken(payload, sessionTimeoutMinutes) {
    const envOverride = process.env.JWT_EXPIRES_IN?.trim();
    let expiresIn;
    if (envOverride) {
        expiresIn = envOverride;
    }
    else if (sessionTimeoutMinutes != null &&
        Number.isFinite(sessionTimeoutMinutes) &&
        sessionTimeoutMinutes > 0) {
        expiresIn = `${Math.round(sessionTimeoutMinutes)}m`;
    }
    else {
        expiresIn = JWT_EXPIRES_IN;
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
function verifySessionToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded?.sub)
            return null;
        return decoded;
    }
    catch {
        return null;
    }
}
function userIdFromLegacyToken(token) {
    if (!token.startsWith('token-'))
        return null;
    const id = token.slice('token-'.length).trim();
    return id.length > 0 ? id : null;
}
//# sourceMappingURL=session.util.js.map