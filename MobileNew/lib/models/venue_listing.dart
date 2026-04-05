import '../utils/default_venue_hero.dart';

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
    this.unsplashImgId,
    this.imageUrl,
    this.locationLabel = 'California, CA',
    this.distanceLabel = '2.4 km',
  });

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
  final String? imageUrl;
  final String locationLabel;
  final String distanceLabel;

  String get heroImageUrl {
    if (imageUrl != null && imageUrl!.isNotEmpty) return imageUrl!;
    if (unsplashImgId != null && unsplashImgId!.isNotEmpty) {
      return 'https://images.unsplash.com/photo-$unsplashImgId?q=80&w=800&fit=crop';
    }
    return DefaultVenueHero.imageUrl(w: 800);
  }

  String get listImageUrl {
    if (imageUrl != null && imageUrl!.isNotEmpty) return imageUrl!;
    if (unsplashImgId != null && unsplashImgId!.isNotEmpty) {
      return 'https://images.unsplash.com/photo-$unsplashImgId?q=80&w=500&fit=crop';
    }
    return heroImageUrl;
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
        if (imageUrl != null) 'imageUrl': imageUrl,
      };

  /// Build a listing from favorites mock data (Mobile `MyFavoritesScreen`).
  factory VenueListing.fromFavoriteMap(Map<String, dynamic> fav) {
    final reviewsRaw = fav['reviews']?.toString() ?? '';
    final reviews = reviewsRaw.replaceAll(RegExp(r'[()]'), '');
    return VenueListing(
      id: fav['id'] as int,
      name: fav['name'] as String,
      categoryKey: 'hairService',
      rating: fav['rating'] as String? ?? '',
      reviews: reviews.isNotEmpty ? reviews : '0',
      price: fav['price'] as String? ?? '',
      lat: 8.98,
      lng: -79.52,
      unsplashImgId: fav['img'] as String?,
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
      unsplashImgId: (m['img'] as String?)?.isNotEmpty == true ? m['img'] as String : null,
      imageUrl: m['imageUrl'] as String?,
    );
  }
}
