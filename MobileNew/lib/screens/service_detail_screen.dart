import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../models/booking_cart_line.dart';
import '../models/venue_listing.dart';
import '../utils/default_venue_hero.dart';
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
  final List<int> _selectedServices = [];
  bool _isFavorite = false;

  List<Map<String, dynamic>> get _mockServices => [
        {
          'id': 1,
          'name': 'servWomenCut'.tr(),
          'desc': 'servWomenCutDesc'.tr(),
          'time': '60 min',
          'price': r'$65.00',
          'tag': 'Todos',
          // Unsplash photo id (no "photo-" prefix) — women's cut & style
          'img': '1560066984-138dadb4c035',
        },
        {
          'id': 2,
          'name': 'servMenCut'.tr(),
          'desc': 'servMenCutDesc'.tr(),
          'time': '45 min',
          'price': r'$35.00',
          'tag': 'Más vendidos',
          'img': '1585747860715-2ba37e788b70',
        },
        {
          'id': 3,
          'name': 'servColor'.tr(),
          'desc': 'servColorDesc'.tr(),
          'time': '3-4 h',
          'price': r'$120.00',
          'tag': 'Promociones',
          'img': '1522338245355-da2d9cf0e458',
        },
        {
          'id': 4,
          'name': 'servHighlights'.tr(),
          'desc': 'servHighlightsDesc'.tr(),
          'time': '2 h',
          'price': r'$140.00',
          'tag': 'Todos',
          'img': '1516975085674-ae34bacd42a0',
        },
      ];

  List<Map<String, dynamic>> get _mockTeam => [
        {'id': 1, 'name': 'Mateo Ríos', 'role': 'roleSenior'.tr(), 'rating': '4.8', 'img': '1503951914875-452162b0f3f1'},
        {'id': 2, 'name': 'Sofia Lara', 'role': 'roleColorist'.tr(), 'rating': '4.9', 'img': '1494790108377-be9c29b29330'},
        {'id': 3, 'name': 'Daniel Vera', 'role': 'roleMaster'.tr(), 'rating': '4.5', 'img': '1500648767791-00dcc994a43e'},
        {'id': 4, 'name': 'Elena Soler', 'role': 'roleManicurist'.tr(), 'rating': '4.2', 'img': '1522337660859-02fbefca4702'},
      ];

  String get _venueName => widget.listing?.name ?? 'Euphoria Spa & Beauty Lounge';

  String get _heroImageUrl => widget.listing?.heroImageUrl ?? DefaultVenueHero.imageUrl();

  String get _ratingDisplay => widget.listing?.rating ?? '4.9';

  String get _reviewsCount => widget.listing?.reviews ?? '217';

  String get _distanceLabel => widget.listing?.distanceLabel ?? '0.5 km';

  Map<String, dynamic> get _venueMap => {
        'name': _venueName,
        'img': widget.listing?.unsplashImgId ?? '',
        'imageUrl': _heroImageUrl,
      };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
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
          onPressed: () => setState(() => _isFavorite = !_isFavorite),
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
              const Icon(Icons.location_on_outlined, color: AppColors.grey300, size: 18),
              const SizedBox(width: 4),
              Text(_distanceLabel, style: AppTypography.body200.copyWith(color: AppColors.grey900)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'venueHeroBlurb'.tr(),
            style: AppTypography.body200.copyWith(color: AppColors.grey600, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesTab() {
    return CustomScrollView(
      key: const PageStorageKey<String>('venue_tab_services'),
      primary: false,
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(20),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final s = _mockServices[index];
                return Padding(
                  padding: EdgeInsets.only(bottom: index < _mockServices.length - 1 ? 20 : 0),
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
                            urls: ChainedNetworkImage.urlsForUnsplashId(s['img'] as String?, w: 400),
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
                                        final id = s['id'] as int;
                                        if (_selectedServices.contains(id)) {
                                          _selectedServices.remove(id);
                                        } else {
                                          _selectedServices.add(id);
                                        }
                                      });
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: _selectedServices.contains(s['id'] as int)
                                          ? AppColors.grey900
                                          : AppColors.primary500,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                    ),
                                    child: Text(
                                      _selectedServices.contains(s['id'] as int)
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
              childCount: _mockServices.length,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTeamTab() {
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
                final m = _mockTeam[index];
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
                            urls: ChainedNetworkImage.urlsForUnsplashId(m['img'] as String?, w: 400),
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
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.star, color: Colors.amber, size: 12),
                                const SizedBox(width: 4),
                                Text(m['rating'] as String, style: AppTypography.heading200),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
              childCount: _mockTeam.length,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewsTab() {
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
                _buildReviewCard(
                  'Lucía Fernández',
                  'Hace 2 días',
                  5,
                  'Fui por un balayage y quedé encantada. El trato de Mateo es excepcional y los productos que usan son de primer nivel. El ambiente del salón es súper relajante.',
                ),
                _buildReviewCard(
                  'Roberto Gómez',
                  'Hace 1 semana',
                  5,
                  'Excelente servicio de barbería. Muy profesional y detallista. Definitivamente volveré.',
                ),
                _buildReviewCard(
                  'Ana Martínez',
                  'Hace 2 semanas',
                  4,
                  'Me encantó el resultado del tinte, aunque tuve que esperar un poco más de lo previsto para ser atendida.',
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
    final amenities = [
      {'icon': Icons.wifi, 'label': 'amWifi'.tr()},
      {'icon': Icons.local_parking, 'label': 'amParking'.tr()},
      {'icon': Icons.coffee, 'label': 'amCoffee'.tr()},
      {'icon': Icons.ac_unit, 'label': 'amAC'.tr()},
      {'icon': Icons.credit_card, 'label': 'amCards'.tr()},
      {'icon': Icons.child_care, 'label': 'amKids'.tr()},
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
                final a = amenities[index];
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
                      Icon(a['icon'] as IconData, color: AppColors.primary500, size: 18),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          a['label'] as String,
                          style: AppTypography.heading100.copyWith(color: AppColors.grey900),
                        ),
                      ),
                    ],
                  ),
                );
              },
              childCount: amenities.length,
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
            onPressed: _selectedServices.isEmpty
                ? null
                : () {
                    final lines = _mockServices
                        .where((s) => _selectedServices.contains(s['id'] as int))
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
              elevation: _selectedServices.isEmpty ? 0 : 8,
              shadowColor: _selectedServices.isEmpty ? Colors.transparent : AppColors.primary500.withValues(alpha: 0.4),
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
