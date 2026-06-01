import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { S3StorageService } from './s3-storage.service';
import { readS3Config } from './s3.config';

/** Unsplash sources for first-time seed of default category tiles. */
const CATEGORY_SEED_SOURCES: Record<string, string> = {
  hairService:
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&fit=crop',
  spaService:
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&fit=crop',
  nailCare:
    'https://images.unsplash.com/photo-1604902396830-aca29e19b067?q=80&w=600&fit=crop',
  beautyService:
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&fit=crop',
  barber:
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=600&fit=crop',
  Massage:
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fit=crop',
  massage:
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fit=crop',
};

function needsMigration(url: string | null | undefined, includeHttp: boolean): boolean {
  if (!url?.trim()) return false;
  const u = url.trim();
  const cfg = readS3Config();
  if (cfg && (u.startsWith(cfg.publicBaseUrl) || u.includes(`${cfg.bucket}.s3.`))) {
    return false;
  }
  if (u.startsWith('data:image/')) return true;
  if (includeHttp && /^https?:\/\//i.test(u)) return true;
  return false;
}

@Injectable()
export class ImageMigrationService {
  private readonly logger = new Logger(ImageMigrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3StorageService,
  ) {}

  async migrateAll(opts: { includeHttp?: boolean; seedDefaults?: boolean } = {}) {
    const includeHttp = opts.includeHttp ?? true;
    const seedDefaults = opts.seedDefaults ?? true;

    if (!(await this.s3.isConfigured())) {
      throw new Error('S3 is not configured on this server');
    }

    const stats = {
      uploaded: 0,
      skipped: 0,
      failed: 0,
      defaultsSeeded: 0,
    };

    if (seedDefaults) {
      stats.defaultsSeeded = await this.seedDefaultCategories(includeHttp, stats);
    }

    const businesses = await this.prisma.business.findMany({
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
      const logo = await this.migrateField(b.logoUrl, 'venues/logos', includeHttp, stats);
      const banner = await this.migrateField(b.bannerUrl, 'venues/banners', includeHttp, stats);
      const gallery: string[] = [];
      for (const img of b.images || []) {
        gallery.push((await this.migrateField(img, 'venues/gallery', includeHttp, stats)) || img);
      }
      const idDoc = await this.migrateField(b.idDocumentImage, 'documents/id', includeHttp, stats);
      const lic = await this.migrateField(b.licenseDocumentImage, 'documents/license', includeHttp, stats);
      const ins = await this.migrateField(b.insuranceDocumentImage, 'documents/insurance', includeHttp, stats);

      await this.prisma.business.update({
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

    for (const s of await this.prisma.service.findMany({ select: { id: true, imageUrl: true } })) {
      const next = await this.migrateField(s.imageUrl, 'venues/services', includeHttp, stats);
      if (next !== s.imageUrl) {
        await this.prisma.service.update({ where: { id: s.id }, data: { imageUrl: next } });
      }
    }

    for (const c of await this.prisma.category.findMany({ select: { id: true, key: true, imageUrl: true } })) {
      let next = await this.migrateField(c.imageUrl, 'categories', includeHttp, stats);
      if (!next && c.key) {
        next = await this.defaultCategoryUrl(c.key, includeHttp, stats);
      }
      if (next !== c.imageUrl) {
        await this.prisma.category.update({ where: { id: c.id }, data: { imageUrl: next } });
      }
    }

    for (const a of await this.prisma.amenity.findMany({ select: { id: true, imageUrl: true } })) {
      const next = await this.migrateField(a.imageUrl, 'amenities', includeHttp, stats);
      if (next !== a.imageUrl) {
        await this.prisma.amenity.update({ where: { id: a.id }, data: { imageUrl: next } });
      }
    }

    for (const st of await this.prisma.staff.findMany({ select: { id: true, image: true } })) {
      const next = await this.migrateField(st.image, 'staff', includeHttp, stats);
      if (next !== st.image) {
        await this.prisma.staff.update({ where: { id: st.id }, data: { image: next } });
      }
    }

    for (const u of await this.prisma.user.findMany({
      where: { avatar: { not: null } },
      select: { id: true, avatar: true },
    })) {
      const next = await this.migrateField(u.avatar, 'avatars', includeHttp, stats);
      if (next !== u.avatar) {
        await this.prisma.user.update({ where: { id: u.id }, data: { avatar: next } });
      }
    }

    for (const e of await this.prisma.event.findMany({ select: { id: true, imageKey: true } })) {
      const key = e.imageKey?.trim();
      if (!key || (!key.startsWith('data:') && !key.startsWith('http'))) continue;
      const next = await this.migrateField(key, 'events', includeHttp, stats);
      if (next !== e.imageKey) {
        await this.prisma.event.update({ where: { id: e.id }, data: { imageKey: next } });
      }
    }

    const cfg = await this.prisma.systemConfig.findUnique({ where: { id: 1 } });
    if (cfg?.homeHeroImageUrl) {
      const next = await this.migrateField(cfg.homeHeroImageUrl, 'site/hero', includeHttp, stats);
      if (next !== cfg.homeHeroImageUrl) {
        await this.prisma.systemConfig.update({
          where: { id: 1 },
          data: { homeHeroImageUrl: next },
        });
      }
    }

    for (const t of await this.prisma.supportTicket.findMany({
      where: { screenshotUrl: { not: null } },
      select: { id: true, screenshotUrl: true },
    })) {
      const next = await this.migrateField(t.screenshotUrl, 'support', includeHttp, stats);
      if (next !== t.screenshotUrl) {
        await this.prisma.supportTicket.update({
          where: { id: t.id },
          data: { screenshotUrl: next },
        });
      }
    }

    for (const m of await this.prisma.supportMessage.findMany({
      where: { attachmentUrl: { not: null } },
      select: { id: true, attachmentUrl: true },
    })) {
      const next = await this.migrateField(m.attachmentUrl, 'support', includeHttp, stats);
      if (next !== m.attachmentUrl) {
        await this.prisma.supportMessage.update({
          where: { id: m.id },
          data: { attachmentUrl: next },
        });
      }
    }

    this.logger.log(`Migration complete: ${JSON.stringify(stats)}`);
    return stats;
  }

  private async defaultCategoryUrl(
    key: string,
    _includeHttp: boolean,
    stats: { uploaded: number; skipped: number; failed: number },
  ): Promise<string | null> {
    const k = key.trim();
    const source = CATEGORY_SEED_SOURCES[k] ?? CATEGORY_SEED_SOURCES[k.toLowerCase()];
    if (!source) return null;
    try {
      const url = await this.s3.uploadFromHttpUrlToFixedKey(
        source,
        `defaults/categories/${k}.jpg`,
      );
      stats.uploaded++;
      return url;
    } catch (err) {
      this.logger.warn(`Default category ${k}: ${err}`);
      stats.failed++;
      return null;
    }
  }

  private async seedDefaultCategories(
    includeHttp: boolean,
    stats: { uploaded: number; skipped: number; failed: number; defaultsSeeded: number },
  ): Promise<number> {
    const cfg = readS3Config();
    if (!cfg) return 0;
    let count = 0;
    const categories = await this.prisma.category.findMany({
      select: { id: true, key: true, imageUrl: true },
    });
    for (const c of categories) {
      const k = c.key.trim();
      const source = CATEGORY_SEED_SOURCES[k] ?? CATEGORY_SEED_SOURCES[k.toLowerCase()];
      const current = c.imageUrl?.trim() || '';
      const alreadyS3 = cfg && current.startsWith(cfg.publicBaseUrl);
      const needsDefault =
        !current || current.includes('unsplash.com') || current.startsWith('data:');

      if (!source || alreadyS3) {
        stats.skipped++;
        continue;
      }
      if (!needsDefault && !needsMigration(current, includeHttp)) {
        stats.skipped++;
        continue;
      }
      try {
        const url = await this.s3.uploadFromHttpUrlToFixedKey(
          source,
          `defaults/categories/${k}.jpg`,
        );
        await this.prisma.category.update({
          where: { id: c.id },
          data: { imageUrl: url },
        });
        stats.uploaded++;
        count++;
      } catch (err) {
        this.logger.warn(`Seed category ${k}: ${err}`);
        stats.failed++;
      }
    }
    return count;
  }

  private async migrateField(
    value: string | null | undefined,
    folder: string,
    includeHttp: boolean,
    stats: { uploaded: number; skipped: number; failed: number },
  ): Promise<string | null> {
    if (!value?.trim()) return null;
    const trimmed = value.trim();
    if (!needsMigration(trimmed, includeHttp)) {
      stats.skipped++;
      return trimmed;
    }
    try {
      const next = await this.s3.migrateValueToS3(trimmed, folder, { includeHttp });
      if (next && next !== trimmed) stats.uploaded++;
      else stats.skipped++;
      return next;
    } catch (err) {
      this.logger.warn(`Migrate failed (${folder}): ${err}`);
      stats.failed++;
      return trimmed;
    }
  }
}
