import { PrismaClient, Role } from '@prisma/client';
import { allocateMerchantNumber, backfillMerchantNumbers } from '../src/merchant-number.util';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rezervame.com' },
    update: {},
    create: { name: 'Platform Admin', email: 'admin@rezervame.com', password: 'password', role: Role.ADMIN },
  });
  const businessUser = await prisma.user.upsert({
    where: { email: 'owner@rezervame.com' },
    update: {},
    create: { name: 'Business Owner', email: 'owner@rezervame.com', password: 'password', role: Role.BUSINESS },
  });
  const businessUser2 = await prisma.user.upsert({
    where: { email: 'studio@rezervame.com' },
    update: {},
    create: { name: 'Studio Owner', email: 'studio@rezervame.com', password: 'password', role: Role.BUSINESS },
  });
  const customer = await prisma.user.upsert({
    where: { email: 'customer@rezervame.com' },
    update: {},
    create: { name: 'Customer One', email: 'customer@rezervame.com', password: 'password', role: Role.USER },
  });

  await prisma.user.upsert({
    where: { email: 'walkin@rezervame.internal' },
    update: {},
    create: {
      name: 'Walk-in guest',
      email: 'walkin@rezervame.internal',
      password: '__internal_no_login__',
      role: Role.USER,
    },
  });

  const luxe = await prisma.business.upsert({
    where: { email: 'owner@rezervame.com' },
    update: {
      amenityKeys: ['wifi', 'parking', 'ac', 'coffee', 'card_payment', 'tv', 'charging'],
      latitude: 34.0614,
      longitude: -118.4417,
      bannerUrl:
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&fit=crop',
    },
    create: {
      merchantNumber: await allocateMerchantNumber(prisma),
      name: 'Luxe Hair Studio',
      owner: businessUser.name,
      email: 'owner@rezervame.com',
      phone: '+1 555 122 3333',
      address: 'Westwood Blvd, Los Angeles, CA',
      description: 'Premium salon services — cuts, color, styling.',
      taxId: 'TAX-8899',
      categoryKeys: ['hairService'],
      amenityKeys: ['wifi', 'parking', 'ac', 'coffee', 'card_payment', 'tv', 'charging'],
      status: 'active',
      revenue: 32000,
      balance: 4500,
      latitude: 34.0614,
      longitude: -118.4417,
      bannerUrl:
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&fit=crop',
    },
  });

  const urban = await prisma.business.upsert({
    where: { email: 'studio@rezervame.com' },
    update: {
      amenityKeys: ['wifi', 'parking', 'kids_friendly', 'card_payment', 'water'],
      latitude: 34.0259,
      longitude: -118.4914,
      bannerUrl:
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1600&fit=crop',
    },
    create: {
      merchantNumber: await allocateMerchantNumber(prisma),
      name: 'Urban Grooming Co.',
      owner: businessUser2.name,
      email: 'studio@rezervame.com',
      phone: '+1 555 987 6543',
      address: 'Santa Monica Blvd, Los Angeles, CA',
      description: 'Fast cuts and beard trims for busy professionals.',
      taxId: 'TAX-9900',
      categoryKeys: ['barber'],
      amenityKeys: ['wifi', 'parking', 'kids_friendly', 'card_payment', 'water'],
      status: 'active',
      revenue: 18500,
      balance: 2100,
      latitude: 34.0259,
      longitude: -118.4914,
      bannerUrl:
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1600&fit=crop',
    },
  });

  let haircut = await prisma.service.findFirst({
    where: { businessId: luxe.id, name: 'Haircut & Style' },
  });
  if (!haircut) {
    haircut = await prisma.service.create({
      data: { name: 'Haircut & Style', category: 'Hair', duration: 45, price: 45, businessId: luxe.id },
    });
  }

  let beard = await prisma.service.findFirst({
    where: { businessId: urban.id, name: 'Beard Trim' },
  });
  if (!beard) {
    beard = await prisma.service.create({
      data: { name: 'Beard Trim', category: 'Grooming', duration: 30, price: 28, businessId: urban.id },
    });
  }

  const existingBookings = await prisma.booking.count({ where: { userId: customer.id } });
  if (existingBookings === 0) {
    await prisma.booking.createMany({
      data: [
        {
          customerName: customer.name,
          date: new Date(),
          status: 'Pending',
          price: haircut.price,
          userId: customer.id,
          serviceId: haircut.id,
          businessId: luxe.id,
        },
        {
          customerName: customer.name,
          date: new Date(Date.now() - 86400000 * 5),
          status: 'Completed',
          price: haircut.price,
          userId: customer.id,
          serviceId: haircut.id,
          businessId: luxe.id,
        },
        {
          customerName: customer.name,
          date: new Date(Date.now() - 86400000 * 12),
          status: 'Completed',
          price: beard.price,
          userId: customer.id,
          serviceId: beard.id,
          businessId: urban.id,
        },
      ],
    });
  }

  const txCount = await prisma.transaction.count({ where: { businessId: luxe.id } });
  if (txCount === 0) {
    await prisma.transaction.createMany({
      data: [
        { businessId: luxe.id, amount: 45, status: 'completed', type: 'Earning' },
        { businessId: luxe.id, amount: 45, status: 'completed', type: 'Earning' },
        { businessId: urban.id, amount: 28, status: 'completed', type: 'Earning' },
      ],
    });
  }

  const wd = await prisma.withdrawal.count({ where: { businessId: luxe.id } });
  if (wd === 0) {
    await prisma.withdrawal.create({
      data: { businessId: luxe.id, amount: 150, balance: 4500, status: 'pending' },
    });
  }

  const rv = await prisma.review.count({ where: { userId: customer.id } });
  if (rv === 0) {
    await prisma.review.createMany({
      data: [
        {
          customerName: customer.name,
          rating: 5,
          comment: 'Excellent cut — will book again.',
          serviceName: haircut.name,
          staffName: 'Marco Tulio',
          userId: customer.id,
          businessId: luxe.id,
        },
        {
          customerName: customer.name,
          rating: 4,
          comment: 'Quick and professional.',
          serviceName: beard.name,
          staffName: 'Alex Rivera',
          userId: customer.id,
          businessId: urban.id,
        },
      ],
    });
  }

  const staffLuxe = await prisma.staff.findFirst({ where: { businessId: luxe.id } });
  if (!staffLuxe) {
    await prisma.staff.create({
      data: {
        name: 'Marco Tulio',
        role: 'Stylist',
        skills: ['Haircut', 'Styling'],
        serviceIds: [haircut.id],
        availability: 'Mon-Fri',
        businessId: luxe.id,
      },
    });
  }
  const staffUrban = await prisma.staff.findFirst({ where: { businessId: urban.id } });
  if (!staffUrban) {
    await prisma.staff.create({
      data: {
        name: 'Alex Rivera',
        role: 'Barber',
        skills: ['Beard', 'Fade'],
        serviceIds: [beard.id],
        availability: 'Tue-Sat',
        businessId: urban.id,
      },
    });
  }

  const mach = await prisma.machine.findFirst({ where: { businessId: luxe.id } });
  if (!mach) {
    await prisma.machine.create({
      data: {
        serial: `SN-LUXE-${luxe.id.slice(0, 6)}`,
        qrCode: `QR-LUXE-${luxe.id.slice(0, 6)}`,
        status: 'active',
        businessId: luxe.id,
      },
    });
  }

  const welcome = await prisma.notification.findFirst({ where: { title: 'Welcome to Rezervame' } });
  if (!welcome) {
    await prisma.notification.createMany({
      data: [
        {
          type: 'SYSTEM',
          title: 'Welcome to Rezervame',
          body: `Live data — admin ${admin.email} / customer ${customer.email} / password: password`,
          role: Role.USER,
        },
        {
          type: 'ORDER_UPDATE',
          title: 'Booking reminder',
          body: 'You have an upcoming appointment at Luxe Hair Studio.',
          role: Role.USER,
        },
      ],
    });
  }

  if ((await prisma.event.count()) === 0) {
    await prisma.event.createMany({
      data: [
        {
          title: 'Style & Connect LA',
          body: 'Network with top stylists and book live demos.',
          startAt: new Date(Date.now() + 86400000 * 7),
          location: 'Downtown Los Angeles, CA',
          price: 45,
          imageKey: '1585747860715-2ba37e788b70',
          active: true,
        },
        {
          title: 'Bridal Preview Day',
          body: 'Complimentary consults and portfolio reviews.',
          startAt: new Date(Date.now() + 86400000 * 14),
          location: 'Santa Monica, CA',
          price: 0,
          imageKey: '1503951914875-452162b0f3f1',
          active: true,
        },
      ],
    });
  }

  if ((await prisma.jobPosting.count()) === 0) {
    await prisma.jobPosting.createMany({
      data: [
        {
          title: 'Senior Stylist',
          location: 'Westwood, Los Angeles, CA',
          description: '5+ years experience, color and cut specialist. Full benefits.',
          active: true,
        },
        {
          title: 'Front Desk Coordinator',
          location: 'Santa Monica, CA',
          description: 'Full-time scheduling and guest experience.',
          active: true,
        },
        {
          title: 'Apprentice Barber',
          location: 'Los Angeles, CA',
          description: 'Paid training with lead barbers.',
          active: true,
        },
      ],
    });
  }

  if ((await prisma.userFavorite.count({ where: { userId: customer.id } })) === 0) {
    await prisma.userFavorite.createMany({
      data: [
        { userId: customer.id, businessId: luxe.id },
        { userId: customer.id, businessId: urban.id },
      ],
    });
  }

  const categorySeed = [
    {
      key: 'hairService',
      labelEn: 'Hair',
      labelEs: 'Peluqueria',
      sortOrder: 10,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&fit=crop',
    },
    {
      key: 'spaService',
      labelEn: 'Spa',
      labelEs: 'Spa',
      sortOrder: 20,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&fit=crop',
    },
    {
      key: 'nailCare',
      labelEn: 'Nails',
      labelEs: 'Manicura',
      sortOrder: 30,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?q=80&w=600&fit=crop',
    },
    {
      key: 'beautyService',
      labelEn: 'Beauty',
      labelEs: 'Belleza',
      sortOrder: 40,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&fit=crop',
    },
    {
      key: 'barber',
      labelEn: 'Barber',
      labelEs: 'Barberia',
      sortOrder: 50,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=600&fit=crop',
    },
  ];
  for (const c of categorySeed) {
    await prisma.category.upsert({
      where: { key: c.key },
      update: c,
      create: c,
    });
  }

  const amenitySeed: Array<{
    key: string;
    labelEn: string;
    labelEs: string;
    descriptionEn?: string;
    descriptionEs?: string;
    sortOrder: number;
    active: boolean;
  }> = [
    {
      key: 'wifi',
      labelEn: 'Free Wi‑Fi',
      labelEs: 'Wi‑Fi gratis',
      descriptionEn: 'High-speed guest network',
      descriptionEs: 'Red de alta velocidad',
      sortOrder: 10,
      active: true,
    },
    {
      key: 'parking',
      labelEn: 'Parking',
      labelEs: 'Estacionamiento',
      descriptionEn: 'On-site or nearby parking',
      descriptionEs: 'Estacionamiento en el lugar o cercano',
      sortOrder: 20,
      active: true,
    },
    {
      key: 'wheelchair',
      labelEn: 'Wheelchair accessible',
      labelEs: 'Accesible en silla de ruedas',
      sortOrder: 30,
      active: true,
    },
    {
      key: 'ac',
      labelEn: 'Air conditioning',
      labelEs: 'Aire acondicionado',
      sortOrder: 40,
      active: true,
    },
    {
      key: 'card_payment',
      labelEn: 'Card payment',
      labelEs: 'Pago con tarjeta',
      sortOrder: 50,
      active: true,
    },
    {
      key: 'coffee',
      labelEn: 'Complimentary drinks',
      labelEs: 'Bebidas de cortesía',
      descriptionEn: 'Coffee, tea, or water',
      descriptionEs: 'Café, té o agua',
      sortOrder: 60,
      active: true,
    },
    {
      key: 'tv',
      labelEn: 'TV & entertainment',
      labelEs: 'TV y entretenimiento',
      sortOrder: 70,
      active: true,
    },
    {
      key: 'charging',
      labelEn: 'Device charging',
      labelEs: 'Carga de dispositivos',
      sortOrder: 80,
      active: true,
    },
    {
      key: 'kids_friendly',
      labelEn: 'Kid-friendly',
      labelEs: 'Apto para niños',
      sortOrder: 90,
      active: true,
    },
    {
      key: 'water',
      labelEn: 'Water station',
      labelEs: 'Estación de agua',
      sortOrder: 100,
      active: true,
    },
    {
      key: 'pet_friendly',
      labelEn: 'Pet-friendly',
      labelEs: 'Mascotas bienvenidas',
      sortOrder: 110,
      active: true,
    },
    {
      key: 'shower',
      labelEn: 'Shower / locker',
      labelEs: 'Ducha / casilleros',
      sortOrder: 120,
      active: true,
    },
  ];
  for (const a of amenitySeed) {
    await prisma.amenity.upsert({
      where: { key: a.key },
      update: {
        labelEn: a.labelEn,
        labelEs: a.labelEs,
        descriptionEn: a.descriptionEn ?? null,
        descriptionEs: a.descriptionEs ?? null,
        sortOrder: a.sortOrder,
        active: a.active,
      },
      create: {
        key: a.key,
        labelEn: a.labelEn,
        labelEs: a.labelEs,
        descriptionEn: a.descriptionEn ?? null,
        descriptionEs: a.descriptionEs ?? null,
        sortOrder: a.sortOrder,
        active: a.active,
      },
    });
  }

  await backfillMerchantNumbers(prisma);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
