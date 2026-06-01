import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../data/home_feed_content.dart';
import '../data/venue_catalog.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../data/user_location.dart';
import '../utils/avatar_image_util.dart';
import '../widgets/chained_network_image.dart';
import '../widgets/event_cover_image.dart';
import 'location_map_picker_screen.dart';
import 'events_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'login_screen.dart';
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
  final ApiRepository _api = ApiRepository();
  int _bannerPageIndex = 0;
  HomePromoBannerItem? _remoteHeroBanner;
  Map<String, dynamic>? _userSession;
  String _locationLabel = '';
  bool _feedLoading = true;
  String? _feedError;
  final Set<String> _favoriteBusinessIds = {};

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).take(2).toList();
    if (parts.isEmpty) return '?';
    return parts.map((s) => s[0].toUpperCase()).join();
  }

  @override
  void initState() {
    super.initState();
    _bannerPageController = PageController();
    _loadRemoteHeroBanner();
    _reloadUserSession();
    _loadLocationLabel();
    _loadFavorites();
    _bootstrapFeed();
  }

  Future<void> _loadRemoteHeroBanner() async {
    final cfg = await _api.fetchPublicHeroBanner();
    if (!mounted || cfg == null) return;
    if (cfg['enabled'] == false) return;
    final title = '${cfg['title'] ?? ''}'.trim();
    final subtitle = '${cfg['subtitle'] ?? ''}'.trim();
    final imageUrl = '${cfg['imageUrl'] ?? ''}'.trim();
    if (title.isEmpty && subtitle.isEmpty && imageUrl.isEmpty) return;
    setState(() {
      _remoteHeroBanner = HomePromoBannerItem(
        rawTitle: title.isEmpty ? null : title,
        rawSubtitle: subtitle.isEmpty ? null : subtitle,
        unsplashId: imageUrl,
        cta: HomePromoBannerCta.featured,
      );
    });
  }

  Future<void> _loadFavorites() async {
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) return;
    final res = await _api.fetchFavoriteVenueMaps(page: 1, limit: 200);
    final maps = (res['data'] as List<Map<String, dynamic>>?) ?? [];
    if (!mounted) return;
    setState(() {
      _favoriteBusinessIds
        ..clear()
        ..addAll(
          maps.map((m) => '${m['businessId'] ?? m['id'] ?? ''}').where((id) => id.isNotEmpty),
        );
    });
  }

  Future<void> _toggleFavorite(String? businessId) async {
    final bid = businessId?.trim() ?? '';
    if (bid.isEmpty) return;
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      Navigator.push<void>(context, MaterialPageRoute<void>(builder: (context) => const LoginScreen()));
      return;
    }
    final isFav = _favoriteBusinessIds.contains(bid);
    final ok = isFav ? await _api.removeFavorite(bid) : await _api.addFavorite(bid);
    if (!ok || !mounted) return;
    setState(() {
      if (isFav) {
        _favoriteBusinessIds.remove(bid);
      } else {
        _favoriteBusinessIds.add(bid);
      }
    });
  }

  Future<void> _bootstrapFeed() async {
    setState(() {
      _feedLoading = true;
      _feedError = null;
    });
    try {
      await _api.refreshCatalogAndHomeFeed();
      await _loadFavorites();
      if (VenueCatalog.all.isEmpty) {
        _feedError =
            'Could not load venues. Check your connection or try again later.';
      }
    } catch (e) {
      _feedError = e.toString().replaceAll('Exception: ', '');
    } finally {
      if (mounted) {
        setState(() => _feedLoading = false);
      }
    }
  }

  Future<void> _reloadUserSession() async {
    final row = await _api.fetchUserSession();
    if (mounted) setState(() => _userSession = row);
  }

  Future<void> _loadLocationLabel() async {
    final label = await UserLocation.getDisplayLabel(fallback: 'homeLocationBrowse'.tr());
    if (mounted) setState(() => _locationLabel = label);
  }

  Future<void> _openChangeLocation() async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute<bool>(builder: (context) => const LocationMapPickerScreen(selectOnly: true)),
    );
    if (changed == true) {
      await _loadLocationLabel();
      await _api.refreshCatalogAndHomeFeed();
      await _loadFavorites();
      if (mounted) setState(() {});
    }
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
            await _bootstrapFeed();
            await _reloadUserSession();
            await _loadLocationLabel();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(_horizontalPad, 16, _horizontalPad, 24),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              if (_feedError != null) ...[
                const SizedBox(height: 12),
                _buildFeedErrorBanner(),
              ],
              const SizedBox(height: 22),
              _buildHeroBanner(),
              const SizedBox(height: 20),
              _buildSearchBar(),
              const SizedBox(height: 28),
              if (_feedLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 32),
                  child: Center(child: CircularProgressIndicator(color: AppColors.primary500)),
                )
              else ...[
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
            ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeedErrorBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFED7AA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _feedError!,
            style: AppTypography.body200.copyWith(color: AppColors.grey700, height: 1.4),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: _bootstrapFeed,
              child: Text('Retry', style: AppTypography.buttonMedium.copyWith(color: AppColors.primary500)),
            ),
          ),
        ],
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
                    urls: v.imageUrls.isNotEmpty
                        ? v.imageUrls
                        : ChainedNetworkImage.chainFrom(null, v.unsplashId, w: 300),
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
          subtitleKey: 'topServicesSub',
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
              children: kHomeTopServices
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
                        urls: f.imageUrls.isNotEmpty
                            ? f.imageUrls
                            : ChainedNetworkImage.chainFrom(f.networkImageUrl, f.unsplashId, w: 500),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: GestureDetector(
                      onTap: () => _toggleFavorite(f.businessId),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
                        child: Icon(
                          f.businessId != null && _favoriteBusinessIds.contains(f.businessId)
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: AppColors.primary500,
                          size: 18,
                        ),
                      ),
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

  String _formatEventStart(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    final y = dt.year;
    final mo = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    final h = dt.hour.toString().padLeft(2, '0');
    final mi = dt.minute.toString().padLeft(2, '0');
    return '$y-$mo-$d · $h:$mi';
  }

  Future<void> _openEvent(HomeUpcomingEventItem event) async {
    final url = event.websiteUrl;
    if (url != null && url.isNotEmpty) {
      final uri = Uri.tryParse(url.startsWith('http') ? url : 'https://$url');
      if (uri != null && await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    }
    if (!mounted) return;
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(builder: (context) => const EventsScreen()),
    );
  }

  Widget _buildUpcomingEventCard(HomeUpcomingEventItem event) {
    final priceLabel = event.price <= 0 ? 'eventFree'.tr() : '\$${event.price.toStringAsFixed(2)}';
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openEvent(event),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          width: 280,
          height: 168,
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
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              fit: StackFit.expand,
              children: [
                EventCoverImage(
                  imageKey: event.imageKey,
                  height: 168,
                  width: 280,
                  borderRadius: BorderRadius.circular(16),
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        AppColors.black.withValues(alpha: 0.78),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.white.withValues(alpha: 0.92),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      priceLabel,
                      style: AppTypography.body100.copyWith(
                        color: AppColors.grey900,
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.heading200.copyWith(color: AppColors.white, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatEventStart(event.startAtIso),
                        style: AppTypography.body100.copyWith(color: Colors.white70, fontWeight: FontWeight.w600),
                      ),
                      if (event.location.trim().isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          event.location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.body100.copyWith(color: Colors.white60, fontSize: 11),
                        ),
                      ],
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

  Widget _buildUpcomingEvents() {
    if (kHomeUpcomingEvents.isEmpty) {
      return const SizedBox.shrink();
    }
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
        SizedBox(
          height: 168,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            clipBehavior: Clip.none,
            itemCount: kHomeUpcomingEvents.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) => _buildUpcomingEventCard(kHomeUpcomingEvents[index]),
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
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      buildProfileAvatar(
                        imageUrl: b.imageUrl,
                        initials: _initials(b.name),
                        radius: 34,
                      ),
                      if (b.rating > 0)
                        Positioned(
                          top: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.white,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppColors.grey100),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.black.withValues(alpha: 0.06),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 10),
                                const SizedBox(width: 2),
                                Text(
                                  b.rating.toStringAsFixed(1),
                                  style: AppTypography.body100.copyWith(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.grey900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
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
    final row = _userSession;
    final name = '${row?['name'] ?? ''}'.trim();
    final avatarUrl = '${row?['avatar'] ?? ''}'.trim();
    final greeting =
        name.isNotEmpty ? 'homeGreetingNamed'.tr(namedArgs: {'name': name}) : 'homeGreetingGuest'.tr();

    final avatar = buildProfileAvatar(
      imageUrl: avatarUrl.isNotEmpty ? avatarUrl : null,
      initials: _initials(name.isNotEmpty ? name : '?'),
      radius: 24,
    );

    return Row(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () async {
              await Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const ProfileScreen()),
              );
              await _reloadUserSession();
            },
            customBorder: const CircleBorder(),
            child: avatar,
          ),
        ),
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
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _openChangeLocation,
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_rounded, color: AppColors.primary500, size: 18),
                        const SizedBox(width: 2),
                        Flexible(
                          child: Text(
                            _locationLabel,
                            style: AppTypography.heading300.copyWith(color: AppColors.grey900),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.grey400, size: 18),
                      ],
                    ),
                  ),
                ),
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
  }

  Widget _buildHeroBanner() {
    final banners = [
      if (_remoteHeroBanner != null) _remoteHeroBanner!,
      ...kHomePromoBanners,
    ];
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
              itemCount: banners.length,
              onPageChanged: (i) => setState(() => _bannerPageIndex = i),
              itemBuilder: (context, index) {
                return _buildPromoBannerPage(banners[index]);
              },
            ),
          ),
        ),
        if (banners.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(banners.length, (i) {
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
    final String? primaryUrl = raw.startsWith('http') || raw.startsWith('data:')
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
