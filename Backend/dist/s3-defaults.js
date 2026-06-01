"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CATEGORY_IMAGE_BY_KEY = exports.S3_BUCKET = exports.S3_PUBLIC_BASE_URL = void 0;
exports.defaultCategoryImageUrl = defaultCategoryImageUrl;
exports.isS3PublicUrl = isS3PublicUrl;
const s3_assets_json_1 = __importDefault(require("./config/s3-assets.json"));
exports.S3_PUBLIC_BASE_URL = s3_assets_json_1.default.publicBaseUrl;
exports.S3_BUCKET = s3_assets_json_1.default.bucket;
exports.DEFAULT_CATEGORY_IMAGE_BY_KEY = {
    ...s3_assets_json_1.default.defaultCategories,
};
function defaultCategoryImageUrl(key) {
    const k = (key || '').trim();
    return exports.DEFAULT_CATEGORY_IMAGE_BY_KEY[k] ?? exports.DEFAULT_CATEGORY_IMAGE_BY_KEY[k.toLowerCase()] ?? null;
}
function isS3PublicUrl(url) {
    if (!url?.trim())
        return false;
    return url.trim().startsWith(exports.S3_PUBLIC_BASE_URL) || url.includes(`${exports.S3_BUCKET}.s3.`);
}
//# sourceMappingURL=s3-defaults.js.map