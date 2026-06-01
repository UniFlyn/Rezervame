"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePublicImageUrl = normalizePublicImageUrl;
const s3_assets_json_1 = __importDefault(require("../config/s3-assets.json"));
const LEGACY_S3_HOSTS = [
    'rezervame-assets-yourname.s3.ap-southeast-2.amazonaws.com',
    'rezervame-assets-yourname.s3.amazonaws.com',
];
function normalizePublicImageUrl(url) {
    if (url == null || typeof url !== 'string')
        return null;
    let s = url.trim();
    if (!s)
        return null;
    const publicBase = s3_assets_json_1.default.publicBaseUrl.replace(/\/+$/, '');
    let correctHost;
    try {
        correctHost = new URL(publicBase).host;
    }
    catch {
        correctHost = `${s3_assets_json_1.default.bucket}.s3.ap-southeast-2.amazonaws.com`;
    }
    for (const legacy of LEGACY_S3_HOSTS) {
        if (s.includes(legacy)) {
            s = s.split(legacy).join(correctHost);
        }
    }
    if (s.includes('rezervame-assets-yourname')) {
        s = s.replace(/rezervame-assets-yourname/g, s3_assets_json_1.default.bucket);
    }
    return s;
}
//# sourceMappingURL=normalize-image-url.js.map