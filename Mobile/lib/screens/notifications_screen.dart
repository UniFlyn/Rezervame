import 'package:flutter/material.dart';

import '../models/app_notification.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/notification_card.dart';
import 'notification_detail_screen.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  static List<AppNotification> get _today =>
      AppNotification.liveAll.where((n) => n.sectionKey == 'today').toList();

  static List<AppNotification> get _yesterday =>
      AppNotification.liveAll.where((n) => n.sectionKey == 'yesterday').toList();

  @override
  Widget build(BuildContext context) {
    final today = _today;
    final yesterday = _yesterday;

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
          'Notifications',
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        children: [
          if (today.isNotEmpty) ...[
            _sectionHeader('Today'),
            ..._tilesForSection(context, today),
          ],
          if (yesterday.isNotEmpty) ...[
            if (today.isNotEmpty) const SizedBox(height: 8),
            _sectionHeader('Yesterday'),
            ..._tilesForSection(context, yesterday),
          ],
        ],
      ),
    );
  }

  Widget _sectionHeader(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: Text(
        label,
        style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
      ),
    );
  }

  List<Widget> _tilesForSection(BuildContext context, List<AppNotification> items) {
    final out = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      final n = items[i];
      final last = i == items.length - 1;
      out.add(
        NotificationListTile(
          notification: n,
          showDividerBelow: !last,
          onTap: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (context) => NotificationDetailScreen(notification: n),
              ),
            );
          },
        ),
      );
    }
    return out;
  }
}
