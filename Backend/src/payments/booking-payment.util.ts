import { BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export async function finalizeBookingGroupPayment(
  prisma: PrismaService,
  user: User,
  bookingIds: string[],
  paymentMethod: string,
): Promise<{ ok: true; transactionId: string; total: number }> {
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    throw new BadRequestException('bookingIds must be a non-empty array');
  }

  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds }, userId: user.id },
    include: { staff: true, business: true, service: true },
  });
  if (bookings.length === 0) throw new BadRequestException('No valid bookings found');

  const payableBookings = bookings.filter(
    (b) => b.status !== 'Cancelled' && b.status !== 'Rejected' && b.status !== 'Completed',
  );
  if (payableBookings.length === 0) {
    throw new BadRequestException('All bookings are already completed or cancelled');
  }

  const businessId = payableBookings[0].businessId;
  const totalAmount = payableBookings.reduce((sum, b) => sum + b.price, 0);
  const totalTax = payableBookings.reduce((sum, b) => sum + (b.taxAmount || 0), 0);
  const staffNames = [...new Set(payableBookings.map((b) => b.staff?.name).filter(Boolean))].join(', ');
  const serviceNames = payableBookings.map((b) => b.service?.name || 'Service').join(', ');

  const transaction = await prisma.transaction.create({
    data: {
      bookingId: payableBookings[0].id,
      businessId,
      amount: totalAmount + totalTax,
      taxAmount: totalTax,
      status: 'Completed',
      paymentMethod,
      description: serviceNames,
      customerEmail: user.email,
      staffMember: staffNames || null,
      bookings: { connect: payableBookings.map((b) => ({ id: b.id })) },
    },
  });

  await prisma.business.update({
    where: { id: businessId },
    data: { revenue: { increment: totalAmount + totalTax } },
  });

  await prisma.booking.updateMany({
    where: { id: { in: payableBookings.map((b) => b.id) } },
    data: { status: 'Paid', transactionId: transaction.id },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      role: user.role,
      type: 'PAYMENT_COMPLETED',
      title: 'Payment received',
      body: `Your payment of $${(totalAmount + totalTax).toFixed(2)} was processed successfully.`,
    },
  });

  return { ok: true, transactionId: transaction.id, total: totalAmount + totalTax };
}
