#!/usr/bin/env node
/**
 * Test forgot-password flow against live or local API.
 *
 *   API_BASE=https://rezervame.onrender.com/api node scripts/test-forgot-password-live.mjs user@example.com
 *   API_BASE=http://127.0.0.1:4000/api node scripts/test-forgot-password-live.mjs customer@rezervame.com
 */
const API_BASE = (process.env.API_BASE || 'https://rezervame.onrender.com/api').replace(/\/$/, '');
const email = process.argv[2] || 'customer@rezervame.com';

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

console.log(`API: ${API_BASE}`);
console.log(`Email: ${email}\n`);

const forgot = await post('/auth/forgot-password', { email });
console.log('POST /auth/forgot-password', forgot.status, forgot.json);

if (forgot.status === 404) {
  console.log('\n⚠️  Endpoint not found — deploy latest backend to Render first.');
  process.exit(1);
}

const devCode = forgot.json?.devCode;
if (devCode) {
  console.log(`\nDev code (local only): ${devCode}`);
  const verify = await post('/auth/verify-reset-code', { email, code: devCode });
  console.log('POST /auth/verify-reset-code', verify.status, verify.json);
} else if (forgot.status === 200) {
  console.log('\n✅ Request accepted. Check the inbox for a 6-digit code (Postmark).');
  console.log('   Developer bypass: 112233');
  console.log('   Then verify on the app or run with CODE=1234 env for step 2.');
}

const code = process.env.CODE;
if (code && forgot.status >= 200 && forgot.status < 300) {
  const verify = await post('/auth/verify-reset-code', { email, code });
  console.log('POST /auth/verify-reset-code', verify.status, verify.json);
}

const bypass = process.env.BYPASS === '1';
if (bypass) {
  const verify = await post('/auth/verify-reset-code', { email, code: '112233' });
  console.log('POST /auth/verify-reset-code (bypass)', verify.status, verify.json);
}
