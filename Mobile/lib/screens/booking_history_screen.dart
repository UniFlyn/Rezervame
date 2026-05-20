import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/invoice_pdf_util.dart';
import '../widgets/chained_network_image.dart';
import '../widgets/reservation_detail_sheet.dart';
import '../widgets/reservation_status_badge.dart';
import '../widgets/review_experience_sheet.dart';
import 'service_detail_screen.dart';

/// My Appointments — single scroll with Upcoming + History sections (Web profile bookings tab).
class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen> {
  final _repo = ApiRepository();
  List<Map<String, dynamic>> _ongoingData = [];
  List<Map<String, dynamic>> _historyData = [];
  bool _loading = true;
  int _historyPage = 1;
  int _historyTotalPages = 1;
  int _historyTotal = 0;

  bool get _isEn => context.locale.languageCode != 'es';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData({bool refresh = true}) async {
    if (refresh) setState(() => _loading = true);
    try {
      final locale = context.locale.languageCode;
      final data = await _repo.fetchBookings(page: _historyPage, limit: 10, locale: locale);
      if (!mounted) return;
      setState(() {
        _ongoingData = (data['ongoing'] as List<Map<String, dynamic>>?) ?? [];
        _historyData = (data['history'] as List<Map<String, dynamic>>?) ?? [];
        _historyTotalPages = (data['totalPages'] as int?) ?? 1;
        _historyTotal = (data['total'] as int?) ?? _historyData.length;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _ongoingData = [];
        _historyData = [];
        _historyTotalPages = 1;
        _historyTotal = 0;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isEn ? 'Could not load reservations. Pull to refresh.' : 'No se pudieron cargar las reservas. Desliza para actualizar.',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<String> _imageUrls(Map<String, dynamic> data) {
    final img = '${data['img'] ?? data['imageUrl'] ?? ''}';
    if (img.isNotEmpty) return ChainedNetworkImage.chainFrom(img, null, w: 200);
    return ChainedNetworkImage.urlsForUnsplashId('', w: 200);
  }

  Future<void> _openDetails(Map<String, dynamic> data) async {
    final changed = await showReservationDetailSheet(
      context,
      reservation: Map<String, dynamic>.from(data),
      onChanged: () => _loadData(refresh: false),
    );
    if (changed == true) await _loadData();
  }

  Future<void> _downloadInvoice(Map<String, dynamic> res) async {
    try {
      await shareReservationInvoice(
        reservation: res,
        paymentStatus: '${res['status']}' == 'completed' || '${res['status']}' == 'paid' ? 'paid' : 'pending',
        paymentMethod: '${res['paymentMethod'] ?? 'Online'}',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    }
  }

  void _rebook(Map<String, dynamic> res) {
    final businessId = '${res['businessId'] ?? ''}';
    if (businessId.isEmpty) return;
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => ServiceDetailScreen(
          listing: VenueListing(
            id: 0,
            name: '${res['venueName']}',
            categoryKey: 'hairService',
            rating: '0',
            reviews: '0',
            price: '0',
            lat: 0,
            lng: 0,
            businessId: businessId,
            serviceImageUrl: '${res['img'] ?? res['imageUrl']}',
            locationLabel: '${res['address'] ?? ''}',
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isEn ? 'My Reservations' : 'Mis Reservas',
              style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w900),
            ),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
          : RefreshIndicator(
              color: AppColors.primary500,
              onRefresh: () => _loadData(),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                children: [
                  Text(
                    _isEn ? 'Manage your appointments and download your invoices' : 'Gestiona tus citas y descarga tus facturas',
                    style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 28),
                  _sectionTitle(_isEn ? 'UPCOMING RESERVATIONS' : 'PRÓXIMAS RESERVAS', dark: true),
                  const SizedBox(height: 12),
                  if (_ongoingData.isEmpty)
                    Text(
                      _isEn ? 'No upcoming reservations.' : 'Sin próximas reservas.',
                      style: AppTypography.body200.copyWith(color: AppColors.grey500),
                    )
                  else
                    ..._ongoingData.map(_buildUpcomingCard),
                  const SizedBox(height: 32),
                  _sectionTitle(_isEn ? 'APPOINTMENT HISTORY' : 'HISTORIAL DE CITAS'),
                  const SizedBox(height: 12),
                  if (_historyData.isEmpty)
                    Text(
                      _isEn ? 'No past appointments yet.' : 'Aún no hay citas anteriores.',
                      style: AppTypography.body200.copyWith(color: AppColors.grey500),
                    )
                  else
                    ..._historyData.map(_buildHistoryCard),
                  if (_historyTotalPages > 1) ...[
                    const SizedBox(height: 24),
                    _buildPagination(),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _sectionTitle(String text, {bool dark = false}) {
    return Text(
      text,
      style: AppTypography.body100.copyWith(
        color: dark ? AppColors.grey600 : AppColors.grey400,
        fontWeight: FontWeight.w900,
        letterSpacing: 2,
        fontSize: 11,
      ),
    );
  }

  Widget _buildUpcomingCard(Map<String, dynamic> res) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.grey100, width: 2),
        boxShadow: [
          BoxShadow(color: AppColors.grey900.withValues(alpha: 0.05), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: ChainedNetworkImage(urls: _imageUrls(res), width: 80, height: 80, fit: BoxFit.cover),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            '${res['serviceName']}',
                            style: AppTypography.heading200.copyWith(fontWeight: FontWeight.w900),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.primary500.withValues(alpha: 0.2)),
                          ),
                          child: Text(
                            '#${res['refNumber']}',
                            style: AppTypography.body100.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w900, fontSize: 10),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${res['venueName']} • ${res['time']}',
                      style: AppTypography.body100.copyWith(color: AppColors.grey600, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        ReservationStatusBadge(status: '${res['status']}', compact: true),
                        if ('${res['customerName'] ?? ''}'.isNotEmpty)
                          _chip(_isEn ? 'For: ${res['customerName']}' : 'Para: ${res['customerName']}'),
                        if ('${res['staffName'] ?? ''}'.isNotEmpty)
                          _chip(_isEn ? 'Pro: ${res['staffName']}' : 'Staff: ${res['staffName']}'),
                        if ('${res['phone'] ?? ''}'.isNotEmpty)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.phone_outlined, size: 14, color: AppColors.primary500),
                              const SizedBox(width: 4),
                              Text(
                                '${res['phone']}',
                                style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w700, fontSize: 11),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${res['price']}',
                style: AppTypography.heading200.copyWith(fontWeight: FontWeight.w900, fontSize: 28),
              ),
              ElevatedButton(
                onPressed: () => _openDetails(res),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: AppColors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text(
                  _isEn ? 'See Details' : 'Ver detalles',
                  style: AppTypography.buttonMedium.copyWith(color: AppColors.white, letterSpacing: 0.8),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(Map<String, dynamic> res) {
    final status = '${res['status']}';
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: AppColors.grey200),
        boxShadow: [
          BoxShadow(color: AppColors.grey200.withValues(alpha: 0.5), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(28),
                child: ChainedNetworkImage(urls: _imageUrls(res), width: 80, height: 80, fit: BoxFit.cover),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${res['venueName']}',
                            style: AppTypography.heading200.copyWith(fontWeight: FontWeight.w900),
                          ),
                        ),
                        Text(
                          '#${res['refNumber']}',
                          style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w900, fontSize: 9),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${res['serviceName']} • ${res['date']}',
                      style: AppTypography.body200.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        ReservationStatusBadge(status: status, compact: true),
                        if ('${res['customerName'] ?? ''}'.isNotEmpty)
                          _chip(_isEn ? 'For: ${res['customerName']}' : 'Para: ${res['customerName']}'),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${res['price']}',
                style: AppTypography.heading200.copyWith(fontWeight: FontWeight.w900, fontSize: 22),
              ),
              Flexible(
                child: Wrap(
                  alignment: WrapAlignment.end,
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    TextButton(
                      onPressed: () => _openDetails(res),
                      style: TextButton.styleFrom(
                        backgroundColor: AppColors.grey25,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        _isEn ? 'Details' : 'Detalles',
                        style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w900, fontSize: 10),
                      ),
                    ),
                    IconButton(
                      onPressed: () => _downloadInvoice(res),
                      style: IconButton.styleFrom(backgroundColor: AppColors.grey25),
                      icon: const Icon(Icons.download_rounded, color: AppColors.grey400, size: 20),
                    ),
                    if (status == 'completed' && res['isReviewed'] != true)
                      TextButton(
                        onPressed: () async {
                          final ok = await showReviewExperienceSheet(context, reservation: res);
                          if (ok) await _loadData();
                        },
                        style: TextButton.styleFrom(
                          backgroundColor: const Color(0xFFFFFBEB),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: Color(0xFFFDE68A)),
                          ),
                        ),
                        child: Text(
                          _isEn ? 'Rate' : 'Calificar',
                          style: AppTypography.body100.copyWith(color: const Color(0xFFD97706), fontWeight: FontWeight.w900, fontSize: 10),
                        ),
                      ),
                    TextButton(
                      onPressed: () => _rebook(res),
                      style: TextButton.styleFrom(
                        backgroundColor: AppColors.primary50,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _isEn ? 'Re-book' : 'Reservar otra vez',
                            style: AppTypography.body100.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w900, fontSize: 11),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: AppColors.primary500, size: 16),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _chip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Text(
        label,
        style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w800, fontSize: 9),
      ),
    );
  }

  Widget _buildPagination() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          onPressed: _historyPage > 1
              ? () {
                  setState(() => _historyPage--);
                  _loadData();
                }
              : null,
          icon: const Icon(Icons.chevron_left_rounded),
        ),
        Text(
          '$_historyPage / $_historyTotalPages',
          style: AppTypography.body200.copyWith(fontWeight: FontWeight.w700),
        ),
        if (_historyTotal > 0)
          Text(
            '  ($_historyTotal)',
            style: AppTypography.body100.copyWith(color: AppColors.grey400),
          ),
        IconButton(
          onPressed: _historyPage < _historyTotalPages
              ? () {
                  setState(() => _historyPage++);
                  _loadData();
                }
              : null,
          icon: const Icon(Icons.chevron_right_rounded),
        ),
      ],
    );
  }
}
