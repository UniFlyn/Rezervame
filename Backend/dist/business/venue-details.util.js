"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPublicVenueDetails = buildPublicVenueDetails;
exports.buildAdminRegistrationSections = buildAdminRegistrationSections;
exports.collectRegistrationPhotoUrls = collectRegistrationPhotoUrls;
const LABELS = {
    businessType: 'Business type',
    country: 'Country',
    state: 'State / province',
    city: 'City',
    yearsOperating: 'Years operating',
    locationAccess: 'Location access',
    buildingName: 'Building / plaza',
    floor: 'Floor / suite',
    localNumber: 'Unit / local number',
    locationReferences: 'Location references',
    specialDirections: 'Special directions',
    parking: 'Parking',
    personType: 'Legal entity type',
    companyName: 'Company name',
    companyType: 'Company type',
    ownerId: 'Owner ID / document',
    ownerPhone: 'Owner phone',
    ownerEmail: 'Owner email',
    bank: 'Bank',
    accountType: 'Account type',
    accountNumber: 'Account number',
    accountHolder: 'Account holder',
    priceRange: 'Price range',
    openTime: 'Opens',
    closeTime: 'Closes',
    appointments: 'Appointments',
    staffCount: 'Team size',
    additionalInfo: 'Additional information',
    marketingOptIn: 'Marketing opt-in',
};
const OPTION_LABELS = {
    businessType: {
        salon: 'Beauty salon',
        barberia: 'Barbershop',
        nails: 'Nail salon',
        tattoo: 'Tattoo studio',
        spa: 'Spa / massage',
        estetica: 'Aesthetics center',
        dermatologo: 'Dermatology / clinic',
        yoga: 'Yoga & fitness',
        otro: 'Other',
    },
    country: { PA: 'Panama', US: 'United States', MX: 'Mexico', CO: 'Colombia', CR: 'Costa Rica', OTHER: 'Other' },
    parking: { si: 'On-site parking', no: 'No parking', calle: 'Street parking' },
    personType: { natural: 'Individual', juridica: 'Company / legal entity' },
    appointments: { 'solo-cita': 'By appointment only', 'walk-in': 'Walk-ins welcome', ambos: 'Appointments & walk-ins' },
    priceRange: { budget: 'Budget ($)', mid: 'Mid-range ($$)', premium: 'Premium ($$$)', luxury: 'Luxury ($$$$)' },
};
function formatValue(key, raw) {
    if (raw === null || raw === undefined || raw === '')
        return '';
    if (typeof raw === 'boolean')
        return raw ? 'Yes' : 'No';
    if (Array.isArray(raw)) {
        const mapped = raw
            .map((v) => {
            const s = String(v).trim();
            return OPTION_LABELS[key]?.[s] ?? s;
        })
            .filter(Boolean);
        return mapped.join(', ');
    }
    const s = String(raw).trim();
    return OPTION_LABELS[key]?.[s] ?? s;
}
function rowsFrom(rd, keys, opts) {
    const out = [];
    for (const key of keys) {
        let val = formatValue(key, rd[key]);
        if (!val)
            continue;
        if (opts?.maskAccount && key === 'accountNumber' && val.length > 4) {
            val = `••••${val.slice(-4)}`;
        }
        out.push({ label: LABELS[key] ?? key, value: val });
    }
    return out;
}
function asRecord(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json))
        return null;
    return json;
}
function buildPublicVenueDetails(business) {
    const rd = asRecord(business.registrationDetails);
    const sections = [];
    const locationRows = [];
    if (business.address)
        locationRows.push({ label: 'Address', value: business.address });
    if (business.latitude != null && business.longitude != null) {
        locationRows.push({
            label: 'Coordinates',
            value: `${business.latitude.toFixed(5)}, ${business.longitude.toFixed(5)}`,
        });
    }
    if (rd) {
        locationRows.push(...rowsFrom(rd, [
            'country',
            'state',
            'city',
            'buildingName',
            'floor',
            'localNumber',
            'locationAccess',
            'locationReferences',
            'specialDirections',
            'parking',
        ]));
    }
    if (locationRows.length)
        sections.push({ title: 'Location', rows: locationRows });
    if (rd) {
        const ops = rowsFrom(rd, [
            'yearsOperating',
            'offeredServices',
            'priceRange',
            'staffCount',
            'appointments',
            'openTime',
            'closeTime',
            'operatingDays',
        ]);
        if (ops.length)
            sections.push({ title: 'Operations', rows: ops });
        const extra = rd.additionalInfo ? String(rd.additionalInfo).trim() : '';
        if (extra)
            sections.push({ title: 'About this place', rows: [{ label: 'Notes', value: extra }] });
    }
    else if (business.description?.trim()) {
        sections.push({
            title: 'About this place',
            rows: [{ label: 'Description', value: business.description.trim() }],
        });
    }
    const photoUrls = [];
    const pushPhoto = (u) => {
        const s = String(u ?? '').trim();
        if (s && !photoUrls.includes(s))
            photoUrls.push(s);
    };
    if (rd) {
        pushPhoto(rd.exteriorPhotoUrl);
        if (Array.isArray(rd.interiorPhotoUrls))
            rd.interiorPhotoUrls.forEach(pushPhoto);
        if (Array.isArray(rd.portfolioPhotoUrls))
            rd.portfolioPhotoUrls.forEach(pushPhoto);
    }
    return { sections, photoUrls };
}
function buildAdminRegistrationSections(registrationDetails) {
    const rd = asRecord(registrationDetails);
    if (!rd)
        return [];
    const sections = [];
    const profile = rowsFrom(rd, ['businessType', 'country', 'state', 'city', 'yearsOperating']);
    if (profile.length)
        sections.push({ title: 'Business profile', rows: profile });
    const location = rowsFrom(rd, [
        'locationAccess',
        'buildingName',
        'floor',
        'localNumber',
        'locationReferences',
        'specialDirections',
        'parking',
    ]);
    if (rd.latitude != null || rd.longitude != null) {
        location.push({
            label: 'Map coordinates',
            value: `${rd.latitude ?? '—'}, ${rd.longitude ?? '—'}`,
        });
    }
    if (location.length)
        sections.push({ title: 'Location details', rows: location });
    const legal = rowsFrom(rd, ['personType', 'companyName', 'companyType', 'ownerId', 'ownerPhone', 'ownerEmail']);
    if (legal.length)
        sections.push({ title: 'Owner & legal', rows: legal });
    const bank = rowsFrom(rd, ['bank', 'accountType', 'accountNumber', 'accountHolder'], { maskAccount: true });
    if (bank.length)
        sections.push({ title: 'Payout (bank)', rows: bank });
    const ops = rowsFrom(rd, [
        'offeredServices',
        'priceRange',
        'operatingDays',
        'openTime',
        'closeTime',
        'appointments',
        'staffCount',
        'marketingOptIn',
        'additionalInfo',
    ]);
    if (ops.length)
        sections.push({ title: 'Operations & marketing', rows: ops });
    return sections;
}
function collectRegistrationPhotoUrls(registrationDetails) {
    const rd = asRecord(registrationDetails);
    if (!rd)
        return [];
    const urls = [];
    const push = (u) => {
        const s = String(u ?? '').trim();
        if (s && !urls.includes(s))
            urls.push(s);
    };
    push(rd.exteriorPhotoUrl);
    push(rd.bankProofUrl);
    if (Array.isArray(rd.interiorPhotoUrls))
        rd.interiorPhotoUrls.forEach(push);
    if (Array.isArray(rd.portfolioPhotoUrls))
        rd.portfolioPhotoUrls.forEach(push);
    return urls;
}
//# sourceMappingURL=venue-details.util.js.map