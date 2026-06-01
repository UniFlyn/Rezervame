import '../utils/image_url.dart';
import '../utils/service_image_util.dart';

/// Shared venue model used by home, search, category, and service detail flows.
/// Mirrors the map shape used in the legacy Mobile app for filters and map pins.
class VenueListing {
  const VenueListing({
    required this.id,
    required this.name,
    required this.categoryKey,
    required this.rating,
    required this.reviews,
    required this.price,
    required this.lat,
    required this.lng,
    this.businessId,
    this.unsplashImgId,
    this.serviceImageUrl,
    this.logoUrl,
    this.bannerUrl,
    this.locationLabel = '',
    this.distanceLabel = '',
    this.primaryServiceName,
    this.serviceDurationMinutes,
    this.amenityLabelsEn = const [],
    this.amenityLabelsEs = const [],
    this.categoryKeys = const [],
    this.portfolioImageUrls = const [],
  });

  /// Backend Prisma id — required for live services/staff/reviews.
  final String? businessId;

  final int id;
  final String name;
  /// Translation key shared with Mobile (e.g. `hairService`, `spaService`).
  final String categoryKey;
  final String rating;
  final String reviews;
  final String price;
  final double lat;
  final double lng;
  final String? unsplashImgId;
  final String? serviceImageUrl;
  final String? logoUrl;
  final String? bannerUrl;

  final String locationLabel;
  final String distanceLabel;

  /// First active service name from API (`/mobile/venues`).
  final String? primaryServiceName;
  final int? serviceDurationMinutes;

  /// Resolved labels from `/api/mobile/venues` (optional).
  final List<String> amenityLabelsEn;
  final List<String> amenityLabelsEs;
  /// All business categories from API (`categoryKeys` on favorites/venues).
  final List<String> categoryKeys;

  /// Gallery / banner / logo URLs for portfolio fallbacks when a service has no image.
  final List<String> portfolioImageUrls;

  /// Prefer service image, then banner, then logo (same order as Web `businessListingImageSrc`).
  String get heroImageUrl {
    for (final candidate in [serviceImageUrl, bannerUrl, logoUrl]) {
      final resolved = resolveMediaUrl(candidate);
      if (resolved != null) return resolved;
    }
    final id = extractUnsplashPhotoId(unsplashImgId);
    if (id != null) {
      return 'https://images.unsplash.com/photo-$id?q=80&w=800&fit=crop';
    }
    return '';
  }

  String get listImageUrl {
    for (final candidate in [serviceImageUrl, bannerUrl, logoUrl]) {
      final resolved = resolveMediaUrl(candidate);
      if (resolved != null) return resolved;
    }
    final id = extractUnsplashPhotoId(unsplashImgId);
    if (id != null) {
      return 'https://images.unsplash.com/photo-$id?q=80&w=500&fit=crop';
    }
    return '';
  }

  /// URLs to try in order for [ChainedNetworkImage].
  /// When the featured service has no image, [portfolioImageUrls] from the API
  /// includes sibling service images and venue gallery/banner fallbacks.
  List<String> get imageUrlChain {
    final portfolio = portfolioImageUrls.isNotEmpty
        ? portfolioImageUrls
        : businessPortfolioUrls(bannerUrl: bannerUrl, logoUrl: logoUrl);
    final chain = serviceImageUrlsChain(
      serviceImageUrl: serviceImageUrl,
      portfolioUrls: portfolio,
      seed: businessId ?? '$id',
    );
    if (chain.isNotEmpty) return chain;
    final unsplashId = extractUnsplashPhotoId(unsplashImgId);
    if (unsplashId != null) {
      return ['https://images.unsplash.com/photo-$unsplashId?q=80&w=500&fit=crop'];
    }
    return const [];
  }

  Map<String, dynamic> toSearchMap() => {
        'id': id,
        'name': name,
        'category': categoryKey,
        'categoryKeys': categoryKeys.isNotEmpty ? categoryKeys : [categoryKey],
        'rating': rating,
        'reviews': reviews,
        'price': price,
        'img': unsplashImgId ?? '',
        'lat': lat,
        'lng': lng,
        'locationLabel': locationLabel,
        if (businessId != null) 'businessId': businessId,
        if (serviceImageUrl != null) 'serviceImageUrl': serviceImageUrl,
        if (logoUrl != null) 'logoUrl': logoUrl,
        if (bannerUrl != null) 'bannerUrl': bannerUrl,
        'imageUrl': listImageUrl.isNotEmpty ? listImageUrl : null,
        if (primaryServiceName != null) 'primaryServiceName': primaryServiceName,
        if (serviceDurationMinutes != null) 'serviceDurationMinutes': serviceDurationMinutes,
        if (amenityLabelsEn.isNotEmpty) 'amenityLabelsEn': amenityLabelsEn,
        if (amenityLabelsEs.isNotEmpty) 'amenityLabelsEs': amenityLabelsEs,
        if (portfolioImageUrls.isNotEmpty) 'portfolioImageUrls': portfolioImageUrls,
      };

  /// Deterministic positive int from a string key (FNV-1a). Stable across app runs.
  static int stableHash32(String input) {
    var hash = 0x811c9dc5;
    for (final unit in input.codeUnits) {
      hash ^= unit;
      hash = (hash * 0x01000193) & 0x7fffffff;
    }
    return hash == 0 ? 1 : hash;
  }

  /// UI list id when API returns a non-numeric id — prefer [businessId] for uniqueness.
  static int resolveListingId(dynamic rawId, {String? businessId}) {
    if (rawId is int) return rawId;
    if (rawId is num) return rawId.toInt();
    final parsed = int.tryParse('$rawId');
    if (parsed != null) return parsed;
    final biz = (businessId ?? '').trim();
    if (biz.isNotEmpty) return stableHash32(biz);
    final key = '$rawId'.trim();
    if (key.isNotEmpty) return stableHash32(key);
    return 0;
  }

  /// Build a listing from `/api/mobile/favorites` rows or legacy mock maps.
  factory VenueListing.fromFavoriteMap(Map<String, dynamic> fav) {
    final reviewsRaw = fav['reviews']?.toString() ?? '';
    final reviews = reviewsRaw.replaceAll(RegExp(r'[()]'), '');
    final businessId = fav['businessId']?.toString();
    final id = resolveListingId(fav['id'], businessId: businessId);
    final lat = (fav['lat'] as num?)?.toDouble() ?? 0;
    final lng = (fav['lng'] as num?)?.toDouble() ?? 0;
    final img = fav['unsplashImgId'] as String? ?? fav['img'] as String?;
    final keysRaw = fav['categoryKeys'];
    final categoryKeys = keysRaw is List
        ? keysRaw.map((e) => '$e').where((s) => s.trim().isNotEmpty).toList()
        : <String>[];
    final categoryKey = fav['categoryKey'] as String? ??
        (categoryKeys.isNotEmpty ? categoryKeys.first : 'hairService');
    return VenueListing(
      id: id,
      name: fav['name']?.toString().trim().isNotEmpty == true ? fav['name'].toString() : 'Venue',
      categoryKey: categoryKey,
      categoryKeys: categoryKeys.isNotEmpty ? categoryKeys : [categoryKey],
      rating: fav['rating'] as String? ?? '',
      reviews: reviews.isNotEmpty ? reviews : '0',
      price: fav['price'] as String? ?? '',
      lat: lat,
      lng: lng,
      businessId: businessId,
      unsplashImgId: img,
      serviceImageUrl: fav['serviceImageUrl'] as String? ?? fav['imageUrl'] as String?,
      logoUrl: fav['logoUrl'] as String?,
      bannerUrl: fav['bannerUrl'] as String?,
      locationLabel: fav['locationLabel'] as String? ?? '',
      distanceLabel: fav['distanceLabel'] as String? ?? '',
      primaryServiceName: fav['primaryServiceName'] as String?,
      serviceDurationMinutes: (fav['serviceDurationMinutes'] as num?)?.toInt(),
      amenityLabelsEn: (fav['amenityLabelsEn'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
      amenityLabelsEs: (fav['amenityLabelsEs'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
      portfolioImageUrls: _parsePortfolioUrls(fav),
    );
  }

  static List<String> _parsePortfolioUrls(Map<String, dynamic> m) {
    final raw = m['portfolioImageUrls'];
    if (raw is List) {
      return raw.map((e) => '$e').where((s) => s.trim().isNotEmpty).toList();
    }
    return businessPortfolioUrls(
      bannerUrl: m['bannerUrl'] as String?,
      logoUrl: m['logoUrl'] as String?,
    );
  }

  static VenueListing? tryFromSearchMap(Map<String, dynamic> m) {
    final id = m['id'];
    if (id is! int) return null;
    return VenueListing(
      id: id,
      name: m['name'] as String? ?? '',
      categoryKey: m['category'] as String? ?? '',
      rating: m['rating'] as String? ?? '0',
      reviews: m['reviews'] as String? ?? '0',
      price: m['price'] as String? ?? '',
      lat: (m['lat'] as num?)?.toDouble() ?? 0,
      lng: (m['lng'] as num?)?.toDouble() ?? 0,
      businessId: m['businessId'] as String?,
      unsplashImgId: (m['img'] as String?)?.isNotEmpty == true ? m['img'] as String : null,
      serviceImageUrl: m['serviceImageUrl'] as String?,
      logoUrl: m['logoUrl'] as String?,
      bannerUrl: m['bannerUrl'] as String?,
      locationLabel: m['locationLabel'] as String? ?? '',
      distanceLabel: m['distanceLabel'] as String? ?? '',
      primaryServiceName: m['primaryServiceName'] as String?,
      serviceDurationMinutes: (m['serviceDurationMinutes'] as num?)?.toInt(),
      amenityLabelsEn: (m['amenityLabelsEn'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
      amenityLabelsEs: (m['amenityLabelsEs'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
      portfolioImageUrls: _parsePortfolioUrls(m),
    );
  }
}
