import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'package:easy_localization/easy_localization.dart';

class BookingConfirmationScreen extends StatelessWidget {
  final Map<String, dynamic> bookingDetails;

  const BookingConfirmationScreen({
    super.key,
    required this.bookingDetails,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 60),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.primary500.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check_circle,
                        size: 80,
                        color: AppColors.primary500,
                      ),
                    ),
                    const SizedBox(height: 40),
                    Text(
                      'bookingConfirmed'.tr(),
                      style: AppTypography.heading700.copyWith(color: AppColors.grey900),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'bookingSuccessMsg'.tr(namedArgs: {'venue': bookingDetails['venueName']}),
                      textAlign: TextAlign.center,
                      style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.5),
                    ),
                    const SizedBox(height: 48),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.grey25,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.grey50),
                      ),
                      child: Column(
                        children: [
                          _buildDetailRow('Professional', bookingDetails['professional'] ?? 'Any available'),
                          const Divider(height: 32),
                          _buildDetailRow('Service', bookingDetails['service'] ?? 'General Cutting'),
                          const Divider(height: 32),
                          _buildDetailRow('Date', bookingDetails['date'] ?? 'Tomorrow, Oct 24'),
                          const Divider(height: 32),
                          _buildDetailRow('Time', bookingDetails['time'] ?? '10:30 AM'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary500,
                      foregroundColor: AppColors.white,
                      minimumSize: const Size(double.infinity, 56),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Text(
                      'goToHome'.tr(),
                      style: AppTypography.heading400.copyWith(color: AppColors.white),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                    style: TextButton.styleFrom(
                      minimumSize: const Size(double.infinity, 56),
                    ),
                    child: Text(
                      'viewBookingDetails'.tr(),
                      style: AppTypography.heading400.copyWith(color: AppColors.grey900),
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

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.bold),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: AppTypography.heading300.copyWith(color: AppColors.grey900),
          ),
        ),
      ],
    );
  }
}
