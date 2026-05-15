import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../models/booking_cart_line.dart';
import '../models/venue_listing.dart';
import '../utils/amenity_icons.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';
import 'booking_calendar_screen.dart';
import 'write_review_screen.dart';

/// Venue / business details — content parity with [Mobile/lib/screens/venue_details_screen.dart],
/// styled with MobileNew [AppColors] / [AppTypography].
class ServiceDetailScreen extends StatefulWidget {
  const ServiceDetailScreen({super.key, this.listing});

  final VenueListing? listing;

  @override
  State<ServiceDetailScreen> createState() => _ServiceDetailScreenState();
}

class _ServiceDetailScreenState extends State<ServiceDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Set<String> _selectedServiceIds = {};
  bool _isFavorite = false;

  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _team = [];
  List<Map<String, dynamic>> _reviewRows = [];
  String _venueDescription = '';
  bool _detailLoading = true;
  String? _detailError;
  String? _profileBannerUrl;
  List<Map<String, dynamic>> _amenityRows = [];
  String _profileRating = '';
  String _profileReviews = '';
  String _profileDistance = '';

  String get _venueName => widget.listing?.name ?? '';

  String get _heroImageUrl {
    final u = (_profileBannerUrl ?? '').trim();
    if (u.isNotEmpty && !u.startsWith('data:')) return u;
    return widget.listing?.heroImageUrl ?? '';
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

  Map<String, dynamic> get _venueMap => {
        'name': _venueName,
        'img': widget.listing?.unsplashImgId ?? '',
        'imageUrl': _heroImageUrl,
      };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadVenueDetail());
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
      ]);
      final prof = results[0] as Map<String, dynamic>?;
      final svc = results[1] as List<Map<String, dynamic>>;
      final staff = results[2] as List<Map<String, dynamic>>;
      final rev = results[3] as List<Map<String, dynamic>>;
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
        _services = svc.map((s) {
          final id = '${s['id']}';
          final price = (s['price'] as num?) ?? 0;
          final dur = (s['duration'] as num?)?.toInt() ?? 30;
          final img = '${s['imageUrl'] ?? ''}'.trim();
          return {
            'id': id,
            'name': '${s['name']}',
            'desc': '${s['category']}',
            'time': '$dur min',
            'price': '\$${price.toStringAsFixed(2)}',
            'tag': 'Todos',
            'imageUrl': img,
          };
        }).toList();
        _team = staff.map((m) {
          final img = '${m['image'] ?? ''}'.trim();
          return {
            'id': '${m['id']}',
            'name': '${m['name']}',
            'role': '${m['role']}',
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
    final favs = await ApiRepository().fetchFavoriteVenueMaps();
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
    _tabController.dispose();
    super.dispose();
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
                  tabs: [
                    Tab(text: 'venueServicios'.tr()),
                  Tab(text: 'venueEquipo'.tr()),
                  Tab(text: 'venueReseñas'.tr()),
                  Tab(text: 'venueAmenidades'.tr()),
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
            _buildReviewsTab(),
            _buildAmenitiesTab(),
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
        background: Stack(
          fit: StackFit.expand,
          children: [
            ChainedNetworkImage(
              urls: ChainedNetworkImage.chainFrom(_heroImageUrl, widget.listing?.unsplashImgId, w: 1200),
              fit: BoxFit.cover,
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.4),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.4),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVenueHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_venueName, style: AppTypography.screenTitle.copyWith(color: AppColors.grey900)),
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
    return CustomScrollView(
      key: const PageStorageKey<String>('venue_tab_services'),
      primary: false,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final s = _services[index];
                return Padding(
                  padding: EdgeInsets.only(bottom: index < _services.length - 1 ? 20 : 0),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.grey50),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.black.withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: ChainedNetworkImage(
                            urls: ChainedNetworkImage.chainFrom(s['imageUrl'] as String?, null, w: 400),
                            width: 92,
                            height: 92,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                      s['name'] as String,
                                      style: AppTypography.heading400,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    s['price'] as String,
                                    style: AppTypography.heading500.copyWith(color: AppColors.primary500),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                s['desc'] as String,
                                style: AppTypography.body100.copyWith(color: AppColors.grey400),
                              ),
                              const SizedBox(height: 14),
                              Row(
                                children: [
                                  const Icon(Icons.access_time, size: 14, color: AppColors.grey300),
                                  const SizedBox(width: 6),
                                  Text(
                                    s['time'] as String,
                                    style: AppTypography.body100.copyWith(color: AppColors.grey400),
                                  ),
                                  const Spacer(),
                                  ElevatedButton(
                                    onPressed: () {
                                      setState(() {
                                        final id = s['id'] as String;
                                        if (_selectedServiceIds.contains(id)) {
                                          _selectedServiceIds.remove(id);
                                        } else {
                                          _selectedServiceIds.add(id);
                                        }
                                      });
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: _selectedServiceIds.contains(s['id'] as String)
                                          ? AppColors.grey900
                                          : AppColors.primary500,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                    ),
                                    child: Text(
                                      _selectedServiceIds.contains(s['id'] as String)
                                          ? 'venueAdded'.tr()
                                          : 'venueAdd'.tr(),
                                      style: AppTypography.heading100.copyWith(color: AppColors.white),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
              childCount: _services.length,
            ),
          ),
        ),
      ],
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
          padding: const EdgeInsets.all(20),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.75,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final m = _team[index];
                return Container(
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(16),
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
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          child: ChainedNetworkImage(
                            urls: ChainedNetworkImage.chainFrom(m['imageUrl'] as String?, null, w: 400),
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          children: [
                            Text(
                              m['name'] as String,
                              style: AppTypography.heading300,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              m['role'] as String,
                              style: AppTypography.heading100.copyWith(color: AppColors.primary500),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
              childCount: _team.length,
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
                          MaterialPageRoute<void>(
                            builder: (context) => WriteReviewScreen(venue: _venueMap),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.grey900, width: 2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                      child: Text(
                        'venueWriteReview'.tr(),
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
    final lang = context.locale.languageCode;
    final tiles = _amenityRows.isNotEmpty
        ? _amenityRows.map((a) {
            final label = lang == 'es'
                ? ('${a['labelEs'] ?? a['labelEn'] ?? a['key'] ?? ''}'.trim())
                : ('${a['labelEn'] ?? a['labelEs'] ?? a['key'] ?? ''}'.trim());
            return {'key': '${a['key']}', 'label': label};
          }).toList()
        : [
            {'key': 'wifi', 'label': 'amWifi'.tr()},
            {'key': 'parking', 'label': 'amParking'.tr()},
            {'key': 'coffee', 'label': 'amCoffee'.tr()},
            {'key': 'ac', 'label': 'amAC'.tr()},
            {'key': 'card_payment', 'label': 'amCards'.tr()},
            {'key': 'kids_friendly', 'label': 'amKids'.tr()},
          ];

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
          child: ElevatedButton(
            onPressed: _selectedServiceIds.isEmpty
                ? null
                : () {
                    final lines = _services
                        .where((s) => _selectedServiceIds.contains(s['id'] as String))
                        .map(
                          (s) => BookingCartLine(
                            id: '${s['id']}',
                            name: s['name'] as String,
                            durationLabel: s['time'] as String,
                            priceLabel: s['price'] as String,
                            priceValue: BookingCartLine.parsePriceLabel(s['price'] as String),
                          ),
                        )
                        .toList();
                    Navigator.push<void>(
                      context,
                      MaterialPageRoute<void>(
                        builder: (context) => BookingCalendarScreen(
                          venueName: _venueName,
                          heroImageUrl: _heroImageUrl,
                          cartLines: lines,
                          specialistNames: _team.map((m) => '${m['name']}').where((s) => s.isNotEmpty).toList(),
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
    return ColoredBox(color: AppColors.white, child: _tabBar);
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
