import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class WriteReviewScreen extends StatefulWidget {
  final Map<String, dynamic> venue;
  const WriteReviewScreen({super.key, required this.venue});

  @override
  State<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends State<WriteReviewScreen> {
  int _rating = 0;
  final TextEditingController _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'writeReviewTitle'.tr(),
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Venue Header Mini
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      'https://images.unsplash.com/photo-${widget.venue['img']}?q=80&w=200&fit=crop',
                      width: 60, height: 60, fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.venue['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                        const SizedBox(height: 2),
                        Text('beautySalon'.tr(), style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),

            // Rating Section
            Text(
              'ratingPrompt'.tr(),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1e293b)),
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
                      color: index < _rating ? Colors.amber : Colors.grey.shade300,
                      size: 48,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 48),

            // Comment Section
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('venueReseñas'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                    Text('${_commentController.text.length}/500', style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _commentController,
                  maxLines: 6,
                  maxLength: 500,
                  onChanged: (v) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'commentHint'.tr(),
                    hintStyle: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.w500),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    counterText: "",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.all(20),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Photo Collection Placeholder
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('addPhotosLabel'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildAddPhotoBox(),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 48),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 58,
              child: ElevatedButton(
                onPressed: _rating > 0 && _commentController.text.isNotEmpty 
                  ? () => _submitReview() 
                  : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFff5a5f),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  disabledBackgroundColor: Colors.grey.shade200,
                ),
                child: Text(
                  'postReview'.tr(),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 0.5),
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200, width: 2, style: BorderStyle.none), // Simplified
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200, width: 2),
        ),
        child: Icon(Icons.add_a_photo_outlined, color: Colors.grey.shade400),
      ),
    );
  }

  void _submitReview() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('reviewSuccess'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
    Future.delayed(const Duration(seconds: 1), () {
       Navigator.pop(context);
    });
  }
}
