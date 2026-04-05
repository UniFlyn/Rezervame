import '../utils/default_venue_hero.dart';

/// Static home feed rows matching the legacy Mobile `home.dart` (copy / navigation targets only).

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
    required this.titleKey,
    required this.subtitleKey,
    this.assetPath,
    required this.unsplashId,
    required this.cta,
    this.categoryTitleKey,
  });

  final String titleKey;
  final String subtitleKey;
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
  });

  final String titleKey;
  final int placeCount;
  final String unsplashId;
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
  });

  final String serviceTitleKey;
  final String salonName;
  final String price;
  final String rating;
  final int reviewCount;
  final int durationMinutes;
  final String unsplashId;
  final int venueId;
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

const List<HomeBrowseCategoryItem> kHomeBrowseCategories = [
  HomeBrowseCategoryItem(titleKey: 'hairService', placeCount: 1245, unsplashId: DefaultVenueHero.unsplashPhotoId),
  HomeBrowseCategoryItem(titleKey: 'spaService', placeCount: 284, unsplashId: '1544161515-4ab6ce6db874'),
  HomeBrowseCategoryItem(titleKey: 'beautyService', placeCount: 434, unsplashId: '1487412947147-5cebf100ffc2'),
  HomeBrowseCategoryItem(titleKey: 'nailCare', placeCount: 220, unsplashId: '1522337660859-02fbefca4702'),
  HomeBrowseCategoryItem(titleKey: 'barber', placeCount: 29, unsplashId: '1585747860715-2ba37e788b70'),
];

const List<HomeFeaturedItem> kHomeFeatured = [
  HomeFeaturedItem(
    serviceTitleKey: 'featCut',
    salonName: 'Luxe Hair Studio',
    price: r'$45.00',
    rating: '4.9',
    reviewCount: 453,
    durationMinutes: 45,
    unsplashId: DefaultVenueHero.unsplashPhotoId,
    venueId: 1,
  ),
  HomeFeaturedItem(
    serviceTitleKey: 'featNails',
    salonName: 'Nail Society',
    price: r'$30.00',
    rating: '4.8',
    reviewCount: 312,
    durationMinutes: 60,
    unsplashId: '1522337660859-02fbefca4702',
    venueId: 3,
  ),
  HomeFeaturedItem(
    serviceTitleKey: 'featMassage',
    salonName: 'Bliss Beauty Spa',
    price: r'$65.00',
    rating: '5.0',
    reviewCount: 528,
    durationMinutes: 90,
    unsplashId: '1544161515-4ab6ce6db874',
    venueId: 2,
  ),
  HomeFeaturedItem(
    serviceTitleKey: 'featFacial',
    salonName: 'Aura Skin Care',
    price: r'$85.00',
    rating: '4.9',
    reviewCount: 198,
    durationMinutes: 60,
    unsplashId: '1487412947147-5cebf100ffc2',
    venueId: 5,
  ),
];

/// Horizontal “nearby” strip — first venues from the same catalog as legacy `home.dart`.
const List<HomeTopVenueItem> kHomeNearbyStrip = [
  HomeTopVenueItem(id: 1, name: 'Luxe Hair Studio', rating: '4.9', reviewCount: 453, price: r'$45.00', unsplashId: DefaultVenueHero.unsplashPhotoId, tagKeys: ['tagCut', 'tagColor', 'tagStyle']),
  HomeTopVenueItem(id: 2, name: 'Bliss Beauty Spa', rating: '4.8', reviewCount: 312, price: r'$65.00', unsplashId: '1544161515-4ab6ce6db874', tagKeys: ['tagMassage', 'tagFacial', 'tagSauna']),
  HomeTopVenueItem(id: 3, name: 'Nail Society', rating: '4.7', reviewCount: 198, price: r'$25.00', unsplashId: '1487412947147-5cebf100ffc2', tagKeys: ['tagNails', 'tagPedicure', 'tagGel']),
  HomeTopVenueItem(id: 5, name: 'Aura Skin Care', rating: '4.8', reviewCount: 77, price: r'$120.00', unsplashId: '1487412947147-5cebf100ffc2', tagKeys: ['tagSkin', 'tagLaser', 'tagPeeling']),
  HomeTopVenueItem(id: 7, name: 'Elite Aesthetics', rating: '4.9', reviewCount: 312, price: r'$200.00', unsplashId: '1522337660859-02fbefca4702', tagKeys: ['tagBody', 'tagFacial', 'tagSculpt']),
];

const List<HomeBeauticianItem> kHomeBeauticians = [
  HomeBeauticianItem(name: 'Ania Harris', avatarSeed: 'ania'),
  HomeBeauticianItem(name: 'Marcus Cole', avatarSeed: 'marcus'),
  HomeBeauticianItem(name: 'Sofia Reyes', avatarSeed: 'sofia'),
  HomeBeauticianItem(name: 'Jordan Lee', avatarSeed: 'jordan'),
  HomeBeauticianItem(name: 'Elena Vogt', avatarSeed: 'elena'),
];

const List<HomeTopVenueItem> kHomeTopVenues = [
  HomeTopVenueItem(id: 1, name: 'Luxe Hair Studio', rating: '4.9', reviewCount: 120, price: r'$45.00', unsplashId: DefaultVenueHero.unsplashPhotoId, tagKeys: ['tagCut', 'tagColor', 'tagStyle']),
  HomeTopVenueItem(id: 2, name: 'Bliss Beauty Spa', rating: '4.8', reviewCount: 89, price: r'$65.00', unsplashId: '1544161515-4ab6ce6db874', tagKeys: ['tagMassage', 'tagFacial', 'tagSauna']),
  HomeTopVenueItem(id: 3, name: 'Nail Society', rating: '4.7', reviewCount: 62, price: r'$25.00', unsplashId: '1487412947147-5cebf100ffc2', tagKeys: ['tagNails', 'tagPedicure', 'tagGel']),
  HomeTopVenueItem(id: 4, name: "The Gentlemen's Club", rating: '4.9', reviewCount: 210, price: r'$35.00', unsplashId: '1503951914875-452162b0f3f1', tagKeys: ['tagBarber', 'tagBeard', 'tagFacial']),
  HomeTopVenueItem(id: 5, name: 'Aura Skin Care', rating: '4.8', reviewCount: 77, price: r'$120.00', unsplashId: '1487412947147-5cebf100ffc2', tagKeys: ['tagSkin', 'tagLaser', 'tagPeeling']),
  HomeTopVenueItem(id: 6, name: 'Urban Barber', rating: '4.6', reviewCount: 145, price: r'$30.00', unsplashId: '1585747860715-2ba37e788b70', tagKeys: ['tagFades', 'tagClassic', 'tagShave']),
  HomeTopVenueItem(id: 7, name: 'Elite Aesthetics', rating: '4.9', reviewCount: 312, price: r'$200.00', unsplashId: '1522337660859-02fbefca4702', tagKeys: ['tagBody', 'tagFacial', 'tagSculpt']),
  HomeTopVenueItem(id: 8, name: 'Modern Nails', rating: '4.7', reviewCount: 92, price: r'$55.00', unsplashId: '1519014816541-da1916305741', tagKeys: ['tagNailArt', 'tagAcrylic', 'tagGel']),
  HomeTopVenueItem(id: 9, name: 'Viking Barber', rating: '4.5', reviewCount: 84, price: r'$40.00', unsplashId: '1532715088550-62f09305f765', tagKeys: ['tagBeard', 'tagHotTowel', 'tagOldSchool']),
  HomeTopVenueItem(id: 10, name: 'Serene Yoga', rating: '4.9', reviewCount: 156, price: r'$40.00', unsplashId: '1544367562803-44252e3c46aa', tagKeys: ['tagYoga', 'tagPrivate']),
  HomeTopVenueItem(id: 11, name: 'Glow Tanning', rating: '4.4', reviewCount: 63, price: r'$35.00', unsplashId: '1562322140-10f67175f053', tagKeys: ['tagSpray']),
  HomeTopVenueItem(id: 12, name: 'Diamond Dental', rating: '4.9', reviewCount: 204, price: r'$150.00', unsplashId: '1588776814546-1ffcf47267a5', tagKeys: ['tagDental', 'tagWhite']),
  HomeTopVenueItem(id: 13, name: 'Brows & Co', rating: '4.8', reviewCount: 118, price: r'$250.00', unsplashId: '1487515201422-2252b45a80b0', tagKeys: ['tagMicro', 'tagLash']),
  HomeTopVenueItem(id: 14, name: 'Rustic Grooming', rating: '4.6', reviewCount: 95, price: r'$45.00', unsplashId: '1503951914875-452162b0f3f1', tagKeys: ['tagCut', 'tagTrim', 'tagStyle']),
  HomeTopVenueItem(id: 15, name: 'Velvet Spa', rating: '4.7', reviewCount: 132, price: r'$75.00', unsplashId: '1544161515-4ab6ce6db874', tagKeys: ['tagMassage', 'tagColor', 'tagSteam']),
];

/// Home hero carousel (coral panel + image). Swipe horizontally.
const List<HomePromoBannerItem> kHomePromoBanners = [
  HomePromoBannerItem(
    titleKey: 'heroTitle',
    subtitleKey: 'heroSubtitle',
    assetPath: 'assets/home/hero_banner_right.png',
    unsplashId: DefaultVenueHero.unsplashPhotoId,
    cta: HomePromoBannerCta.featured,
  ),
  HomePromoBannerItem(
    titleKey: 'heroBanner2Title',
    subtitleKey: 'heroBanner2Subtitle',
    unsplashId: '1544161515-4ab6ce6db874',
    cta: HomePromoBannerCta.category,
    categoryTitleKey: 'spaService',
  ),
  HomePromoBannerItem(
    titleKey: 'heroBanner3Title',
    subtitleKey: 'heroBanner3Subtitle',
    unsplashId: DefaultVenueHero.unsplashPhotoId,
    cta: HomePromoBannerCta.category,
    categoryTitleKey: 'hairService',
  ),
  HomePromoBannerItem(
    titleKey: 'heroBanner4Title',
    subtitleKey: 'heroBanner4Subtitle',
    unsplashId: '1522337660859-02fbefca4702',
    cta: HomePromoBannerCta.category,
    categoryTitleKey: 'nailCare',
  ),
  HomePromoBannerItem(
    titleKey: 'heroBanner5Title',
    subtitleKey: 'heroBanner5Subtitle',
    unsplashId: '1585747860715-2ba37e788b70',
    cta: HomePromoBannerCta.events,
  ),
];
