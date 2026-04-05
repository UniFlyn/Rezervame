import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'package:rezervame_mobile/widgets/notification_card.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifications = [
      {
        'title': 'bookingConfirmed'.tr(),
        'body': 'notifBodyBookingConfirmed1'.tr(),
        'time': '2 min ago',
        'isRead': false,
        'icon': Icons.calendar_today,
        'color': AppColors.primary500,
      },
      {
        'title': 'specialOffer'.tr(),
        'body': 'notifBodySpecialOffer1'.tr(),
        'time': '1 hour ago',
        'isRead': true,
        'icon': Icons.local_offer,
        'color': Colors.amber,
      },
      {
        'title': 'reminder'.tr(),
        'body': 'notifBodyReminder1'.tr(),
        'time': 'Yesterday',
        'isRead': true,
        'icon': Icons.star,
        'color': Colors.blue,
      },
      {
        'title': 'systemUpdate'.tr(),
        'body': 'notifBodySystemUpdate1'.tr(),
        'time': '2 days ago',
        'isRead': true,
        'icon': Icons.system_update,
        'color': Colors.grey,
      },
      {
        'title': 'paymentSuccess'.tr(),
        'body': 'notifBodyPaymentSuccess1'.tr(),
        'time': 'Mar 28',
        'isRead': true,
        'icon': Icons.check_circle,
        'color': Colors.green,
      },
      {
        'title': 'newPromotion'.tr(),
        'body': 'notifBodyNewPromotion1'.tr(),
        'time': 'Mar 25',
        'isRead': true,
        'icon': Icons.new_releases,
        'color': Colors.purple,
      },
      {
        'title': 'bookingConfirmed'.tr(),
        'body': 'notifBodyBookingConfirmed2'.tr(),
        'time': 'Mar 22',
        'isRead': true,
        'icon': Icons.calendar_today,
        'color': AppColors.primary500,
      },
      {
        'title': 'reviewRequest'.tr(),
        'body': 'notifBodyReviewRequest1'.tr(),
        'time': 'Mar 20',
        'isRead': true,
        'icon': Icons.rate_review,
        'color': Colors.orange,
      },
      {
        'title': 'specialOffer'.tr(),
        'body': 'notifBodySpecialOffer2'.tr(),
        'time': 'Mar 18',
        'isRead': true,
        'icon': Icons.local_offer,
        'color': Colors.amber,
      },
      {
        'title': 'reminder'.tr(),
        'body': 'notifBodyReminder2'.tr(),
        'time': 'Mar 15',
        'isRead': true,
        'icon': Icons.notifications_active,
        'color': Colors.red,
      },
      {
        'title': 'systemUpdate'.tr(),
        'body': 'notifBodySystemUpdate2'.tr(),
        'time': 'Mar 12',
        'isRead': true,
        'icon': Icons.warning,
        'color': Colors.orange,
      },
      {
        'title': 'paymentSuccess'.tr(),
        'body': 'notifBodyPaymentSuccess2'.tr(),
        'time': 'Mar 10',
        'isRead': true,
        'icon': Icons.receipt,
        'color': Colors.green,
      },
      {
        'title': 'newPromotion'.tr(),
        'body': 'notifBodyNewPromotion2'.tr(),
        'time': 'Mar 08',
        'isRead': true,
        'icon': Icons.people,
        'color': Colors.blue,
      },
      {
        'title': 'bookingConfirmed'.tr(),
        'body': 'notifBodyBookingConfirmed3'.tr(),
        'time': 'Mar 05',
        'isRead': true,
        'icon': Icons.assignment_turned_in,
        'color': Colors.teal,
      },
      {
        'title': 'reminder'.tr(),
        'body': 'notifBodyReminder3'.tr(),
        'time': 'Mar 01',
        'isRead': true,
        'icon': Icons.view_list,
        'color': Colors.indigo,
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(
          'notifications'.tr(),
          style: AppTypography.heading500.copyWith(color: AppColors.grey900),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.grey900),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: () {},
            child: Text(
              'markAsRead'.tr(),
              style: AppTypography.heading200.copyWith(color: AppColors.primary500),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        itemCount: notifications.length,
        itemBuilder: (context, index) {
          final item = notifications[index];
          return NotificationCard(
            title: item['title'] as String,
            message: item['body'] as String,
            time: item['time'] as String,
            isRead: item['isRead'] as bool,
            icon: item['icon'] as IconData,
            iconColor: item['color'] as Color,
          );
        },
      ),
    );
  }
}
