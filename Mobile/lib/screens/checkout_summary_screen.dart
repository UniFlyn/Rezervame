import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../models/booking_cart_line.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';
import 'booking_confirmation_screen.dart';

/// Checkout presented as an editable cart: remove lines, change specialist / family member.
class CheckoutSummaryScreen extends StatefulWidget {
  const CheckoutSummaryScreen({
    super.key,
    required this.venueName,
    required this.heroImageUrl,
    required this.bookingDate,
    required this.bookingTime,
    required this.cartLines,
    this.specialistNames,
  });

  final String venueName;
  final String heroImageUrl;
  final DateTime bookingDate;
  final String bookingTime;
  final List<BookingCartLine> cartLines;
  final List<String>? specialistNames;

  @override
  State<CheckoutSummaryScreen> createState() => _CheckoutSummaryScreenState();
}

class _CheckoutSummaryScreenState extends State<CheckoutSummaryScreen> {
  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).take(2).toList();
    if (parts.isEmpty) return '?';
    return parts.map((s) => s[0].toUpperCase()).join();
  }

  late List<BookingCartLine> _lines;
  late String _specialist;
  late String _bookingFor;
  late List<String> _familyOptions;

  @override
  void initState() {
    super.initState();
    _lines = List<BookingCartLine>.from(widget.cartLines);
    final names = widget.specialistNames ?? const <String>[];
    _specialist = names.isNotEmpty ? names.first : 'checkoutNoStaffListed'.tr();
    _bookingFor = 'checkoutMyself'.tr();
    _familyOptions = [
      'checkoutMyself'.tr(),
    ];
  }

  double get _subtotal => _lines.fold<double>(0, (a, b) => a + b.priceValue);

  static const double _serviceFee = 10;
  static const double _tax = 5;

  double get _total => _subtotal + _serviceFee + _tax;

  String get _formattedDate =>
      MaterialLocalizations.of(context).formatFullDate(widget.bookingDate);

  String _money(double v) => '\$${v.toStringAsFixed(2)}';

  void _removeLine(String id) {
    setState(() => _lines.removeWhere((e) => e.id == id));
  }

  Future<void> _pickSpecialist() async {
    final names = widget.specialistNames ?? const <String>[];
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
              if (names.isEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                  child: Text(
                    'checkoutNoSpecialistsModal'.tr(),
                    style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.4),
                  ),
                )
              else
                RadioGroup<String>(
                  groupValue: _specialist,
                  onChanged: (v) {
                    if (v != null) Navigator.pop(ctx, v);
                  },
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: names
                        .map(
                          (n) => Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () => Navigator.pop(ctx, n),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Radio<String>(
                                      value: n,
                                      activeColor: AppColors.primary500,
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
                          ),
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
    if (picked != null) setState(() => _specialist = picked);
  }

  Future<void> _pickFamily() async {
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
              RadioGroup<String>(
                groupValue: _bookingFor,
                onChanged: (v) {
                  if (v != null) Navigator.pop(ctx, v);
                },
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: _familyOptions
                      .map(
                        (n) => RadioListTile<String>(
                          value: n,
                          activeColor: AppColors.primary500,
                          title: Text(n, style: AppTypography.body200.copyWith(color: AppColors.grey900)),
                        ),
                      )
                      .toList(),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
    if (picked != null) setState(() => _bookingFor = picked);
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
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('checkoutYourItems'.tr(), style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900)),
                  const SizedBox(height: 16),
                  if (_lines.isEmpty)
                    _buildEmptyCart()
                  else ...[
                    ..._lines.map(_buildCartLine),
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
                onPressed: _lines.isEmpty ? null : _navigateToBookingConfirmation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: AppColors.white,
                  elevation: 0,
                  disabledBackgroundColor: AppColors.grey200,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('bookingPayNow'.tr(), style: AppTypography.buttonLarge),
              ),
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

  Widget _buildCartLine(BookingCartLine line) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.grey25,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.grey100),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(line.name, style: AppTypography.heading200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(line.durationLabel, style: AppTypography.body100.copyWith(color: AppColors.grey500)),
                ],
              ),
            ),
            Text(line.priceLabel, style: AppTypography.heading200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w800)),
            IconButton(
              onPressed: () => _removeLine(line.id),
              icon: const Icon(Icons.close_rounded, color: AppColors.grey400, size: 22),
              tooltip: 'checkoutRemoveLine'.tr(),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
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
          const Divider(height: 28, color: AppColors.grey100),
          _tappableRow(
            label: 'checkoutSpecialist'.tr(),
            value: _specialist,
            actionLabel: 'bookingChange'.tr(),
            onTap: _pickSpecialist,
          ),
          const SizedBox(height: 12),
          _tappableRow(
            label: 'checkoutBookFor'.tr(),
            value: _bookingFor,
            actionLabel: 'bookingChange'.tr(),
            onTap: _pickFamily,
          ),
        ],
      ),
    );
  }

  Widget _tappableRow({
    required String label,
    required String value,
    required String actionLabel,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: AppTypography.body100.copyWith(color: AppColors.grey500)),
                  const SizedBox(height: 2),
                  Text(value, style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            Text(actionLabel, style: AppTypography.buttonSmall.copyWith(color: AppColors.primary500)),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethod() {
    return Material(
      color: AppColors.white,
      child: InkWell(
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('bookingCreditDebit'.tr()), behavior: SnackBarBehavior.floating),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.grey100),
          ),
          child: Row(
            children: [
              const Icon(Icons.credit_card, color: AppColors.primary500),
              const SizedBox(width: 16),
              Expanded(child: Text('checkoutPaymentPending'.tr(), style: AppTypography.body200.copyWith(color: AppColors.grey900))),
              Text('bookingChange'.tr(), style: AppTypography.buttonSmall.copyWith(color: AppColors.primary500)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriceBreakdown() {
    return Column(
      children: [
        _priceRow('Subtotal', _money(_subtotal)),
        const SizedBox(height: 12),
        _priceRow('Service Fee', _money(_serviceFee)),
        const SizedBox(height: 12),
        _priceRow('Tax', _money(_tax)),
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
          label,
          style: isTotal ? AppTypography.heading300 : AppTypography.body200.copyWith(color: AppColors.grey500),
        ),
        Text(
          value,
          style: isTotal
              ? AppTypography.heading400.copyWith(color: AppColors.primary500)
              : AppTypography.heading200.copyWith(color: AppColors.grey900),
        ),
      ],
    );
  }

  String _unsplashIdFromHeroUrl(String url) {
    final m = RegExp(r'photo-([^?&#]+)').firstMatch(url);
    if (m != null) return m.group(1)!;
    return '';
  }

  void _navigateToBookingConfirmation() {
    final serviceSummary = _lines.map((e) => e.name).join(', ');
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => BookingConfirmationScreen(
          bookingDetails: {
            'venueName': widget.venueName,
            'professional': _specialist,
            'service': serviceSummary,
            'date': _formattedDate,
            'time': widget.bookingTime,
            'price': _money(_total),
            'img': _unsplashIdFromHeroUrl(widget.heroImageUrl),
            'bookingFor': _bookingFor,
          },
        ),
      ),
    );
  }
}
