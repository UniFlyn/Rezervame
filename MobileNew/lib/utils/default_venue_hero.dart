/// Fallback venue imagery when a listing has no photo.
/// Unsplash: hair tools on a counter (no hero model shot).
class DefaultVenueHero {
  DefaultVenueHero._();

  static const String unsplashPhotoId = '1522338245355-da2d9cf0e458';

  static String imageUrl({int w = 800}) =>
      'https://images.unsplash.com/photo-$unsplashPhotoId?q=80&w=$w&fit=crop';
}
