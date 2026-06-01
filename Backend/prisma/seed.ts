import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/auth/password.util';
import { allocateMerchantNumber, backfillMerchantNumbers } from '../src/merchant-number.util';

const prisma = new PrismaClient();

async function main() {
  const demoPassword = await hashPassword('password');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rezervame.com' },
    update: { password: demoPassword },
    create: { name: 'Platform Admin', email: 'admin@rezervame.com', password: demoPassword, role: Role.ADMIN },
  });
  const businessUser = await prisma.user.upsert({
    where: { email: 'owner@rezervame.com' },
    update: { password: demoPassword },
    create: { name: 'Business Owner', email: 'owner@rezervame.com', password: demoPassword, role: Role.BUSINESS },
  });
  const businessUser2 = await prisma.user.upsert({
    where: { email: 'studio@rezervame.com' },
    update: { password: demoPassword },
    create: { name: 'Studio Owner', email: 'studio@rezervame.com', password: demoPassword, role: Role.BUSINESS },
  });
  const businessUser3 = await prisma.user.upsert({
    where: { email: 'spa@rezervame.com' },
    update: { password: demoPassword },
    create: { name: 'Serenity Owner', email: 'spa@rezervame.com', password: demoPassword, role: Role.BUSINESS },
  });
  const customer = await prisma.user.upsert({
    where: { email: 'customer@rezervame.com' },
    update: { password: demoPassword },
    create: { name: 'Customer One', email: 'customer@rezervame.com', password: demoPassword, role: Role.USER },
  });
  await prisma.user.upsert({
    where: { email: 'ram@gmail.com' },
    update: { password: demoPassword, name: 'Ramed', phone: '87788778', gender: 'male' },
    create: {
      name: 'Ramed',
      email: 'ram@gmail.com',
      password: demoPassword,
      role: Role.USER,
      phone: '87788778',
      gender: 'male',
    },
  });

  await prisma.user.upsert({
    where: { email: 'walkin@rezervame.internal' },
    update: {},
    create: {
      name: 'Walk-in guest',
      email: 'walkin@rezervame.internal',
      password: await hashPassword('__internal_no_login__'),
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

  const serena = await prisma.business.upsert({
    where: { email: 'spa@rezervame.com' },
    update: {
      amenityKeys: ['wifi', 'parking', 'ac', 'coffee', 'card_payment', 'water', 'shower'],
      latitude: 8.9833,
      longitude: -79.5167,
      bannerUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&fit=crop',
    },
    create: {
      merchantNumber: await allocateMerchantNumber(prisma),
      name: 'Serenity Spa',
      owner: 'Serena Smith',
      email: 'spa@rezervame.com',
      phone: '+507 888-9999',
      address: 'Calle 50, Panama City, Panama',
      description: 'Luxury spa treatments, massages, and wellness rituals.',
      taxId: 'TAX-SPA-123',
      categoryKeys: ['spaService'],
      amenityKeys: ['wifi', 'parking', 'ac', 'coffee', 'card_payment', 'water', 'shower'],
      status: 'active',
      revenue: 55000,
      balance: 8200,
      latitude: 8.9833,
      longitude: -79.5167,
      bannerUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1600&fit=crop',
    },
  });

  let massage = await prisma.service.findFirst({
    where: { businessId: serena.id, name: 'Deep Tissue Massage' },
  });
  if (!massage) {
    massage = await prisma.service.create({
      data: { name: 'Deep Tissue Massage', category: 'Spa', duration: 60, price: 85, businessId: serena.id, imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fit=crop' },
    });
  }

  let facial = await prisma.service.findFirst({
    where: { businessId: serena.id, name: 'HydraFacial' },
  });
  if (!facial) {
    facial = await prisma.service.create({
      data: { name: 'HydraFacial', category: 'Spa', duration: 45, price: 120, businessId: serena.id, imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&fit=crop' },
    });
  }

  const txCount = await prisma.transaction.count({ where: { businessId: luxe.id } });
  if (txCount === 0) {
    await prisma.transaction.createMany({
      data: [
        { businessId: luxe.id, amount: 45, status: 'completed', type: 'Earning' },
        { businessId: luxe.id, amount: 45, status: 'completed', type: 'Earning' },
        { businessId: urban.id, amount: 28, status: 'completed', type: 'Earning' },
        { businessId: serena.id, amount: 85, status: 'completed', type: 'Earning' },
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
    {
      key: 'massage',
      labelEn: 'Massage',
      labelEs: 'Masaje',
      sortOrder: 55,
      active: true,
      imageUrl: 'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/massage.jpg',
    },
    {
      key: 'tattoo',
      labelEn: 'Tattoo studio',
      labelEs: 'Estudio de tatuajes',
      sortOrder: 60,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?q=80&w=600&fit=crop',
    },
    {
      key: 'yoga',
      labelEn: 'Yoga & fitness',
      labelEs: 'Yoga y fitness',
      sortOrder: 65,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&fit=crop',
    },
    {
      key: 'estetica',
      labelEn: 'Aesthetics center',
      labelEs: 'Centro de estética',
      sortOrder: 45,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&fit=crop',
    },
    {
      key: 'dermatology',
      labelEn: 'Dermatology / clinic',
      labelEs: 'Dermatología / clínica',
      sortOrder: 47,
      active: true,
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&fit=crop',
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

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'basic' },
    update: {},
    create: {
      id: 'basic',
      name: 'Basic',
      price: 0,
      billingCycle: 'monthly',
      features: ['Up to 50 bookings/month', 'Basic business profile', 'Email support'],
      active: true,
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'premium' },
    update: {},
    create: {
      id: 'premium',
      name: 'Premium',
      price: 29,
      billingCycle: 'monthly',
      features: ['Unlimited bookings', 'Marketing & Promotions', 'Advanced Analytics', '24/7 Priority support'],
      active: true,
    },
  });

  await prisma.business.updateMany({
    where: { email: { in: ['owner@rezervame.com', 'studio@rezervame.com', 'spa@rezervame.com'] } },
    data: { planId: premiumPlan.id, plan: 'Premium' },
  });

  const defaultFaqs = [
    {
      questionEn: 'How do I book an appointment at a salon or barbershop?',
      questionEs: '¿Cómo reservo una cita en un salón o barbería?',
      answerEn:
        'Search for a business on the home or map page, open their profile, choose services and a time, then submit your booking request. Once the business approves, you can pay from My Reservations in your profile.',
      answerEs:
        'Busca un negocio en inicio o en el mapa, abre su perfil, elige servicios y horario, y envía tu solicitud. Cuando el negocio la apruebe, podrás pagar desde Mis reservas en tu perfil.',
      sortOrder: 0,
      active: true,
    },
    {
      questionEn: 'How do I cancel a reservation?',
      questionEs: '¿Cómo cancelo una reserva?',
      answerEn:
        'Open your profile, go to My Reservations, select the booking, and cancel if the business allows it. Cancellation rules depend on each salon or barbershop.',
      answerEs:
        'Abre tu perfil, ve a Mis reservas, selecciona la cita y cancela si el negocio lo permite. Las reglas dependen de cada salón o barbería.',
      sortOrder: 1,
      active: true,
    },
    {
      questionEn: 'What happens after I submit a booking request?',
      questionEs: '¿Qué pasa después de enviar una solicitud de reserva?',
      answerEn:
        'Your request is sent to the business as Pending. They review availability and confirm or propose a new time. You receive a notification when the status changes.',
      answerEs:
        'Tu solicitud se envía al negocio como Pendiente. Ellos revisan disponibilidad y confirman o proponen otro horario. Recibirás notificación cuando cambie el estado.',
      sortOrder: 2,
      active: true,
    },
    {
      questionEn: 'Is it safe to pay through Rezervame?',
      questionEs: '¿Es seguro pagar con Rezervame?',
      answerEn:
        'Yes. Card payments are processed securely through Stripe. You may also pay with Yappy or cash at the venue when the business offers those options.',
      answerEs:
        'Sí. Los pagos con tarjeta se procesan con Stripe. También puedes pagar con Yappy o en efectivo en el local si el negocio lo ofrece.',
      sortOrder: 3,
      active: true,
    },
    {
      questionEn: 'Can I pay with cash or Yappy at the salon?',
      questionEs: '¿Puedo pagar en efectivo o con Yappy en el salón?',
      answerEn:
        'Many businesses accept card online, Yappy, or cash at the venue. Available methods are shown when you pay from My Reservations after your booking is confirmed.',
      answerEs:
        'Muchos negocios aceptan tarjeta en línea, Yappy o efectivo en el local. Los métodos se muestran al pagar desde Mis reservas cuando tu cita está confirmada.',
      sortOrder: 4,
      active: true,
    },
    {
      questionEn: 'Can I book appointments for a family member?',
      questionEs: '¿Puedo reservar citas para un familiar?',
      answerEn:
        'Yes. Add family members in your profile, then when booking select who the service is for.',
      answerEs:
        'Sí. Agrega familiares en tu perfil y al reservar indica para quién es el servicio.',
      sortOrder: 5,
      active: true,
    },
    {
      questionEn: 'How do I find barbershops and salons near me?',
      questionEs: '¿Cómo encuentro barberías y salones cerca de mí?',
      answerEn:
        'Use Search to browse on the map or list view. Allow location for distance sorting, or search by city and category.',
      answerEs:
        'Usa Buscar para ver mapa o lista. Activa ubicación para ordenar por distancia, o busca por ciudad y categoría.',
      sortOrder: 6,
      active: true,
    },
    {
      questionEn: 'What fees appear on my booking total?',
      questionEs: '¿Qué cargos aparecen en el total de mi reserva?',
      answerEn:
        'Your total includes the service price, a platform service fee, and any tax set by the business. The breakdown is shown before you pay.',
      answerEs:
        'El total incluye el precio del servicio, comisión de plataforma e impuestos del negocio. El desglose se muestra antes de pagar.',
      sortOrder: 7,
      active: true,
    },
    {
      questionEn: 'I am a business owner. How do I join Rezervame?',
      questionEs: 'Soy dueño de un negocio. ¿Cómo me registro en Rezervame?',
      answerEn:
        'Go to Register your business on our website, complete your profile, services, staff, and hours. After admin verification, customers can book you online.',
      answerEs:
        'Ve a Registrar tu negocio, completa perfil, servicios, personal y horarios. Tras verificación, los clientes podrán reservar en línea.',
      sortOrder: 8,
      active: true,
    },
  ];
  for (const faq of defaultFaqs) {
    const exists = await prisma.customerServiceFaq.findFirst({
      where: { questionEn: faq.questionEn },
    });
    if (!exists) {
      await prisma.customerServiceFaq.create({ data: faq });
    }
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
