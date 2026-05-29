#!/usr/bin/env node
/**
 * Copy inline (data:) and optional remote (http) images from Postgres into S3.
 *
 * Requires: DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
 * Optional: AWS_REGION, S3_PUBLIC_BASE_URL, S3_UPLOAD_PREFIX
 *
 *   node scripts/migrate-images-to-s3.mjs
 *   node scripts/migrate-images-to-s3.mjs --include-http
 *   node scripts/migrate-images-to-s3.mjs --dry-run
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = join(__dirname, '..', 'Backend');
const require = createRequire(join(backendDir, 'package.json'));

try {
  require('dotenv').config({ path: join(backendDir, '.env') });
  require('dotenv').config({ path: join(backendDir, '.env.local') });
} catch {
  /* optional */
}

const { PrismaClient } = require('@prisma/client');

const dryRun = process.argv.includes('--dry-run');
const includeHttp = process.argv.includes('--include-http');

const bucket = process.env.S3_BUCKET_NAME?.trim();
const region = process.env.AWS_REGION?.trim() || 'ap-southeast-2';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
const uploadPrefix = (process.env.S3_UPLOAD_PREFIX || 'uploads').replace(/^\/+|\/+$/g, '');
const publicBaseUrl =
  process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') ||
  `https://${bucket}.s3.${region}.amazonaws.com`;

if (!process.env.DATABASE_URL?.trim()) {
  console.error('Set DATABASE_URL (RDS connection string).');
  process.exit(1);
}
if (!bucket || !accessKeyId || !secretAccessKey) {
  console.error('Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME.');
  process.exit(1);
}

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

const MAX_BYTES = 5 * 1024 * 1024;
let uploaded = 0;
let skipped = 0;
let failed = 0;

function isOurBucket(url) {
  if (!url?.trim()) return false;
  const u = url.trim();
  return u.startsWith(`${publicBaseUrl}/`) || (u.includes(`${bucket}.s3.`) && u.includes(`/${uploadPrefix}/`));
}

function needsUpload(url) {
  if (!url?.trim()) return false;
  if (isOurBucket(url)) return false;
  if (url.trim().startsWith('data:image/')) return true;
  if (includeHttp && /^https?:\/\//i.test(url.trim())) return true;
  return false;
}

async function putBuffer(buffer, contentType, folder) {
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+/, '') || 'misc';
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const key = `${uploadPrefix}/${safeFolder}/${randomUUID()}.${ext}`;
  if (dryRun) {
    console.log(`  [dry-run] would upload s3://${bucket}/${key}`);
    return `${publicBaseUrl}/${key}`;
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    }),
  );
  uploaded++;
  return `${publicBaseUrl}/${key}`;
}

async function migrateUrl(url, folder) {
  const trimmed = (url || '').trim();
  if (!needsUpload(trimmed)) {
    skipped++;
    return trimmed || null;
  }
  try {
    if (trimmed.startsWith('data:image/')) {
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(trimmed);
      if (!match) throw new Error('Invalid data URL');
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > MAX_BYTES) throw new Error(`Too large: ${buffer.length}`);
      return await putBuffer(buffer, match[1], folder);
    }
    const res = await fetch(trimmed, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_BYTES) throw new Error(`Too large: ${buffer.length}`);
    return await putBuffer(buffer, contentType, folder);
  } catch (err) {
    failed++;
    console.warn(`  ⚠️  keep original: ${err.message}`);
    return trimmed;
  }
}

async function updateIfChanged(prisma, table, id, field, next, current) {
  if (!next || next === current) return;
  if (dryRun) {
    console.log(`  [dry-run] ${table}.${field} ${id}`);
    return;
  }
  await prisma[table].update({ where: { id }, data: { [field]: next } });
}

const prisma = new PrismaClient();

async function main() {
  console.log(`Migrating images → s3://${bucket}/${uploadPrefix}/`);
  console.log(`include-http=${includeHttp} dry-run=${dryRun}\n`);

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      logoUrl: true,
      bannerUrl: true,
      images: true,
      idDocumentImage: true,
      licenseDocumentImage: true,
      insuranceDocumentImage: true,
    },
  });
  for (const b of businesses) {
    const logo = await migrateUrl(b.logoUrl, 'venues/logos');
    const banner = await migrateUrl(b.bannerUrl, 'venues/banners');
    const gallery = [];
    for (const img of b.images || []) {
      gallery.push((await migrateUrl(img, 'venues/gallery')) || img);
    }
    const idDoc = await migrateUrl(b.idDocumentImage, 'documents/id');
    const lic = await migrateUrl(b.licenseDocumentImage, 'documents/license');
    const ins = await migrateUrl(b.insuranceDocumentImage, 'documents/insurance');
    if (!dryRun) {
      await prisma.business.update({
        where: { id: b.id },
        data: {
          ...(logo !== b.logoUrl ? { logoUrl: logo } : {}),
          ...(banner !== b.bannerUrl ? { bannerUrl: banner } : {}),
          ...(JSON.stringify(gallery) !== JSON.stringify(b.images) ? { images: gallery } : {}),
          ...(idDoc !== b.idDocumentImage ? { idDocumentImage: idDoc } : {}),
          ...(lic !== b.licenseDocumentImage ? { licenseDocumentImage: lic } : {}),
          ...(ins !== b.insuranceDocumentImage ? { insuranceDocumentImage: ins } : {}),
        },
      });
    }
    console.log(`Business ${b.id}`);
  }

  for (const s of await prisma.service.findMany({ select: { id: true, imageUrl: true } })) {
    const next = await migrateUrl(s.imageUrl, 'venues/services');
    await updateIfChanged(prisma, 'service', s.id, 'imageUrl', next, s.imageUrl);
  }
  console.log('Services done');

  for (const c of await prisma.category.findMany({ select: { id: true, imageUrl: true } })) {
    const next = await migrateUrl(c.imageUrl, 'categories');
    await updateIfChanged(prisma, 'category', c.id, 'imageUrl', next, c.imageUrl);
  }
  console.log('Categories done');

  for (const a of await prisma.amenity.findMany({ select: { id: true, imageUrl: true } })) {
    const next = await migrateUrl(a.imageUrl, 'amenities');
    await updateIfChanged(prisma, 'amenity', a.id, 'imageUrl', next, a.imageUrl);
  }
  console.log('Amenities done');

  for (const st of await prisma.staff.findMany({ select: { id: true, image: true } })) {
    const next = await migrateUrl(st.image, 'staff');
    await updateIfChanged(prisma, 'staff', st.id, 'image', next, st.image);
  }
  console.log('Staff done');

  for (const u of await prisma.user.findMany({
    where: { avatar: { not: null } },
    select: { id: true, avatar: true },
  })) {
    const next = await migrateUrl(u.avatar, 'avatars');
    await updateIfChanged(prisma, 'user', u.id, 'avatar', next, u.avatar);
  }
  console.log('User avatars done');

  for (const e of await prisma.event.findMany({ select: { id: true, imageKey: true } })) {
    const key = e.imageKey?.trim();
    if (!key || (!key.startsWith('data:') && !key.startsWith('http'))) continue;
    const next = await migrateUrl(key, 'events');
    await updateIfChanged(prisma, 'event', e.id, 'imageKey', next, e.imageKey);
  }
  console.log('Events done');

  const cfg = await prisma.systemConfig.findUnique({ where: { id: 1 } });
  if (cfg?.homeHeroImageUrl) {
    const next = await migrateUrl(cfg.homeHeroImageUrl, 'site/hero');
    if (next !== cfg.homeHeroImageUrl && !dryRun) {
      await prisma.systemConfig.update({
        where: { id: 1 },
        data: { homeHeroImageUrl: next },
      });
    }
    console.log('Home hero done');
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { screenshotUrl: { not: null } },
    select: { id: true, screenshotUrl: true },
  });
  for (const t of tickets) {
    const next = await migrateUrl(t.screenshotUrl, 'support');
    await updateIfChanged(prisma, 'supportTicket', t.id, 'screenshotUrl', next, t.screenshotUrl);
  }
  const msgs = await prisma.supportMessage.findMany({
    where: { attachmentUrl: { not: null } },
    select: { id: true, attachmentUrl: true },
  });
  for (const m of msgs) {
    const next = await migrateUrl(m.attachmentUrl, 'support');
    await updateIfChanged(prisma, 'supportMessage', m.id, 'attachmentUrl', next, m.attachmentUrl);
  }
  console.log('Support attachments done');

  console.log(`\n✅ Done — uploaded: ${uploaded}, skipped: ${skipped}, failed: ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
