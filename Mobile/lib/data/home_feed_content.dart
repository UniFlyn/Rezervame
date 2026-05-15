import '../models/venue_listing.dart';
/// Home feed rows hydrated from `/mobile/venues`, `/public/categories`, and events (only active businesses).

/// Hero carousel CTA target.
enum HomePromoBannerCta {
  featured,
  search,
  events,
  /// Pass [categoryTitleKey] (e.g. `spaService`); home screen passes `.tr()` as the search category label.
  category,
}

class HomePromoBannerItem {
  const HomePromoBannerItem({
    this.titleKey = '',
    this.subtitleKey = '',
    this.rawTitle,
    this.rawSubtitle,
    this.assetPath,
    required this.unsplashId,
    required this.cta,
    this.categoryTitleKey,
  });

  final String titleKey;
  final String subtitleKey;
  /// When set (e.g. from API / Postgres), shown instead of [titleKey].tr().
  final String? rawTitle;
  final String? rawSubtitle;
  final String? assetPath;
  final String unsplashId;
  final HomePromoBannerCta cta;
  /// Translation key for `HomePromoBannerCta.category` (e.g. `hairService`).
  final String? categoryTitleKey;
}

class HomeBrowseCategoryItem {
  const HomeBrowseCategoryItem({
    required this.titleKey,
    required this.placeCount,
    required this.unsplashId,
    this.imageUrl,
  });

  final String titleKey;
  final int placeCount;
  final String unsplashId;
  /// Optional full URL from `Category.imageUrl` (seed/API).
  final String? imageUrl;
}

class HomeFeaturedItem {
  const HomeFeaturedItem({
    required this.serviceTitleKey,
    required this.salonName,
    required this.price,
    required this.rating,
    required this.reviewCount,
    required this.durationMinutes,
    required this.unsplashId,
    required this.venueId,
    this.displayServiceName,
    this.networkImageUrl,
  });

  final String serviceTitleKey;
  final String salonName;
  final String price;
  final String rating;
  final int reviewCount;
  final int durationMinutes;
  final String unsplashId;
  final int venueId;
  /// When set (live catalog), shown instead of translating [serviceTitleKey].
  final String? displayServiceName;
  /// Business logo/banner from API when present.
  final String? networkImageUrl;
}

class HomeBeauticianItem {
  const HomeBeauticianItem({required this.name, required this.avatarSeed});

  final String name;
  final String avatarSeed;
}

class HomeTopVenueItem {
  const HomeTopVenueItem({
    required this.id,
    required this.name,
    required this.rating,
    required this.reviewCount,
    required this.price,
    required this.unsplashId,
    required this.tagKeys,
  });

  final int id;
  final String name;
  final String rating;
  final int reviewCount;
  final String price;
  final String unsplashId;
  final List<String> tagKeys;
}

List<HomeBrowseCategoryItem> kHomeBrowseCategories = [];

List<HomeFeaturedItem> kHomeFeatured = [];

/// Horizontal “nearby” strip — first venues from the same catalog as legacy `home.dart`.
List<HomeTopVenueItem> kHomeNearbyStrip = [];

List<HomeBeauticianItem> kHomeBeauticians = [];

List<HomeTopVenueItem> kHomeTopVenues = [];

/// Home hero carousel (coral panel + image). Swipe horizontally.
List<HomePromoBannerItem> kHomePromoBanners = [];

void hydrateHomeFeedFromVenues(
  List<VenueListing> venues, {
  List<String> staffNames = const [],
  List<Map<String, dynamic>> categoryRows = const [],
}) {
  final sorted = List<VenueListing>.from(venues)
    ..sort((a, b) {
      final ra = double.tryParse(a.rating) ?? 0;
      final rb = double.tryParse(b.rating) ?? 0;
      return rb.compareTo(ra);
    });

  if (categoryRows.isNotEmpty) {
    kHomeBrowseCategories = categoryRows.map((c) {
      final key = '${c['key'] ?? ''}'.trim();
      final count = (c['activeBusinessCount'] as num?)?.toInt() ?? 0;
      final rawImg = (c['imageUrl'] as String?)?.trim();
      String? networkUrl;
      var fallbackUnsplash = '';
      if (rawImg != null && rawImg.isNotEmpty) {
        if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
          networkUrl = rawImg;
        } else {
          fallbackUnsplash = rawImg.replaceFirst(RegExp(r'^photo-'), '');
        }
      }
      return HomeBrowseCategoryItem(
        titleKey: key.isNotEmpty ? key : 'hairService',
        placeCount: count,
        unsplashId: fallbackUnsplash,
        imageUrl: networkUrl,
      );
    }).toList();
  } else {
    final n = sorted.length;
    kHomeBrowseCategories = n > 0
        ? [
            HomeBrowseCategoryItem(
              titleKey: 'hairService',
              placeCount: n,
              unsplashId: '',
              imageUrl: null,
            ),
          ]
        : [];
  }

  kHomeNearbyStrip = sorted.take(5).map((v) {
    final img = v.unsplashImgId ?? '';
    return HomeTopVenueItem(
      id: v.id,
      name: v.name,
      rating: v.rating,
      reviewCount: int.tryParse(v.reviews) ?? 0,
      price: v.price,
      unsplashId: img,
      tagKeys: const ['tagCut'],
    );
  }).toList();

  kHomeFeatured = sorted.take(4).map((v) {
    final img = v.unsplashImgId ?? '';
    final svcName = v.primaryServiceName?.trim();
    return HomeFeaturedItem(
      serviceTitleKey: 'featCut',
      displayServiceName: (svcName != null && svcName.isNotEmpty) ? svcName : null,
      salonName: v.name,
      price: v.price,
      rating: v.rating,
      reviewCount: int.tryParse(v.reviews) ?? 0,
      durationMinutes: v.serviceDurationMinutes ?? 45,
      unsplashId: img,
      venueId: v.id,
      networkImageUrl: v.imageUrl,
    );
  }).toList();

  kHomeBeauticians = staffNames.map((n) => HomeBeauticianItem(name: n, avatarSeed: n)).toList();
  kHomeTopVenues = List<HomeTopVenueItem>.from(kHomeNearbyStrip);
}

/// Hero carousel from [Event] rows (Postgres). Falls back to one marketing banner if empty.
void hydrateHomeFeedFromEvents(List<Map<String, dynamic>> events) {
  if (events.isEmpty) {
    kHomePromoBanners = [
      HomePromoBannerItem(
        titleKey: 'heroTitle',
        subtitleKey: 'heroSubtitle',
        assetPath: 'assets/home/hero_banner_right.png',
        unsplashId: '',
        cta: HomePromoBannerCta.featured,
      ),
    ];
    return;
  }
  kHomePromoBanners = events.take(4).map((e) {
    final title = '${e['title'] ?? ''}';
    final body = '${e['body'] ?? ''}';
    final sub = body.length > 90 ? '${body.substring(0, 90)}…' : body;
    final img = '${e['imageKey'] ?? ''}'.trim();
    final unsplash = img;
    return HomePromoBannerItem(
      rawTitle: title,
      rawSubtitle: sub,
      unsplashId: unsplash,
      cta: HomePromoBannerCta.events,
    );
  }).toList();
}
