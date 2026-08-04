import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { allocateMerchantNumber } from '../merchant-number.util';
import { businessDiscoveryWhere } from '../business/business-listing.util';

const MASSAGE_CATEGORY_IMAGE =
  'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/Massage.jpg';

const DEFAULT_HOURS = JSON.stringify([
  { day: 'Monday', hours: '09:00 AM - 06:00 PM' },
  { day: 'Tuesday', hours: '09:00 AM - 06:00 PM' },
  { day: 'Wednesday', hours: '09:00 AM - 06:00 PM' },
  { day: 'Thursday', hours: '09:00 AM - 06:00 PM' },
  { day: 'Friday', hours: '09:00 AM - 07:00 PM' },
  { day: 'Saturday', hours: '10:00 AM - 05:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
]);

type DemoService = { name: string; category: string; duration: number; price: number };

type CategoryDemo = {
  key: string;
  name: string;
  owner: string;
  email: string;
  address: string;
  description: string;
  lat: number;
  lng: number;
  bannerUrl: string;
  logoUrl: string;
  services: DemoService[];
};

const CATEGORY_DEMOS: CategoryDemo[] = [
  {
    key: 'barber',
    name: 'Classic Barbershop PA',
    owner: 'Carlos Mendez',
    email: 'demo-barber@rezervame.com',
    address: 'Calle 50, Panama City, Panama',
    description: 'Barbería clásica con cortes fade, afeitado y arreglo de barba para hombres.',
    lat: 8.9824,
    lng: -79.5199,
    bannerUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1600&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=400&fit=crop',
    services: [
      { name: 'Corte clásico para hombre', category: 'barber', duration: 30, price: 18 },
      { name: 'Fade & Beard Trim', category: 'barber', duration: 45, price: 25 },
      { name: 'Afeitado tradicional', category: 'barber', duration: 25, price: 15 },
      { name: 'Corte para niño', category: 'barber', duration: 25, price: 14 },
    ],
  },
  {
    key: 'nailCare',
    name: 'Nails & Co. Studio',
    owner: 'Maria Santos',
    email: 'demo-nails@rezervame.com',
    address: 'Marbella, Panama City, Panama',
    description: 'Manicura, pedicura y nail art con productos premium para mujeres.',
    lat: 8.9756,
    lng: -79.5089,
    bannerUrl: 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?q=80&w=1600&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=400&fit=crop',
    services: [
      { name: 'Manicure clásica', category: 'nailCare', duration: 40, price: 22 },
      { name: 'Pedicure spa', category: 'nailCare', duration: 55, price: 32 },
      { name: 'Uñas en gel', category: 'nailCare', duration: 75, price: 45 },
      { name: 'Manicure para niña', category: 'nailCare', duration: 30, price: 16 },
    ],
  },
  {
    key: 'tattoo',
    name: 'Ink District Studio',
    owner: 'Diego Ruiz',
    email: 'demo-tattoo@rezervame.com',
    address: 'Bella Vista, Panama City, Panama',
    description: 'Estudio de tatuajes con artistas especializados en línea fina y realismo.',
    lat: 8.9698,
    lng: -79.5341,
    bannerUrl: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?q=80&w=1600&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994f8d?q=80&w=400&fit=crop',
    services: [
      { name: 'Consulta de diseño', category: 'tattoo', duration: 30, price: 0 },
      { name: 'Tatuaje pequeño', category: 'tattoo', duration: 60, price: 80 },
      { name: 'Tatuaje mediano', category: 'tattoo', duration: 120, price: 180 },
      { name: 'Retoque de tatuaje', category: 'tattoo', duration: 45, price: 50 },
    ],
  },
  {
    key: 'estetica',
    name: 'Estética Bella Vista',
    owner: 'Ana Torres',
    email: 'demo-estetica@rezervame.com',
    address: 'Bella Vista, Panama City, Panama',
    description: 'Tratamientos faciales, corporales y depilación en centro de estética moderno.',
    lat: 8.9712,
    lng: -79.531,
    bannerUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1600&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&fit=crop',
    services: [
      { name: 'Limpieza facial profunda', category: 'estetica', duration: 60, price: 55 },
      { name: 'Depilación con cera', category: 'estetica', duration: 45, price: 35 },
      { name: 'Tratamiento anti-edad', category: 'estetica', duration: 75, price: 90 },
      { name: 'Masaje relajante mujer', category: 'estetica', duration: 50, price: 48 },
    ],
  },
  {
    key: 'dermatology',
    name: 'Derma Clinic Panamá',
    owner: 'Dr. Laura Vega',
    email: 'demo-dermatology@rezervame.com',
    address: 'Obarrio, Panama City, Panama',
    description: 'Consultas dermatológicas, peelings químicos y tratamientos clínicos de piel.',
    lat: 8.9891,
    lng: -79.5275,
    bannerUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1600&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&fit=crop',
    services: [
      { name: 'Consulta dermatológica', category: 'dermatology', duration: 30, price: 65 },
      { name: 'Peeling químico', category: 'dermatology', duration: 45, price: 95 },
      { name: 'Tratamiento de acné', category: 'dermatology', duration: 40, price: 75 },
      { name: 'Revisión de lunares', category: 'dermatology', duration: 25, price: 50 },
    ],
  },
  {
    key: 'yoga',
    name: 'Zen Flow Yoga Studio',
    owner: 'Sofia Chen',
    email: 'demo-yoga@rezervame.com',
    address: 'Costa del Este, Panama City, Panama',
    description: 'Clases de yoga, pilates y meditación para todos los niveles.',
    lat: 9.0134,
    lng: -79.4655,
    bannerUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1600&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&fit=crop',
    services: [
      { name: 'Yoga Vinyasa', category: 'yoga', duration: 60, price: 20 },
      { name: 'Pilates mat', category: 'yoga', duration: 55, price: 22 },
      { name: 'Meditación guiada', category: 'yoga', duration: 45, price: 15 },
      { name: 'Yoga para niños', category: 'yoga', duration: 45, price: 16 },
    ],
  },
  {
    key: 'beautyService',
    name: 'Glow Beauty Bar',
    owner: 'Valentina Ortiz',
    email: 'demo-beauty@rezervame.com',
    address: 'El Cangrejo, Panama City, Panama',
    description: 'Maquillaje, cejas, pestañas y servicios de belleza para mujeres.',
    lat: 8.9882,
    lng: -79.5233,
    bannerUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1600&fit=crop',
    logoUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=400&fit=crop',
    services: [
      { name: 'Maquillaje social', category: 'beautyService', duration: 60, price: 55 },
      { name: 'Diseño de cejas', category: 'beautyService', duration: 30, price: 18 },
      { name: 'Extensiones de pestañas', category: 'beautyService', duration: 90, price: 75 },
      { name: 'Peinado para mujer', category: 'beautyService', duration: 45, price: 40 },
    ],
  },
  {
    key: 'massage',
    name: 'Relax Massage Spa',
    owner: 'Roberto Núñez',
    email: 'demo-massage@rezervame.com',
    address: 'San Francisco, Panama City, Panama',
    description: 'Masajes terapéuticos, relajantes y deportivos en ambiente tranquilo.',
    lat: 8.9945,
    lng: -79.5128,
    bannerUrl: MASSAGE_CATEGORY_IMAGE,
    logoUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1600&fit=crop',
    services: [
      { name: 'Masaje relajante', category: 'massage', duration: 60, price: 55 },
      { name: 'Masaje de tejido profundo', category: 'massage', duration: 60, price: 65 },
      { name: 'Masaje deportivo hombre', category: 'massage', duration: 50, price: 58 },
      { name: 'Masaje prenatal mujer', category: 'massage', duration: 55, price: 62 },
    ],
  },
];

/** Extra services so venue tabs (Hombres / Mujeres / Niños) have items for every business type. */
const AUDIENCE_SERVICES_BY_CATEGORY: Record<string, DemoService[]> = {
  hairService: [
    { name: 'Corte clásico para hombre', category: 'hairService', duration: 35, price: 35 },
    { name: 'Afeitado y arreglo de barba', category: 'hairService', duration: 30, price: 22 },
    { name: 'Peinado para mujer', category: 'hairService', duration: 40, price: 38 },
    { name: 'Balayage', category: 'hairService', duration: 60, price: 95 },
    { name: 'Highlights', category: 'hairService', duration: 90, price: 120 },
    { name: 'Corte para niño', category: 'hairService', duration: 30, price: 25 },
    { name: 'Peinado infantil', category: 'hairService', duration: 35, price: 28 },
    { name: 'Corte y peinado para niña', category: 'hairService', duration: 40, price: 30 },
  ],
  barber: [
    { name: 'Corte clásico para hombre', category: 'barber', duration: 30, price: 18 },
    { name: 'Fade & Beard Trim', category: 'barber', duration: 45, price: 25 },
    { name: 'Afeitado tradicional', category: 'barber', duration: 25, price: 15 },
    { name: 'Corte para niño', category: 'barber', duration: 25, price: 14 },
  ],
  spaService: [
    { name: 'Masaje relajante', category: 'spaService', duration: 60, price: 65 },
    { name: 'Masaje deportivo hombre', category: 'spaService', duration: 50, price: 70 },
    { name: 'Facial hidratante mujer', category: 'spaService', duration: 45, price: 55 },
    { name: 'Deep Tissue Massage', category: 'spaService', duration: 60, price: 85 },
    { name: 'HydraFacial', category: 'spaService', duration: 45, price: 120 },
    { name: 'Tratamiento spa para niños', category: 'spaService', duration: 40, price: 45 },
  ],
  massage: [
    { name: 'Masaje relajante', category: 'massage', duration: 60, price: 55 },
    { name: 'Masaje de tejido profundo', category: 'massage', duration: 60, price: 65 },
    { name: 'Masaje deportivo hombre', category: 'massage', duration: 50, price: 58 },
    { name: 'Masaje prenatal mujer', category: 'massage', duration: 55, price: 62 },
  ],
  nailCare: [
    { name: 'Manicure clásica', category: 'nailCare', duration: 40, price: 22 },
    { name: 'Pedicure spa', category: 'nailCare', duration: 55, price: 32 },
    { name: 'Uñas en gel', category: 'nailCare', duration: 75, price: 45 },
    { name: 'Manicure para niña', category: 'nailCare', duration: 30, price: 16 },
  ],
  beautyService: [
    { name: 'Maquillaje social', category: 'beautyService', duration: 60, price: 55 },
    { name: 'Diseño de cejas', category: 'beautyService', duration: 30, price: 18 },
    { name: 'Extensiones de pestañas', category: 'beautyService', duration: 90, price: 75 },
    { name: 'Peinado para mujer', category: 'beautyService', duration: 45, price: 40 },
  ],
  estetica: [
    { name: 'Limpieza facial profunda', category: 'estetica', duration: 60, price: 55 },
    { name: 'Depilación con cera', category: 'estetica', duration: 45, price: 35 },
    { name: 'Tratamiento anti-edad mujer', category: 'estetica', duration: 75, price: 90 },
    { name: 'Masaje relajante mujer', category: 'estetica', duration: 50, price: 48 },
  ],
  yoga: [
    { name: 'Yoga Vinyasa', category: 'yoga', duration: 60, price: 20 },
    { name: 'Yoga para hombres', category: 'yoga', duration: 60, price: 20 },
    { name: 'Yoga para mujeres', category: 'yoga', duration: 60, price: 20 },
    { name: 'Pilates mat', category: 'yoga', duration: 55, price: 22 },
    { name: 'Yoga para niños', category: 'yoga', duration: 45, price: 16 },
  ],
  tattoo: [
    { name: 'Consulta de diseño', category: 'tattoo', duration: 30, price: 0 },
    { name: 'Tatuaje pequeño', category: 'tattoo', duration: 60, price: 80 },
    { name: 'Tatuaje mediano', category: 'tattoo', duration: 120, price: 180 },
    { name: 'Retoque de tatuaje', category: 'tattoo', duration: 45, price: 50 },
  ],
  dermatology: [
    { name: 'Consulta dermatológica', category: 'dermatology', duration: 30, price: 65 },
    { name: 'Peeling químico', category: 'dermatology', duration: 45, price: 95 },
    { name: 'Tratamiento de acné', category: 'dermatology', duration: 40, price: 75 },
    { name: 'Revisión de lunares', category: 'dermatology', duration: 25, price: 50 },
  ],
};

function primaryCategoryKey(categoryKeys: string[]): string {
  const keys = (categoryKeys ?? []).filter(Boolean);
  if (keys.length === 0) return 'hairService';
  return keys[0];
}

function audiencePackForBusiness(categoryKeys: string[]): DemoService[] {
  const seen = new Set<string>();
  const merged: DemoService[] = [];
  for (const key of categoryKeys.length > 0 ? categoryKeys : ['hairService']) {
    const pack = AUDIENCE_SERVICES_BY_CATEGORY[key];
    if (!pack) continue;
    for (const svc of pack) {
      const id = svc.name.trim().toLowerCase();
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push({ ...svc, category: key });
    }
  }
  if (merged.length > 0) return merged;
  return AUDIENCE_SERVICES_BY_CATEGORY.hairService ?? [];
}

@Injectable()
export class CategoryDemoSeedService {
  private readonly logger = new Logger(CategoryDemoSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Fix S3 case mismatch: lowercase massage.jpg → Massage.jpg */
  private async repairBrokenMassageImages(): Promise<number> {
    const broken = '/defaults/categories/massage.jpg';
    const fixed = '/defaults/categories/Massage.jpg';
    let updated = 0;

    const categories = await this.prisma.category.findMany({
      where: { imageUrl: { contains: broken } },
    });
    for (const c of categories) {
      await this.prisma.category.update({
        where: { id: c.id },
        data: { imageUrl: (c.imageUrl || '').replace(broken, fixed) },
      });
      updated += 1;
    }

    const businesses = await this.prisma.business.findMany({
      select: { id: true, bannerUrl: true, logoUrl: true, images: true },
    });
    for (const b of businesses) {
      const hasBroken =
        b.bannerUrl?.includes(broken) ||
        b.logoUrl?.includes(broken) ||
        (b.images ?? []).some((u) => u.includes(broken));
      if (!hasBroken) continue;
      const images = (b.images ?? []).map((u) => (u.includes(broken) ? u.replace(broken, fixed) : u));
      await this.prisma.business.update({
        where: { id: b.id },
        data: {
          bannerUrl: b.bannerUrl?.includes(broken) ? b.bannerUrl.replace(broken, fixed) : b.bannerUrl,
          logoUrl: b.logoUrl?.includes(broken) ? b.logoUrl.replace(broken, fixed) : b.logoUrl,
          images,
        },
      });
      updated += 1;
    }

    return updated;
  }

  private async ensureAudienceServicesForAllBusinesses(): Promise<{ businessesUpdated: number; servicesAdded: number }> {
    const businesses = await this.prisma.business.findMany({
      where: businessDiscoveryWhere,
      select: { id: true, name: true, categoryKeys: true },
    });

    let businessesUpdated = 0;
    let servicesAdded = 0;

    for (const business of businesses) {
      const pack = audiencePackForBusiness(business.categoryKeys ?? []);
      let addedForBusiness = 0;

      for (const svc of pack) {
        const categoryKey = primaryCategoryKey(business.categoryKeys ?? []);
        const found = await this.prisma.service.findFirst({
          where: { businessId: business.id, name: svc.name },
        });
        if (!found) {
          await this.prisma.service.create({
            data: {
              name: svc.name,
              price: svc.price,
              duration: svc.duration,
              category: svc.category || categoryKey,
              businessId: business.id,
            },
          });
          addedForBusiness += 1;
          servicesAdded += 1;
        }
      }

      if (addedForBusiness > 0) {
        businessesUpdated += 1;
        this.logger.log(`Audience services +${addedForBusiness} → ${business.name}`);
      }
    }

    return { businessesUpdated, servicesAdded };
  }

  async run(): Promise<{
    demoBusinesses: number;
    demoServicesAdded: number;
    audienceBusinessesUpdated: number;
    audienceServicesAdded: number;
    imagesRepaired: number;
    servicesAdded: number;
  }> {
    let demoServicesAdded = 0;

    await this.prisma.category.upsert({
      where: { key: 'massage' },
      update: { active: true, labelEn: 'Massage', labelEs: 'Masaje', sortOrder: 55, imageUrl: MASSAGE_CATEGORY_IMAGE },
      create: {
        key: 'massage',
        labelEn: 'Massage',
        labelEs: 'Masaje',
        sortOrder: 55,
        active: true,
        imageUrl: MASSAGE_CATEGORY_IMAGE,
      },
    });
    await this.prisma.category.upsert({
      where: { key: 'beautyService' },
      update: { active: true, labelEn: 'Beauty', labelEs: 'Belleza', sortOrder: 40 },
      create: {
        key: 'beautyService',
        labelEn: 'Beauty',
        labelEs: 'Belleza',
        sortOrder: 40,
        active: true,
        imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&fit=crop',
      },
    });

    for (const demo of CATEGORY_DEMOS) {
      const gallery = [demo.bannerUrl, demo.logoUrl];
      const businessData = {
        name: demo.name,
        owner: demo.owner,
        phone: '+507 600-0000',
        address: demo.address,
        description: demo.description,
        taxId: `DEMO-${demo.key.toUpperCase()}`,
        categoryKeys: [demo.key],
        categoryLabels: [demo.key],
        amenityKeys: ['wifi', 'parking', 'card_payment'],
        status: 'active',
        listingVisible: true,
        profileSetupComplete: true,
        latitude: demo.lat,
        longitude: demo.lng,
        bannerUrl: demo.bannerUrl,
        logoUrl: demo.logoUrl,
        images: gallery,
        workingHours: DEFAULT_HOURS,
        plan: 'Premium',
        planId: 'premium',
      };

      const existing = await this.prisma.business.findUnique({ where: { email: demo.email } });
      const business = existing
        ? await this.prisma.business.update({ where: { id: existing.id }, data: businessData })
        : await this.prisma.business.create({
            data: {
              ...businessData,
              email: demo.email,
              merchantNumber: await allocateMerchantNumber(this.prisma),
            },
          });

      for (const svc of demo.services) {
        const found = await this.prisma.service.findFirst({
          where: { businessId: business.id, name: svc.name },
        });
        if (!found) {
          await this.prisma.service.create({ data: { ...svc, businessId: business.id } });
          demoServicesAdded += 1;
        }
      }

      const staffExists = await this.prisma.staff.findFirst({ where: { businessId: business.id } });
      if (!staffExists) {
        const services = await this.prisma.service.findMany({ where: { businessId: business.id }, take: 4 });
        await this.prisma.staff.create({
          data: {
            name: `${demo.owner.split(' ')[0]} Pro`,
            role: demo.key === 'barber' ? 'Barber' : 'Specialist',
            skills: demo.services.slice(0, 2).map((s) => s.name),
            serviceIds: services.map((s) => s.id),
            availability: 'Mon-Sat',
            businessId: business.id,
          },
        });
      }

      this.logger.log(`Seeded category demo: ${demo.key} → ${business.name}`);
    }

    const audience = await this.ensureAudienceServicesForAllBusinesses();
    const imagesRepaired = await this.repairBrokenMassageImages();

    return {
      demoBusinesses: CATEGORY_DEMOS.length,
      demoServicesAdded,
      audienceBusinessesUpdated: audience.businessesUpdated,
      audienceServicesAdded: audience.servicesAdded,
      imagesRepaired,
      servicesAdded: demoServicesAdded + audience.servicesAdded,
    };
  }
}
