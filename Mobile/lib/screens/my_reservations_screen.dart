import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'reservation_details_screen.dart';

class MyReservationsScreen extends StatefulWidget {
  const MyReservationsScreen({super.key});

  @override
  State<MyReservationsScreen> createState() => _MyReservationsScreenState();
}

class _MyReservationsScreenState extends State<MyReservationsScreen> {
  final _repo = ApiRepository();
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;
  String? _error;
  bool _needsLogin = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _needsLogin = false;
    });
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      setState(() {
        _needsLogin = true;
        _rows = [];
        _loading = false;
      });
      return;
    }
    try {
      final map = await _repo.fetchBookings();
      if (!mounted) return;
      final ongoing = (map['ongoing'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
      final history = (map['history'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
      final all = [...ongoing, ...history];
      all.sort((a, b) {
        final da = '${a['date']}T${a['time']}:00';
        final db = '${b['date']}T${b['time']}:00';
        return db.compareTo(da);
      });
      setState(() {
        _rows = all;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.grey900),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'reservations'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
        centerTitle: false,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
          : _needsLogin
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      'reservationsSignIn'.tr(),
                      textAlign: TextAlign.center,
                      style: AppTypography.body200.copyWith(color: AppColors.grey500),
                    ),
                  ),
                )
              : _error != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(_error!, style: AppTypography.body200.copyWith(color: AppColors.grey500)),
                      ),
                    )
                  : _rows.isEmpty
                      ? Center(
                          child: Text(
                            'appointmentsEmpty'.tr(),
                            style: AppTypography.body200.copyWith(color: AppColors.grey400),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          color: AppColors.primary500,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            itemCount: _rows.length,
                            itemBuilder: (context, index) {
                              final res = _rows[index];
                              return GestureDetector(
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute<void>(
                                    builder: (context) => ReservationDetailsScreen(
                                      reservation: res,
                                      showRatingSection: res['status'] == 'resPast',
                                      showQrAndFooterActions: res['status'] != 'resPast',
                                    ),
                                  ),
                                ),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 20),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppColors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: AppColors.grey50),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.black.withValues(alpha: 0.03),
                                        blurRadius: 15,
                                        offset: const Offset(0, 8),
                                      )
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 70,
                                        height: 70,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(14),
                                          image: DecorationImage(
                                            image: NetworkImage(
                                              'https://images.unsplash.com/photo-${res['img']}?q=80&w=200&fit=crop',
                                            ),
                                            fit: BoxFit.cover,
                                          ),
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
                                                Text(
                                                  (res['status'] as String).tr(),
                                                  style: AppTypography.heading100.copyWith(
                                                    color: (res['status'] == 'appointmentOngoing')
                                                        ? AppColors.success
                                                        : (res['status'] == 'resPast'
                                                            ? AppColors.grey500
                                                            : AppColors.primary500),
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                                Text(
                                                  res['price'] as String,
                                                  style: AppTypography.heading300,
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              res['venueName'] as String,
                                              style: AppTypography.homeSectionTitle.copyWith(
                                                color: AppColors.grey900,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              res['service'] as String,
                                              style: AppTypography.body100.copyWith(color: AppColors.grey400),
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                const Icon(Icons.calendar_today_rounded, size: 12, color: AppColors.grey300),
                                                const SizedBox(width: 6),
                                                Text(
                                                  '${res['date']} • ${res['time']}',
                                                  style: AppTypography.body100.copyWith(
                                                    color: AppColors.grey500,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Icon(Icons.chevron_right_rounded, color: Colors.grey.shade300),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
    );
  }
}
