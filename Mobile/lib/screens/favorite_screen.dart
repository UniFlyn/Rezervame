import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/category_chips.dart';
import '../widgets/chained_network_image.dart';
import '../widgets/list_pagination_bar.dart';
import 'service_detail_screen.dart';

/// Favorites: search, category chips, list (hero image + price pill) or 2-column grid — product reference layout.
class FavoriteScreen extends StatefulWidget {
  const FavoriteScreen({super.key, this.isActive = false});

  /// When the bottom-nav Favorites tab is selected (IndexedStack keeps state alive).
  final bool isActive;

  static const double _horizontalPad = 20;

  @override
  State<FavoriteScreen> createState() => FavoriteScreenState();
}

class FavoriteScreenState extends State<FavoriteScreen> {

  final ApiRepository _repo = ApiRepository();
  final TextEditingController _searchController = TextEditingController();
  int _chipIndex = 0;
  bool _gridView = false;
  bool _loading = true;
  bool _loggedIn = false;
  String? _loadError;
  List<VenueListing> _dynamicFavorites = [];
  String _sortMode = 'name';
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  static const int _pageSize = 12;

  List<CategoryChipOption> _categoryChips = [
    CategoryChipOption(key: null, label: 'All Service'),
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadFavorites();
  }

  Future<void> _loadCategories() async {
    final rows = await _repo.fetchPublicCategories();
    if (!mounted) return;
    final isEn = context.locale.languageCode == 'en';
    setState(() {
      _categoryChips = buildCategoryChipOptions(
        rows,
        isEnglish: isEn,
        allLabel: 'searchChipAll'.tr(),
      );
      _chipIndex = _chipIndex.clamp(0, _categoryChips.length - 1);
    });
  }

  @override
  void didUpdateWidget(FavoriteScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _loadFavorites();
    }
  }

  void reload() => _loadFavorites();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadFavorites({int? page}) async {
    final nextPage = page ?? _page;
    setState(() {
      _loading = true;
      _loadError = null;
      _page = nextPage;
    });
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) {
      if (mounted) {
        setState(() {
          _loggedIn = false;
          _dynamicFavorites = [];
          _loading = false;
        });
      }
      return;
    }
    try {
      final chipKey = _chipIndex >= 0 && _chipIndex < _categoryChips.length
          ? _categoryChips[_chipIndex].key
          : null;
      final res = await _repo.fetchFavoriteVenueMaps(
        page: nextPage,
        limit: _pageSize,
        search: _searchController.text.trim(),
        category: chipKey,
      );
      final list = (res['data'] as List<Map<String, dynamic>>?) ?? [];
      final listings = list.map((m) => VenueListing.fromFavoriteMap(m)).toList();
      if (mounted) {
        setState(() {
          _loggedIn = true;
          _dynamicFavorites = listings;
          _total = (res['total'] as int?) ?? listings.length;
          _totalPages = (res['totalPages'] as int?) ?? 1;
          _loadError = null;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loggedIn = true;
          _dynamicFavorites = [];
          _loadError = e.toString().replaceAll('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  void _reloadFavorites({int page = 1}) => _loadFavorites(page: page);

  List<VenueListing> _filtered(BuildContext context) {
    if (!_loggedIn) return const [];
    return _dynamicFavorites
      ..sort((a, b) {
        switch (_sortMode) {
          case 'rating':
            final ar = double.tryParse(a.rating) ?? 0;
            final br = double.tryParse(b.rating) ?? 0;
            return br.compareTo(ar);
          case 'price':
            final ap = double.tryParse(a.price.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0;
            final bp = double.tryParse(b.price.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0;
            return ap.compareTo(bp);
          case 'name':
          default:
            return a.name.compareTo(b.name);
        }
      });
  }

  void _openDetail(VenueListing listing) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(builder: (context) => ServiceDetailScreen(listing: listing)),
    ).then((_) => _loadFavorites());
  }

  Future<void> _toggleFavorite(String? businessId) async {
    if (businessId == null) return;
    try {
      final ok = await _repo.removeFavorite(businessId);
      if (ok) {
        _loadFavorites();
      }
    } catch (e) {
      // Handle error
    }
  }

  void _showMoreMenu() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.sort_rounded, color: AppColors.grey900),
                title: Text('Sort by name', style: AppTypography.body200.copyWith(color: AppColors.grey900)),
                onTap: () {
                  setState(() => _sortMode = 'name');
                  Navigator.pop(ctx);
                },
              ),
              ListTile(
                leading: const Icon(Icons.star_outline_rounded, color: AppColors.grey900),
                title: Text('Sort by rating', style: AppTypography.body200.copyWith(color: AppColors.grey900)),
                onTap: () {
                  setState(() => _sortMode = 'rating');
                  Navigator.pop(ctx);
                },
              ),
              ListTile(
                leading: const Icon(Icons.attach_money_rounded, color: AppColors.grey900),
                title: Text('Sort by price', style: AppTypography.body200.copyWith(color: AppColors.grey900)),
                onTap: () {
                  setState(() => _sortMode = 'price');
                  Navigator.pop(ctx);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canPop = Navigator.canPop(context);
    final filtered = _filtered(context);

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        automaticallyImplyLeading: false,
        centerTitle: true,
        leadingWidth: 56,
        leading: Padding(
          padding: const EdgeInsets.only(left: 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: canPop
                ? Material(
                    color: AppColors.white,
                    elevation: 3,
                    shadowColor: AppColors.black.withValues(alpha: 0.12),
                    shape: const CircleBorder(),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => Navigator.of(context).maybePop(),
                      child: const SizedBox(
                        width: 40,
                        height: 40,
                        child: Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 18),
                      ),
                    ),
                  )
                : const SizedBox(width: 40, height: 40),
          ),
        ),
        title: Text(
          'favoriteScreenTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
        actions: [
          IconButton(
            onPressed: () => setState(() => _gridView = !_gridView),
            icon: Icon(
              _gridView ? Icons.view_list_rounded : Icons.grid_view_rounded,
              color: AppColors.grey900,
            ),
          ),
          IconButton(
            onPressed: _showMoreMenu,
            icon: const Icon(Icons.more_vert_rounded, color: AppColors.grey900),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadFavorites,
        color: AppColors.primary500,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary500),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(FavoriteScreen._horizontalPad, 4, FavoriteScreen._horizontalPad, 12),
                    child: TextField(
                      controller: _searchController,
                      onSubmitted: (_) => _reloadFavorites(page: 1),
                      style: AppTypography.body200.copyWith(color: AppColors.grey900),
                      decoration: InputDecoration(
                        hintText: 'searchFieldHint'.tr(),
                        hintStyle: AppTypography.body200.copyWith(color: AppColors.grey400),
                        prefixIcon: const Icon(Icons.search_rounded, color: AppColors.grey400, size: 22),
                        filled: true,
                        fillColor: AppColors.grey25,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.grey200),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: FavoriteScreen._horizontalPad),
                      scrollDirection: Axis.horizontal,
                      itemCount: _categoryChips.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (context, i) {
                        final selected = _chipIndex == i;
                        return ChoiceChip(
                          label: Text(
                            _categoryChips[i].label,
                            style: AppTypography.body100.copyWith(
                              color: selected ? AppColors.white : AppColors.grey600,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          selected: selected,
                          onSelected: (_) {
                            setState(() => _chipIndex = i);
                            _reloadFavorites(page: 1);
                          },
                          backgroundColor: AppColors.white,
                          selectedColor: AppColors.primary500,
                          side: BorderSide(color: selected ? AppColors.primary500 : AppColors.grey200),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                          showCheckmark: false,
                          labelPadding: EdgeInsets.zero,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: filtered.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(top: 80, left: 24, right: 24),
                                child: Column(
                                  children: [
                                    Icon(
                                      _loggedIn ? Icons.favorite_border : Icons.lock_outline,
                                      size: 80,
                                      color: AppColors.grey100,
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      !_loggedIn
                                          ? 'favoritesSignIn'.tr()
                                          : _loadError != null
                                              ? _loadError!
                                              : _dynamicFavorites.isNotEmpty
                                                  ? 'favNoResults'.tr()
                                                  : 'noFavorites'.tr(),
                                      textAlign: TextAlign.center,
                                      style: AppTypography.body200.copyWith(color: AppColors.grey400),
                                    ),
                                    if (_loadError != null) ...[
                                      const SizedBox(height: 16),
                                      TextButton(
                                        onPressed: _loadFavorites,
                                        child: Text('tryAgain'.tr()),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          )
                        : _gridView
                            ? GridView.builder(
                                padding: const EdgeInsets.fromLTRB(
                                  FavoriteScreen._horizontalPad,
                                  0,
                                  FavoriteScreen._horizontalPad,
                                  24,
                                ),
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  mainAxisSpacing: 14,
                                  crossAxisSpacing: 12,
                                  childAspectRatio: 0.62,
                                ),
                                itemCount: filtered.length,
                                itemBuilder: (context, index) {
                                  return _FavoriteGridCard(
                                    listing: filtered[index],
                                    onTap: () => _openDetail(filtered[index]),
                                    onFavoritePressed: () => _toggleFavorite(filtered[index].businessId),
                                    isLoggedIn: _loggedIn,
                                  );
                                },
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.fromLTRB(
                                  FavoriteScreen._horizontalPad,
                                  0,
                                  FavoriteScreen._horizontalPad,
                                  24,
                                ),
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 16),
                                itemBuilder: (context, index) {
                                  return _FavoriteListHeroCard(
                                    listing: filtered[index],
                                    onTap: () => _openDetail(filtered[index]),
                                    onFavoritePressed: () => _toggleFavorite(filtered[index].businessId),
                                    isLoggedIn: _loggedIn,
                                  );
                                },
                              ),
                  ),
                  ListPaginationBar(
                    page: _page,
                    totalPages: _totalPages,
                    total: _total,
                    onPageChange: (p) => _reloadFavorites(page: p),
                  ),
                ],
              ),
      ),
    );
  }
}

class _FavoriteListHeroCard extends StatelessWidget {
  const _FavoriteListHeroCard({
    required this.listing,
    required this.onTap,
    required this.onFavoritePressed,
    required this.isLoggedIn,
  });

  final VenueListing listing;
  final VoidCallback onTap;
  final VoidCallback onFavoritePressed;
  final bool isLoggedIn;

  static const Color _heartRed = Color(0xFFE53935);

  @override
  Widget build(BuildContext context) {
    final categoryLabel = listing.categoryKey.tr();
    final reviewsLabel = '(${listing.reviews})';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.grey100),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withValues(alpha: 0.06),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                child: AspectRatio(
                  aspectRatio: 16 / 10,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ChainedNetworkImage(
                        urls: listing.imageUrlChain.isNotEmpty
                            ? listing.imageUrlChain
                            : ChainedNetworkImage.chainFrom(listing.listImageUrl, listing.unsplashImgId, w: 900),
                        fit: BoxFit.cover,
                      ),
                      Positioned(
                        top: 10,
                        right: 10,
                        child: GestureDetector(
                          onTap: onFavoritePressed,
                          child: Icon(
                            isLoggedIn ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                            color: isLoggedIn ? _heartRed : AppColors.white,
                            size: 26,
                            shadows: _iconShadow,
                          ),
                        ),
                      ),
                      Positioned(
                        right: 10,
                        bottom: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primary500,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            listing.price,
                            style: AppTypography.heading200.copyWith(color: AppColors.white, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            categoryLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.body200.copyWith(color: AppColors.grey600, fontWeight: FontWeight.w600),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          child: Text('·', style: AppTypography.body200.copyWith(color: AppColors.grey400)),
                        ),
                        const Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 16),
                        const SizedBox(width: 4),
                        Text(
                          listing.rating,
                          style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          ' $reviewsLabel',
                          style: AppTypography.body200.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      listing.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.sectionTitle.copyWith(
                        color: AppColors.grey900,
                        fontWeight: FontWeight.w800,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 16, color: AppColors.grey400),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            listing.locationLabel,
                            style: AppTypography.body200.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w500),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
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
      ),
    );
  }

  static const List<Shadow> _iconShadow = [
    Shadow(color: Colors.black54, blurRadius: 6, offset: Offset(0, 1)),
  ];
}

class _FavoriteGridCard extends StatelessWidget {
  const _FavoriteGridCard({
    required this.listing,
    required this.onTap,
    required this.onFavoritePressed,
    required this.isLoggedIn,
  });

  final VenueListing listing;
  final VoidCallback onTap;
  final VoidCallback onFavoritePressed;
  final bool isLoggedIn;

  static const Color _heartRed = Color(0xFFE53935);

  @override
  Widget build(BuildContext context) {
    final reviewsLabel = '(${listing.reviews})';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.grey100),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ChainedNetworkImage(
                        urls: listing.imageUrlChain.isNotEmpty
                            ? listing.imageUrlChain
                            : ChainedNetworkImage.chainFrom(listing.listImageUrl, listing.unsplashImgId, w: 500),
                        fit: BoxFit.cover,
                      ),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: onFavoritePressed,
                          child: Icon(
                            isLoggedIn ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                            color: isLoggedIn ? _heartRed : AppColors.white,
                            size: 22,
                            shadows: _FavoriteListHeroCard._iconShadow,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      listing.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.heading200.copyWith(
                        color: AppColors.grey900,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          listing.price,
                          style: AppTypography.heading200.copyWith(
                            color: AppColors.primary500,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const Spacer(),
                        const Icon(Icons.star_rounded, color: Color(0xFFFFC107), size: 14),
                        const SizedBox(width: 2),
                        Text(
                          listing.rating,
                          style: AppTypography.body100.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          ' $reviewsLabel',
                          style: AppTypography.body100.copyWith(color: AppColors.grey500),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
