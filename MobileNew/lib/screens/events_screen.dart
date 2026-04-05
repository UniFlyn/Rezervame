import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class EventsScreen extends StatelessWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final events = [
      {
        'id': 1,
        'title': 'event1Title'.tr(),
        'date': 'event1Date'.tr(),
        'location': 'event1Loc'.tr(),
        'price': '\$45.00',
        'img': '1585747860715-2ba37e788b70'
      },
      {
        'id': 2,
        'title': 'event2Title'.tr(),
        'date': 'event2Date'.tr(),
        'location': 'event2Loc'.tr(),
        'price': 'eventFree'.tr(),
        'img': '1503951914875-452162b0f3f1'
      }
    ];

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'eventsTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'eventsSub'.tr(),
            style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
          ),
          const SizedBox(height: 32),
          ...events.map((event) => _buildEventCard(context, event)).toList(),
        ],
      ),
    );
  }

  Widget _buildEventCard(BuildContext context, Map<String, dynamic> event) {
    return Container(
      margin: const EdgeInsets.only(bottom: 32),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.grey50),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              image: DecorationImage(
                image: NetworkImage('https://images.unsplash.com/photo-${event['img']}?q=80&w=600&fit=crop'),
                fit: BoxFit.cover,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.primary500),
                    const SizedBox(width: 8),
                    Text(
                      event['date'].toString(),
                      style: AppTypography.heading100.copyWith(color: AppColors.primary500, letterSpacing: 1),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  event['title'].toString(),
                  style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                    const SizedBox(width: 8),
                    Text(
                      event['location'].toString(),
                      style: AppTypography.body200.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      event['price'].toString(),
                      style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800),
                    ),
                    ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.confirmation_num_outlined, size: 16),
                      label: Text('eventGetTicket'.tr()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.grey900,
                        foregroundColor: AppColors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
