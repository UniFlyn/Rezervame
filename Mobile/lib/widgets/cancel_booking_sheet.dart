import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

/// Bottom sheet: coral header, centered question + body, outlined [Cancel] + filled [Confirm].
Future<bool> showCancelBookingSheet(BuildContext context) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isDismissible: true,
    enableDrag: true,
    backgroundColor: Colors.transparent,
    barrierColor: AppColors.black.withValues(alpha: 0.45),
    builder: (ctx) => const _CancelBookingSheetContent(),
  );
  return result ?? false;
}

class _CancelBookingSheetContent extends StatelessWidget {
  const _CancelBookingSheetContent();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: DecoratedBox(
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.grey200,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'cancelBookingSheetTitle'.tr(),
                  textAlign: TextAlign.center,
                  style: AppTypography.sectionTitle.copyWith(
                    color: AppColors.primary500,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'cancelBookingConfirmQuestion'.tr(),
                  textAlign: TextAlign.center,
                  style: AppTypography.sectionTitle.copyWith(
                    color: AppColors.grey900,
                    fontWeight: FontWeight.w800,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'cancelBookingConfirmMessage'.tr(),
                  textAlign: TextAlign.center,
                  style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.55),
                ),
                const SizedBox(height: 28),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context, false),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: AppColors.primary500, width: 1.5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          'cancelBookingDismissBtn'.tr(),
                          style: AppTypography.buttonMedium.copyWith(color: AppColors.primary500),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context, true),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: AppColors.primary500,
                          foregroundColor: AppColors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          'cancelBookingConfirmBtn'.tr(),
                          style: AppTypography.buttonMedium.copyWith(color: AppColors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
