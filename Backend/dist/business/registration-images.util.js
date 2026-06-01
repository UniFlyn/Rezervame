"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistRegistrationDetailsImages = persistRegistrationDetailsImages;
exports.mergeRegistrationDetails = mergeRegistrationDetails;
function asRecord(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json))
        return null;
    return json;
}
async function persistOne(s3, value, folder) {
    if (typeof value !== 'string' || !value.trim())
        return null;
    return s3.persistImageUrl(value.trim(), folder);
}
async function persistList(s3, values, folder) {
    if (!Array.isArray(values))
        return [];
    const out = [];
    for (const raw of values.slice(0, 16)) {
        const url = await persistOne(s3, raw, folder);
        if (url)
            out.push(url);
    }
    return out;
}
async function persistRegistrationDetailsImages(registrationDetails, s3) {
    const out = { ...registrationDetails };
    const exterior = await persistOne(s3, out.exteriorPhotoUrl, 'venues/gallery');
    if (exterior)
        out.exteriorPhotoUrl = exterior;
    const bankProof = await persistOne(s3, out.bankProofUrl, 'documents/bank');
    if (bankProof)
        out.bankProofUrl = bankProof;
    const interior = await persistList(s3, out.interiorPhotoUrls, 'venues/gallery');
    if (interior.length)
        out.interiorPhotoUrls = interior;
    const portfolio = await persistList(s3, out.portfolioPhotoUrls, 'venues/gallery');
    if (portfolio.length)
        out.portfolioPhotoUrls = portfolio;
    return out;
}
function mergeRegistrationDetails(prev, patch) {
    const base = asRecord(prev) ?? {};
    if (!patch)
        return { ...base };
    return { ...base, ...patch };
}
//# sourceMappingURL=registration-images.util.js.map