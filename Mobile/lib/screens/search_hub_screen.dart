import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/venue_catalog.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';
import 'booking_history_screen.dart';
import 'search_results_screen.dart';
import 'service_detail_screen.dart';

/// Root Search tab: search field, recent searches, recently viewed (reference layout).
class SearchHubScreen extends StatefulWidget {
  const SearchHubScreen({super.key});

  @override
  State<SearchHubScreen> createState() => _SearchHubScreenState();
}

class _SearchHubScreenState extends State<SearchHubScreen> {
  final TextEditingController _searchController = TextEditingController();
  final List<String> _recentTerms = ['Clinic', 'Salon', 'Facial Treatment'];

  List<VenueListing> get _recentlyViewed => VenueCatalog.nearbyPreview(3);

  void _openResults([String? query]) {
    final q = (query ?? _searchController.text).trim();
    if (q.isNotEmpty && !_recentTerms.contains(q)) {
      setState(() => _recentTerms.insert(0, q));
      if (_recentTerms.length > 10) _recentTerms.removeLast();
    }
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => SearchResultsScreen(
          initialQuery: q,
          showBackButton: true,
        ),
      ),
    );
  }

  void _openResultsFromChip(String term) {
    _searchController.text = term;
    _openResults(term);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        title: Text(
          'searchScreenTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const BookingHistoryScreen()),
              );
            },
            icon: const Icon(Icons.calendar_today_outlined, color: AppColors.grey900, size: 24),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        children: [
          Container(
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.grey25,
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: AppColors.grey100),
            ),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _openResults(),
              style: AppTypography.body200.copyWith(color: AppColors.grey900),
              decoration: InputDecoration(
                hintText: 'searchFieldHint'.tr(),
                hintStyle: AppTypography.body200.copyWith(color: AppColors.grey400),
                prefixIcon: Icon(Icons.search_rounded, color: AppColors.grey400.withValues(alpha: 0.95), size: 24),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'recentSearch'.tr(),
                style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
              ),
              TextButton(
                onPressed: () => setState(() => _recentTerms.clear()),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'clearAll'.tr(),
                  style: AppTypography.heading200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_recentTerms.isEmpty)
            Text(
              'searchPlaceholder'.tr(),
              style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey400),
            )
          else
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _recentTerms
                  .map(
                    (t) => Material(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(24),
                      child: InkWell(
                        onTap: () => _openResultsFromChip(t),
                        borderRadius: BorderRadius.circular(24),
                        child: Container(
                          padding: const EdgeInsets.only(left: 14, right: 6, top: 8, bottom: 8),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: AppColors.grey200),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                t,
                                style: AppTypography.body200.copyWith(color: AppColors.grey800, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(width: 4),
                              InkWell(
                                onTap: () => setState(() => _recentTerms.remove(t)),
                                borderRadius: BorderRadius.circular(20),
                                child: Padding(
                                  padding: const EdgeInsets.all(4),
                                  child: Icon(Icons.close_rounded, size: 18, color: AppColors.grey400),
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
          const SizedBox(height: 32),
          Text(
            'recentlyViewed'.tr(),
            style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
          ),
          const SizedBox(height: 14),
          ..._recentlyViewed.map(_buildRecentlyViewedTile),
        ],
      ),
    );
  }

  Widget _buildRecentlyViewedTile(VenueListing v) {
    final reviews = '(${v.reviews})';
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(builder: (context) => ServiceDetailScreen(listing: v)),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: ChainedNetworkImage(
                    urls: ChainedNetworkImage.chainFrom(v.listImageUrl, v.unsplashImgId, w: 300),
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
                        v.name,
                        style: AppTypography.navigationTitle.copyWith(color: AppColors.grey900, height: 1.25),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        v.price,
                        style: AppTypography.heading200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 18),
                          const SizedBox(width: 4),
                          Text(
                            v.rating,
                            style: AppTypography.body100.copyWith(color: AppColors.grey800, fontWeight: FontWeight.w700),
                          ),
                          Text(
                            ' $reviews',
                            style: AppTypography.body100.copyWith(color: AppColors.grey500),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
