import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'reservation_details_screen.dart';

class MyReservationsScreen extends StatelessWidget {
  const MyReservationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final reservations = [
      {
        'id': 1,
        'venueName': 'Luxe Hair Studio',
        'service': 'featCut'.tr(),
        'date': 'Today, Mar 30',
        'time': '3:00 PM',
        'status': 'resConfirmed',
        'price': '\$45.00',
        'img': '1560066984-138dadb4c035',
      },
      {
        'id': 2,
        'venueName': 'Nail Society',
        'service': 'featNails'.tr(),
        'date': 'Apr 02, 2026',
        'time': '11:00 AM',
        'status': 'resUpcoming',
        'price': '\$25.00',
        'img': '1522337660859-02fbefca4702',
      },
      {
        'id': 3,
        'venueName': 'The Gentlemen\'s Club',
        'service': 'servMenCut'.tr(),
        'date': 'Apr 05, 2026',
        'time': '10:30 AM',
        'status': 'resUpcoming',
        'price': '\$35.00',
        'img': '1503951914875-452162b0f3f1',
      },
      {
        'id': 4,
        'venueName': 'Bliss Beauty Spa',
        'service': 'featMassage'.tr(),
        'date': 'Mar 15, 2026',
        'time': '2:00 PM',
        'status': 'resPast',
        'price': '\$85.00',
        'img': '1544161515-4ab6ce6db874',
      },
      {
        'id': 5,
        'venueName': 'Urban Barber',
        'service': 'tagFades'.tr(),
        'date': 'Feb 28, 2026',
        'time': '5:00 PM',
        'status': 'resConfirmed',
        'price': '\$30.00',
        'img': '1585747860715-2ba37e788b70',
      },
      {
        'id': 6,
        'venueName': 'Aura Skin Care',
        'service': 'tagSkin'.tr(),
        'date': 'Apr 10, 2026',
        'time': '09:00 AM',
        'status': 'resUpcoming',
        'price': '\$120.00',
        'img': '1564832486372-f628308223a7',
      },
      {
        'id': 7,
        'venueName': 'Elite Aesthetics',
        'service': 'tagLaser'.tr(),
        'date': 'Jan 15, 2026',
        'time': '11:30 AM',
        'status': 'resConfirmed',
        'price': '\$200.00',
        'img': '1522337660859-02fbefca4702',
      },
      {
        'id': 8,
        'venueName': 'Modern Nails',
        'service': 'tagNails'.tr(),
        'date': 'May 01, 2026',
        'time': '04:00 PM',
        'status': 'resUpcoming',
        'price': '\$55.00',
        'img': '1519014816541-da1916305741',
      },
      {
        'id': 9,
        'venueName': 'Viking Barber',
        'service': 'tagShave'.tr(),
        'date': 'Dec 20, 2025',
        'time': '01:00 PM',
        'status': 'resCancelled',
        'price': '\$40.00',
        'img': '1532715088550-62f09305f765',
      },
      {
        'id': 10,
        'venueName': 'Serene Yoga Center',
        'service': 'tagYoga'.tr(),
        'date': 'Apr 22, 2026',
        'time': '07:00 AM',
        'status': 'resUpcoming',
        'price': '\$40.00',
        'img': '1544367562803-44252e3c46aa',
      },
      {
        'id': 11,
        'venueName': 'Glow Tanning',
        'service': 'tagSpray'.tr(),
        'date': 'Jun 10, 2026',
        'time': '06:00 PM',
        'status': 'resUpcoming',
        'price': '\$35.00',
        'img': '1562322140-10f67175f053',
      },
      {
        'id': 12,
        'venueName': 'Diamond Dental',
        'service': 'tagWhite'.tr(),
        'date': 'Jul 15, 2026',
        'time': '10:00 AM',
        'status': 'resUpcoming',
        'price': '\$150.00',
        'img': '1588776814546-1ffcf47267a5',
      },
      {
        'id': 13,
        'venueName': 'Brows & Co',
        'service': 'tagMicro'.tr(),
        'date': 'Aug 05, 2026',
        'time': '02:30 PM',
        'status': 'resUpcoming',
        'price': '\$250.00',
        'img': '1487515201422-2252b45a80b0',
      },
      {
        'id': 14,
        'venueName': 'Rustic Grooming',
        'service': 'tagCut'.tr(),
        'date': 'Sep 12, 2026',
        'time': '11:00 AM',
        'status': 'resUpcoming',
        'price': '\$45.00',
        'img': '1503951914875-452162b0f3f1',
      },
      {
        'id': 15,
        'venueName': 'Velvet Spa',
        'service': 'tagMassage'.tr(),
        'date': 'Oct 20, 2026',
        'time': '03:00 PM',
        'status': 'resUpcoming',
        'price': '\$75.00',
        'img': '1544161515-4ab6ce6db874',
      },
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.black, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'reservations'.tr(), 
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 20),
        ),
        centerTitle: false,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        itemCount: reservations.length,
        itemBuilder: (context, index) {
          final res = reservations[index];
          return GestureDetector(
            onTap: () => Navigator.push(
              context, 
              MaterialPageRoute(builder: (context) => ReservationDetailsScreen(reservation: res))
            ),
            child: Container(
              margin: const EdgeInsets.only(bottom: 20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade100),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  )
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      image: DecorationImage(
                        image: NetworkImage('https://images.unsplash.com/photo-${res['img']}?q=80&w=200&fit=crop'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              res['status'].toString().tr(),
                              style: TextStyle(
                                color: (res['status'] == 'resConfirmed') ? Colors.green : (res['status'] == 'resCancelled' ? Colors.red : Colors.blue),
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              res['price'] as String,
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          res['venueName'] as String,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1e293b)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          res['service'] as String,
                          style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.calendar_today_rounded, size: 12, color: Colors.grey.shade400),
                            const SizedBox(width: 6),
                            Text(
                              '${res['date']} • ${res['time']}',
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.chevron_right_rounded, color: Colors.grey.shade300),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
