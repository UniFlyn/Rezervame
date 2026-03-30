import 'package:barber/widgets/notification_card.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifications = [
      {
        'title': 'bookingConfirmed'.tr(),
        'body': 'Your appointment at Luxe Hair Studio is confirmed for today at 3:00 PM.',
        'time': '2 min ago',
        'isRead': false,
        'icon': Icons.calendar_today,
        'color': const Color(0xFFff5a5f),
      },
      {
        'title': 'specialOffer'.tr(),
        'body': 'Get 20% off on your next manicure at Nail Society!',
        'time': '1 hour ago',
        'isRead': true,
        'icon': Icons.local_offer,
        'color': Colors.amber,
      },
      {
        'title': 'reminder'.tr(),
        'body': 'Don\'t forget to rate your experience at Bliss Beauty.',
        'time': 'Yesterday',
        'isRead': true,
        'icon': Icons.star,
        'color': Colors.blue,
      },
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'notifications'.tr(),
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 20),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: () {},
            child: Text(
              'markAsRead'.tr(),
              style: const TextStyle(color: Color(0xFFff5a5f), fontWeight: FontWeight.w800, fontSize: 13),
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
