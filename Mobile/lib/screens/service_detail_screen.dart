import 'dart:async';
import 'dart:convert';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../models/booking_cart_line.dart';
import '../models/venue_listing.dart';
import '../utils/amenity_icons.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/booking_cart.dart';
import '../utils/booking_utils.dart';
import '../utils/service_audience.dart';
import '../utils/service_image_util.dart';
import '../widgets/chained_network_image.dart';
import 'booking_calendar_screen.dart';
import 'booking_history_screen.dart';

/// Venue / business details — content parity with [Mobile/lib/screens/venue_details_screen.dart],
/// styled with MobileNew [AppColors] / [AppTypography].
class ServiceDetailScreen extends StatefulWidget {
  const ServiceDetailScreen({super.key, this.listing});

  final VenueListing? listing;

  @override
  State<ServiceDetailScreen> createState() => _ServiceDetailScreenState();
}

class _ServiceDetailScreenState extends State<ServiceDetailScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  late final PageController _heroPageController;
  Timer? _heroAutoSlideTimer;
  int _heroPageIndex = 0;
  final List<String> _selectedServiceIds = [];
  bool _isFavorite = false;

  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _team = [];
  List<Map<String, dynamic>> _reviewRows = [];
  String _venueDescription = '';
  String _address = '';
  double? _latitude;
  double? _longitude;
  String _contactEmail = '';
  String _contactPhone = '';
  String _socialYoutube = '';
  String _socialInstagram = '';
  String _socialX = '';
  String _socialTiktok = '';
  List<Map<String, String>> _schedule = [];
  List<Map<String, dynamic>> _venueDetailSections = [];
  bool _detailLoading = true;
  String? _detailError;
  String? _profileBannerUrl;
  List<Map<String, dynamic>> _amenityRows = [];
  String _profileRating = '';
  String _profileReviews = '';
  String _profileDistance = '';
  List<String> _categoryLabels = [];
  List<String> _galleryImages = [];
  Map<String, int> _bestsellerMap = {};
  List<Map<String, dynamic>> _promotions = [];
  String _serviceFilter = 'all';
  bool _servicesExpanded = false;

  String get _venueName => widget.listing?.name ?? '';

  String get _heroImageUrl {
    final slides = _heroSlides;
    if (slides.isNotEmpty) return slides[_heroPageIndex.clamp(0, slides.length - 1)];
    final u = (_profileBannerUrl ?? '').trim();
    if (u.isNotEmpty && !u.startsWith('data:')) return u;
    return widget.listing?.heroImageUrl ?? '';
  }

  List<String> get _heroSlides {
    if (_galleryImages.isNotEmpty) return List<String>.from(_galleryImages);
    final banner = (_profileBannerUrl ?? '').trim();
    if (banner.isNotEmpty) return [banner];
    final listingHero = (widget.listing?.heroImageUrl ?? '').trim();
    if (listingHero.isNotEmpty) return [listingHero];
    final unsplash = widget.listing?.unsplashImgId;
    if (unsplash != null && unsplash.isNotEmpty) {
      return ['https://images.unsplash.com/photo-$unsplash?q=80&w=1200&fit=crop'];
    }
    return const [];
  }

  String get _ratingDisplay {
    if (_profileRating.isNotEmpty) return _profileRating;
    return widget.listing?.rating ?? '0';
  }

  String get _reviewsCount {
    if (_profileReviews.isNotEmpty) return _profileReviews;
    return widget.listing?.reviews ?? '0';
  }

  String get _distanceLabel {
    if (_profileDistance.isNotEmpty) return _profileDistance;
    final d = (widget.listing?.distanceLabel ?? '').trim();
    return d;
  }

  List<String> _portfolioImagePool() {
    final fromListing = widget.listing?.portfolioImageUrls ?? const [];
    if (fromListing.isNotEmpty) return List<String>.from(fromListing);
    return businessPortfolioUrls(
      gallery: _galleryImages,
      bannerUrl: _profileBannerUrl ?? widget.listing?.bannerUrl,
      logoUrl: widget.listing?.logoUrl,
    );
  }

  List<String> _serviceImageUrls(Map<String, dynamic> s) {
    return serviceImageUrlsChain(
      serviceImageUrl: s['imageUrl'] as String?,
      portfolioUrls: _portfolioImagePool(),
      seed: '${s['id']}',
    );
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _heroPageController = PageController();
    if (BookingCart.instance.businessId == widget.listing?.businessId) {
      _selectedServiceIds.addAll(BookingCart.instance.lines.map((l) => l.id));
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadVenueDetail());
  }

  void _syncCart() {
    final lines = <BookingCartLine>[];
    for (final id in _selectedServiceIds) {
      final s = _services.firstWhere((item) => item['id'] == id);
      lines.add(BookingCartLine(
        id: '${s['id']}',
        name: s['name'] as String,
        durationLabel: s['time'] as String,
        priceLabel: s['price'] as String,
        priceValue: BookingCartLine.parsePriceLabel(s['price'] as String),
      ));
    }
    if (lines.isEmpty) {
      BookingCart.instance.clear();
    } else {
      BookingCart.instance.setCart(
        bId: widget.listing?.businessId ?? '',
        name: _venueName,
        img: _heroImageUrl,
        items: lines,
        team: _team,
      );
    }
  }

  Future<void> _loadVenueDetail() async {
    final bid = widget.listing?.businessId;
    if (bid == null || bid.isEmpty) {
      setState(() {
        _detailLoading = false;
        _detailError = 'missingBusiness';
      });
      return;
    }
    final repo = ApiRepository();
    try {
      final results = await Future.wait([
        repo.fetchBusinessPublicProfile(bid),
        repo.fetchBusinessServices(bid),
        repo.fetchBusinessStaff(bid),
        repo.fetchBusinessReviews(bid),
        repo.fetchBusinessPromotions(bid),
        repo.fetchBusinessBestsellers(bid),
      ]);
      final prof = results[0] as Map<String, dynamic>?;
      final svc = (results[1] as List?)?.cast<Map<String, dynamic>>() ?? <Map<String, dynamic>>[];
      final staff = (results[2] as List?)?.cast<Map<String, dynamic>>() ?? <Map<String, dynamic>>[];
      final rev = (results[3] as List?)?.cast<Map<String, dynamic>>() ?? <Map<String, dynamic>>[];
      final promos = (results[4] as List?)?.cast<Map<String, dynamic>>() ?? <Map<String, dynamic>>[];
      final bestsellers = (results[5] as List?)?.cast<Map<String, dynamic>>() ?? <Map<String, dynamic>>[];
      if (!mounted) return;
      setState(() {
        final bannerRaw = '${prof?['banner'] ?? ''}'.trim();
        _profileBannerUrl = bannerRaw.isEmpty ? null : bannerRaw;
        _amenityRows = (prof?['amenities'] as List<dynamic>?)
                ?.map((e) => Map<String, dynamic>.from(e as Map))
                .toList() ??
            [];
        _venueDescription = '${prof?['description'] ?? ''}'.trim();
        _profileRating = '${prof?['rating'] ?? ''}'.trim();
        _profileReviews = '${prof?['reviews'] ?? ''}'.trim();
        _profileDistance = '${prof?['distanceLabel'] ?? ''}'.trim();
        final cats = prof?['categories'];
        if (cats is List && cats.isNotEmpty) {
          _categoryLabels = cats.map((e) => '$e'.trim().toUpperCase()).where((s) => s.isNotEmpty).toList();
        } else {
          final single = '${prof?['category'] ?? ''}'.trim();
          if (single.isNotEmpty) {
            _categoryLabels = single.split('·').map((s) => s.trim().toUpperCase()).where((s) => s.isNotEmpty).toList();
          } else {
            _categoryLabels = [];
          }
        }
        final rawImages = prof?['images'];
        final banner = bannerRaw;
        final logo = '${prof?['logo'] ?? ''}'.trim();
        final skip = <String>{if (banner.isNotEmpty) banner, if (logo.isNotEmpty) logo};
        _galleryImages = [];
        if (rawImages is List) {
          for (final img in rawImages) {
            final u = '$img'.trim();
            if (u.isNotEmpty && !skip.contains(u) && !_galleryImages.contains(u)) {
              _galleryImages.add(u);
            }
          }
        }
        if (_galleryImages.isEmpty && banner.isNotEmpty) _galleryImages.add(banner);
        _promotions = promos;
        _bestsellerMap = {};
        for (final b in bestsellers) {
          final sid = '${b['serviceId'] ?? ''}';
          if (sid.isNotEmpty) {
            _bestsellerMap[sid] = (b['bookingCount'] as num?)?.toInt() ?? 0;
          }
        }
        _address = '${prof?['location'] ?? ''}'.trim();
        _latitude = prof?['latitude'] != null ? (prof?['latitude'] as num).toDouble() : null;
        _longitude = prof?['longitude'] != null ? (prof?['longitude'] as num).toDouble() : null;
        _contactEmail = '${prof?['contactEmail'] ?? ''}'.trim();
        _contactPhone = '${prof?['contactPhone'] ?? ''}'.trim();
        final regPhotos = prof?['registrationPhotoUrls'];
        if (regPhotos is List) {
          for (final u in regPhotos) {
            final s = '$u'.trim();
            if (s.isNotEmpty && !_galleryImages.contains(s)) {
              _galleryImages.insert(0, s);
            }
          }
        }
        final vds = prof?['venueDetailSections'];
        if (vds is List) {
          _venueDetailSections = vds.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        } else {
          _venueDetailSections = [];
        }
        _socialYoutube = '${prof?['socialYoutube'] ?? ''}'.trim();
        _socialInstagram = '${prof?['socialInstagram'] ?? ''}'.trim();
        _socialX = '${prof?['socialX'] ?? ''}'.trim();
        _socialTiktok = '${prof?['socialTiktok'] ?? ''}'.trim();
        _schedule = [];
        final wh = prof?['workingHours'];
        if (wh != null && wh is String && wh.trim().isNotEmpty) {
          try {
            final parsed = jsonDecode(wh);
            if (parsed is List) {
              for (final item in parsed) {
                if (item is Map) {
                  String hoursStr = '';
                  if (item['hours'] != null) {
                    hoursStr = '${item['hours']}';
                  } else if (item['open'] == false) {
                    hoursStr = 'Closed';
                  } else if (item['start'] != null && item['end'] != null) {
                    hoursStr = '${item['start']} - ${item['end']}';
                  } else {
                    hoursStr = 'Closed';
                  }
                  _schedule.add({
                    'day': '${item['day'] ?? ''}',
                    'hours': hoursStr,
                  });
                }
              }
            }
          } catch (e) {
            debugPrint('Error parsing workingHours JSON: $e');
          }
        }
        if (_schedule.isEmpty) {
          _schedule = [
            {'day': 'Monday', 'hours': '9:00 AM - 6:00 PM'},
            {'day': 'Tuesday', 'hours': '9:00 AM - 6:00 PM'},
            {'day': 'Wednesday', 'hours': '9:00 AM - 6:00 PM'},
            {'day': 'Thursday', 'hours': '9:00 AM - 6:00 PM'},
            {'day': 'Friday', 'hours': '9:00 AM - 6:00 PM'},
            {'day': 'Saturday', 'hours': '10:00 AM - 4:00 PM'},
            {'day': 'Sunday', 'hours': 'Closed'},
          ];
        }
        _services = svc.map((s) {
          final id = '${s['id']}';
          final price = ((s['price'] as num?) ?? 0).toDouble();
          final dur = (s['duration'] as num?)?.toInt() ?? 30;
          final img = '${s['imageUrl'] ?? ''}'.trim();
          return {
            'id': id,
            'name': '${s['name']}',
            'desc': '${s['category']}',
            'time': '$dur min',
            'price': '\$${price.toStringAsFixed(2)}',
            'priceValue': price,
            'tag': '${s['category'] ?? ''}',
            'imageUrl': img,
          };
        }).toList();
        _team = staff.map((m) {
          final img = '${m['image'] ?? ''}'.trim();
          final svcIds = (m['serviceIds'] as List<dynamic>?)?.map((e) => '$e').toList() ?? <String>[];
          var bio = '${m['bio'] ?? ''}'.trim();
          final skills = m['skills'];
          if (bio.isEmpty && skills is List && skills.isNotEmpty) {
            bio = skills.map((e) => '$e').join(', ');
          }
          if (bio.isEmpty) bio = '—';
          return {
            'id': '${m['id']}',
            'name': '${m['name']}',
            'role': '${m['role']}',
            'rating': ((m['rating'] as num?) ?? 0).toDouble(),
            'reviews': (m['reviews'] as num?)?.toInt() ?? 0,
            'clients': formatStaffStatValue(m['clients']),
            'years': formatStaffStatValue(m['experienceYears']),
            'bio': bio,
            'serviceIds': svcIds,
            'availability': '${m['availability'] ?? ''}',
            'imageUrl': img,
          };
        }).toList();
        _reviewRows = rev.map((r) {
          final d = DateTime.tryParse('${r['date']}') ?? DateTime.now();
          return {
            'name': '${r['customerName']}',
            'date': '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}',
            'rating': (r['rating'] as num?)?.toInt() ?? 5,
            'comment': '${r['comment']}',
          };
        }).toList();
        _detailLoading = false;
      });
      if (_heroPageIndex >= _heroSlides.length) {
        _heroPageIndex = 0;
        if (_heroPageController.hasClients) {
          _heroPageController.jumpToPage(0);
        }
      }
      _restartHeroAutoSlide();
      await _syncFavoriteState();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _detailLoading = false;
        _detailError = '$e';
      });
    }
  }

  Future<void> _syncFavoriteState() async {
    final bid = widget.listing?.businessId;
    if (bid == null || bid.isEmpty) {
      if (mounted) setState(() => _isFavorite = false);
      return;
    }
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) {
      if (mounted) setState(() => _isFavorite = false);
      return;
    }
    final res = await ApiRepository().fetchFavoriteVenueMaps(page: 1, limit: 200);
    final favs = (res['data'] as List<Map<String, dynamic>>?) ?? [];
    if (!mounted) return;
    final on = favs.any((m) => '${m['businessId']}' == bid);
    setState(() => _isFavorite = on);
  }

  Future<void> _toggleFavorite() async {
    final bid = widget.listing?.businessId;
    if (bid == null || bid.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('missingBusiness'.tr())));
      return;
    }
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('loginRequiredFavorite'.tr())));
      return;
    }
    final repo = ApiRepository();
    final ok = _isFavorite ? await repo.removeFavorite(bid) : await repo.addFavorite(bid);
    if (ok && mounted) setState(() => _isFavorite = !_isFavorite);
  }

  @override
  void dispose() {
    _heroAutoSlideTimer?.cancel();
    _heroPageController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _restartHeroAutoSlide() {
    _heroAutoSlideTimer?.cancel();
    final count = _heroSlides.length;
    if (count <= 1 || !mounted) return;
    _heroAutoSlideTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_heroPageController.hasClients) return;
      final next = (_heroPageIndex + 1) % count;
      _heroPageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOut,
      );
    });
  }

  void _onHeroPageChanged(int index) {
    setState(() => _heroPageIndex = index);
    _restartHeroAutoSlide();
  }

  void _openImageLightbox(int initialIndex) {
    if (_galleryImages.isEmpty) return;
    showDialog<void>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.88),
      builder: (ctx) => _VenueImageLightbox(
        images: _galleryImages,
        initialIndex: initialIndex.clamp(0, _galleryImages.length - 1),
      ),
    );
  }

  void _showShareSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'shareThisVenue'.tr(),
              style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildShareOption(Icons.message_rounded, 'WhatsApp', const Color(0xFF25D366)),
                _buildShareOption(Icons.camera_alt_rounded, 'Instagram', const Color(0xFFE1306C)),
                _buildShareOption(Icons.facebook_rounded, 'Facebook', const Color(0xFF1877F2)),
                _buildShareOption(Icons.link_rounded, 'copyLink'.tr(), Colors.grey.shade700),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption(IconData icon, String label, Color color) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w800),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: NestedScrollView(
        headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
          return [
            // No SliverOverlapAbsorber here: the tab bar lives in a separate pinned
            // sliver. Pairing absorber (app bar only) + SliverOverlapInjector in tabs
            // double-reserves overlap and leaves a large empty gap under the tabs.
            _buildSliverAppBar(),
            SliverToBoxAdapter(child: _buildVenueHeader()),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverAppBarDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: AppColors.primary500,
                  unselectedLabelColor: AppColors.grey400,
                  indicatorColor: AppColors.primary500,
                  indicatorWeight: 3,
                  labelStyle: AppTypography.homeSectionTitle.copyWith(letterSpacing: 0.5, fontSize: 11),
                  unselectedLabelStyle: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey400, fontSize: 11),
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  padding: EdgeInsets.zero,
                  labelPadding: const EdgeInsets.symmetric(horizontal: 16),
                  tabs: [
                    Tab(text: 'venueServicios'.tr()),
                    Tab(text: 'venueEquipo'.tr()),
                    const Tab(text: 'Portfolio'),
                    Tab(text: 'venueReseñas'.tr()),
                    Tab(text: 'venueAmenidades'.tr()),
                    Tab(text: 'venueInfo'.tr()),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildServicesTab(),
            _buildTeamTab(),
            _buildPortfolioTab(),
            _buildReviewsTab(),
            _buildAmenitiesTab(),
            _buildInfoTab(),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomAction(),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 250,
      pinned: true,
      backgroundColor: AppColors.grey900,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: AppColors.white),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.share_outlined, color: AppColors.white),
          onPressed: _showShareSheet,
        ),
        IconButton(
          icon: Icon(
            _isFavorite ? Icons.favorite : Icons.favorite_border,
            color: _isFavorite ? AppColors.primary500 : AppColors.white,
          ),
          onPressed: _toggleFavorite,
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: _buildHeroGallery(),
      ),
    );
  }

  Widget _buildHeroGallery() {
    final slides = _heroSlides;
    if (slides.isEmpty) {
      return Container(color: AppColors.grey200);
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        GestureDetector(
          onTap: slides.isNotEmpty && _galleryImages.isNotEmpty
              ? () => _openImageLightbox(_heroPageIndex)
              : null,
          child: slides.length == 1
              ? ChainedNetworkImage(
                  urls: ChainedNetworkImage.chainFrom(slides.first, widget.listing?.unsplashImgId, w: 1200),
                  fit: BoxFit.cover,
                )
              : PageView.builder(
                  controller: _heroPageController,
                  onPageChanged: _onHeroPageChanged,
                  itemCount: slides.length,
                  itemBuilder: (context, index) {
                    return ChainedNetworkImage(
                      urls: ChainedNetworkImage.chainFrom(slides[index], widget.listing?.unsplashImgId, w: 1200),
                      fit: BoxFit.cover,
                    );
                  },
                ),
        ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.4),
                Colors.transparent,
                Colors.black.withValues(alpha: 0.35),
              ],
            ),
          ),
        ),
        if (slides.length > 1)
          Positioned(
            left: 0,
            right: 0,
            bottom: 14,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(slides.length, (i) {
                final active = i == _heroPageIndex;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: active ? 18 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: active ? AppColors.white : AppColors.white.withValues(alpha: 0.45),
                    borderRadius: BorderRadius.circular(3),
                  ),
                );
              }),
            ),
          ),
      ],
    );
  }

  Widget _buildVenueHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_venueName, style: AppTypography.screenTitle.copyWith(color: AppColors.grey900)),
          if (_categoryLabels.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              _categoryLabels.join(' · '),
              style: AppTypography.body100.copyWith(
                color: AppColors.primary500,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
                fontSize: 10,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.star, color: Colors.amber, size: 18),
              const SizedBox(width: 4),
              Text(_ratingDisplay, style: AppTypography.heading300.copyWith(color: AppColors.grey900)),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'venueReviewStats'.tr(namedArgs: {'count': _reviewsCount}),
                  style: AppTypography.body100.copyWith(color: AppColors.grey400),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (_distanceLabel.isNotEmpty) ...[
                const Icon(Icons.location_on_outlined, color: AppColors.grey300, size: 18),
                const SizedBox(width: 4),
                Text(_distanceLabel, style: AppTypography.body200.copyWith(color: AppColors.grey900)),
              ],
            ],
          ),
          const SizedBox(height: 16),
          Text(
            _venueDescription.isNotEmpty ? _venueDescription : 'venueHeroBlurb'.tr(),
            style: AppTypography.body200.copyWith(color: AppColors.grey600, height: 1.5),
          ),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> get _filteredServices {
    if (_serviceFilter == 'promotions') {
      final promoIds = _promotions.map((p) => '${p['serviceId']}').toSet();
      return _services.where((s) => promoIds.contains('${s['id']}')).toList();
    }
    if (_serviceFilter == 'women' || _serviceFilter == 'men' || _serviceFilter == 'kids') {
      return _services
          .where((s) => serviceMatchesAudienceFilter('${s['tag']}', _serviceFilter))
          .toList();
    }
    return _services;
  }

  Future<bool> _confirmCartVenueSwitch() async {
    final cart = BookingCart.instance;
    final bid = widget.listing?.businessId;
    if (cart.isEmpty || bid == null || cart.businessId == bid) return true;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Replace cart?'),
        content: Text(
          'You have services from ${cart.venueName ?? 'another venue'} in your cart. '
          'Adding services here will replace them.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Replace')),
        ],
      ),
    );
    if (confirmed == true) {
      cart.clear();
      return true;
    }
    return false;
  }

  Future<void> _addServiceId(String id) async {
    final ok = await _confirmCartVenueSwitch();
    if (!ok || !mounted) return;
    setState(() {
      _selectedServiceIds.add(id);
      _syncCart();
    });
  }

  Future<void> _removeServiceId(String id) async {
    setState(() {
      final idx = _selectedServiceIds.lastIndexOf(id);
      if (idx >= 0) _selectedServiceIds.removeAt(idx);
      _syncCart();
    });
  }

  Map<String, dynamic>? _promoForService(String serviceId) {
    for (final p in _promotions) {
      if ('${p['serviceId']}' == serviceId) return p;
    }
    return null;
  }

  Widget _buildServicesTab() {
    if (_detailLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary500));
    }
    if (_detailError != null && _services.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            _detailError == 'missingBusiness'
                ? 'Venue data unavailable (missing business id). Open from search or home after API loads.'
                : _detailError!,
            textAlign: TextAlign.center,
            style: AppTypography.body200.copyWith(color: AppColors.grey500),
          ),
        ),
      );
    }
    if (_services.isEmpty) {
      return Center(child: Text('No services listed.', style: AppTypography.body200.copyWith(color: AppColors.grey500)));
    }

    final filtered = _filteredServices;
    const previewLimit = 6;
    final visible = _servicesExpanded ? filtered : filtered.take(previewLimit).toList();
    final hasMore = filtered.length > previewLimit && !_servicesExpanded;
    final filters = <Map<String, String>>[
      ...buildServiceAudienceFilters(_services),
      if (_promotions.isNotEmpty) {'id': 'promotions', 'label': 'PROMOTIONS'},
    ];

    return CustomScrollView(
      key: const PageStorageKey<String>('venue_tab_services'),
      primary: false,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          sliver: SliverToBoxAdapter(
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: filters.map((f) {
                    final selected = _serviceFilter == f['id'];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: OutlinedButton(
                        onPressed: () => setState(() {
                          _serviceFilter = f['id']!;
                          _servicesExpanded = false;
                        }),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: selected ? AppColors.grey900 : AppColors.white,
                          foregroundColor: selected ? AppColors.white : AppColors.grey400,
                          side: BorderSide(color: selected ? AppColors.grey900 : AppColors.grey100, width: 2),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(f['label']!, style: AppTypography.body100.copyWith(fontWeight: FontWeight.w800, fontSize: 10)),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              mainAxisExtent: 268,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) => _buildServiceGridCard(visible[index]),
              childCount: visible.length,
            ),
          ),
        ),
        if (hasMore)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Center(
                child: TextButton(
                  onPressed: () => setState(() => _servicesExpanded = true),
                  child: Text('See more +', style: AppTypography.buttonMedium.copyWith(color: AppColors.grey900)),
                ),
              ),
            ),
          ),
      ],
    );
  }

  /// Classic mobile 2-column service card (image on top, details + BOOK below).
  Widget _buildServiceGridCard(Map<String, dynamic> s) {
    final id = '${s['id']}';
    final promo = _promoForService(id);
    final priceValue = (s['priceValue'] as num?)?.toDouble() ?? 0;
    final discountPct = (promo?['discountPercent'] as num?)?.toDouble();
    final discounted = discountPct != null ? priceValue * (1 - discountPct / 100) : null;
    final isBestseller = promo == null && (_bestsellerMap[id] ?? 0) > 0;
    final promoLabel = promo != null
        ? ('${promo['label'] ?? ''}'.trim().isNotEmpty
            ? '${promo['label']}'
            : '${discountPct?.toStringAsFixed(0)}% OFF')
        : null;
    final nextSlot = getNextSlotForService(
      id,
      _team,
      schedule: _schedule.map((e) => Map<String, dynamic>.from(e)).toList(),
    );
    final qty = _selectedServiceIds.where((x) => x == id).length;

    return Container(
      decoration: BoxDecoration(
        color: promo != null ? AppColors.primary50.withValues(alpha: 0.4) : AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: promo != null ? AppColors.primary500.withValues(alpha: 0.28) : AppColors.grey50,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 100,
            child: ChainedNetworkImage(
              urls: _serviceImageUrls(s),
              fit: BoxFit.cover,
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (promoLabel != null || isBestseller)
                    SizedBox(
                      height: 20,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          if (promoLabel != null) _serviceTag(promoLabel, AppColors.primary500),
                          if (isBestseller) ...[
                            if (promoLabel != null) const SizedBox(width: 4),
                            _serviceTag('POPULAR', const Color(0xFFD97706)),
                          ],
                        ],
                      ),
                    ),
                  if (promoLabel != null || isBestseller) const SizedBox(height: 4),
                  Text(
                    s['name'] as String,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.heading300.copyWith(fontWeight: FontWeight.w800, fontSize: 13, height: 1.1),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${s['time']} · $nextSlot',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.body100.copyWith(color: AppColors.grey400, fontSize: 9, fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  if (discounted != null && promo != null) ...[
                    Text(
                      '\$${discounted.toStringAsFixed(2)}',
                      maxLines: 1,
                      style: AppTypography.heading200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w900, fontSize: 14),
                    ),
                    Text(
                      s['price'] as String,
                      maxLines: 1,
                      style: AppTypography.body100.copyWith(
                        color: AppColors.grey400,
                        decoration: TextDecoration.lineThrough,
                        fontSize: 9,
                      ),
                    ),
                  ] else
                    Text(
                      s['price'] as String,
                      maxLines: 1,
                      style: AppTypography.heading200.copyWith(fontWeight: FontWeight.w900, fontSize: 14),
                    ),
                  const SizedBox(height: 6),
                  SizedBox(
                    height: 34,
                    width: double.infinity,
                    child: qty > 0
                        ? Container(
                            decoration: BoxDecoration(color: AppColors.grey900, borderRadius: BorderRadius.circular(10)),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _qtyBtn(Icons.remove, () => _removeServiceId(id)),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  child: Text('$qty', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                                ),
                                _qtyBtn(Icons.add, () => _addServiceId(id)),
                              ],
                            ),
                          )
                        : OutlinedButton(
                            onPressed: () => _addServiceId(id),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primary500,
                              side: const BorderSide(color: AppColors.primary500, width: 2),
                              padding: EdgeInsets.zero,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: Text('BOOK', style: AppTypography.body100.copyWith(fontWeight: FontWeight.w800, fontSize: 11)),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _serviceTag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label.toUpperCase(), style: AppTypography.body100.copyWith(color: color, fontSize: 9, fontWeight: FontWeight.w800)),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
    );
  }

  String? _staffYearsLabel(Map<String, dynamic> m) {
    final years = '${m['years']}'.trim();
    if (years.isEmpty || years == '—' || years == '0') return null;
    return '$years yrs exp.';
  }

  void _openStaffProfile(Map<String, dynamic> member) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.52,
        minChildSize: 0.38,
        maxChildSize: 0.92,
        expand: false,
        builder: (_, scrollCtrl) {
          final m = member;
          final rating = (m['rating'] as num?)?.toDouble() ?? 0;
          final yearsLabel = _staffYearsLabel(m);
          final svcIds = (m['serviceIds'] as List<dynamic>?)?.map((e) => '$e').toSet() ?? <String>{};
          final offered = svcIds.isEmpty
              ? _services
              : _services.where((s) => svcIds.contains('${s['id']}')).toList();
          final bio = '${m['bio']}';
          final bioText = bio == '—' ? 'This professional has not added a bio yet.' : bio;
          return Container(
            decoration: const BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: ListView(
              controller: scrollCtrl,
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(color: AppColors.grey200, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: AppColors.primary50,
                          child: ClipOval(
                            child: ChainedNetworkImage(
                              urls: ChainedNetworkImage.chainFrom('${m['imageUrl']}', null, w: 400),
                              width: 72,
                              height: 72,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        if (rating > 0)
                          Positioned(
                            right: -4,
                            bottom: -2,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.grey100),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.black.withValues(alpha: 0.08),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 12),
                                  const SizedBox(width: 2),
                                  Text(
                                    rating.toStringAsFixed(1),
                                    style: AppTypography.body100.copyWith(fontWeight: FontWeight.w900, fontSize: 10),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${m['name']}', style: AppTypography.heading200.copyWith(fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text(
                            '${m['role']}'.toUpperCase(),
                            style: AppTypography.body100.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w800, fontSize: 10),
                          ),
                          if (yearsLabel != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              yearsLabel,
                              style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close, size: 22),
                      color: AppColors.grey500,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(bioText, style: AppTypography.body200.copyWith(color: AppColors.grey600, height: 1.4)),
                if (offered.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  Text('Services', style: AppTypography.sectionTitle.copyWith(fontSize: 16)),
                  const SizedBox(height: 8),
                  ...offered.map((s) {
                    final sid = '${s['id']}';
                    final selected = _selectedServiceIds.contains(sid);
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('${s['name']}', style: AppTypography.heading200),
                      subtitle: Text('${s['time']} · ${s['price']}'),
                      trailing: OutlinedButton(
                        onPressed: () async {
                          if (selected) {
                            await _removeServiceId(sid);
                          } else {
                            await _addServiceId(sid);
                          }
                          if (ctx.mounted) Navigator.pop(ctx);
                        },
                        child: Text(selected ? 'Added' : 'BOOK'),
                      ),
                    );
                  }),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStaffTile(Map<String, dynamic> m) {
    final rating = (m['rating'] as num?)?.toDouble() ?? 0;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openStaffProfile(m),
        borderRadius: BorderRadius.circular(12),
        child: SizedBox(
          width: 92,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  CircleAvatar(
                    radius: 34,
                    backgroundColor: AppColors.primary50,
                    child: ClipOval(
                      child: ChainedNetworkImage(
                        urls: ChainedNetworkImage.chainFrom('${m['imageUrl']}', null, w: 300),
                        width: 68,
                        height: 68,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  if (rating > 0)
                    Positioned(
                      top: 0,
                      right: 4,
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
                              rating.toStringAsFixed(1),
                              style: AppTypography.body100.copyWith(fontWeight: FontWeight.w900, fontSize: 9),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${m['name']}',
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.body100.copyWith(
                  color: AppColors.grey900,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${m['role']}'.toUpperCase(),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.body100.copyWith(
                  color: AppColors.primary500,
                  fontWeight: FontWeight.w800,
                  fontSize: 9,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTeamTab() {
    if (_detailLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary500));
    }
    if (_team.isEmpty) {
      return Center(child: Text('No team listed yet.', style: AppTypography.body200.copyWith(color: AppColors.grey500)));
    }
    return CustomScrollView(
      key: const PageStorageKey<String>('venue_tab_team'),
      primary: false,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          sliver: SliverToBoxAdapter(
            child: Wrap(
              spacing: 12,
              runSpacing: 20,
              alignment: WrapAlignment.center,
              children: _team.map(_buildStaffTile).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPortfolioTab() {
    if (_detailLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary500));
    }
    if (_galleryImages.isEmpty) {
      return Center(child: Text('No portfolio images yet.', style: AppTypography.body200.copyWith(color: AppColors.grey500)));
    }
    return CustomScrollView(
      key: const PageStorageKey<String>('venue_tab_portfolio'),
      primary: false,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 4 / 3,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final src = _galleryImages[index];
                return Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _openImageLightbox(index),
                    borderRadius: BorderRadius.circular(12),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: ChainedNetworkImage(
                        urls: ChainedNetworkImage.chainFrom(src, null, w: 800),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                );
              },
              childCount: _galleryImages.length,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewsTab() {
    if (_detailLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary500));
    }
    return CustomScrollView(
      key: const PageStorageKey<String>('venue_tab_reviews'),
      primary: false,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(
            delegate: SliverChildListDelegate(
              [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$_ratingDisplay / 5.0',
                            style: AppTypography.heading500.copyWith(color: AppColors.grey900),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: List.generate(5, (_) => const Icon(Icons.star, color: Colors.amber, size: 16)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'venueReviewStats'.tr(namedArgs: {'count': _reviewsCount}),
                            style: AppTypography.body100.copyWith(color: AppColors.grey400),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: () {
                        Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(builder: (context) => const BookingHistoryScreen()),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.grey900, width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                      child: Text(
                        'My reservations',
                        style: AppTypography.heading100.copyWith(color: AppColors.grey900),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                if (_reviewRows.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Text(
                      'No reviews yet.',
                      style: AppTypography.body200.copyWith(color: AppColors.grey500),
                    ),
                  )
                else
                  ..._reviewRows.map(
                    (r) => _buildReviewCard(
                      r['name']! as String,
                      r['date']! as String,
                      r['rating']! as int,
                      r['comment']! as String,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewCard(String name, String date, int rating, String comment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(name, style: AppTypography.heading200.copyWith(color: AppColors.grey900)),
              Text(
                date,
                style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: List.generate(
              5,
              (i) => Icon(
                Icons.star,
                color: i < rating ? Colors.amber : AppColors.grey200,
                size: 14,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            comment,
            style: AppTypography.body200.copyWith(color: AppColors.grey600, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildAmenitiesTab() {
    final tiles = _amenityRows
        .map((a) {
          final label = ('${a['labelEn'] ?? a['labelEs'] ?? a['key'] ?? ''}'.trim());
          return {'key': '${a['key']}', 'label': label};
        })
        .where((a) => '${a['label']}'.isNotEmpty)
        .toList();

    if (tiles.isEmpty) {
      return CustomScrollView(
        key: const PageStorageKey<String>('venue_tab_amenities'),
        primary: false,
        slivers: [
          SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'venueNoAmenitiesListed'.tr(),
                  textAlign: TextAlign.center,
                  style: AppTypography.body200.copyWith(color: AppColors.grey500),
                ),
              ),
            ),
          ),
        ],
      );
    }

    return CustomScrollView(
      key: const PageStorageKey<String>('venue_tab_amenities'),
      primary: false,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(24),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final a = tiles[index];
                final key = '${a['key']}';
                final icon = amenityIconForKey(key);
                return Container(
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.grey50),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.black.withValues(alpha: 0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Icon(icon, color: AppColors.primary500, size: 18),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${a['label']}',
                          style: AppTypography.heading100.copyWith(color: AppColors.grey900),
                        ),
                      ),
                    ],
                  ),
                );
              },
              childCount: tiles.length,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoTab() {
    return CustomScrollView(
      key: const PageStorageKey<String>('venue_tab_info'),
      primary: false,
      slivers: [
        SliverToBoxAdapter(child: _buildVenueExtraInfo()),
      ],
    );
  }

  Widget _buildBottomAction() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: AppColors.grey900.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: Row(
            children: [
              if (_selectedServiceIds.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: AppColors.grey800,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle_outline, color: Colors.greenAccent, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        '${_selectedServiceIds.length} ${_selectedServiceIds.length == 1 ? "service" : "services"}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              Expanded(
                child: ElevatedButton(
                  onPressed: _selectedServiceIds.isEmpty
                      ? null
                      : () {
                          Navigator.push<void>(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => BookingCalendarScreen(
                                venueName: _venueName,
                                heroImageUrl: _heroImageUrl,
                                cartLines: BookingCart.instance.lines,
                                specialists: _team,
                                businessId: widget.listing?.businessId,
                              ),
                            ),
                          );
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    disabledBackgroundColor: AppColors.grey200,
                    disabledForegroundColor: AppColors.grey500,
                    foregroundColor: AppColors.white,
                    textStyle: AppTypography.heading400,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: _selectedServiceIds.isEmpty ? 0 : 8,
                    shadowColor: _selectedServiceIds.isEmpty ? Colors.transparent : AppColors.primary500.withValues(alpha: 0.4),
                  ),
                  child: Text('venueReserveNow'.tr()),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVenueDetailSectionsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.grey50),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'venueDetailsHeading'.tr().isNotEmpty && 'venueDetailsHeading'.tr() != 'venueDetailsHeading'
                ? 'venueDetailsHeading'.tr()
                : 'Venue details',
            style: AppTypography.heading200.copyWith(color: AppColors.grey900),
          ),
          const SizedBox(height: 16),
          ..._venueDetailSections.map((sec) {
            final title = '${sec['title'] ?? ''}'.trim();
            final rows = sec['rows'];
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (title.isNotEmpty)
                    Text(
                      title,
                      style: AppTypography.body100.copyWith(
                        color: AppColors.primary500,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  if (title.isNotEmpty) const SizedBox(height: 8),
                  if (rows is List)
                    ...rows.map((r) {
                      final row = Map<String, dynamic>.from(r as Map);
                      final label = '${row['label'] ?? ''}'.trim();
                      final value = '${row['value'] ?? ''}'.trim();
                      if (label.isEmpty && value.isEmpty) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 2,
                              child: Text(label, style: AppTypography.body100.copyWith(color: AppColors.grey500)),
                            ),
                            Expanded(
                              flex: 3,
                              child: Text(
                                value,
                                textAlign: TextAlign.end,
                                style: AppTypography.body200.copyWith(
                                  color: AppColors.grey900,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildVenueExtraInfo() {
    final mapCenter = _latitude != null && _longitude != null
        ? LatLng(_latitude!, _longitude!)
        : const LatLng(8.98, -79.52);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Mini Map & Address Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.grey50),
              boxShadow: [
                BoxShadow(
                  color: AppColors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(Icons.map_outlined, color: AppColors.primary500, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'venueLocationMissing'.tr().isNotEmpty && 'venueLocationMissing'.tr() != 'venueLocationMissing' ? 'venueLocationMissing'.tr() : 'Location',
                      style: AppTypography.heading200.copyWith(color: AppColors.grey900),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: SizedBox(
                    height: 180,
                    child: FlutterMap(
                      options: MapOptions(
                        initialCenter: mapCenter,
                        initialZoom: 14,
                        interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.rezervame.app',
                        ),
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: mapCenter,
                              width: 40,
                              height: 40,
                              child: const Icon(Icons.location_on, color: AppColors.primary500, size: 40),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  _address.isNotEmpty ? _address : 'No address provided.',
                  style: AppTypography.body200.copyWith(color: AppColors.grey600),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () async {
                    final query = Uri.encodeComponent(_address.isNotEmpty ? _address : _venueName);
                    final url = Uri.parse('https://www.openstreetmap.org/search?query=$query');
                    if (await canLaunchUrl(url)) {
                      await launchUrl(url, mode: LaunchMode.externalApplication);
                    }
                  },
                  icon: const Icon(Icons.open_in_new_rounded, size: 16, color: AppColors.white),
                  label: Text('venueMapOpen'.tr().isNotEmpty && 'venueMapOpen'.tr() != 'venueMapOpen' ? 'venueMapOpen'.tr() : 'Open Map', style: const TextStyle(color: AppColors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.grey900,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
          ),
          if (_venueDetailSections.isNotEmpty) ...[
            const SizedBox(height: 20),
            _buildVenueDetailSectionsCard(),
          ],
          const SizedBox(height: 20),

          // 2. Working Hours (Schedule) Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.grey50),
              boxShadow: [
                BoxShadow(
                  color: AppColors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.access_time_rounded, color: AppColors.primary500, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'venueHoursHeading'.tr().isNotEmpty && 'venueHoursHeading'.tr() != 'venueHoursHeading' ? 'venueHoursHeading'.tr() : 'Opening Hours',
                      style: AppTypography.heading200.copyWith(color: AppColors.grey900),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ..._schedule.map((s) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          s['day'] ?? '',
                          style: AppTypography.body200.copyWith(color: AppColors.grey600, fontWeight: FontWeight.w600),
                        ),
                        Text(
                          s['hours'] ?? '',
                          style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 3. Contact & Socials Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.grey50),
              boxShadow: [
                BoxShadow(
                  color: AppColors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: AppColors.primary500, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'venueInfoHeading'.tr().isNotEmpty && 'venueInfoHeading'.tr() != 'venueInfoHeading' ? 'venueInfoHeading'.tr() : 'Venue Info',
                      style: AppTypography.heading200.copyWith(color: AppColors.grey900),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                if (_contactPhone.isNotEmpty) ...[
                  ListTile(
                    leading: const Icon(Icons.phone_rounded, color: AppColors.primary500),
                    title: Text(_contactPhone, style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.bold)),
                    subtitle: Text('contact'.tr().isNotEmpty && 'contact'.tr() != 'contact' ? 'contact'.tr() : 'Contact', style: AppTypography.body100.copyWith(color: AppColors.grey400)),
                    onTap: () async {
                      final url = Uri.parse('tel:$_contactPhone');
                      if (await canLaunchUrl(url)) await launchUrl(url);
                    },
                  ),
                  const Divider(color: AppColors.grey50),
                ],
                if (_contactEmail.isNotEmpty) ...[
                  ListTile(
                    leading: const Icon(Icons.email_rounded, color: AppColors.primary500),
                    title: Text(_contactEmail, style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.bold)),
                    subtitle: const Text('Email', style: TextStyle(color: AppColors.grey400, fontSize: 12)),
                    onTap: () async {
                      final url = Uri.parse('mailto:$_contactEmail');
                      if (await canLaunchUrl(url)) await launchUrl(url);
                    },
                  ),
                  const Divider(color: AppColors.grey50),
                ],
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    if (_socialInstagram.isNotEmpty)
                      _buildSocialIcon(Icons.camera_alt_rounded, 'Instagram', _socialInstagram),
                    if (_socialTiktok.isNotEmpty)
                      _buildSocialIcon(Icons.video_library_rounded, 'TikTok', _socialTiktok),
                    if (_socialYoutube.isNotEmpty)
                      _buildSocialIcon(Icons.video_collection_rounded, 'YouTube', _socialYoutube),
                    if (_socialX.isNotEmpty)
                      _buildSocialIcon(Icons.close_rounded, 'Twitter', _socialX),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSocialIcon(IconData icon, String tooltip, String urlStr) {
    return Tooltip(
      message: tooltip,
      child: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary500.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.link, color: AppColors.primary500, size: 24),
        ),
        onPressed: () async {
          final url = Uri.tryParse(urlStr);
          if (url != null && await canLaunchUrl(url)) {
            await launchUrl(url, mode: LaunchMode.externalApplication);
          }
        },
      ),
    );
  }
}

class _VenueImageLightbox extends StatefulWidget {
  const _VenueImageLightbox({required this.images, required this.initialIndex});

  final List<String> images;
  final int initialIndex;

  @override
  State<_VenueImageLightbox> createState() => _VenueImageLightboxState();
}

class _VenueImageLightboxState extends State<_VenueImageLightbox> {
  late final PageController _controller;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _controller = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            onPageChanged: (i) => setState(() => _index = i),
            itemCount: widget.images.length,
            itemBuilder: (context, index) {
              return InteractiveViewer(
                minScale: 0.9,
                maxScale: 3,
                child: Center(
                  child: ChainedNetworkImage(
                    urls: ChainedNetworkImage.chainFrom(widget.images[index], null, w: 1400),
                    fit: BoxFit.contain,
                  ),
                ),
              );
            },
          ),
          Positioned(
            top: 8,
            right: 8,
            child: IconButton(
              icon: const Icon(Icons.close, color: AppColors.white, size: 28),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          if (widget.images.length > 1)
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Text(
                '${_index + 1} / ${widget.images.length}',
                textAlign: TextAlign.center,
                style: AppTypography.body200.copyWith(color: AppColors.white, fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;

  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return ColoredBox(
      color: AppColors.white,
      child: Align(
        alignment: Alignment.centerLeft,
        child: _tabBar,
      ),
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
