
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGroupedReview() {
  console.log('--- Testing Grouped Review Backend Logic ---');

  // 1. Find a user and some completed unreviewed bookings for them
  const user = await prisma.user.findFirst({
    where: { role: 'USER' }
  });

  if (!user) {
    console.error('No USER found');
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: { 
      userId: user.id,
      status: 'Completed',
      isReviewed: false
    },
    take: 2,
    include: { service: true, staff: true }
  });

  if (bookings.length < 2) {
    console.error('Need at least 2 completed unreviewed bookings for user', user.id);
    return;
  }

  console.log(`Found ${bookings.length} bookings for user ${user.name}`);

  // 2. Simulate the request body that mobile/reviews/group would receive
  const body = {
    businessRating: 4,
    comment: "Excellent overall experience!",
    services: bookings.map((b, i) => ({
      bookingId: b.id,
      serviceRating: 5 - i, // 5 for first, 4 for second
      staffRating: 5,
      comment: i === 1 ? "Staff was particularly good here" : undefined
    }))
  };

  console.log('Simulating POST mobile/reviews/group with body:', JSON.stringify(body, null, 2));

  // 3. Execute the logic (manually replicating what's in app.controller.ts)
  const reviews = [];
  for (let i = 0; i < body.services.length; i++) {
    const s = body.services[i];
    const booking = await prisma.booking.findUnique({
      where: { id: s.bookingId },
      include: { service: true, staff: true },
    });

    if (!booking || booking.userId !== user.id) {
        console.log(`Booking ${s.bookingId} not found or wrong user`);
        continue;
    }
    if (booking.status !== 'Completed' || booking.isReviewed) {
        console.log(`Booking ${s.bookingId} status: ${booking.status}, isReviewed: ${booking.isReviewed}`);
        continue;
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        businessId: booking.businessId,
        bookingId: booking.id,
        staffId: booking.staffId,
        customerName: user.name,
        avatar: user.avatar,
        staffRating: s.staffRating,
        businessRating: i === 0 ? body.businessRating : null,
        rating: s.serviceRating,
        comment: i === 0 ? body.comment : (s.comment || ''),
        serviceName: booking.service?.name || 'Service',
        staffName: booking.staff?.name || 'Staff',
        status: 'Pending',
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { isReviewed: true },
    });
    reviews.push(review);
  }

  console.log(`Created ${reviews.length} reviews.`);

  // 4. Verify the results
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    console.log(`Review ${i + 1}:`);
    console.log(`  Booking ID: ${r.bookingId}`);
    console.log(`  Business Rating: ${r.businessRating} (Expected: ${i === 0 ? body.businessRating : 'null'})`);
    console.log(`  Service Rating: ${r.rating} (Expected: ${body.services[i].serviceRating})`);
    console.log(`  Comment: "${r.comment}" (Expected: ${i === 0 ? body.comment : (body.services[i].comment || '')})`);
    
    if (i === 0 && r.businessRating !== body.businessRating) console.error('FAILED: First review missing businessRating');
    if (i > 0 && r.businessRating !== null) console.error('FAILED: Secondary review has businessRating');
  }

  console.log('--- Test Finished ---');
}

testGroupedReview().catch(e => console.error(e)).finally(() => prisma.$disconnect());
