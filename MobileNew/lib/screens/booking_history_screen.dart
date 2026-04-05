import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/default_venue_hero.dart';
import '../widgets/cancel_booking_sheet.dart';
import '../widgets/chained_network_image.dart';
import 'reservation_details_screen.dart';

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  /// Maps used by [ReservationDetailsScreen] (`img` = Unsplash photo id).
  static final List<Map<String, dynamic>> _ongoingData = [
    {
      'venueName': 'Euphoria Spa & Beauty Lounge',
      'service': 'Premium Package',
      'professionalName': 'John Doe',
      'date': 'Dec 20, 2024',
      'time': '10:00 AM',
      'status': 'appointmentOngoing',
      'price': r'$150.00',
      'img': DefaultVenueHero.unsplashPhotoId,
    },
    {
      'venueName': 'Euphoria Spa & Beauty Lounge',
      'service': 'Deluxe Facial',
      'professionalName': 'Sofia Lara',
      'date': 'Dec 22, 2024',
      'time': '2:00 PM',
      'status': 'appointmentOngoing',
      'price': r'$95.00',
      'img': '1487412947147-5cebf100ffc2',
    },
  ];

  static final List<Map<String, dynamic>> _historyData = [
    {
      'venueName': 'Luxe Hair Studio',
      'service': "Women's Haircut",
      'professionalName': 'Mateo Ríos',
      'date': 'Nov 08, 2024',
      'time': '11:00 AM',
      'status': 'resPast',
      'price': r'$65.00',
      'img': '1522338245355-da2d9cf0e458',
    },
    {
      'venueName': 'Bliss Beauty Spa',
      'service': 'Deep Tissue Massage',
      'professionalName': 'Daniel Vera',
      'date': 'Oct 21, 2024',
      'time': '4:30 PM',
      'status': 'resPast',
      'price': r'$120.00',
      'img': '1544161515-4ab6ce6db874',
    },
    {
      'venueName': 'Nail Society',
      'service': 'Gel Manicure',
      'professionalName': 'Elena Soler',
      'date': 'Sep 15, 2024',
      'time': '10:00 AM',
      'status': 'resPast',
      'price': r'$45.00',
      'img': '1522337660859-02fbefca4702',
    },
    {
      'venueName': 'Diamond Dental',
      'service': 'Whitening',
      'professionalName': 'Marco Tulio',
      'date': 'Jul 15, 2026',
      'time': '10:00 AM',
      'status': 'resUpcoming',
      'price': r'$150.00',
      'img': '1588776814546-1ffcf47267a5',
    },
    {
      'venueName': 'Urban Barber',
      'service': "Men's Cut & Style",
      'professionalName': 'James Cole',
      'date': 'Aug 02, 2024',
      'time': '3:00 PM',
      'status': 'resPast',
      'price': r'$35.00',
      'img': '1585747860715-2ba37e788b70',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  void _openDetails(Map<String, dynamic> data, {required bool isPast}) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => ReservationDetailsScreen(
          reservation: Map<String, dynamic>.from(data),
          showRatingSection: isPast,
          showQrAndFooterActions: !isPast,
        ),
      ),
    );
  }

  Future<void> _confirmCancel(Map<String, dynamic> _) async {
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showCancelBookingSheet(context);
    if (!mounted || !confirmed) return;
    messenger.showSnackBar(
      SnackBar(content: Text('appointmentCancelledMsg'.tr()), behavior: SnackBarBehavior.floating),
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
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Text(
          'myAppointmentsTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary500,
          unselectedLabelColor: AppColors.grey500,
          indicatorColor: AppColors.primary500,
          indicatorSize: TabBarIndicatorSize.tab,
          tabs: [
            Tab(text: 'appointmentTabOngoing'.tr()),
            Tab(text: 'appointmentTabHistory'.tr()),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOngoingList(),
          _buildHistoryList(),
        ],
      ),
    );
  }

  Widget _buildOngoingList() {
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: _ongoingData.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) => _buildOngoingCard(_ongoingData[index]),
    );
  }

  Widget _buildHistoryList() {
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: _historyData.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final data = _historyData[index];
        return _buildHistoryCard(data);
      },
    );
  }

  Widget _buildOngoingCard(Map<String, dynamic> data) {
    final imgId = data['img'] as String? ?? DefaultVenueHero.unsplashPhotoId;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.grey100),
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: ChainedNetworkImage(
                  urls: ChainedNetworkImage.urlsForUnsplashId(imgId, w: 200),
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      data['venueName'] as String,
                      style: AppTypography.heading200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${'checkoutSpecialist'.tr()}: ${data['professionalName']}',
                      style: AppTypography.body100.copyWith(color: AppColors.grey500),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'appointmentOngoing'.tr(),
                        style: AppTypography.body100.copyWith(
                          color: AppColors.primary500,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: AppColors.grey100),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_today_outlined, color: AppColors.grey400, size: 16),
                  const SizedBox(width: 8),
                  Text(data['date'] as String, style: AppTypography.body100.copyWith(color: AppColors.grey900)),
                ],
              ),
              Row(
                children: [
                  const Icon(Icons.access_time_outlined, color: AppColors.grey400, size: 16),
                  const SizedBox(width: 8),
                  Text(data['time'] as String, style: AppTypography.body100.copyWith(color: AppColors.grey900)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              IconButton(
                onPressed: () => _confirmCancel(data),
                tooltip: 'cancelAppointment'.tr(),
                style: IconButton.styleFrom(
                  foregroundColor: AppColors.error,
                  backgroundColor: AppColors.error.withValues(alpha: 0.08),
                ),
                icon: const Icon(Icons.event_busy_outlined, size: 22),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _openDetails(data, isPast: false),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.grey200),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text('appointmentView'.tr(), style: AppTypography.buttonMedium.copyWith(color: AppColors.grey900)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('appointmentReceipt'.tr()), behavior: SnackBarBehavior.floating),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text('appointmentReceipt'.tr(), style: AppTypography.buttonMedium.copyWith(color: AppColors.white)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(Map<String, dynamic> data) {
    final imgId = data['img'] as String? ?? DefaultVenueHero.unsplashPhotoId;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openDetails(data, isPast: true),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.grey100),
            boxShadow: [
              BoxShadow(
                color: AppColors.grey900.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: ChainedNetworkImage(
                  urls: ChainedNetworkImage.urlsForUnsplashId(imgId, w: 200),
                  width: 72,
                  height: 72,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      data['venueName'] as String,
                      style: AppTypography.heading200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      data['service'] as String,
                      style: AppTypography.body100.copyWith(color: AppColors.grey500),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text(
                          '${data['date']} · ${data['time']}',
                          style: AppTypography.body100.copyWith(color: AppColors.grey400),
                        ),
                        const Spacer(),
                        Icon(Icons.chevron_right_rounded, color: AppColors.grey400, size: 22),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
