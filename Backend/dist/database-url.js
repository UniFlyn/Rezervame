"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDatabaseUrl = normalizeDatabaseUrl;
function normalizeDatabaseUrl() {
    const raw = process.env.DATABASE_URL?.trim();
    if (!raw)
        return;
    let url = raw;
    const isNeon = url.includes('neon.tech');
    const isSupabase = url.includes('supabase.co') || url.includes('pooler.supabase.com');
    const isRemote = isNeon ||
        isSupabase ||
        (!url.includes('localhost') && !url.includes('127.0.0.1'));
    if (isRemote && !/[?&]sslmode=/i.test(url)) {
        url += url.includes('?') ? '&sslmode=require' : '?sslmode=require';
    }
    if (isNeon && !/[?&]connect_timeout=/i.test(url)) {
        url += url.includes('?') ? '&connect_timeout=15' : '?connect_timeout=15';
    }
    if (isSupabase && /:6543\//.test(url) && !/[?&]pgbouncer=/i.test(url)) {
        url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
    }
    process.env.DATABASE_URL = url;
}
//# sourceMappingURL=database-url.js.map