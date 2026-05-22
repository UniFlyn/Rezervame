import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

/// Web profile review modal — business rating + per-service service/staff ratings.
Future<bool> showReviewExperienceSheet(
  BuildContext context, {
  required Map<String, dynamic> reservation,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _ReviewExperienceSheet(reservation: reservation),
  );
  return result ?? false;
}

class _ReviewExperienceSheet extends StatefulWidget {
  const _ReviewExperienceSheet({required this.reservation});

  final Map<String, dynamic> reservation;

  @override
  State<_ReviewExperienceSheet> createState() => _ReviewExperienceSheetState();
}

class _ReviewExperienceSheetState extends State<_ReviewExperienceSheet> {
  final _api = ApiRepository();
  final _comment = TextEditingController();
  int _businessRating = 5;
  final Map<String, int> _serviceRatings = {};
  final Map<String, int> _staffRatings = {};
  bool _submitting = false;

  bool get _isEn => true;

  List<Map<String, dynamic>> get _reviewableItems {
    final items = (widget.reservation['items'] as List<dynamic>?) ?? [];
    return items
        .cast<Map<String, dynamic>>()
        .where((i) => '${i['status']}' == 'completed' && i['isReviewed'] != true)
        .toList();
  }

  @override
  void initState() {
    super.initState();
    for (final item in _reviewableItems) {
      final id = '${item['id']}';
      _serviceRatings[id] = 5;
      _staffRatings[id] = 5;
    }
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final services = _reviewableItems.map((item) {
        final id = '${item['id']}';
        return {
          'bookingId': id,
          'serviceRating': _serviceRatings[id] ?? 5,
          'staffRating': _staffRatings[id] ?? 5,
        };
      }).toList();

      await _api.submitReviewGroup(
        businessRating: _businessRating,
        comment: _comment.text.trim(),
        services: services,
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9),
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.grey200, borderRadius: BorderRadius.circular(2))),
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close_rounded, color: AppColors.grey400),
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: Column(
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 36),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _isEn ? 'Rate Your Experience' : 'Califica tu experiencia',
                      style: AppTypography.sectionTitle.copyWith(fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${widget.reservation['venueName']}',
                      style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w700, letterSpacing: 1),
                    ),
                    const SizedBox(height: 28),
                    Text(
                      _isEn ? 'Common Venue Rating' : 'Calificación General del Local',
                      style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 12),
                    _starRow(_businessRating, (v) => setState(() => _businessRating = v), large: true),
                    const Divider(height: 40),
                    Text(
                      _isEn ? 'Individual Service Ratings' : 'Calificaciones por Servicio',
                      style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 16),
                    ..._reviewableItems.map((item) {
                      final id = '${item['id']}';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.grey25,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${item['name']}', style: AppTypography.heading300.copyWith(fontWeight: FontWeight.w800)),
                            Text('${item['staffName']}', style: AppTypography.body100.copyWith(color: AppColors.grey400)),
                            const SizedBox(height: 16),
                            Text(_isEn ? 'Service Quality' : 'Calidad del Servicio', style: AppTypography.body100.copyWith(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 8),
                            _starRow(_serviceRatings[id] ?? 5, (v) => setState(() => _serviceRatings[id] = v)),
                            const SizedBox(height: 16),
                            Text(_isEn ? 'Staff Rating' : 'Calificación del Personal', style: AppTypography.body100.copyWith(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 8),
                            _starRow(_staffRatings[id] ?? 5, (v) => setState(() => _staffRatings[id] = v), staff: true),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _comment,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: _isEn ? 'Tell us more about your visit...' : 'Cuéntanos más sobre tu visita...',
                        filled: true,
                        fillColor: AppColors.grey25,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _submitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.grey900,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        ),
                        child: _submitting
                            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : Text(
                                _isEn ? 'Submit All Ratings' : 'Enviar todas las calificaciones',
                                style: AppTypography.buttonMedium.copyWith(color: AppColors.white, letterSpacing: 1),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _starRow(int value, ValueChanged<int> onChanged, {bool large = false, bool staff = false}) {
    final activeColor = staff ? const Color(0xFF0891B2) : const Color(0xFFF59E0B);
    final size = large ? 44.0 : 36.0;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (i) {
        final star = i + 1;
        final filled = star <= value;
        return IconButton(
          onPressed: () => onChanged(star),
          icon: Icon(
            filled ? Icons.star_rounded : Icons.star_outline_rounded,
            color: filled ? activeColor : AppColors.grey200,
            size: size * 0.55,
          ),
        );
      }),
    );
  }
}
