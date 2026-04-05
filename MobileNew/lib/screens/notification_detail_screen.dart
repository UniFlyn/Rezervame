import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../models/app_notification.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';

class NotificationDetailScreen extends StatelessWidget {
  const NotificationDetailScreen({super.key, required this.notification});

  final AppNotification notification;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leadingWidth: 56,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12, top: 8, bottom: 8),
          child: Material(
            color: AppColors.white,
            elevation: 3,
            shadowColor: AppColors.black.withValues(alpha: 0.12),
            shape: const CircleBorder(),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () => Navigator.pop(context),
              child: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 18),
            ),
          ),
        ),
        title: Text(
          'notifications'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.detailTimestampLine,
                    style: AppTypography.body100.copyWith(color: AppColors.grey500, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    notification.detailTitle,
                    style: AppTypography.screenTitle.copyWith(color: AppColors.grey900, height: 1.15),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    notification.detailBody,
                    style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.55),
                  ),
                  const SizedBox(height: 28),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.grey100),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.black.withValues(alpha: 0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: ChainedNetworkImage(
                                urls: ChainedNetworkImage.chainFrom(notification.venueImageUrl, null, w: 200),
                                width: 64,
                                height: 64,
                                fit: BoxFit.cover,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    notification.venueName,
                                    style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900, height: 1.25),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    notification.venueSubtitle,
                                    style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.4),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 22),
                        Text(
                          'notifYourOrder'.tr(),
                          style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                        ),
                        const SizedBox(height: 14),
                        _detailRow('notifPackageLabel'.tr(), notification.packageLabel),
                        const SizedBox(height: 12),
                        _detailRow('notifBeauticianRow'.tr(), notification.beautician),
                        const SizedBox(height: 12),
                        _detailRow('notifDatesRow'.tr(), notification.datesLine),
                        if (notification.availedServices.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          Text(
                            'notifAvailedServices'.tr(),
                            style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                          ),
                          const SizedBox(height: 14),
                          for (var i = 0; i < notification.availedServices.length; i++) ...[
                            if (i > 0) const SizedBox(height: 12),
                            _lineItemRow(
                              notification.availedServices[i].name,
                              notification.availedServices[i].price,
                            ),
                          ],
                        ],
                        const SizedBox(height: 22),
                        Text(
                          'notifPriceDetails'.tr(),
                          style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                        ),
                        const SizedBox(height: 14),
                        _detailRow('notifPriceRow'.tr(), notification.price),
                        const SizedBox(height: 12),
                        _detailRow('notifFeeRow'.tr(), notification.fee),
                        const SizedBox(height: 12),
                        _detailRow('notifTotalPriceRow'.tr(), notification.totalPrice, emphasizeValue: true),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('notifBack'.tr(), style: AppTypography.buttonLarge.copyWith(color: AppColors.white)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value, {bool emphasizeValue = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: AppTypography.body200.copyWith(color: AppColors.grey500),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: emphasizeValue
                ? AppTypography.sectionTitle.copyWith(color: AppColors.grey900)
                : AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  /// Service name (left) and price (right), both emphasized like receipt line items.
  Widget _lineItemRow(String title, String trailing) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            title,
            style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w600, height: 1.35),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          trailing,
          textAlign: TextAlign.right,
          style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

}
