import '../models/venue_listing.dart';
import 's3_assets.dart';

/// Home feed rows hydrated from `/mobile/venues`, `/public/categories`, and events (only active businesses).

String? _defaultCategoryImageUrl(String key) => S3Assets.defaultCategoryUrl(key);

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
    this.businessId,
    this.displayServiceName,
    this.networkImageUrl,
    this.imageUrls = const [],
    this.isDiscoveryPlaceholder = false,
    this.searchCategoryKey,
  });

  final String serviceTitleKey;
  final String salonName;
  final String price;
  final String rating;
  final int reviewCount;
  final int durationMinutes;
  final String unsplashId;
  final int venueId;
  final String? businessId;
  /// When set (live catalog), shown instead of translating [serviceTitleKey].
  final String? displayServiceName;
  /// Business logo/banner from API when present.
  final String? networkImageUrl;
  /// Resolved URL chain for [ChainedNetworkImage].
  final List<String> imageUrls;
  /// Opens [SearchResultsScreen] with [searchCategoryKey] instead of venue detail.
  final bool isDiscoveryPlaceholder;
  final String? searchCategoryKey;
}

class HomeBeauticianItem {
  const HomeBeauticianItem({
    required this.name,
    required this.avatarSeed,
    this.imageUrl,
    this.rating = 0,
    this.reviewCount = 0,
    this.staffId,
    this.businessId,
  });

  final String name;
  final String avatarSeed;
  final String? imageUrl;
  final double rating;
  final int reviewCount;
  final String? staffId;
  final String? businessId;
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
    this.businessId,
    this.imageUrls = const [],
  });

  final int id;
  final String? businessId;
  final String name;
  final String rating;
  final int reviewCount;
  final String price;
  final String unsplashId;
  final List<String> tagKeys;
  final List<String> imageUrls;
}

List<HomeBrowseCategoryItem> kHomeBrowseCategories = [];

List<HomeFeaturedItem> kHomeFeatured = [];

/// Most-reviewed services — excludes businesses already shown in [kHomeFeatured].
List<HomeFeaturedItem> kHomeTopServices = [];

/// Horizontal “nearby” strip — first venues from the same catalog as legacy `home.dart`.
List<HomeTopVenueItem> kHomeNearbyStrip = [];

List<HomeBeauticianItem> kHomeBeauticians = [];

List<HomeTopVenueItem> kHomeTopVenues = [];

/// Home hero carousel (coral panel + image). Swipe horizontally.
List<HomePromoBannerItem> kHomePromoBanners = [];

/// Upcoming events strip on home (`/mobile/events`, max 5).
List<HomeUpcomingEventItem> kHomeUpcomingEvents = [];

class HomeUpcomingEventItem {
  const HomeUpcomingEventItem({
    required this.id,
    required this.title,
    required this.body,
    required this.startAtIso,
    required this.location,
    required this.price,
    required this.imageKey,
    this.websiteUrl,
  });

  final String id;
  final String title;
  final String body;
  final String startAtIso;
  final String location;
  final double price;
  final String imageKey;
  final String? websiteUrl;

  factory HomeUpcomingEventItem.fromMap(Map<String, dynamic> e) {
    final p = e['price'];
    final price = p is num ? p.toDouble() : double.tryParse('$p') ?? 0;
    final web = '${e['websiteUrl'] ?? ''}'.trim();
    return HomeUpcomingEventItem(
      id: '${e['id'] ?? ''}',
      title: '${e['title'] ?? ''}',
      body: '${e['body'] ?? ''}',
      startAtIso: '${e['startAt'] ?? ''}',
      location: '${e['location'] ?? ''}',
      price: price,
      imageKey: '${e['imageKey'] ?? ''}'.trim(),
      websiteUrl: web.isEmpty ? null : web,
    );
  }
}

const _kFeaturedTarget = 5;
const _kTopServicesTarget = 6;

const _discoveryPlaceholderCategories = <
    ({String key, String titleKey, String descKey})>[
  (key: 'hairService', titleKey: 'partnersTypeSalonTitle', descKey: 'partnersTypeSalonDesc'),
  (key: 'barber', titleKey: 'partnersTypeBarberTitle', descKey: 'partnersTypeBarberDesc'),
  (key: 'nailCare', titleKey: 'partnersTypeNailsTitle', descKey: 'partnersTypeNailsDesc'),
  (key: 'tattoo', titleKey: 'partnersTypeTattooTitle', descKey: 'partnersTypeTattooDesc'),
  (key: 'spaService', titleKey: 'partnersTypeSpaTitle', descKey: 'partnersTypeSpaDesc'),
  (key: 'estetica', titleKey: 'partnersTypeEsteticaTitle', descKey: 'partnersTypeEsteticaDesc'),
  (key: 'dermatology', titleKey: 'partnersTypeDermTitle', descKey: 'partnersTypeDermDesc'),
  (key: 'yoga', titleKey: 'partnersTypeYogaTitle', descKey: 'partnersTypeYogaDesc'),
];

int _homeFeedSeedHash(String seed) {
  var h = 2166136261;
  for (var i = 0; i < seed.length; i++) {
    h = (h ^ seed.codeUnitAt(i)) * 16777619;
  }
  return h;
}

List<T> _shuffledHomeFeed<T>(List<T> items, String seed) {
  final arr = List<T>.from(items);
  var h = _homeFeedSeedHash(seed);
  for (var i = arr.length - 1; i > 0; i--) {
    h = (h ^ (h >> 13)) * 1274126177;
    final j = (h & 0x7fffffff) % (i + 1);
    final tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

List<HomeFeaturedItem> _discoveryPlaceholderItems(String seed) {
  final rows = _shuffledHomeFeed(_discoveryPlaceholderCategories, seed);
  return List<HomeFeaturedItem>.generate(rows.length, (index) {
    final row = rows[index];
    final img = _defaultCategoryImageUrl(row.key) ?? '';
    final rating = (4.4 + (index % 6) * 0.1).toStringAsFixed(1);
    final reviews = 12 + ((index * 17) % 88);
    final price = '\$${(18 + ((index * 11) % 72)).toStringAsFixed(2)}';
    return HomeFeaturedItem(
      serviceTitleKey: row.titleKey,
      displayServiceName: null,
      salonName: row.descKey,
      price: price,
      rating: rating,
      reviewCount: reviews,
      durationMinutes: 45,
      unsplashId: '',
      venueId: -(index + 1),
      businessId: 'discovery:${row.key}',
      networkImageUrl: img.isNotEmpty ? img : null,
      imageUrls: img.isNotEmpty ? [img] : const [],
      isDiscoveryPlaceholder: true,
      searchCategoryKey: row.key,
    );
  });
}

List<HomeFeaturedItem> _fillHomeFeaturedItems(
  List<HomeFeaturedItem> primary,
  List<HomeFeaturedItem> pool,
  int target,
) {
  final out = List<HomeFeaturedItem>.from(primary);
  final ids = out.map((e) => e.businessId ?? '').where((id) => id.isNotEmpty).toSet();
  for (final item in pool) {
    if (out.length >= target) break;
    final bid = item.businessId ?? '';
    if (bid.isNotEmpty && ids.contains(bid)) continue;
    if (bid.isNotEmpty) ids.add(bid);
    out.add(item);
  }
  return out.take(target).toList();
}

void hydrateHomeFeedFromVenues(
  List<VenueListing> venues, {
  List<HomeBeauticianItem> beauticians = const [],
  List<Map<String, dynamic>> categoryRows = const [],
  String feedSeed = 'home',
}) {
  HomeFeaturedItem mapVenueToFeaturedItem(VenueListing v) {
    final svcName = v.primaryServiceName?.trim();
    final chain = v.imageUrlChain;
    return HomeFeaturedItem(
      serviceTitleKey: 'featCut',
      displayServiceName: (svcName != null && svcName.isNotEmpty) ? svcName : null,
      salonName: v.name,
      price: v.price,
      rating: v.rating,
      reviewCount: int.tryParse(v.reviews) ?? 0,
      durationMinutes: v.serviceDurationMinutes ?? 45,
      unsplashId: v.unsplashImgId ?? '',
      venueId: v.id,
      businessId: v.businessId,
      networkImageUrl: chain.isNotEmpty ? chain.first : null,
      imageUrls: chain,
    );
  }

  final byRating = List<VenueListing>.from(venues)
    ..sort((a, b) {
      final ra = double.tryParse(a.rating) ?? 0;
      final rb = double.tryParse(b.rating) ?? 0;
      if (rb != ra) return rb.compareTo(ra);
      final revA = int.tryParse(a.reviews) ?? 0;
      final revB = int.tryParse(b.reviews) ?? 0;
      return revB.compareTo(revA);
    });

  final placeholders = _discoveryPlaceholderItems('$feedSeed-ph');

  final byReviews = List<VenueListing>.from(venues)
    ..sort((a, b) {
      final revA = int.tryParse(a.reviews) ?? 0;
      final revB = int.tryParse(b.reviews) ?? 0;
      if (revB != revA) return revB.compareTo(revA);
      final ra = double.tryParse(a.rating) ?? 0;
      final rb = double.tryParse(b.rating) ?? 0;
      return rb.compareTo(ra);
    });

  final sorted = byRating;

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
      if (networkUrl == null && key.isNotEmpty) {
        networkUrl = _defaultCategoryImageUrl(key);
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
    return HomeTopVenueItem(
      id: v.id,
      businessId: v.businessId,
      name: v.name,
      rating: v.rating,
      reviewCount: int.tryParse(v.reviews) ?? 0,
      price: v.price,
      unsplashId: v.unsplashImgId ?? '',
      tagKeys: const ['tagCut'],
      imageUrls: v.imageUrlChain,
    );
  }).toList();

  if (venues.isEmpty) {
    kHomeFeatured = _fillHomeFeaturedItems([], placeholders, _kFeaturedTarget);
    kHomeTopServices = _fillHomeFeaturedItems(
      [],
      _shuffledHomeFeed(placeholders, '$feedSeed-top-ph'),
      _kTopServicesTarget,
    );
  } else {
    final unique = <String, VenueListing>{};
    for (final v in venues) {
      final bid = (v.businessId ?? '').trim();
      final key = bid.isNotEmpty ? bid : 'id:${v.id}';
      unique.putIfAbsent(key, () => v);
    }
    final uniqueVenues = unique.values.toList();
    final randomPool = _shuffledHomeFeed(uniqueVenues, feedSeed);

    var featuredItems = _fillHomeFeaturedItems(
      byRating.take(_kFeaturedTarget).map(mapVenueToFeaturedItem).toList(),
      randomPool.map(mapVenueToFeaturedItem).toList(),
      _kFeaturedTarget,
    );
    final featuredBizIds = featuredItems
        .map((e) => e.businessId)
        .where((id) => id != null && id.isNotEmpty)
        .toSet();

    var topItems = _fillHomeFeaturedItems(
      byReviews
          .where((v) {
            final bid = v.businessId ?? '';
            return bid.isEmpty || !featuredBizIds.contains(bid);
          })
          .take(_kTopServicesTarget)
          .map(mapVenueToFeaturedItem)
          .toList(),
      _shuffledHomeFeed(
        uniqueVenues
            .where((v) {
              final bid = v.businessId ?? '';
              return bid.isEmpty || !featuredBizIds.contains(bid);
            })
            .toList(),
        '$feedSeed-top',
      )
          .map(mapVenueToFeaturedItem)
          .toList(),
      _kTopServicesTarget,
    );

    if (topItems.length < _kTopServicesTarget) {
      topItems = _fillHomeFeaturedItems(
        topItems,
        _shuffledHomeFeed(byReviews.map(mapVenueToFeaturedItem).toList(), '$feedSeed-top-fb'),
        _kTopServicesTarget,
      );
    }

    if (featuredItems.length < _kFeaturedTarget) {
      featuredItems = _fillHomeFeaturedItems(
        featuredItems,
        _shuffledHomeFeed(
          [...byRating.map(mapVenueToFeaturedItem), ...placeholders],
          '$feedSeed-feat-fb',
        ),
        _kFeaturedTarget,
      );
    }

    if (topItems.length < _kTopServicesTarget) {
      topItems = _fillHomeFeaturedItems(
        topItems,
        _shuffledHomeFeed(
          [...byReviews.map(mapVenueToFeaturedItem), ...placeholders],
          '$feedSeed-top-ph-fill',
        ),
        _kTopServicesTarget,
      );
    }

    kHomeFeatured = featuredItems;
    kHomeTopServices = topItems;
  }

  kHomeBeauticians = beauticians;
  final topVenueExcludeIds = kHomeFeatured
      .map((e) => e.businessId)
      .where((id) => id != null && id.isNotEmpty)
      .toSet();
  kHomeTopVenues = byReviews
      .where((v) {
        final bid = v.businessId ?? '';
        return bid.isEmpty || !topVenueExcludeIds.contains(bid);
      })
      .take(6)
      .map((v) {
        return HomeTopVenueItem(
          id: v.id,
          businessId: v.businessId,
          name: v.name,
          rating: v.rating,
          reviewCount: int.tryParse(v.reviews) ?? 0,
          price: v.price,
          unsplashId: v.unsplashImgId ?? '',
          tagKeys: const ['tagCut'],
          imageUrls: v.imageUrlChain,
        );
      })
      .toList();
}

/// Hero carousel + upcoming strip from [Event] rows (Postgres).
void hydrateHomeFeedFromEvents(List<Map<String, dynamic>> events) {
  kHomeUpcomingEvents = events.take(5).map(HomeUpcomingEventItem.fromMap).toList();

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
