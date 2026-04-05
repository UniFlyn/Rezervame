import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../models/booking_cart_line.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/default_venue_hero.dart';
import 'checkout_summary_screen.dart';

class BookingCalendarScreen extends StatefulWidget {
  const BookingCalendarScreen({
    super.key,
    this.venueName,
    this.heroImageUrl,
    this.cartLines = const [],
  });

  final String? venueName;
  final String? heroImageUrl;
  final List<BookingCartLine> cartLines;

  @override
  State<BookingCalendarScreen> createState() => _BookingCalendarScreenState();
}

class _BookingCalendarScreenState extends State<BookingCalendarScreen> {
  DateTime _selectedDate = DateTime.now();
  String _selectedTime = '10:00 AM';

  final List<String> _timeSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
  ];

  List<BookingCartLine> get _effectiveCart {
    if (widget.cartLines.isNotEmpty) return widget.cartLines;
    return const [
      BookingCartLine(
        id: 'default',
        name: 'Premium Package',
        durationLabel: '90 min',
        priceLabel: r'$150.00',
        priceValue: 150,
      ),
    ];
  }

  String get _venueName => widget.venueName ?? 'Euphoria Spa & Beauty Lounge';

  String get _heroImageUrl => widget.heroImageUrl ?? DefaultVenueHero.imageUrl(w: 400);

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
          'Select Date & Time',
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle('Select Date'),
            const SizedBox(height: 16),
            _buildCalendar(),
            const SizedBox(height: 32),
            _buildSectionTitle('Select Time'),
            const SizedBox(height: 16),
            _buildTimeGrid(),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => CheckoutSummaryScreen(
                        venueName: _venueName,
                        heroImageUrl: _heroImageUrl,
                        bookingDate: _selectedDate,
                        bookingTime: _selectedTime,
                        cartLines: List<BookingCartLine>.from(_effectiveCart),
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: AppColors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('bookingConfirmCalendar'.tr(), style: AppTypography.buttonLarge),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900),
    );
  }

  Widget _buildCalendar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.grey100),
      ),
      child: CalendarDatePicker(
        initialDate: _selectedDate,
        firstDate: DateTime.now(),
        lastDate: DateTime.now().add(const Duration(days: 30)),
        onDateChanged: (date) => setState(() => _selectedDate = date),
      ),
    );
  }

  Widget _buildTimeGrid() {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: _timeSlots.map((time) {
        final isSelected = _selectedTime == time;
        return InkWell(
          onTap: () => setState(() => _selectedTime = time),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary500 : AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isSelected ? AppColors.primary500 : AppColors.grey100),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: AppColors.primary500.withValues(alpha: 0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : [],
            ),
            child: Text(
              time,
              style: AppTypography.body200.copyWith(
                color: isSelected ? AppColors.white : AppColors.grey900,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
