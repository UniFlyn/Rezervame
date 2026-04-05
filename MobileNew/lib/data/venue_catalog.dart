import '../models/venue_listing.dart';
import '../utils/default_venue_hero.dart';

/// Central mock catalog (same conceptual data as Mobile search + MobileNew home cards).
class VenueCatalog {
  VenueCatalog._();

  /// Maps MobileNew home category labels to Mobile translation category keys.
  static const Map<String, List<String>> homeCategoryToKeys = {
    'Haircut': ['hairService', 'barber'],
    'Facial': ['beautyService', 'spaService'],
    'Waxing': ['beautyService'],
    'Spa': ['spaService'],
  };

  /// Order matters for [nearbyPreview]: first entries match the original MobileNew home cards.
  static final List<VenueListing> all = [
    VenueListing(
      id: 5,
      name: 'Euphoria Spa & Beauty Lounge',
      categoryKey: 'spaService',
      rating: '4.4',
      reviews: '453',
      price: r'$150.00',
      imageUrl: 'https://img.freepik.com/free-photo/beauty-spa_144627-46.jpg',
      lat: 8.96,
      lng: -79.54,
    ),
    VenueListing(
      id: 6,
      name: 'Lumina Beauty Sanctuary',
      categoryKey: 'spaService',
      rating: '4.6',
      reviews: '312',
      price: r'$100.00',
      imageUrl:
          'https://img.freepik.com/free-photo/young-woman-getting-beauty-treatment-spa-salon_23-2148192804.jpg',
      lat: 8.95,
      lng: -79.50,
    ),
    const VenueListing(
      id: 1,
      name: 'Luxe Hair Studio',
      categoryKey: 'hairService',
      rating: '4.9',
      reviews: '120',
      price: r'$45.00',
      unsplashImgId: '1560066984-138dadb4c035',
      lat: 8.98,
      lng: -79.52,
    ),
    const VenueListing(
      id: 2,
      name: 'Bliss Beauty Spa',
      categoryKey: 'spaService',
      rating: '4.8',
      reviews: '89',
      price: r'$65.00',
      unsplashImgId: '1544161515-4ab6ce6db874',
      lat: 8.99,
      lng: -79.51,
    ),
    const VenueListing(
      id: 3,
      name: 'Nail Society',
      categoryKey: 'nailCare',
      rating: '4.7',
      reviews: '62',
      price: r'$30.00',
      unsplashImgId: '1522337660859-02fbefca4702',
      lat: 8.97,
      lng: -79.53,
    ),
    const VenueListing(
      id: 4,
      name: 'Brow Studio',
      categoryKey: 'beautyService',
      rating: '4.9',
      reviews: '194',
      price: r'$32.75',
      unsplashImgId: '1487412947147-5cebf100ffc2',
      lat: 8.985,
      lng: -79.525,
    ),
  ];

  static List<Map<String, dynamic>> allAsSearchMaps() =>
      all.map((e) => e.toSearchMap()).toList();

  static List<VenueListing> byHomeCategory(String name) {
    final keys = homeCategoryToKeys[name];
    if (keys == null) return List<VenueListing>.from(all);
    return all.where((v) => keys.contains(v.categoryKey)).toList();
  }

  static List<VenueListing> nearbyPreview(int count) {
    if (count <= 0) return [];
    return all.take(count).toList();
  }

  static List<VenueListing> featured({double minRating = 4.8}) =>
      all.where((v) => double.parse(v.rating) >= minRating).toList();

  static VenueListing? byId(int id) {
    for (final v in all) {
      if (v.id == id) return v;
    }
    return null;
  }
}
