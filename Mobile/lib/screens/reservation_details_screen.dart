import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/cancel_booking_sheet.dart';
import '../widgets/chained_network_image.dart';
import '../data/api_repository.dart';
import 'reschedule_screen.dart';

class ReservationDetailsScreen extends StatefulWidget {
  const ReservationDetailsScreen({
    super.key,
    required this.reservation,
    this.showRatingSection = false,
    this.showQrAndFooterActions = true,
  });

  final Map<String, dynamic> reservation;
  /// Past appointments: show star rating + submit (e.g. opened from History).
  final bool showRatingSection;
  /// Upcoming: QR ticket + cancel / edit row at bottom.
  final bool showQrAndFooterActions;

  @override
  State<ReservationDetailsScreen> createState() => _ReservationDetailsScreenState();
}

class _ReservationDetailsScreenState extends State<ReservationDetailsScreen> {
  int _staffRating = 5;
  int _businessRating = 5;
  final TextEditingController _reviewNote = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _reviewNote.dispose();
    super.dispose();
  }

  String get _imgId => (widget.reservation['img'] as String? ?? '').trim();

  @override
  Widget build(BuildContext context) {
    final r = widget.reservation;
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.grey900, size: 24),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'viewDetails'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              alignment: Alignment.topRight,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: ChainedNetworkImage(
                    urls: ChainedNetworkImage.urlsForUnsplashId(_imgId, w: 600),
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(100),
                      boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.1), blurRadius: 10)],
                    ),
                    child: Text(
                      (r['status'] as String).tr(),
                      style: AppTypography.heading100.copyWith(
                        color: (r['status'] == 'resConfirmed')
                            ? AppColors.success
                            : (r['status'] == 'resCancelled')
                                ? AppColors.error
                                : AppColors.primary500,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              r['venueName'] as String,
              style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
            ),
            const SizedBox(height: 8),
            Text(
              r['service'] as String,
              style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
            ),
            const SizedBox(height: 32),
            _buildDetailRow(Icons.location_on_outlined, 'location'.tr(), 'Calle 50, Plaza Sigma, Panama City'),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _buildDetailRow(Icons.calendar_today_outlined, 'dateLabel'.tr(), r['date'] as String)),
                Expanded(child: _buildDetailRow(Icons.access_time_rounded, 'timeLabel'.tr(), r['time'] as String)),
              ],
            ),
            const SizedBox(height: 20),
            _buildDetailRow(
              Icons.person_outline_rounded,
              'professionalService'.tr(),
              (r['professionalName'] as String?)?.isNotEmpty == true
                  ? r['professionalName'] as String
                  : 'Marco Tulio',
            ),
            const Divider(height: 64, thickness: 1),
            Text(
              'servicesContracted'.tr(),
              style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 0.3),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(r['service'] as String, style: AppTypography.heading300),
                Text(r['price'] as String, style: AppTypography.heading400),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.grey25,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('totalLabel'.tr(), style: AppTypography.screenTitle.copyWith(color: AppColors.grey900)),
                  Text(r['price'] as String, style: AppTypography.screenTitle.copyWith(color: AppColors.primary500)),
                ],
              ),
            ),
            if (widget.showRatingSection) ...[
              const SizedBox(height: 40),
              Text(
                'rateYourVisit'.tr(),
                style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
              ),
              const SizedBox(height: 8),
              Text(
                'ratingPrompt'.tr(),
                style: AppTypography.body200.copyWith(color: AppColors.grey500),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Text('staffRating'.tr(), style: AppTypography.heading100.copyWith(color: AppColors.grey500)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  final filled = i < _staffRating;
                  return IconButton(
                    onPressed: () => setState(() => _staffRating = i + 1),
                    icon: Icon(
                      filled ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: filled ? Colors.amber : AppColors.grey200,
                      size: 40,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Text('businessRating'.tr(), style: AppTypography.heading100.copyWith(color: AppColors.grey500)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  final filled = i < _businessRating;
                  return IconButton(
                    onPressed: () => setState(() => _businessRating = i + 1),
                    icon: Icon(
                      filled ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: filled ? Colors.amber : AppColors.grey200,
                      size: 40,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _reviewNote,
                maxLines: 3,
                maxLength: 500,
                decoration: InputDecoration(
                  hintText: 'commentHint'.tr(),
                  hintStyle: AppTypography.body100.copyWith(color: AppColors.grey300),
                  filled: true,
                  fillColor: AppColors.grey25,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : () async {
                    if (_staffRating == 0 || _businessRating == 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('ratingPrompt'.tr()), behavior: SnackBarBehavior.floating),
                      );
                      return;
                    }
                    setState(() => _isSubmitting = true);
                    try {
                      final bid = widget.reservation['id'] as String?;
                      if (bid != null) {
                        await ApiRepository().submitReview(
                          bookingId: bid,
                          staffRating: _staffRating,
                          businessRating: _businessRating,
                          comment: _reviewNote.text.trim(),
                        );
                      }
                      
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('reviewSuccess'.tr(), style: AppTypography.body200.copyWith(color: AppColors.white)),
                          backgroundColor: AppColors.success,
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                      Navigator.pop(context);
                    } catch (e) {
                       ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('errorSubmittingReview'.tr()), behavior: SnackBarBehavior.floating),
                      );
                    } finally {
                      if (mounted) setState(() => _isSubmitting = false);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    disabledBackgroundColor: AppColors.grey200,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSubmitting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: AppColors.white, strokeWidth: 2))
                    : Text('submitRating'.tr(), style: AppTypography.buttonLarge.copyWith(color: AppColors.white)),
                ),
              ),
            ],
            if (widget.showQrAndFooterActions) ...[
              const SizedBox(height: 48),
              Center(
                child: Column(
                  children: [
                    Text(
                      'ticketId'.tr(),
                      style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 0.3),
                    ),
                    const SizedBox(height: 8),
                    Text('RZV-982-XKL', style: AppTypography.screenTitle.copyWith(color: AppColors.grey900)),
                    const SizedBox(height: 32),
                    QrImageView(
                      data: 'RZV-982-XKL',
                      version: QrVersions.auto,
                      size: 200,
                      eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                      dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'showCodeAtVenue'.tr(),
                      textAlign: TextAlign.center,
                      style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        final navigator = Navigator.of(context);
                        final confirmed = await showCancelBookingSheet(context);
                        if (!mounted || !confirmed) return;
                        messenger.showSnackBar(
                          SnackBar(content: Text('appointmentCancelledMsg'.tr()), behavior: SnackBarBehavior.floating),
                        );
                        navigator.pop();
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: AppColors.error),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text('cancelAppointment'.tr(), style: AppTypography.buttonMedium.copyWith(color: AppColors.error)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(
                            builder: (context) => RescheduleScreen(
                              venueName: r['venueName'] as String?,
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: AppColors.grey900,
                        foregroundColor: AppColors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        'rescheduleAction'.tr(),
                        style: AppTypography.buttonMedium.copyWith(color: AppColors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppColors.grey25, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, size: 20, color: AppColors.grey900),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 0.3),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
