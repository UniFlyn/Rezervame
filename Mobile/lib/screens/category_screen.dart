import 'package:flutter/material.dart';
import '../data/venue_catalog.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';
import 'service_detail_screen.dart';

class CategoryScreen extends StatelessWidget {
  const CategoryScreen({super.key, required this.categoryName});

  final String categoryName;

  @override
  Widget build(BuildContext context) {
    final venues = VenueCatalog.byHomeCategory(categoryName);

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
          categoryName,
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.tune_outlined, color: AppColors.grey900),
          ),
        ],
      ),
      body: venues.isEmpty
          ? Center(
              child: Text(
                'No venues in this category yet.',
                style: AppTypography.body200.copyWith(color: AppColors.grey500),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: venues.length,
              separatorBuilder: (context, index) => const SizedBox(height: 20),
              itemBuilder: (context, index) {
                return _ResultCard(listing: venues[index]);
              },
            ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.listing});

  final VenueListing listing;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.push<void>(
        context,
        MaterialPageRoute<void>(
          builder: (context) => ServiceDetailScreen(listing: listing),
        ),
      ),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.grey100),
          boxShadow: [
            BoxShadow(
              color: AppColors.grey900.withValues(alpha: 0.04),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: ChainedNetworkImage(
                    urls: ChainedNetworkImage.chainFrom(listing.listImageUrl, listing.unsplashImgId, w: 800),
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: AppColors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.favorite_outline, color: AppColors.primary500, size: 20),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        listing.name,
                        style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.location_on, color: AppColors.grey400, size: 14),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              '${listing.locationLabel} (${listing.distanceLabel})',
                              style: AppTypography.body100.copyWith(color: AppColors.grey500),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      listing.price,
                      style: AppTypography.heading300.copyWith(color: AppColors.primary500),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 16),
                        const SizedBox(width: 4),
                        Text(listing.rating, style: AppTypography.body200.copyWith(color: AppColors.grey900)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
