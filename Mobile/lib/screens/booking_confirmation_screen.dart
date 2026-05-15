import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'reservation_details_screen.dart';

/// Full-screen confirmation after payment — layout aligned to reference “Booking Confirmed” screen.
class BookingConfirmationScreen extends StatelessWidget {
  const BookingConfirmationScreen({super.key, required this.bookingDetails});

  final Map<String, dynamic> bookingDetails;

  Map<String, dynamic> get _reservationForDetails {
    final rawImg = bookingDetails['img'] as String? ?? '';
    return {
      'venueName': bookingDetails['venueName'] ?? '',
      'service': bookingDetails['service'] ?? '',
      'date': bookingDetails['date'] ?? '',
      'time': bookingDetails['time'] ?? '',
      'status': 'resConfirmed',
      'price': bookingDetails['price'] ?? r'$0.00',
      'img': rawImg,
      'professionalName': bookingDetails['professional'] ?? '',
    };
  }

  @override
  Widget build(BuildContext context) {
    final venue = bookingDetails['venueName'] as String? ?? '';
    final professional = bookingDetails['professional'] as String? ?? '—';
    final service = bookingDetails['service'] as String? ?? '—';
    final date = bookingDetails['date'] as String? ?? '—';
    final time = bookingDetails['time'] as String? ?? '—';

    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 40),
                    _buildSuccessMark(),
                    const SizedBox(height: 28),
                    Text(
                      'bookingConfirmed'.tr(),
                      textAlign: TextAlign.center,
                      style: AppTypography.heading300.copyWith(
                        color: AppColors.grey900,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'bookingSuccessMsg'.tr(namedArgs: {'venue': venue}),
                      textAlign: TextAlign.center,
                      style: AppTypography.body200.copyWith(
                        color: AppColors.grey500,
                        height: 1.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 36),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F8F8),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.grey100),
                      ),
                      child: Column(
                        children: [
                          _buildDetailRow('bookingConfirmProfessional'.tr(), professional),
                          const Divider(height: 26, thickness: 1, color: AppColors.grey100),
                          _buildDetailRow('bookingConfirmService'.tr(), service),
                          const Divider(height: 26, thickness: 1, color: AppColors.grey100),
                          _buildDetailRow('dateLabel'.tr(), date),
                          const Divider(height: 26, thickness: 1, color: AppColors.grey100),
                          _buildDetailRow('timeLabel'.tr(), time),
                          const Divider(height: 26, thickness: 1, color: AppColors.grey100),
                          _buildDetailRow(
                            'checkoutBookFor'.tr(),
                            bookingDetails['bookingFor'] as String? ?? 'checkoutMyself'.tr(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary500,
                        foregroundColor: AppColors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: Text(
                        'goToHome'.tr(),
                        style: AppTypography.buttonLarge.copyWith(
                          color: AppColors.white,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  TextButton(
                    onPressed: () {
                      Navigator.push<void>(
                        context,
                        MaterialPageRoute<void>(
                          builder: (context) => ReservationDetailsScreen(reservation: _reservationForDetails),
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      minimumSize: const Size(double.infinity, 52),
                      foregroundColor: AppColors.grey900,
                    ),
                    child: Text(
                      'viewBookingDetails'.tr(),
                      style: AppTypography.buttonMedium.copyWith(
                        color: AppColors.grey900,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Soft pink halo + solid coral circle + white check (reference UI).
  Widget _buildSuccessMark() {
    return Center(
      child: SizedBox(
        width: 132,
        height: 132,
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 128,
              height: 128,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary500.withValues(alpha: 0.14),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary500.withValues(alpha: 0.22),
                    blurRadius: 36,
                    spreadRadius: 2,
                  ),
                ],
              ),
            ),
            Container(
              width: 88,
              height: 88,
              decoration: const BoxDecoration(
                color: AppColors.primary500,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_rounded, color: AppColors.white, size: 52),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: AppTypography.body100.copyWith(
              color: AppColors.grey500,
              fontWeight: FontWeight.w600,
              height: 1.35,
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: AppTypography.body200.copyWith(
              color: AppColors.grey900,
              fontWeight: FontWeight.w800,
              height: 1.35,
            ),
          ),
        ),
      ],
    );
  }
}
