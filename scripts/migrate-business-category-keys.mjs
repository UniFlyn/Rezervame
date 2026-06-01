#!/usr/bin/env node
/**
 * Normalize Business.categoryKeys to partner types + legacy keys.
 * Maps registrationDetails.businessType → canonical keys; removes duplicate Massage, etc.
 *
 *   node scripts/migrate-business-category-keys.mjs
 *   node scripts/migrate-business-category-keys.mjs --dry-run
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = join(__dirname, '..', 'Backend');
const require = createRequire(join(backendDir, 'package.json'));

try {
  require('dotenv').config({ path: join(backendDir, '.env') });
  require('dotenv').config({ path: join(backendDir, '.env.local') });
} catch {
  /* optional */
}

const dryRun = process.argv.includes('--dry-run');

const PARTNER_TYPES = JSON.parse(
  readFileSync(join(backendDir, 'src/config/partner-business-types.json'), 'utf8'),
);

function normalizeCategoryKey(key) {
  const k = `${key || ''}`.trim();
  if (k === 'Massage') return 'massage';
  return k;
}

function migrateKeys(categoryKeys, registrationDetails) {
  const type = `${registrationDetails?.businessType || ''}`.trim().toLowerCase();
  const partner = PARTNER_TYPES.find((p) => p.id === type);
  if (partner) return [...partner.categoryKeys];

  let keys = [...new Set((categoryKeys ?? []).map(normalizeCategoryKey).filter(Boolean))];

  if (keys.includes('tattoo')) keys = keys.filter((k) => k !== 'beautyService');
  if (keys.includes('estetica')) keys = keys.filter((k) => k !== 'beautyService');
  if (keys.includes('dermatology')) keys = keys.filter((k) => k !== 'beautyService');
  if (keys.includes('yoga')) keys = keys.filter((k) => k !== 'spaService' && k !== 'massage');

  return keys.length ? keys : ['hairService'];
}

function sameKeys(a, b) {
  const sa = [...new Set(a)].sort().join('|');
  const sb = [...new Set(b)].sort().join('|');
  return sa === sb;
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('Set DATABASE_URL in Backend/.env');
    process.exit(1);
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, categoryKeys: true, registrationDetails: true },
  });

  let updated = 0;
  for (const b of businesses) {
    const reg =
      b.registrationDetails && typeof b.registrationDetails === 'object'
        ? b.registrationDetails
        : null;
    const next = migrateKeys(b.categoryKeys, reg);
    if (sameKeys(b.categoryKeys ?? [], next)) continue;
    console.log(`${dryRun ? '[dry-run] ' : ''}${b.name}: ${JSON.stringify(b.categoryKeys)} → ${JSON.stringify(next)}`);
    if (!dryRun) {
      await prisma.business.update({
        where: { id: b.id },
        data: { categoryKeys: next },
      });
    }
    updated += 1;
  }

  console.log(`${dryRun ? 'Would update' : 'Updated'} ${updated} of ${businesses.length} businesses.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
