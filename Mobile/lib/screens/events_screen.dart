import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _repo.fetchEvents();
      if (!mounted) return;
      setState(() {
        _events = list;
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

  String _formatStart(dynamic raw) {
    final s = '$raw';
    final dt = DateTime.tryParse(s);
    if (dt == null) return s;
    final y = dt.year;
    final mo = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    final h = dt.hour.toString().padLeft(2, '0');
    final mi = dt.minute.toString().padLeft(2, '0');
    return '$y-$mo-$d · $h:$mi';
  }

  String _priceLine(Map<String, dynamic> e) {
    final p = e['price'];
    final n = p is num ? p.toDouble() : double.tryParse('$p') ?? 0;
    if (n <= 0) return 'eventFree'.tr();
    return '\$${n.toStringAsFixed(2)}';
  }

  // String _imageUrl(Map<String, dynamic> e) {
  //   final key = '${e['imageKey'] ?? ''}'.trim();
  //   if (key.isEmpty) return '';
  //   if (key.startsWith('http')) return key;
  //   return 'https://images.unsplash.com/photo-$key?q=80&w=600&fit=crop';
  // }

  @override
  Widget build(BuildContext context) {
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
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary500,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      Text('eventsLoadError'.tr(), style: AppTypography.body200.copyWith(color: AppColors.grey500)),
                      const SizedBox(height: 16),
                      Text(_error!, style: AppTypography.body100.copyWith(color: AppColors.grey400)),
                    ],
                  )
                : _events.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(24),
                        children: [
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 48),
                              child: Text(
                                'eventsEmpty'.tr(),
                                style: AppTypography.body200.copyWith(color: AppColors.grey500),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ],
                      )
                    : ListView(
                        padding: const EdgeInsets.all(24),
                        children: [
                          Text(
                            'eventsSub'.tr(),
                            style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
                          ),
                          const SizedBox(height: 32),
                          ..._events.map((e) => _buildEventCard(context, e)),
                        ],
                      ),
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
          Builder(
            builder: (context) {
              final key = '${event['imageKey'] ?? ''}'.trim();
              if (key.isEmpty) {
                return Container(
                  height: 200,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    color: AppColors.grey200,
                  ),
                  child: Icon(Icons.image_not_supported_outlined, color: AppColors.grey400, size: 40),
                );
              }
              if (key.startsWith('data:image/')) {
                try {
                  final base64String = key.split(',').last;
                  final bytes = base64Decode(base64String);
                  return ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    child: Image.memory(
                      bytes,
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  );
                } catch (_) {
                  // Fallback to placeholder if corrupt
                }
              }
              final url = key.startsWith('http') 
                  ? key 
                  : 'https://images.unsplash.com/photo-$key?q=80&w=600&fit=crop';
              return Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  image: DecorationImage(
                    image: NetworkImage(url),
                    fit: BoxFit.cover,
                  ),
                ),
              );
            },
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
                    Expanded(
                      child: Text(
                        _formatStart(event['startAt']),
                        style: AppTypography.heading100.copyWith(color: AppColors.primary500, letterSpacing: 1),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${event['title'] ?? ''}',
                  style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800),
                ),
                if ('${event['body'] ?? ''}'.trim().isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    '${event['body']}',
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.4),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${event['location'] ?? ''}',
                        style: AppTypography.body200.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _priceLine(event),
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
