import '../models/venue_listing.dart';

/// Venue listings loaded from the API ([VenueCatalog.replaceAll]) for search + home cards.
class VenueCatalog {
  VenueCatalog._();

  /// Maps MobileNew home category labels to Mobile translation category keys.
  static const Map<String, List<String>> homeCategoryToKeys = {
    'Haircut': ['hairService', 'barber'],
    'Facial': ['beautyService', 'spaService'],
    'Waxing': ['beautyService'],
    'Spa': ['spaService'],
  };

  static List<VenueListing> all = [];

  static void replaceAll(List<VenueListing> listings) {
    all = List<VenueListing>.from(listings);
  }

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
