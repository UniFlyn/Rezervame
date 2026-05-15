import 'package:flutter/material.dart';

import '../models/app_notification.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

/// Single row in the notifications list (reference: icon, title, 2-line preview, time top-right).
class NotificationListTile extends StatelessWidget {
  const NotificationListTile({
    super.key,
    required this.notification,
    required this.onTap,
    this.showDividerBelow = true,
  });

  final AppNotification notification;
  final VoidCallback onTap;
  final bool showDividerBelow;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: AppColors.white,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      notification.icon,
                      size: 22,
                      color: AppColors.primary500,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                notification.listTitle,
                                style: AppTypography.homeSectionTitle.copyWith(
                                  color: AppColors.grey900,
                                  fontWeight: FontWeight.w800,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                notification.preview,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.body200.copyWith(
                                  color: AppColors.grey500,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          notification.timeShort,
                          style: AppTypography.body100.copyWith(
                            color: AppColors.grey400,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (showDividerBelow)
          Divider(height: 1, thickness: 1, color: AppColors.grey100),
      ],
    );
  }
}
