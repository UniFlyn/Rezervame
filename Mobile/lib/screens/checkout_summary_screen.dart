import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../models/booking_cart_line.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/booking_cart.dart';
import '../utils/booking_utils.dart';
import '../utils/payment_config.dart';
import '../utils/payment_method.dart';
import '../widgets/chained_network_image.dart';
import 'booking_confirmation_screen.dart';

class CheckoutSummaryScreen extends StatefulWidget {
  const CheckoutSummaryScreen({
    super.key,
    required this.venueName,
    required this.heroImageUrl,
    required this.bookingDate,
    required this.bookingTime,
    required this.cartLines,
    this.specialists,
    this.businessId,
  });

  final String venueName;
  final String heroImageUrl;
  final DateTime bookingDate;
  final String bookingTime;
  final List<BookingCartLine> cartLines;
  final List<Map<String, dynamic>>? specialists;
  final String? businessId;

  @override
  State<CheckoutSummaryScreen> createState() => _CheckoutSummaryScreenState();
}

class _CheckoutSummaryScreenState extends State<CheckoutSummaryScreen> {
  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).take(2).toList();
    if (parts.isEmpty) return '?';
    return parts.map((s) => s[0].toUpperCase()).join();
  }

  String _staffDisplayName(Map<String, dynamic> staff) {
    final name = '${staff['name'] ?? ''}'.trim();
    return name.isNotEmpty ? name : 'checkoutNoStaffListed'.tr();
  }

  String? _resolveStaffId(String specialistLabel) {
    final list = widget.specialists;
    if (list == null) return null;
    for (final s in list) {
      if (_staffDisplayName(s) == specialistLabel) {
        final id = '${s['id'] ?? ''}'.trim();
        return id.isNotEmpty ? id : null;
      }
    }
    return null;
  }

  final ApiRepository _api = ApiRepository();
  late List<BookingCartLine> _lines;

  // Maps from cartLine index to selected staff name and family guest name
  final Map<int, String> _lineSpecialists = {};
  final Map<int, String> _lineBookingFor = {};

  late List<String> _familyOptions;
  List<Map<String, dynamic>> _loadedFamilyMembers = [];
  bool _submitting = false;
  String _checkoutPayTab = 'pay_at_venue';
  bool _autoApproval = false;
  List<Map<String, dynamic>> _payMethods = [
    {'id': 'wompi', 'label': 'Card', 'enabled': false},
    {'id': 'yappy', 'label': 'Yappy', 'enabled': false},
    {'id': 'pay_at_venue', 'label': 'Pay by visit', 'enabled': true},
  ];

  double _taxPercentage = 0;
  double _commissionPercent = 15;

  @override
  void initState() {
    super.initState();
    final liveCart = BookingCart.instance;
    if (liveCart.isNotEmpty &&
        (liveCart.businessId == null ||
            liveCart.businessId == widget.businessId ||
            widget.businessId == null)) {
      _lines = List<BookingCartLine>.from(liveCart.lines);
    } else {
      _lines = List<BookingCartLine>.from(widget.cartLines);
    }
    final list = widget.specialists ?? const [];
    final defaultStaff = list.isNotEmpty ? _staffDisplayName(list.first) : 'checkoutNoStaffListed'.tr();

    for (int i = 0; i < _lines.length; i++) {
      _lineSpecialists[i] = defaultStaff;
      _lineBookingFor[i] = 'checkoutMyself'.tr();
    }

    _familyOptions = [
      'checkoutMyself'.tr(),
    ];
    _loadFamily();
    _loadBusinessProfile();
    _loadPaymentConfig();
  }

  Future<void> _loadPaymentConfig() async {
    try {
      final raw = await _api.fetchPaymentConfig();
      if (!mounted) return;
      final cfg = normalizePaymentConfig(raw);
      final methods = (cfg['methods'] as List<dynamic>?)
              ?.whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList() ??
          _payMethods;
      final visible = checkoutVisibleMethods(methods);
      setState(() {
        _payMethods = visible.isNotEmpty ? visible : methods;
        final dc = cfg['defaultCommission'];
        if (dc is num) _commissionPercent = dc.toDouble();
        _checkoutPayTab = pickDefaultPaymentMethodId(methods);
      });
    } catch (_) {}
  }

  Future<void> _loadBusinessProfile() async {
    if (widget.businessId == null) return;
    try {
      final biz = await _api.fetchBusinessPublicProfile(widget.businessId!);
      if (mounted && biz != null) {
        setState(() {
          _taxPercentage = double.tryParse('${biz['taxPercentage']}') ?? 0.0;
          _commissionPercent = double.tryParse('${biz['commissionPercent']}') ?? 15.0;
          _autoApproval = '${biz['appointmentApprovalMode'] ?? ''}' == 'automatic';
        });
      }
    } catch (e) {
      // Keep default
    }
  }

  IconData _paymentMethodIcon(String id) {
    switch (normalizeCheckoutMethodId(id)) {
      case 'yappy':
        return Icons.account_balance_wallet_outlined;
      case 'wompi':
        return Icons.credit_card;
      default:
        return Icons.payments_outlined;
    }
  }

  Future<void> _loadFamily() async {
    try {
      final fam = await _api.fetchFamilyMembers();
      if (mounted) {
        setState(() {
          _loadedFamilyMembers = fam;
          _familyOptions = [
            'checkoutMyself'.tr(),
            ...fam
                .map((m) => '${m['name'] ?? ''}'.trim())
                .where((name) => name.isNotEmpty),
          ];
        });
      }
    } catch (e) {
      // Keep default
    }
  }

  double get _subtotal => _lines.fold<double>(0, (a, b) => a + b.priceValue);
  double get _platformFee => (_subtotal * _commissionPercent) / 100;
  double get _tax => (_subtotal * _taxPercentage) / 100;
  double get _total => _subtotal + _platformFee + _tax;

  String get _formattedDate =>
      MaterialLocalizations.of(context).formatFullDate(widget.bookingDate);

  String _money(double v) => '\$${v.toStringAsFixed(2)}';

  void _removeLine(int index) {
    setState(() {
      _lines.removeAt(index);
      // Shift keys in our maps to match new indices
      final nextSpecialists = <int, String>{};
      final nextBookingFor = <int, String>{};
      for (int i = 0; i < _lines.length; i++) {
        final oldIndex = i >= index ? i + 1 : i;
        nextSpecialists[i] = _lineSpecialists[oldIndex] ?? 'checkoutNoStaffListed'.tr();
        nextBookingFor[i] = _lineBookingFor[oldIndex] ?? 'checkoutMyself'.tr();
      }
      _lineSpecialists.clear();
      _lineSpecialists.addAll(nextSpecialists);
      _lineBookingFor.clear();
      _lineBookingFor.addAll(nextBookingFor);
    });
  }

  Future<void> _pickSpecialistForLine(int index) async {
    final list = widget.specialists ?? const [];
    final current = _lineSpecialists[index] ?? 'checkoutNoStaffListed'.tr();
    final picked = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.grey100,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
                child: Text(
                  'bookingSelectProfessional'.tr(),
                  style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                ),
              ),
              if (list.isEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                  child: Text(
                    'checkoutNoSpecialistsModal'.tr(),
                    style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.4),
                  ),
                )
              else
                RadioGroup<String>(
                  groupValue: current,
                  onChanged: (v) {
                    if (v != null) Navigator.pop(ctx, v);
                  },
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: list
                        .map(
                          (m) {
                            final rawName = '${m['name'] ?? ''}'.trim();
                            final hasId = '${m['id'] ?? ''}'.trim().isNotEmpty;
                            if (rawName.isEmpty && !hasId) {
                              return const SizedBox.shrink();
                            }
                            final n = _staffDisplayName(m);
                            return Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () => Navigator.pop(ctx, n),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Icon(
                                        n == current ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                                        color: n == current ? AppColors.primary500 : AppColors.grey300,
                                      ),
                                      CircleAvatar(
                                        radius: 22,
                                        backgroundColor: AppColors.primary50,
                                        child: Text(
                                          _initials(n),
                                          style: AppTypography.body200.copyWith(
                                            color: AppColors.primary500,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Text(
                                          n,
                                          style: AppTypography.body200.copyWith(color: AppColors.grey900),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        )
                        .toList(),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: Text('bookingBackToSummary'.tr(), style: AppTypography.buttonMedium),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (picked != null) {
      setState(() => _lineSpecialists[index] = picked);
    }
  }

  Future<void> _pickFamilyForLine(int index) async {
    final current = _lineBookingFor[index] ?? 'checkoutMyself'.tr();
    final picked = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.grey100,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
                child: Text(
                  'checkoutSelectFamily'.tr(),
                  style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: _familyOptions
                    .map(
                      (n) => ListTile(
                        leading: Icon(
                          n == current ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          color: n == current ? AppColors.primary500 : AppColors.grey300,
                        ),
                        title: Text(n, style: AppTypography.body200.copyWith(color: AppColors.grey900)),
                        onTap: () => Navigator.pop(ctx, n),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
    if (picked != null) {
      setState(() => _lineBookingFor[index] = picked);
    }
  }

  DateTime _combineDateTime(DateTime date, String timeStr) {
    final timeClean = timeStr.trim().toUpperCase();
    final parts = timeClean.split(' ');
    final hms = parts[0].split(':');
    var hour = int.parse(hms[0]);
    final minute = int.parse(hms[1]);
    final ampm = parts.length > 1 ? parts[1] : 'AM';
    if (ampm == 'PM' && hour < 12) {
      hour += 12;
    } else if (ampm == 'AM' && hour == 12) {
      hour = 0;
    }
    return DateTime(date.year, date.month, date.day, hour, minute);
  }

  Future<void> _submitBookings() async {
    final start = _combineDateTime(widget.bookingDate, widget.bookingTime);
    if (start.isBefore(DateTime.now().subtract(const Duration(minutes: 1)))) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please choose a future date and time.')),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      var cursor = start;
      final bookingGroupId = 'grp_${DateTime.now().millisecondsSinceEpoch}';
      final preferredPayment = apiPaymentMethodForCheckoutTab(_checkoutPayTab);
      final isCashCheckout =
          _checkoutPayTab == 'cash' || _checkoutPayTab == 'pay_at_venue';

      // Create bookings sequentially; stagger each service by its duration (matches Web).
      final createdIds = <String>[];
      for (int i = 0; i < _lines.length; i++) {
        final line = _lines[i];

        final bookingFor = _lineBookingFor[i] ?? 'checkoutMyself'.tr();
        String? familyMemberId;
        if (bookingFor != 'checkoutMyself'.tr()) {
          final matches = _loadedFamilyMembers.where(
            (m) => '${m['name'] ?? ''}'.trim() == bookingFor,
          );
          if (matches.isNotEmpty) {
            final id = '${matches.first['id'] ?? ''}'.trim();
            if (id.isNotEmpty) familyMemberId = id;
          }
        }

        final specialist = _lineSpecialists[i] ?? 'checkoutNoStaffListed'.tr();
        final staffId = _resolveStaffId(specialist);

        final result = await _api.createBooking(
          businessId: widget.businessId ?? '',
          serviceId: line.id,
          date: cursor.toIso8601String(),
          staffId: staffId,
          familyMemberId: familyMemberId,
          paymentMethod: preferredPayment,
          bookingGroupId: bookingGroupId,
        );
        if (result != null && result['id'] != null) {
          createdIds.add('${result['id']}');
        }

        final durationMins = parseDurationMinutes({'time': line.durationLabel});
        cursor = cursor.add(Duration(minutes: durationMins));
      }

      if (createdIds.isEmpty) {
        throw Exception('No bookings were created. Please try again.');
      }

      BookingCart.instance.clear();

      if (!mounted) return;
      _navigateToBookingConfirmation(
        createdIds,
        paid: _autoApproval && !isCashCheckout,
        autoApproval: _autoApproval,
        isCash: isCashCheckout,
      );
    } catch (e) {
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Booking Error'),
          content: Text(e.toString().replaceAll('Exception: ', '')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.grey900),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'checkoutCartTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('checkoutYourItems'.tr(), style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900)),
                      if (_lines.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            '${_lines.length} ${_lines.length == 1 ? 'service' : 'services'}',
                            style: AppTypography.body100.copyWith(color: AppColors.grey500),
                          ),
                        ),
                      const SizedBox(height: 16),
                      if (_lines.isEmpty)
                        _buildEmptyCart()
                      else ...[
                        ...List.generate(_lines.length, (index) => _buildCartLine(_lines[index], index)),
                        const SizedBox(height: 28),
                        Text('checkoutAppointment'.tr(), style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900)),
                        const SizedBox(height: 16),
                        _buildAppointmentCard(),
                        const SizedBox(height: 28),
                        Text('bookingPaymentMethod'.tr(), style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900)),
                        const SizedBox(height: 16),
                        _buildPaymentMethod(),
                        const SizedBox(height: 28),
                        Text('bookingPriceBreakdown'.tr(), style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900)),
                        const SizedBox(height: 16),
                        _buildPriceBreakdown(),
                      ],
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: (_lines.isEmpty || _submitting) ? null : _submitBookings,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary500,
                      foregroundColor: AppColors.white,
                      elevation: 0,
                      disabledBackgroundColor: AppColors.grey200,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _submitting
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(color: AppColors.white, strokeWidth: 2),
                          )
                        : Text('bookingConfirmCalendar'.tr(), style: AppTypography.buttonLarge),
                  ),
                ),
              ),
            ],
          ),
          if (_submitting)
            Container(
              color: Colors.black.withValues(alpha: 0.3),
              child: const Center(
                child: CircularProgressIndicator(color: AppColors.primary500),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyCart() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Column(
        children: [
          Text(
            'checkoutEmptyCart'.tr(),
            textAlign: TextAlign.center,
            style: AppTypography.body200.copyWith(color: AppColors.grey500),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('checkoutAddServices'.tr(), style: AppTypography.buttonMedium.copyWith(color: AppColors.primary500)),
          ),
        ],
      ),
    );
  }

  Widget _buildCartLine(BookingCartLine line, int index) {
    final specialistName = _lineSpecialists[index] ?? 'checkoutNoStaffListed'.tr();
    final bookingForName = _lineBookingFor[index] ?? 'checkoutMyself'.tr();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.grey25,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.grey100),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        line.name,
                        style: AppTypography.heading200.copyWith(
                          color: AppColors.grey900,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        line.durationLabel,
                        style: AppTypography.body100.copyWith(color: AppColors.grey500),
                      ),
                    ],
                  ),
                ),
                Text(
                  line.priceLabel,
                  style: AppTypography.heading200.copyWith(
                    color: AppColors.primary500,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: () => _removeLine(index),
                  icon: const Icon(Icons.close_rounded, color: AppColors.grey400, size: 22),
                  tooltip: 'checkoutRemoveLine'.tr(),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                ),
              ],
            ),
            const Divider(height: 24, color: AppColors.grey100),
            Row(
              children: [
                // Specialist Selection Pill
                Expanded(
                  child: InkWell(
                    onTap: () => _pickSpecialistForLine(index),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.grey100),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.psychology_outlined, color: AppColors.primary500, size: 16),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'checkoutSpecialist'.tr(),
                                  style: AppTypography.body100.copyWith(color: AppColors.grey400, fontSize: 9),
                                ),
                                Text(
                                  specialistName,
                                  style: AppTypography.body200.copyWith(
                                    color: AppColors.grey900,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 11,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.keyboard_arrow_down, color: AppColors.grey400, size: 16),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Guest Selection Pill
                Expanded(
                  child: InkWell(
                    onTap: () => _pickFamilyForLine(index),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.grey100),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.people_alt_outlined, color: AppColors.primary500, size: 16),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'checkoutBookFor'.tr(),
                                  style: AppTypography.body100.copyWith(color: AppColors.grey400, fontSize: 9),
                                ),
                                Text(
                                  bookingForName,
                                  style: AppTypography.body200.copyWith(
                                    color: AppColors.grey900,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 11,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.keyboard_arrow_down, color: AppColors.grey400, size: 16),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: ChainedNetworkImage(
                  urls: ChainedNetworkImage.chainFrom(widget.heroImageUrl, null, w: 200),
                  width: 56,
                  height: 56,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.venueName, style: AppTypography.heading200.copyWith(color: AppColors.grey900)),
                    const SizedBox(height: 4),
                    Text(_formattedDate, style: AppTypography.body100.copyWith(color: AppColors.grey500)),
                    Text(widget.bookingTime, style: AppTypography.body100.copyWith(color: AppColors.grey500)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethod() {
    if (_payMethods.isEmpty) {
      return Text(
        'checkoutPaymentPending'.tr(),
        style: AppTypography.body100.copyWith(color: AppColors.grey500),
      );
    }

    final activeId = normalizeCheckoutMethodId(_checkoutPayTab);
    if (!isCheckoutMethodSelectable(activeId, _payMethods)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() => _checkoutPayTab = pickDefaultPaymentMethodId(_payMethods));
        }
      });
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: _payMethods.map((method) {
        final id = '${method['id']}';
        final selectable = isPaymentMethodSelectable(method);
        final selected = activeId == id && selectable;
        final label = '${method['label'] ?? ''}'.trim();
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Material(
            color: selected ? AppColors.primary50 : AppColors.white,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: selectable ? () => setState(() => _checkoutPayTab = id) : null,
              borderRadius: BorderRadius.circular(16),
              child: Opacity(
                opacity: selectable ? 1 : 0.45,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selected ? AppColors.primary500 : AppColors.grey100,
                      width: selected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(_paymentMethodIcon(id), color: AppColors.primary500),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              label.isNotEmpty ? label : id,
                              style: AppTypography.body200.copyWith(
                                color: AppColors.grey900,
                                fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                              ),
                            ),
                            if (!selectable)
                              Text(
                                'checkoutPaymentPending'.tr(),
                                style: AppTypography.body100.copyWith(color: AppColors.grey500),
                              ),
                          ],
                        ),
                      ),
                      if (selected)
                        const Icon(Icons.check_circle, color: AppColors.primary500, size: 22),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPriceBreakdown() {
    return Column(
      children: [
        _priceRow('Subtotal', _money(_subtotal)),
        const SizedBox(height: 12),
        _priceRow('Service Fee (${_commissionPercent.toStringAsFixed(0)}%)', _money(_platformFee)),
        const SizedBox(height: 12),
        _priceRow('Tax${_taxPercentage > 0 ? ' (${_taxPercentage.toStringAsFixed(0)}%)' : ''}', _money(_tax)),
        const SizedBox(height: 16),
        const Divider(color: AppColors.grey100),
        const SizedBox(height: 16),
        _priceRow('Total', _money(_total), isTotal: true),
      ],
    );
  }

  Widget _priceRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: isTotal ? FontWeight.w900 : FontWeight.bold,
            letterSpacing: 1.5,
            color: isTotal ? AppColors.grey900 : AppColors.grey400,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 24 : 14,
            fontWeight: FontWeight.w900,
            color: isTotal ? AppColors.primary500 : AppColors.grey600,
          ),
        ),
      ],
    );
  }

  String _unsplashIdFromHeroUrl(String url) {
    final m = RegExp(r'photo-([^?&#]+)').firstMatch(url);
    if (m != null) return m.group(1)!;
    return '';
  }

  void _navigateToBookingConfirmation(
    List<String> bookingIds, {
    bool paid = false,
    bool autoApproval = false,
    bool isCash = false,
  }) {
    final serviceSummary = _lines.map((e) => e.name).join(', ');
    final specialistsSummary = _lineSpecialists.values.toSet().join(', ');
    final bookingForSummary = _lineBookingFor.values.toSet().join(', ');
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => BookingConfirmationScreen(
          bookingDetails: {
            'venueName': widget.venueName,
            'professional': specialistsSummary,
            'service': serviceSummary,
            'date': _formattedDate,
            'time': widget.bookingTime,
            'price': _money(_total),
            'img': _unsplashIdFromHeroUrl(widget.heroImageUrl),
            'bookingFor': bookingForSummary,
            'bookingIds': bookingIds,
            'primaryBookingId': bookingIds.isNotEmpty ? bookingIds.first : null,
            'businessId': widget.businessId,
            'imageUrl': widget.heroImageUrl,
            'address': '',
            'paid': paid,
            'autoApproval': autoApproval,
            'isCash': isCash,
          },
        ),
      ),
    );
  }
}

// Inline RadioGroup implementation to ensure we don't depend on external widget definition
class RadioGroup<T> extends StatelessWidget {
  const RadioGroup({
    super.key,
    required this.groupValue,
    required this.onChanged,
    required this.child,
  });

  final T groupValue;
  final ValueChanged<T?> onChanged;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return child;
  }
}
