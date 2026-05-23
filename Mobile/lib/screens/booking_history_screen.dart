import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/invoice_pdf_util.dart';
import '../widgets/chained_network_image.dart';
import '../widgets/reservation_detail_sheet.dart';
import '../widgets/reservation_status_badge.dart';
import '../widgets/review_experience_sheet.dart';
import 'login_screen.dart';
import 'service_detail_screen.dart';

enum _BookingsSegment { upcoming, past }

/// My Reservations — Upcoming / Past toggle + Web-style reservation cards.
class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen> with WidgetsBindingObserver {
  final _repo = ApiRepository();
  _BookingsSegment _segment = _BookingsSegment.upcoming;
  List<Map<String, dynamic>> _ongoingData = [];
  List<Map<String, dynamic>> _historyData = [];
  bool _loading = true;
  bool _authChecked = false;
  bool _loggedIn = false;
  String? _loadError;
  int _historyPage = 1;
  int _historyTotalPages = 1;
  int _historyTotal = 0;

  bool get _isEn => context.locale.languageCode == 'en';

  List<Map<String, dynamic>> get _activeList =>
      _segment == _BookingsSegment.upcoming ? _ongoingData : _historyData;

  List<Map<String, dynamic>> _coerceMapList(dynamic raw) {
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _loggedIn) {
      _loadData(refresh: false);
    }
  }

  Future<void> _bootstrap() async {
    final token = await AuthSession.getToken();
    if (!mounted) return;
    final hasAuth = token != null && token.isNotEmpty;
    setState(() {
      _authChecked = true;
      _loggedIn = hasAuth;
      _loading = hasAuth;
    });
    if (hasAuth) {
      await _loadData(refresh: false);
    }
  }

  Future<void> _loadData({bool refresh = true}) async {
    if (!mounted) return;
    if (!_loggedIn) {
      setState(() {
        _loading = false;
        _ongoingData = [];
        _historyData = [];
      });
      return;
    }
    if (refresh) {
      setState(() {
        _loading = true;
        _loadError = null;
      });
    }

    try {
      final localeCode = mounted ? context.locale.languageCode : 'en';
      final data = await _repo.fetchBookings(page: _historyPage, limit: 10, locale: localeCode);
      if (!mounted) return;
      setState(() {
        _ongoingData = _coerceMapList(data['ongoing']);
        _historyData = _coerceMapList(data['history']);
        _historyTotalPages = (data['totalPages'] as int?) ?? 1;
        _historyTotal = (data['total'] as int?) ?? _historyData.length;
        _loadError = null;
      });
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString().replaceAll('Exception: ', '').trim();
      final unauthorized = msg.toLowerCase().contains('unauthorized');
      setState(() {
        if (unauthorized) _loggedIn = false;
        _ongoingData = [];
        _historyData = [];
        _historyTotalPages = 1;
        _historyTotal = 0;
        _loadError = unauthorized
            ? null
            : (msg.isNotEmpty
                ? msg
                : (_isEn
                    ? 'Could not load reservations. Pull to refresh.'
                    : 'No se pudieron cargar las reservas. Desliza para actualizar.'));
      });
      if (!unauthorized && refresh && _loadError != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_loadError!)),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onSegmentChanged(_BookingsSegment next) {
    if (_segment == next) return;
    setState(() {
      _segment = next;
      if (next == _BookingsSegment.past && _historyPage != 1) {
        _historyPage = 1;
        _loadData();
      }
    });
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
      backgroundColor: AppColors.grey25,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Text(
          _isEn ? 'My Reservations' : 'Mis Reservas',
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w900),
        ),
      ),
      body: !_authChecked
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
          : !_loggedIn
              ? _buildSignInPrompt()
              : RefreshIndicator(
                  color: AppColors.primary500,
                  onRefresh: () => _loadData(),
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                    children: [
                      Text(
                        _isEn
                            ? 'Manage your appointments and download your invoices'
                            : 'Gestiona tus citas y descarga tus facturas',
                        style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 20),
                      _buildSegmentToggle(),
                      const SizedBox(height: 20),
                      if (_loading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 48),
                          child: Center(
                            child: CircularProgressIndicator(color: AppColors.primary500),
                          ),
                        )
                      else if (_loadError != null)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 32),
                          child: Center(
                            child: Column(
                              children: [
                                Text(
                                  _loadError!,
                                  textAlign: TextAlign.center,
                                  style: AppTypography.body200.copyWith(
                                    color: AppColors.grey500,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                OutlinedButton(
                                  onPressed: () => _loadData(),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.primary500,
                                    side: const BorderSide(color: AppColors.primary500),
                                  ),
                                  child: Text(
                                    _isEn ? 'Try again' : 'Reintentar',
                                    style: AppTypography.buttonMedium.copyWith(color: AppColors.primary500),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      else if (_activeList.isEmpty)
                        _buildEmptyState()
                      else
                        ..._activeList.map(
                          (res) => _segment == _BookingsSegment.upcoming
                              ? _buildUpcomingTail(res)
                              : _buildPastTail(res),
                        ),
                      if (!_loading && _segment == _BookingsSegment.past && _historyTotalPages > 1) ...[
                        const SizedBox(height: 8),
                        _buildPagination(),
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _buildSignInPrompt() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.calendar_month_outlined, size: 56, color: AppColors.grey300),
            const SizedBox(height: 16),
            Text(
              _isEn ? 'Sign in to view your reservations' : 'Inicia sesión para ver tus reservas',
              textAlign: TextAlign.center,
              style: AppTypography.body200.copyWith(color: AppColors.grey600, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () async {
                await Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(builder: (context) => const LoginScreen()),
                );
                await _loadData();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary500,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: Text(
                _isEn ? 'Sign in' : 'Iniciar sesión',
                style: AppTypography.buttonMedium.copyWith(color: AppColors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSegmentToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Row(
        children: [
          Expanded(child: _segmentButton(_BookingsSegment.upcoming, _isEn ? 'Upcoming' : 'Próximas')),
          Expanded(child: _segmentButton(_BookingsSegment.past, _isEn ? 'Past' : 'Anteriores')),
        ],
      ),
    );
  }

  Widget _segmentButton(_BookingsSegment value, String label) {
    final selected = _segment == value;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _onSegmentChanged(value),
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary500 : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: AppColors.primary500.withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: AppTypography.body100.copyWith(
              color: selected ? AppColors.white : AppColors.grey500,
              fontWeight: FontWeight.w900,
              fontSize: 12,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final upcoming = _segment == _BookingsSegment.upcoming;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Text(
          upcoming
              ? (_isEn ? 'No upcoming reservations.' : 'Sin próximas reservas.')
              : (_isEn ? 'No past appointments yet.' : 'Aún no hay citas anteriores.'),
          style: AppTypography.body200.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  /// Web-style upcoming reservation card (rounded tail, full-width tap).
  Widget _buildUpcomingTail(Map<String, dynamic> res) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => _openDetails(res),
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.grey100, width: 2),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.grey900.withValues(alpha: 0.05),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
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
                    Expanded(child: _reservationHeader(res, emphasizeService: true)),
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
          ),
        ),
      ),
    );
  }

  /// Web-style history card (large rounded tail).
  Widget _buildPastTail(Map<String, dynamic> res) {
    final status = '${res['status']}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(40),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => _openDetails(res),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.grey200),
              borderRadius: BorderRadius.circular(40),
              boxShadow: [
                BoxShadow(
                  color: AppColors.grey200.withValues(alpha: 0.5),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
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
                    Expanded(child: _reservationHeader(res, emphasizeService: false)),
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
                              style: AppTypography.body100.copyWith(
                                color: AppColors.grey400,
                                fontWeight: FontWeight.w900,
                                fontSize: 10,
                              ),
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
                                style: AppTypography.body100.copyWith(
                                  color: const Color(0xFFD97706),
                                  fontWeight: FontWeight.w900,
                                  fontSize: 10,
                                ),
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
                                  style: AppTypography.body100.copyWith(
                                    color: AppColors.primary500,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 11,
                                  ),
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
          ),
        ),
      ),
    );
  }

  Widget _reservationHeader(Map<String, dynamic> res, {required bool emphasizeService}) {
    final title = emphasizeService ? '${res['serviceName']}' : '${res['venueName']}';
    final subtitle = emphasizeService
        ? '${res['venueName']} • ${res['time']}'
        : '${res['serviceName']} • ${res['date']}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                title,
                style: AppTypography.heading200.copyWith(fontWeight: FontWeight.w900),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: emphasizeService ? AppColors.primary50 : AppColors.grey50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: emphasizeService
                      ? AppColors.primary500.withValues(alpha: 0.2)
                      : AppColors.grey100,
                ),
              ),
              child: Text(
                '#${res['refNumber']}',
                style: AppTypography.body100.copyWith(
                  color: emphasizeService ? AppColors.primary500 : AppColors.grey400,
                  fontWeight: FontWeight.w900,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: AppTypography.body100.copyWith(
            color: emphasizeService ? AppColors.grey600 : AppColors.grey400,
            fontWeight: FontWeight.w700,
          ),
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
              _chip(_isEn ? 'Pro: ${res['staffName']}' : 'Prof: ${res['staffName']}'),
            if (emphasizeService && '${res['phone'] ?? ''}'.isNotEmpty)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.phone_outlined, size: 14, color: AppColors.primary500),
                  const SizedBox(width: 4),
                  Text(
                    '${res['phone']}',
                    style: AppTypography.body100.copyWith(
                      color: AppColors.grey500,
                      fontWeight: FontWeight.w700,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ],
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
