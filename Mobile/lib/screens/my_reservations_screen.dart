import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'venue_details_screen.dart';

class MyReservationsScreen extends StatelessWidget {
  const MyReservationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final reservations = [
      {
        'id': 1,
        'venueName': 'Luxe Hair Studio',
        'service': 'Corte de Cabello Premium',
        'date': 'Today, Mar 30',
        'time': '3:00 PM',
        'status': 'Confirmed',
        'price': '\$45.00',
        'img': '1560066984-138dadb4c035',
      },
      {
        'id': 2,
        'venueName': 'Nail Society',
        'service': 'Manicura Spa',
        'date': 'Apr 02, 2026',
        'time': '11:00 AM',
        'status': 'Upcoming',
        'price': '\$25.00',
        'img': '1522337660859-02fbefca4702',
      },
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('myReservations'.tr(), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 20)),
        centerTitle: false,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: reservations.length,
        itemBuilder: (context, index) {
          final res = reservations[index];
          return Container(
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.grey.shade100),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 10))],
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
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
                                  res['status'] as String,
                                  style: TextStyle(
                                    color: (res['status'] == 'Confirmed') ? Colors.green : Colors.blue,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                Text(
                                  res['price'] as String,
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(res['venueName'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
                            const SizedBox(height: 4),
                            Text(res['service'] as String, style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 13)),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.calendar_today, size: 12, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text('${res['date']} • ${res['time']}', style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w700)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {},
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.grey.shade300),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('View Details', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                             Navigator.push(context, MaterialPageRoute(builder: (context) => VenueDetailsScreen(venue: {'id': res['id'], 'name': res['venueName'], 'img': res['img']})));
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFff5a5f),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Book Again', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }
}
