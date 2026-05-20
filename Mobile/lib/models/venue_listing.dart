import '../utils/image_url.dart';

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
  List<String> get imageUrlChain {
    final out = <String>[];
    void add(String? u) {
      final resolved = resolveMediaUrl(u);
      if (resolved != null && !out.contains(resolved)) out.add(resolved);
    }
    add(serviceImageUrl);
    add(bannerUrl);
    add(logoUrl);
    final id = extractUnsplashPhotoId(unsplashImgId);
    if (id != null) {
      final u = 'https://images.unsplash.com/photo-$id?q=80&w=500&fit=crop';
      if (!out.contains(u)) out.add(u);
    }
    return out;
  }

  Map<String, dynamic> toSearchMap() => {
        'id': id,
        'name': name,
        'category': categoryKey,
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
      };

  /// Build a listing from `/api/mobile/favorites` rows or legacy mock maps.
  factory VenueListing.fromFavoriteMap(Map<String, dynamic> fav) {
    final reviewsRaw = fav['reviews']?.toString() ?? '';
    final reviews = reviewsRaw.replaceAll(RegExp(r'[()]'), '');
    final idRaw = fav['id'];
    final id = idRaw is int ? idRaw : (idRaw as num?)?.toInt() ?? 0;
    final lat = (fav['lat'] as num?)?.toDouble() ?? 0;
    final lng = (fav['lng'] as num?)?.toDouble() ?? 0;
    final img = fav['unsplashImgId'] as String? ?? fav['img'] as String?;
    return VenueListing(
      id: id,
      name: fav['name'] as String,
      categoryKey: fav['categoryKey'] as String? ?? 'hairService',
      rating: fav['rating'] as String? ?? '',
      reviews: reviews.isNotEmpty ? reviews : '0',
      price: fav['price'] as String? ?? '',
      lat: lat,
      lng: lng,
      businessId: fav['businessId'] as String?,
      unsplashImgId: img,
      serviceImageUrl: fav['imageUrl'] as String? ?? fav['serviceImageUrl'] as String?,
      locationLabel: fav['locationLabel'] as String? ?? '',
      distanceLabel: fav['distanceLabel'] as String? ?? '',
      primaryServiceName: fav['primaryServiceName'] as String?,
      serviceDurationMinutes: (fav['serviceDurationMinutes'] as num?)?.toInt(),
      amenityLabelsEn: (fav['amenityLabelsEn'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
      amenityLabelsEs: (fav['amenityLabelsEs'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
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
    );
  }
}
