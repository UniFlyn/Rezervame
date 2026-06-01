#!/usr/bin/env node
/** Quick production API diagnosis — run: node scripts/check-production-api.mjs */

const API = process.env.API_BASE || 'https://rezervame.onrender.com';

async function probe(path, label) {
  const url = `${API}${path}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
    const ms = Date.now() - t0;
    let body;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    console.log(`\n${label}: ${url}`);
    console.log(`  HTTP ${res.status} (${(ms / 1000).toFixed(1)}s)`);
    console.log(`  ${JSON.stringify(body, null, 2).slice(0, 800)}`);
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    console.log(`\n${label}: ${url}`);
    console.log(`  FAILED after ${((Date.now() - t0) / 1000).toFixed(1)}s — ${e.message}`);
    if (e.message.includes('timeout')) {
      console.log('  → Render free tier may be cold-starting (wait 60s and retry).');
    }
    return { ok: false, error: e.message };
  }
}

console.log(`Checking ${API} …`);
const root = await probe('', 'Root');
const health = await probe('/api/v1/health', 'Health');

if (health.body?.checks?.postgres === 'error') {
  console.log('\n⚠️  ROOT CAUSE: API is up but PostgreSQL is NOT connected.');
  console.log('   Fix DATABASE_URL on Render (Neon connection string, sslmode=require).');
  console.log('   Wake/resume the Neon project in console.neon.tech if suspended.');
} else if (health.body?.checks?.postgres === 'ok') {
  console.log('\n✅ API and database are healthy.');
} else if (!root.ok && !health.ok) {
  console.log('\n⚠️  Backend may be sleeping (Render free) or crashed. Open Render → Logs.');
}
