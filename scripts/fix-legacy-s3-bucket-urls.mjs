#!/usr/bin/env node
/**
 * Replace retired S3 bucket hostnames in Postgres (rezervame-assets-yourname → rezervame-assets-abs).
 *
 *   node scripts/fix-legacy-s3-bucket-urls.mjs
 *   node scripts/fix-legacy-s3-bucket-urls.mjs --dry-run
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
const WRONG = 'rezervame-assets-yourname';
const RIGHT = 'rezervame-assets-abs';

if (!process.env.DATABASE_URL?.trim()) {
  console.error('Set DATABASE_URL in Backend/.env');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function rewrite(value) {
  if (typeof value !== 'string' || !value.includes(WRONG)) return value;
  return value.split(WRONG).join(RIGHT);
}

async function main() {
  let updated = 0;

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      logoUrl: true,
      bannerUrl: true,
      images: true,
    },
  });

  for (const b of businesses) {
    const logoUrl = rewrite(b.logoUrl);
    const bannerUrl = rewrite(b.bannerUrl);
    const images = Array.isArray(b.images) ? b.images.map((u) => rewrite(u)) : b.images;
    const changed =
      logoUrl !== b.logoUrl || bannerUrl !== b.bannerUrl || JSON.stringify(images) !== JSON.stringify(b.images);
    if (!changed) continue;
    if (dryRun) {
      console.log('[dry-run] business', b.id);
      updated++;
      continue;
    }
    await prisma.business.update({
      where: { id: b.id },
      data: { logoUrl, bannerUrl, images },
    });
    updated++;
  }

  const scalarFields = [
    ['service', 'imageUrl'],
    ['staff', 'image'],
    ['category', 'imageUrl'],
    ['user', 'avatar'],
    ['amenity', 'imageUrl'],
    ['review', 'avatar'],
    ['supportTicket', 'screenshotUrl'],
  ];

  for (const [model, field] of scalarFields) {
    if (!prisma[model]) continue;
    const rows = await prisma[model].findMany({ select: { id: true, [field]: true } });
    for (const row of rows) {
      const next = rewrite(row[field]);
      if (next === row[field]) continue;
      if (dryRun) {
        console.log(`[dry-run] ${model}`, row.id);
        updated++;
        continue;
      }
      await prisma[model].update({ where: { id: row.id }, data: { [field]: next } });
      updated++;
    }
  }

  console.log(JSON.stringify({ dryRun, updated }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
