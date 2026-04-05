import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class ReservationDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> reservation;

  const ReservationDetailsScreen({super.key, required this.reservation});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.grey900, size: 24),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'viewDetails'.tr(),
          style: AppTypography.heading400.copyWith(color: AppColors.grey900),
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
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(100),
                      boxShadow: [BoxShadow(color: AppColors.black.withOpacity(0.1), blurRadius: 10)],
                    ),
                    child: Text(
                      reservation['status'] == 'Confirmed' ? 'resConfirmed'.tr() : 'resUpcoming'.tr(),
                      style: AppTypography.heading100.copyWith(
                        color: reservation['status'] == 'Confirmed' ? AppColors.success : AppColors.primary500,
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
              style: AppTypography.heading700,
            ),
            const SizedBox(height: 8),
            Text(
              reservation['service'],
              style: AppTypography.body200.copyWith(color: AppColors.grey500),
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
              style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 1.2),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(reservation['service'], style: AppTypography.heading300),
                Text(reservation['price'], style: AppTypography.heading400),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.grey25,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('totalLabel'.tr(), style: AppTypography.heading500),
                  Text(reservation['price'], style: AppTypography.heading700.copyWith(color: AppColors.primary500)),
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
                    style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 8),
                  Text('RZV-982-XKL', style: AppTypography.heading600),
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
                    style: AppTypography.body100.copyWith(color: AppColors.grey500),
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
                      side: const BorderSide(color: AppColors.error),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('cancelAppointment'.tr(), style: AppTypography.heading300.copyWith(color: AppColors.error)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppColors.grey900,
                      foregroundColor: AppColors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('editBooking'.tr(), style: AppTypography.heading300.copyWith(color: AppColors.white)),
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
          decoration: BoxDecoration(color: AppColors.grey25, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, size: 20, color: AppColors.grey900),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 1.2),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
