import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/event_cover_image.dart';
import '../widgets/list_pagination_bar.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final ApiRepository _repo = ApiRepository();
  List<Map<String, dynamic>> _events = [];
  bool _loading = true;
  String? _error;
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  static const int _pageSize = 10;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({int? page}) async {
    final nextPage = page ?? _page;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _repo.fetchEvents(page: nextPage, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _page = nextPage;
        _events = (res['data'] as List<Map<String, dynamic>>?) ?? [];
        _total = (res['total'] as int?) ?? _events.length;
        _totalPages = (res['totalPages'] as int?) ?? 1;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  String _formatStart(BuildContext context, dynamic raw) {
    final dt = DateTime.tryParse('$raw');
    if (dt == null) return '$raw';
    final local = dt.toLocal();
    final locale = context.locale.toString();
    final date = DateFormat.yMMMd(locale).format(local);
    final time = DateFormat.jm(locale).format(local);
    return '$date · $time';
  }

  String _formatDateChip(BuildContext context, dynamic raw) {
    final dt = DateTime.tryParse('$raw');
    if (dt == null) return '';
    final local = dt.toLocal();
    final locale = context.locale.toString();
    return DateFormat.MMMd(locale).format(local).toUpperCase();
  }

  String _priceLine(Map<String, dynamic> e) {
    final p = e['price'];
    final n = p is num ? p.toDouble() : double.tryParse('$p') ?? 0;
    if (n <= 0) return 'eventFree'.tr();
    return '\$${n.toStringAsFixed(2)}';
  }

  bool _isFree(Map<String, dynamic> e) {
    final p = e['price'];
    final n = p is num ? p.toDouble() : double.tryParse('$p') ?? 0;
    return n <= 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.grey25,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'eventsTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary500,
        child: _loading
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 120),
                  Center(child: CircularProgressIndicator(color: AppColors.primary500)),
                ],
              )
            : _error != null
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(24),
                    children: [
                      Icon(Icons.error_outline_rounded, size: 48, color: AppColors.grey200),
                      const SizedBox(height: 16),
                      Text(
                        'eventsLoadError'.tr(),
                        style: AppTypography.sectionTitle.copyWith(color: AppColors.grey500),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: AppTypography.body100.copyWith(color: AppColors.grey400), textAlign: TextAlign.center),
                    ],
                  )
                : _events.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(24),
                        children: [
                          const SizedBox(height: 80),
                          Icon(Icons.event_busy_rounded, size: 64, color: AppColors.grey200),
                          const SizedBox(height: 16),
                          Text(
                            'eventsEmpty'.tr(),
                            style: AppTypography.body200.copyWith(color: AppColors.grey500),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      )
                    : ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                        itemCount: _events.length + 2,
                        separatorBuilder: (_, index) => SizedBox(height: index == 0 ? 20 : 16),
                        itemBuilder: (context, index) {
                          if (index == 0) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                'eventsSub'.tr(),
                                style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.5),
                              ),
                            );
                          }
                          if (index == _events.length + 1) {
                            return ListPaginationBar(
                              page: _page,
                              totalPages: _totalPages,
                              total: _total,
                              onPageChange: (p) => _load(page: p),
                            );
                          }
                          return _buildEventCard(context, _events[index - 1]);
                        },
                      ),
      ),
    );
  }

  Future<void> _openWebsite(String raw) async {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return;
    final uri = Uri.parse(trimmed.startsWith(RegExp(r'https?://')) ? trimmed : 'https://$trimmed');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Widget _buildEventCard(BuildContext context, Map<String, dynamic> event) {
    final title = '${event['title'] ?? ''}'.trim();
    final body = '${event['body'] ?? ''}'.trim();
    final location = '${event['location'] ?? ''}'.trim();
    final website = '${event['websiteUrl'] ?? ''}'.trim();
    final priceLabel = _priceLine(event);
    final free = _isFree(event);
    final dateChip = _formatDateChip(context, event['startAt']);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: website.isNotEmpty ? () => _openWebsite(website) : null,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.grey100),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Stack(
                  children: [
                    EventCoverImage(
                      imageKey: '${event['imageKey'] ?? ''}',
                      height: 200,
                    ),
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              AppColors.black.withValues(alpha: 0.08),
                              Colors.transparent,
                              AppColors.black.withValues(alpha: 0.35),
                            ],
                            stops: const [0, 0.45, 1],
                          ),
                        ),
                      ),
                    ),
                    if (dateChip.isNotEmpty)
                      Positioned(
                        top: 14,
                        left: 14,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.white.withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            dateChip,
                            style: AppTypography.body100.copyWith(
                              color: AppColors.primary500,
                              fontWeight: FontWeight.w800,
                              fontSize: 11,
                              letterSpacing: 0.6,
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      top: 14,
                      right: 14,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: free ? AppColors.primary500 : AppColors.grey900,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          priceLabel,
                          style: AppTypography.body100.copyWith(
                            color: AppColors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.calendar_today_rounded, size: 15, color: AppColors.primary500),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _formatStart(context, event['startAt']),
                              style: AppTypography.body100.copyWith(
                                color: AppColors.primary500,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        title,
                        style: AppTypography.sectionTitle.copyWith(
                          color: AppColors.grey900,
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                        ),
                      ),
                      if (body.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          body,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.45),
                        ),
                      ],
                      if (location.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 17, color: AppColors.grey400),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                location,
                                style: AppTypography.body200.copyWith(
                                  color: AppColors.grey600,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (website.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () => _openWebsite(website),
                            icon: const Icon(Icons.open_in_new_rounded, size: 18),
                            label: Text('eventGetTicket'.tr()),
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.grey900,
                              foregroundColor: AppColors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
