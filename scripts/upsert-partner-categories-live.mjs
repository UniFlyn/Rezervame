#!/usr/bin/env node
/**
 * Upsert partner categories on production via Admin API (no direct DATABASE_URL needed).
 *
 *   ADMIN_EMAIL=admin@rezervame.com ADMIN_PASSWORD=password node scripts/upsert-partner-categories-live.mjs
 *   API_BASE=https://rezervame.onrender.com/api node scripts/upsert-partner-categories-live.mjs
 */
const API_BASE = (process.env.API_BASE || 'https://rezervame.onrender.com/api').replace(/\/$/, '');
const EMAIL = process.env.ADMIN_EMAIL || 'admin@rezervame.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'password';

const CATEGORIES = [
  {
    key: 'tattoo',
    labelEn: 'Tattoo studio',
    labelEs: 'Estudio de tatuajes',
    sortOrder: 60,
    imageUrl: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?q=80&w=600&fit=crop',
  },
  {
    key: 'yoga',
    labelEn: 'Yoga & fitness',
    labelEs: 'Yoga y fitness',
    sortOrder: 65,
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&fit=crop',
  },
  {
    key: 'estetica',
    labelEn: 'Aesthetics center',
    labelEs: 'Centro de estética',
    sortOrder: 45,
    imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&fit=crop',
  },
  {
    key: 'dermatology',
    labelEn: 'Dermatology / clinic',
    labelEs: 'Dermatología / clínica',
    sortOrder: 47,
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&fit=crop',
  },
  {
    key: 'massage',
    labelEn: 'Massage',
    labelEs: 'Masaje',
    sortOrder: 55,
    imageUrl:
      'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/massage.jpg',
  },
];

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const token = data.token || data.accessToken;
  if (!token) throw new Error('Login response missing token');
  return token;
}

async function upsertCategory(token, row) {
  const res = await fetch(`${API_BASE}/admin/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...row, active: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upsert ${row.key} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function main() {
  console.log(`API: ${API_BASE}`);
  const token = await login();
  console.log('Admin login OK');
  for (const row of CATEGORIES) {
    const saved = await upsertCategory(token, row);
    console.log(`✓ ${saved.key} (${saved.id})`);
  }
  const pub = await fetch(`${API_BASE}/public/categories`);
  const list = await pub.json();
  const keys = list.map((c) => c.key).sort();
  console.log('Public categories:', keys.join(', '));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
