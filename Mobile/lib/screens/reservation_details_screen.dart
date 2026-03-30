import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:qr_flutter/qr_flutter.dart';

class ReservationDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> reservation;

  const ReservationDetailsScreen({super.key, required this.reservation});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black, size: 24),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'viewDetails'.tr(),
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Venue Image & Status
            Stack(
              alignment: Alignment.topRight,
              children: [
                Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    image: DecorationImage(
                      image: NetworkImage('https://images.unsplash.com/photo-${reservation['img']}?q=80&w=600&fit=crop'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(100),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
                    ),
                    child: Text(
                      reservation['status'] == 'Confirmed' ? 'resConfirmed'.tr() : 'resUpcoming'.tr(),
                      style: TextStyle(
                        color: reservation['status'] == 'Confirmed' ? Colors.green : Colors.blue,
                        fontWeight: FontWeight.w900,
                        fontSize: 10,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Venue Name & Service
            Text(
              reservation['venueName'],
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF1e293b)),
            ),
            const SizedBox(height: 8),
            Text(
              reservation['service'],
              style: TextStyle(fontSize: 16, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 32),

            // Details Grid
            _buildDetailRow(Icons.location_on_outlined, 'location'.tr(), 'Calle 50, Plaza Sigma, Panama City'),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _buildDetailRow(Icons.calendar_today_outlined, 'dateLabel'.tr(), reservation['date'])),
                Expanded(child: _buildDetailRow(Icons.access_time_rounded, 'timeLabel'.tr(), reservation['time'])),
              ],
            ),
            const SizedBox(height: 20),
            _buildDetailRow(Icons.person_outline_rounded, 'professionalService'.tr(), 'Marco Tulio'),
            
            const Divider(height: 64, thickness: 1),

            // Services & Total
            Text(
              'servicesContracted'.tr().toUpperCase(),
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey.shade500, letterSpacing: 1.2),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(reservation['service'], style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                Text(reservation['price'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('totalLabel'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                  Text(reservation['price'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: Color(0xFFff5a5f))),
                ],
              ),
            ),

            const SizedBox(height: 48),

            // QR Code Section
            Center(
              child: Column(
                children: [
                  Text(
                    'ticketId'.tr().toUpperCase(),
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey.shade500, letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 8),
                  const Text('RZV-982-XKL', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 32),
                  QrImageView(
                    data: 'RZV-982-XKL',
                    version: QrVersions.auto,
                    size: 200.0,
                    eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                    dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'showCodeAtVenue'.tr(),
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 64),

            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: Colors.grey.shade300),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text('cancelAppointment'.tr(), style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w800)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text('editBooking'.tr(), style: const TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, size: 20, color: Colors.black87),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey.shade500, letterSpacing: 1.2),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1e293b)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
