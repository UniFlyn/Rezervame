import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../models/app_notification.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/list_pagination_bar.dart';
import '../widgets/notification_card.dart';
import 'notification_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _api = ApiRepository();
  bool _loading = true;
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  static const int _pageSize = 20;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh({int? page}) async {
    final nextPage = page ?? _page;
    setState(() => _loading = true);
    try {
      final res = await _api.fetchNotificationsPage(page: nextPage, limit: _pageSize);
      final rows = (res['data'] as List<AppNotification>?) ?? [];
      AppNotification.liveAll = rows;
      if (mounted) {
        setState(() {
          _page = nextPage;
          _total = (res['total'] as int?) ?? rows.length;
          _totalPages = (res['totalPages'] as int?) ?? 1;
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<AppNotification> get _today =>
      AppNotification.liveAll.where((n) => n.sectionKey == 'today').toList();

  List<AppNotification> get _yesterday =>
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
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
          : RefreshIndicator(
              onRefresh: _refresh,
              color: AppColors.primary500,
              child: ListView(
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
                  if (today.isEmpty && yesterday.isEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 48),
                      child: Center(
                        child: Text(
                          'No notifications yet',
                          style: AppTypography.body200.copyWith(color: AppColors.grey400),
                        ),
                      ),
                    ),
                  ListPaginationBar(
                    page: _page,
                    totalPages: _totalPages,
                    total: _total,
                    onPageChange: (p) => _refresh(page: p),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _sectionHeader(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Text(
        label,
        style: AppTypography.body100.copyWith(
          color: AppColors.grey400,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  List<Widget> _tilesForSection(BuildContext context, List<AppNotification> items) {
    return items
        .map(
          (n) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: NotificationListTile(
              notification: n,
              onTap: () async {
                if (n.id != null && n.id!.isNotEmpty) {
                  await _api.markNotificationRead(n.id!);
                }
                if (!context.mounted) return;
                await Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => NotificationDetailScreen(notification: n),
                  ),
                );
                await _refresh();
              },
            ),
          ),
        )
        .toList();
  }
}
