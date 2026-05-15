import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../data/home_feed_content.dart';
import '../data/venue_catalog.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';
import 'events_screen.dart';
import 'notifications_screen.dart';
import 'search_results_screen.dart';
import 'service_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const double _horizontalPad = 24;
  static const double _bannerHeight = 184;

  late final PageController _bannerPageController;
  late final Future<Map<String, dynamic>?> _userSessionFuture;
  final ApiRepository _api = ApiRepository();
  int _bannerPageIndex = 0;

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).take(2).toList();
    if (parts.isEmpty) return '?';
    return parts.map((s) => s[0].toUpperCase()).join();
  }

  @override
  void initState() {
    super.initState();
    _bannerPageController = PageController();
    _userSessionFuture = _api.fetchUserSession();
  }

  @override
  void dispose() {
    _bannerPageController.dispose();
    super.dispose();
  }

  void _onPromoCta(HomePromoBannerItem item) {
    switch (item.cta) {
      case HomePromoBannerCta.featured:
        Navigator.push<void>(
          context,
          MaterialPageRoute<void>(builder: (context) => const SearchResultsScreen(onlyFeatured: true)),
        );
        break;
      case HomePromoBannerCta.search:
        Navigator.push<void>(
          context,
          MaterialPageRoute<void>(builder: (context) => const SearchResultsScreen()),
        );
        break;
      case HomePromoBannerCta.events:
        Navigator.push<void>(
          context,
          MaterialPageRoute<void>(builder: (context) => const EventsScreen()),
        );
        break;
      case HomePromoBannerCta.category:
        final key = item.categoryTitleKey;
        if (key != null) {
          Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => SearchResultsScreen(categoryKey: key),
            ),
          );
        }
        break;
    }
  }

  void _openVenueDetail(int id, String name, String unsplashId, String price, String rating, String reviews) {
    final listing = VenueCatalog.byId(id) ??
        VenueListing(
          id: id,
          name: name,
          categoryKey: 'hairService',
          rating: rating,
          reviews: reviews,
          price: price,
          unsplashImgId: unsplashId,
          lat: 8.98,
          lng: -79.52,
        );
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(builder: (context) => ServiceDetailScreen(listing: listing)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary500,
          onRefresh: () async {
            await ApiRepository().refreshCatalogAndHomeFeed();
            setState(() {});
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(_horizontalPad, 16, _horizontalPad, 24),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 22),
              _buildHeroBanner(),
              const SizedBox(height: 20),
              _buildSearchBar(),
              const SizedBox(height: 28),
              _buildBrowseCategoriesSection(),
              const SizedBox(height: 28),
              _buildNearbySection(),
              const SizedBox(height: 28),
              _buildTopServicesGridSection(),
              const SizedBox(height: 28),
              _buildUpcomingEvents(),
              const SizedBox(height: 28),
              _buildBeauticiansSection(),
              const SizedBox(height: 16),
            ],
            ),
          ),
        ),
      ),
    );
  }

  /// Section row: compact title (+ optional subtitle) and coral action link, aligned with first line of title.
  Widget _sectionTitleRow({
    required String titleKey,
    String? subtitleKey,
    VoidCallback? onSeeAll,
    String? seeAllLabelKey,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                titleKey.tr(),
                style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900),
              ),
              if (subtitleKey != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitleKey.tr(),
                  style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.4),
                ),
              ],
            ],
          ),
        ),
        if (onSeeAll != null)
          Padding(
            padding: EdgeInsets.only(top: subtitleKey != null ? 0 : 1),
            child: TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(left: 10, right: 0, top: 0, bottom: 0),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                (seeAllLabelKey ?? 'seeAll').tr(),
                style: AppTypography.body200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w700),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildBrowseCategoriesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitleRow(
          titleKey: 'chooseCategory',
          subtitleKey: 'chooseCategorySub',
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 154,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: kHomeBrowseCategories.length,
            itemBuilder: (context, index) {
              final item = kHomeBrowseCategories[index];
              final title = item.titleKey.tr();
              final stat = '${item.placeCount} ${'places'.tr()}';
              return Padding(
                padding: EdgeInsets.only(right: index == kHomeBrowseCategories.length - 1 ? 0 : 14),
                child: _buildBrowseCategoryCircle(item, title, stat),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBrowseCategoryCircle(HomeBrowseCategoryItem item, String title, String stat) {
    final imgId = item.unsplashId.trim();
    final DecorationImage? circleImage = (item.imageUrl != null && item.imageUrl!.trim().isNotEmpty)
        ? DecorationImage(image: NetworkImage(item.imageUrl!.trim()), fit: BoxFit.cover)
        : (imgId.isNotEmpty
            ? DecorationImage(
                image: NetworkImage('https://images.unsplash.com/photo-$imgId?q=80&w=250&fit=crop'),
                fit: BoxFit.cover,
              )
            : null);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => SearchResultsScreen(categoryKey: item.titleKey),
            ),
          );
        },
        borderRadius: BorderRadius.circular(48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(2.5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary200, width: 1.5),
                color: AppColors.primary50,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.white, width: 2.5),
                  color: circleImage == null ? AppColors.grey100 : null,
                  image: circleImage,
                ),
                child: circleImage == null
                    ? Icon(Icons.spa_rounded, color: AppColors.grey400, size: 32)
                    : null,
              ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: 100,
              child: Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.body100.copyWith(
                  color: AppColors.grey600,
                  fontWeight: FontWeight.w600,
                  height: 1.2,
                  fontSize: 11,
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              stat,
              textAlign: TextAlign.center,
              style: AppTypography.body100.copyWith(color: AppColors.grey400, fontSize: 10, height: 1.2),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNearbySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitleRow(
          titleKey: 'nearbyService',
          onSeeAll: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(builder: (context) => const SearchResultsScreen()),
            );
          },
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: 112,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: kHomeNearbyStrip.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final v = kHomeNearbyStrip[index];
              return _buildNearbyCard(v);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildNearbyCard(HomeTopVenueItem v) {
    final reviewsLabel = '(${v.reviewCount})';
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openVenueDetail(v.id, v.name, v.unsplashId, v.price, v.rating, '${v.reviewCount}'),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          width: 272,
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.grey100),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withValues(alpha: 0.06),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: ChainedNetworkImage(
                    urls: ChainedNetworkImage.urlsForUnsplashId(v.unsplashId, w: 300),
                    width: 88,
                    height: 88,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        v.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.heading200.copyWith(
                          color: AppColors.grey900,
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        v.price,
                        style: AppTypography.heading200.copyWith(
                          color: AppColors.primary500,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 14),
                          const SizedBox(width: 4),
                          Text(
                            v.rating,
                            style: AppTypography.body200.copyWith(color: AppColors.grey800, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            ' $reviewsLabel',
                            style: AppTypography.body200.copyWith(color: AppColors.grey500),
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

  Widget _buildTopServicesGridSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitleRow(
          titleKey: 'topServicesHome',
          subtitleKey: 'featuredServicesSub2',
          onSeeAll: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(builder: (context) => const SearchResultsScreen()),
            );
          },
        ),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            const gap = 12.0;
            final itemWidth = (constraints.maxWidth - gap) / 2;
            return Wrap(
              spacing: gap,
              runSpacing: gap,
              children: kHomeFeatured
                  .map(
                    (f) => SizedBox(
                      width: itemWidth,
                      child: _buildTopServiceGridCard(f),
                    ),
                  )
                  .toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildTopServiceGridCard(HomeFeaturedItem f) {
    final title = (f.displayServiceName != null && f.displayServiceName!.trim().isNotEmpty)
        ? f.displayServiceName!.trim()
        : f.serviceTitleKey.tr();
    final reviews = '(${f.reviewCount})';
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openVenueDetail(f.venueId, f.salonName, f.unsplashId, f.price, f.rating, '${f.reviewCount}'),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.grey100),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withValues(alpha: 0.06),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                    child: AspectRatio(
                      aspectRatio: 1.05,
                      child: ChainedNetworkImage(
                        urls: ChainedNetworkImage.chainFrom(f.networkImageUrl, f.unsplashId, w: 500),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
                      child: const Icon(Icons.favorite_border, color: AppColors.primary500, size: 18),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.heading200.copyWith(
                        color: AppColors.grey900,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      f.price,
                      style: AppTypography.heading200.copyWith(
                        color: AppColors.primary500,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 14),
                        const SizedBox(width: 4),
                        Text(
                          f.rating,
                          style: AppTypography.body200.copyWith(color: AppColors.grey800, fontWeight: FontWeight.w600),
                        ),
                        Text(
                          ' $reviews',
                          style: AppTypography.body200.copyWith(color: AppColors.grey500),
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
    );
  }

  Widget _buildUpcomingEvents() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitleRow(
          titleKey: 'upcomingEvents',
          onSeeAll: () {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(builder: (context) => const EventsScreen()),
            );
          },
        ),
        const SizedBox(height: 14),
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const EventsScreen()),
              );
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 168,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.grey100),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.black.withValues(alpha: 0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
                image: const DecorationImage(
                  image: AssetImage('assets/home/hero_banner_right.png'),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      AppColors.black.withValues(alpha: 0.78),
                    ],
                  ),
                ),
                padding: const EdgeInsets.all(20),
                alignment: Alignment.bottomLeft,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'eventMasterclass'.tr(),
                      style: AppTypography.heading200.copyWith(color: AppColors.white, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'eventDate1'.tr(),
                      style: AppTypography.body100.copyWith(color: Colors.white70, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBeauticiansSection() {
    if (kHomeBeauticians.isEmpty) {
      return const SizedBox.shrink();
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitleRow(titleKey: 'bestBeautician'),
        const SizedBox(height: 14),
        SizedBox(
          height: 108,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: kHomeBeauticians.length,
            separatorBuilder: (_, __) => const SizedBox(width: 18),
            itemBuilder: (context, index) {
              final b = kHomeBeauticians[index];
              return Column(
                children: [
                  CircleAvatar(
                    radius: 34,
                    backgroundColor: AppColors.primary50,
                    child: Text(
                      _initials(b.name),
                      style: AppTypography.heading300.copyWith(color: AppColors.primary500, fontSize: 18),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: 88,
                    child: Text(
                      b.name,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.body100.copyWith(color: AppColors.grey600, fontWeight: FontWeight.w600, fontSize: 12),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    final preview = VenueCatalog.nearbyPreview(1);
    final locationLine =
        preview.isNotEmpty ? preview.first.locationLabel : 'homeLocationBrowse'.tr();

    return FutureBuilder<Map<String, dynamic>?>(
      future: _userSessionFuture,
      builder: (context, snap) {
        final row = snap.data;
        final name = '${row?['name'] ?? ''}'.trim();
        final avatarUrl = '${row?['avatar'] ?? ''}'.trim();
        final greeting =
            name.isNotEmpty ? 'homeGreetingNamed'.tr(namedArgs: {'name': name}) : 'homeGreetingGuest'.tr();

        final Widget avatar = avatarUrl.startsWith('http')
            ? CircleAvatar(
                radius: 24,
                backgroundColor: AppColors.grey100,
                backgroundImage: NetworkImage(avatarUrl),
              )
            : CircleAvatar(
                radius: 24,
                backgroundColor: AppColors.grey100,
                child: Text(
                  _initials(name.isNotEmpty ? name : '?'),
                  style: AppTypography.heading300.copyWith(color: AppColors.grey700, fontSize: 14),
                ),
              );

        return Row(
          children: [
            avatar,
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    greeting,
                    style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.location_on_rounded, color: AppColors.primary500, size: 18),
                      const SizedBox(width: 2),
                      Flexible(
                        child: Text(
                          locationLine,
                          style: AppTypography.heading300.copyWith(color: AppColors.grey900),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Material(
              color: AppColors.grey25,
              shape: const CircleBorder(),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () => Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(builder: (context) => const NotificationsScreen()),
                ),
                child: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Icon(Icons.notifications_none_rounded, color: AppColors.grey900, size: 22),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeroBanner() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: _bannerHeight,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: PageView.builder(
              controller: _bannerPageController,
              physics: const BouncingScrollPhysics(),
              itemCount: kHomePromoBanners.length,
              onPageChanged: (i) => setState(() => _bannerPageIndex = i),
              itemBuilder: (context, index) {
                return _buildPromoBannerPage(kHomePromoBanners[index]);
              },
            ),
          ),
        ),
        if (kHomePromoBanners.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(kHomePromoBanners.length, (i) {
              final active = i == _bannerPageIndex;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: active ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(3),
                  color: active ? AppColors.primary500 : AppColors.grey200,
                ),
              );
            }),
          ),
        ],
      ],
    );
  }

  Widget _buildPromoBannerPage(HomePromoBannerItem item) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: Container(
            color: AppColors.primary500,
            padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
            alignment: Alignment.centerLeft,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: SizedBox(
                    width: constraints.maxWidth,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          (item.rawTitle != null && item.rawTitle!.trim().isNotEmpty)
                              ? item.rawTitle!.trim()
                              : item.titleKey.tr(),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.homeSectionTitle.copyWith(
                            color: AppColors.white,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          (item.rawSubtitle != null && item.rawSubtitle!.trim().isNotEmpty)
                              ? item.rawSubtitle!.trim()
                              : item.subtitleKey.tr(),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.screenSubtitle.copyWith(
                            color: AppColors.white.withValues(alpha: 0.92),
                            height: 1.3,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          height: 36,
                          child: ElevatedButton(
                            onPressed: () => _onPromoCta(item),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.white,
                              foregroundColor: AppColors.primary500,
                              disabledForegroundColor: AppColors.primary500,
                              elevation: 0,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              shape: const StadiumBorder(),
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                            ),
                            child: Text(
                              'bookNow'.tr(),
                              style: AppTypography.buttonMedium.copyWith(
                                color: AppColors.primary500,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        Expanded(
          child: _buildPromoBannerImage(item),
        ),
      ],
    );
  }

  Widget _buildPromoBannerImage(HomePromoBannerItem item) {
    final raw = item.unsplashId.trim();
    final String? primaryUrl = raw.startsWith('http')
        ? raw
        : (raw.isNotEmpty ? 'https://images.unsplash.com/photo-$raw?q=80&w=600&fit=crop' : null);
    final chain = ChainedNetworkImage.chainFrom(
      primaryUrl,
      raw.startsWith('http') ? null : (raw.isEmpty ? null : raw),
      w: 600,
    );
    if (item.assetPath != null) {
      return Image.asset(
        item.assetPath!,
        fit: BoxFit.cover,
        height: _bannerHeight,
        width: double.infinity,
        alignment: Alignment.center,
        errorBuilder: (context, error, stackTrace) {
          return ChainedNetworkImage(
            urls: chain,
            fit: BoxFit.cover,
            height: _bannerHeight,
            width: double.infinity,
          );
        },
      );
    }
    return ChainedNetworkImage(
      urls: chain,
      fit: BoxFit.cover,
      height: _bannerHeight,
      width: double.infinity,
    );
  }

  Widget _buildSearchBar() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.push<void>(
            context,
            MaterialPageRoute<void>(builder: (context) => const SearchResultsScreen()),
          );
        },
        borderRadius: BorderRadius.circular(28),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18),
          height: 54,
          decoration: BoxDecoration(
            color: AppColors.grey25,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppColors.grey100),
          ),
          child: Row(
            children: [
              Icon(Icons.search_rounded, color: AppColors.grey400.withValues(alpha: 0.95), size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'searchSomething'.tr(),
                  style: AppTypography.body200.copyWith(color: AppColors.grey400),
                ),
              ),
              Container(
                width: 38,
                height: 38,
                decoration: const BoxDecoration(color: AppColors.primary500, shape: BoxShape.circle),
                child: const Icon(Icons.tune_rounded, color: AppColors.white, size: 18),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
