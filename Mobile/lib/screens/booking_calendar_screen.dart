import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../models/booking_cart_line.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/booking_cart.dart';
import '../utils/booking_utils.dart';
import 'checkout_summary_screen.dart';

class BookingCalendarScreen extends StatefulWidget {
  const BookingCalendarScreen({
    super.key,
    this.venueName,
    this.heroImageUrl,
    this.cartLines = const [],
    this.specialists,
    this.businessId,
  });

  final String? venueName;
  final String? heroImageUrl;
  final List<BookingCartLine> cartLines;
  final List<Map<String, dynamic>>? specialists;
  final String? businessId;

  @override
  State<BookingCalendarScreen> createState() => _BookingCalendarScreenState();
}

class _BookingCalendarScreenState extends State<BookingCalendarScreen> {
  final ApiRepository _api = ApiRepository();
  DateTime _selectedDate = DateTime.now();
  String _selectedTime = '10:00 AM';
  List<Map<String, dynamic>> _schedule = [];
  List<String> _timeSlots = [];
  bool _loading = true;

  String get _venueName => widget.venueName ?? 'Venue';

  @override
  void initState() {
    super.initState();
    _loadSchedule();
  }

  Future<void> _loadSchedule() async {
    if (widget.businessId == null) {
      _refreshSlots();
      return;
    }
    try {
      final biz = await _api.fetchBusinessPublicProfile(widget.businessId!);
      if (mounted) {
        setState(() {
          _schedule = parseScheduleFromBusiness(biz);
        });
      }
    } catch (_) {}
    await _refreshSlots();
  }

  Future<void> _refreshSlots() async {
    setState(() => _loading = true);
    final slots = generateSlotsForDay(_schedule, _selectedDate);
    if (!mounted) return;

    final bookable = filterBookableTimeSlots(slots, _selectedDate);
    setState(() {
      _timeSlots = slots;
      if (bookable.isNotEmpty &&
          (!_timeSlots.contains(_selectedTime) || isTimeSlotInPast(_selectedDate, _selectedTime))) {
        _selectedTime = bookable.first;
      }
      _loading = false;
    });
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
            if (_loading)
              const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
            else if (_timeSlots.isEmpty)
              Text(
                'No available times for this date.',
                style: AppTypography.body200.copyWith(color: AppColors.grey500),
              )
            else
              _buildTimeGrid(),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: filterBookableTimeSlots(_timeSlots, _selectedDate).isEmpty
                    ? null
                    : () {
                        if (widget.cartLines.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('checkoutEmptyCart'.tr())),
                          );
                          return;
                        }
                        final selected = combineDateAndTime(_selectedDate, _selectedTime);
                        if (selected.isBefore(DateTime.now().subtract(const Duration(minutes: 1)))) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please choose a future date and time.')),
                          );
                          return;
                        }
                        Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(
                            builder: (context) => CheckoutSummaryScreen(
                              venueName: _venueName,
                              heroImageUrl: widget.heroImageUrl ?? '',
                              bookingDate: _selectedDate,
                              bookingTime: _selectedTime,
                              cartLines: BookingCart.instance.isNotEmpty
                                  ? List<BookingCartLine>.from(BookingCart.instance.lines)
                                  : List<BookingCartLine>.from(widget.cartLines),
                              specialists: widget.specialists,
                              businessId: widget.businessId,
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
    return Text(title, style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900));
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
        lastDate: DateTime.now().add(const Duration(days: 60)),
        onDateChanged: (date) {
          setState(() => _selectedDate = date);
          _refreshSlots();
        },
      ),
    );
  }

  Widget _buildTimeGrid() {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: _timeSlots.map((time) {
        final isPast = isTimeSlotInPast(_selectedDate, time);
        final isSelected = !isPast && _selectedTime == time;
        return InkWell(
          onTap: isPast ? null : () => setState(() => _selectedTime = time),
          child: Opacity(
            opacity: isPast ? 0.38 : 1,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary500 : AppColors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isPast
                      ? AppColors.grey100
                      : isSelected
                          ? AppColors.primary500
                          : AppColors.grey100,
                ),
              ),
              child: Text(
                time,
                style: AppTypography.body200.copyWith(
                  color: isPast
                      ? AppColors.grey400
                      : isSelected
                          ? AppColors.white
                          : AppColors.grey900,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
