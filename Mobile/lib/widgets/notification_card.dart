import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class NotificationCard extends StatelessWidget {
  final String title;
  final String message;
  final String time;
  final bool isRead;
  final IconData icon;
  final Color iconColor;

  const NotificationCard({
    super.key,
    required this.title,
    required this.message,
    required this.time,
    this.isRead = false,
    this.icon = Icons.notifications,
    this.iconColor = AppColors.primary500,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isRead ? AppColors.white : iconColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isRead ? AppColors.grey50 : iconColor.withOpacity(0.1),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isRead ? AppColors.grey25 : iconColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 20,
              color: isRead ? AppColors.grey400 : iconColor,
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
                    Expanded(
                      child: Text(
                        title,
                        style: (isRead ? AppTypography.body200 : AppTypography.heading300).copyWith(color: AppColors.grey900),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      time,
                      style: AppTypography.body100.copyWith(color: AppColors.grey400),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: AppTypography.body100.copyWith(color: AppColors.grey500, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
