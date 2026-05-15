import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';

class WriteReviewScreen extends StatefulWidget {
  const WriteReviewScreen({super.key, required this.venue});

  final Map<String, dynamic> venue;

  @override
  State<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends State<WriteReviewScreen> {
  int _rating = 0;
  final TextEditingController _commentController = TextEditingController();

  String get _thumbUrl {
    final id = widget.venue['img'] as String? ?? '';
    if (id.isEmpty) {
      final direct = widget.venue['imageUrl'] as String?;
      if (direct != null && direct.isNotEmpty) return direct;
      return '';
    }
    return 'https://images.unsplash.com/photo-$id?q=80&w=200&fit=crop';
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.grey900),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'writeReviewTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.grey25,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: ChainedNetworkImage(
                      urls: ChainedNetworkImage.chainFrom(_thumbUrl, widget.venue['img'] as String?, w: 200),
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.venue['name'] as String? ?? '',
                          style: AppTypography.heading300,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'beautySalon'.tr(),
                          style: AppTypography.body100.copyWith(color: AppColors.grey400),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),
            Text(
              'ratingPrompt'.tr(),
              style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                return GestureDetector(
                  onTap: () => setState(() => _rating = index + 1),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      index < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: index < _rating ? Colors.amber : AppColors.grey200,
                      size: 48,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 48),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('venueReseñas'.tr(), style: AppTypography.heading200),
                    Text(
                      '${_commentController.text.length}/500',
                      style: AppTypography.body100.copyWith(color: AppColors.grey400),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _commentController,
                  maxLines: 6,
                  maxLength: 500,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'commentHint'.tr(),
                    hintStyle: AppTypography.body100.copyWith(color: AppColors.grey300),
                    filled: true,
                    fillColor: AppColors.grey25,
                    counterText: '',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.all(20),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('addPhotosLabel'.tr(), style: AppTypography.heading200),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildAddPhotoBox(),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 58,
              child: ElevatedButton(
                onPressed: _rating > 0 && _commentController.text.isNotEmpty ? _submitReview : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: AppColors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  disabledBackgroundColor: AppColors.grey100,
                ),
                child: Text(
                  'postReview'.tr(),
                  style: AppTypography.buttonLarge.copyWith(color: AppColors.white),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildAddPhotoBox() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey100, width: 1.5, style: BorderStyle.solid),
      ),
      child: const Icon(Icons.add_a_photo_outlined, color: AppColors.grey300),
    );
  }

  void _submitReview() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'reviewSuccess'.tr(),
          style: AppTypography.heading300.copyWith(color: AppColors.white),
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );

    Future<void>.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      Navigator.of(context).pop();
    });
  }
}
