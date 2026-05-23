/**
 * Inserts default customer-service FAQs for the booking marketplace (idempotent by questionEn).
 *
 * Usage: cd Backend && node scripts/seed-customer-faqs.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUSINESS_FAQS = [
  {
    questionEn: 'How do I book an appointment at a salon or barbershop?',
    questionEs: '¿Cómo reservo una cita en un salón o barbería?',
    answerEn:
      'Search for a business on the home or map page, open their profile, choose services and a time, then submit your booking request. Once the business approves, you can pay from My Reservations in your profile.',
    answerEs:
      'Busca un negocio en inicio o en el mapa, abre su perfil, elige servicios y horario, y envía tu solicitud. Cuando el negocio la apruebe, podrás pagar desde Mis reservas en tu perfil.',
    sortOrder: 0,
  },
  {
    questionEn: 'How do I cancel a reservation?',
    questionEs: '¿Cómo cancelo una reserva?',
    answerEn:
      'Open your profile, go to My Reservations, select the booking, and cancel if the business allows it. Cancellation rules depend on each salon or barbershop.',
    answerEs:
      'Abre tu perfil, ve a Mis reservas, selecciona la cita y cancela si el negocio lo permite. Las reglas dependen de cada salón o barbería.',
    sortOrder: 1,
  },
  {
    questionEn: 'What happens after I submit a booking request?',
    questionEs: '¿Qué pasa después de enviar una solicitud de reserva?',
    answerEn:
      'Your request is sent to the business as Pending. They review availability and confirm or propose a new time. You receive an in-app notification and email (when enabled) when the status changes.',
    answerEs:
      'Tu solicitud se envía al negocio como Pendiente. Ellos revisan disponibilidad y confirman o proponen otro horario. Recibirás notificación en la app y correo (si está activo) cuando cambie el estado.',
    sortOrder: 2,
  },
  {
    questionEn: 'Is it safe to pay through Rezervame?',
    questionEs: '¿Es seguro pagar con Rezervame?',
    answerEn:
      'Yes. Card payments are processed securely through Stripe. We never store your full card number on our servers. You may also pay with Yappy or cash at the venue when the business offers those options.',
    answerEs:
      'Sí. Los pagos con tarjeta se procesan de forma segura con Stripe. No guardamos el número completo de tu tarjeta. También puedes pagar con Yappy o en efectivo en el local si el negocio lo ofrece.',
    sortOrder: 3,
  },
  {
    questionEn: 'Can I pay with cash or Yappy at the salon?',
    questionEs: '¿Puedo pagar en efectivo o con Yappy en el salón?',
    answerEn:
      'Many businesses accept card online, Yappy, or cash at the venue. Available methods are shown when you pay from My Reservations after your booking is confirmed.',
    answerEs:
      'Muchos negocios aceptan tarjeta en línea, Yappy o efectivo en el local. Los métodos disponibles se muestran al pagar desde Mis reservas cuando tu cita está confirmada.',
    sortOrder: 4,
  },
  {
    questionEn: 'Can I book appointments for a family member?',
    questionEs: '¿Puedo reservar citas para un familiar?',
    answerEn:
      'Yes. Add family members in your profile, then when booking select who the service is for. Each service in a group booking can be assigned to you or a family member.',
    answerEs:
      'Sí. Agrega familiares en tu perfil y al reservar indica para quién es el servicio. Cada servicio en una reserva grupal puede asignarse a ti o a un familiar.',
    sortOrder: 5,
  },
  {
    questionEn: 'How do I reschedule or change my appointment?',
    questionEs: '¿Cómo reprogramo o cambio mi cita?',
    answerEn:
      'If the business offers rescheduling, they may send you a new time to approve from My Reservations. For other changes, contact the business through their venue page or open a support ticket here.',
    answerEs:
      'Si el negocio permite reprogramar, puede enviarte un nuevo horario para aprobar desde Mis reservas. Para otros cambios, contacta al negocio en su página o abre un ticket de soporte aquí.',
    sortOrder: 6,
  },
  {
    questionEn: 'How do I find barbershops and salons near me?',
    questionEs: '¿Cómo encuentro barberías y salones cerca de mí?',
    answerEn:
      'Use Search to browse on the map or list view. Allow location access for distance sorting, or search by city and category (barbershop, spa, nails, and more).',
    answerEs:
      'Usa Buscar para ver mapa o lista. Activa ubicación para ordenar por distancia, o busca por ciudad y categoría (barbería, spa, uñas y más).',
    sortOrder: 7,
  },
  {
    questionEn: 'What fees appear on my booking total?',
    questionEs: '¿Qué cargos aparecen en el total de mi reserva?',
    answerEn:
      'Your total includes the service price, a platform service fee (commission), and any tax set by the business. The breakdown is shown before you pay or submit your booking request.',
    answerEs:
      'El total incluye el precio del servicio, una comisión de plataforma y los impuestos del negocio. El desglose se muestra antes de pagar o enviar la solicitud.',
    sortOrder: 8,
  },
  {
    questionEn: 'How do I get help with a specific business or booking?',
    questionEs: '¿Cómo obtengo ayuda con un negocio o reserva específica?',
    answerEn:
      'Sign in and use the support ticket form above with your booking details and a screenshot if needed. Our team coordinates with merchants on the platform. For urgent day-of issues, call the salon directly using the contact info on their profile.',
    answerEs:
      'Inicia sesión y usa el formulario de soporte arriba con los datos de tu reserva y una captura si hace falta. Nuestro equipo coordina con los comercios. Para urgencias el mismo día, llama al salón usando el contacto en su perfil.',
    sortOrder: 9,
  },
  {
    questionEn: 'I am a business owner. How do I join Rezervame?',
    questionEs: 'Soy dueño de un negocio. ¿Cómo me registro en Rezervame?',
    answerEn:
      'Go to Register your business on our website, complete your profile, services, staff, and hours. After admin verification, customers can discover and book you online.',
    answerEs:
      'Ve a Registrar tu negocio en el sitio, completa perfil, servicios, personal y horarios. Tras la verificación del administrador, los clientes podrán encontrarte y reservar en línea.',
    sortOrder: 10,
  },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const faq of BUSINESS_FAQS) {
    const exists = await prisma.customerServiceFaq.findFirst({
      where: { questionEn: faq.questionEn },
    });
    if (exists) {
      skipped += 1;
      continue;
    }
    await prisma.customerServiceFaq.create({
      data: { ...faq, active: true },
    });
    created += 1;
  }
  const total = await prisma.customerServiceFaq.count({ where: { active: true } });
  console.log(`Customer FAQs: ${created} added, ${skipped} already present. Active total: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
