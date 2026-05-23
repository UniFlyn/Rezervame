import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/category_chips.dart';
import '../utils/image_url.dart';
import '../widgets/chained_network_image.dart';
import '../widgets/list_pagination_bar.dart';
import 'login_screen.dart';
import 'service_detail_screen.dart';

/// Search results: bar with in-field filter, chips, recommendation hero, 2-col grid.
class SearchResultsScreen extends StatefulWidget {
  const SearchResultsScreen({
    super.key,
    this.categoryKey,
    this.category,
    this.initialQuery,
    this.onlyFeatured = false,
    this.showBackButton = true,
  });

  /// Locale-agnostic key matching [VenueListing.categoryKey] chips (`hairService`, `spaService`, …).
  /// Selects the correct category chip without relying on translated labels.
  final String? categoryKey;

  /// Pre-filled search text (legacy: translated category label). Prefer [categoryKey] from home.
  final String? category;

  /// Query from search hub submit.
  final String? initialQuery;

  final bool onlyFeatured;
  final bool showBackButton;

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  final ApiRepository _api = ApiRepository();
  late final TextEditingController _searchController;
  int _selectedChipIndex = 0;

  double? _appliedMinPrice;
  double? _appliedMaxPrice;
  double? _appliedMinRating;
  String _appliedLocation = '';
  int _appliedSheetCategoryIndex = 0;
  String _sortBy = 'ratingHighLow';
  bool _showMap = false;
  final Set<String> _favoriteBusinessIds = {};

  List<Map<String, dynamic>> _sourceResults = [];
  List<Map<String, dynamic>> _filteredResults = [];
  bool _catalogLoading = true;
  int _currentPage = 1;
  int _totalPages = 1;
  int _total = 0;

  List<CategoryChipOption> _categoryChips = [
    CategoryChipOption(key: null, label: 'All Service'),
  ];
  Map<String, String> _categoryPlaceholders = {};

  String? get _activeCategoryKey {
    if (_selectedChipIndex < 0 || _selectedChipIndex >= _categoryChips.length) return null;
    return _categoryChips[_selectedChipIndex].key;
  }

  @override
  void initState() {
    super.initState();
    final q = widget.initialQuery?.trim();
    final String initial;
    if (q != null && q.isNotEmpty) {
      initial = q;
    } else if (widget.categoryKey != null && widget.categoryKey!.trim().isNotEmpty) {
      initial = '';
    } else {
      initial = widget.category ?? '';
    }
    _searchController = TextEditingController(text: initial);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadFavorites();
      _loadCategories().then((_) {
        if (widget.categoryKey != null && widget.categoryKey!.trim().isNotEmpty) {
          _syncChipFromCategoryKey();
        } else {
          _syncChipFromCategoryParam();
        }
        _bootstrapCatalog();
      });
    });
  }

  Future<void> _loadCategories() async {
    final rows = await _api.fetchPublicCategories();
    if (!mounted) return;
    final isEn = context.locale.languageCode == 'en';
    setState(() {
      _categoryChips = buildCategoryChipOptions(
        rows,
        isEnglish: isEn,
        allLabel: 'searchChipAll'.tr(),
      );
      _categoryPlaceholders = categoryPlaceholderUrls(rows);
      _selectedChipIndex = _selectedChipIndex.clamp(0, _categoryChips.length - 1);
    });
  }

  Future<void> _loadFavorites() async {
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) return;
    final res = await _api.fetchFavoriteVenueMaps(page: 1, limit: 200);
    final maps = (res['data'] as List<Map<String, dynamic>>?) ?? [];
    if (!mounted) return;
    setState(() {
      _favoriteBusinessIds
        ..clear()
        ..addAll(
          maps.map((m) => '${m['businessId'] ?? m['id'] ?? ''}').where((id) => id.isNotEmpty),
        );
    });
  }

  Future<void> _toggleFavorite(String businessId) async {
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      Navigator.push<void>(context, MaterialPageRoute<void>(builder: (context) => const LoginScreen()));
      return;
    }
    final isFav = _favoriteBusinessIds.contains(businessId);
    final ok = isFav ? await _api.removeFavorite(businessId) : await _api.addFavorite(businessId);
    if (!ok || !mounted) return;
    setState(() {
      if (isFav) {
        _favoriteBusinessIds.remove(businessId);
      } else {
        _favoriteBusinessIds.add(businessId);
      }
    });
  }

  Future<void> _bootstrapCatalog({int? page}) async {
    final nextPage = page ?? _currentPage;
    setState(() {
      _catalogLoading = true;
      if (page != null) _currentPage = page;
    });

    final query = _searchController.text.trim();
    final categoryKey = _activeCategoryKey;

    final res = await _api.searchVenues(
      page: nextPage,
      search: query,
      category: categoryKey,
      sortBy: _sortBy,
      minRating: _appliedMinRating,
    );

    if (!mounted) return;

    setState(() {
      final List<VenueListing> venues = res['data'] as List<VenueListing>;
      final List<Map<String, dynamic>> mapped = venues.map((v) => v.toSearchMap()).toList();
      _currentPage = nextPage;
      _sourceResults = mapped;
      _total = (res['total'] as int?) ?? mapped.length;
      _totalPages = res['totalPages'] ?? 1;
      _catalogLoading = false;
    });
    _applyFilter();
  }

  void _goToPage(int page) {
    if (page < 1 || page > _totalPages || _catalogLoading) return;
    _bootstrapCatalog(page: page);
  }

  void _triggerSearch() {
    setState(() => _currentPage = 1);
    _bootstrapCatalog(page: 1);
  }

  void _syncChipFromCategoryKey() {
    final raw = widget.categoryKey?.trim();
    if (raw == null || raw.isEmpty) return;
    for (var i = 0; i < _categoryChips.length; i++) {
      if (_categoryChips[i].key == raw) {
        _selectedChipIndex = i;
        return;
      }
    }
  }

  void _syncChipFromCategoryParam() {
    final c = widget.category?.trim();
    if (c == null || c.isEmpty) return;
    for (var i = 0; i < _categoryChips.length; i++) {
      if (_categoryChips[i].label == c) {
        _selectedChipIndex = i;
        return;
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  double? _parsePrice(String raw) {
    final t = raw.replaceAll(RegExp(r'[^\d.]'), '');
    if (t.isEmpty) return null;
    return double.tryParse(t);
  }

  void _applyFilter() {
    var results = List<Map<String, dynamic>>.from(_sourceResults);

    if (widget.onlyFeatured) {
      results = results.where((r) => double.parse(r['rating'] as String) >= 4.8).toList();
    }

    final q = _searchController.text.trim().toLowerCase();
    if (q.isNotEmpty) {
      results = results.where((r) {
        final name = r['name'].toString().toLowerCase();
        final catKey = r['category'] as String;
        final translatedCat = catKey.tr().toLowerCase();
        return name.contains(q) || translatedCat.contains(q) || catKey.toLowerCase().contains(q);
      }).toList();
    }

    if (_appliedMinPrice != null) {
      results = results
          .where((r) => (_parsePrice(r['price'] as String) ?? 0) >= _appliedMinPrice!)
          .toList();
    }
    if (_appliedMaxPrice != null) {
      results = results
          .where((r) => (_parsePrice(r['price'] as String) ?? double.infinity) <= _appliedMaxPrice!)
          .toList();
    }

    if (_appliedLocation.isNotEmpty) {
      results = results
          .where((r) => (r['locationLabel'] as String? ?? '').trim() == _appliedLocation.trim())
          .toList();
    }

    setState(() => _filteredResults = results);
  }

  String _businessIdFor(Map<String, dynamic> res) {
    final bid = res['businessId'] as String?;
    if (bid != null && bid.isNotEmpty) return bid;
    return '${res['id']}';
  }

  void _showSortSheet() {
    const options = <String, String>{
      'ratingHighLow': 'Highest rated',
      'newest': 'Newest',
      'priceLowHigh': 'Price: low to high',
      'priceHighLow': 'Price: high to low',
      'distance': 'Nearest',
    };
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: options.entries
              .map(
                (e) => ListTile(
                  title: Text(e.value),
                  trailing: _sortBy == e.key ? const Icon(Icons.check, color: AppColors.primary500) : null,
                  onTap: () {
                    Navigator.pop(ctx);
                    setState(() => _sortBy = e.key);
                    _triggerSearch();
                  },
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  Widget _buildMapPanel() {
    final markers = <Marker>[];
    for (final r in _filteredResults) {
      final lat = (r['lat'] as num?)?.toDouble();
      final lng = (r['lng'] as num?)?.toDouble();
      if (lat == null || lng == null) continue;
      markers.add(
        Marker(
          point: LatLng(lat, lng),
          width: 44,
          height: 44,
          child: GestureDetector(
            onTap: () => _openDetail(r),
            child: const Icon(Icons.location_on, color: AppColors.primary500, size: 36),
          ),
        ),
      );
    }
    final center = markers.isNotEmpty
        ? markers.first.point
        : const LatLng(8.9824, -79.5199);

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: 220,
        child: FlutterMap(
          options: MapOptions(initialCenter: center, initialZoom: 11),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.rezervame.app',
            ),
            MarkerLayer(markers: markers),
          ],
        ),
      ),
    );
  }

  Widget _favoriteButton(Map<String, dynamic> res, {double iconSize = 20}) {
    final bid = _businessIdFor(res);
    final isFav = _favoriteBusinessIds.contains(bid);
    return GestureDetector(
      onTap: () => _toggleFavorite(bid),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
        child: Icon(
          isFav ? Icons.favorite : Icons.favorite_border,
          color: AppColors.primary500,
          size: iconSize,
        ),
      ),
    );
  }

  void _openDetail(Map<String, dynamic> res) {
    final listing = VenueListing.tryFromSearchMap(res);
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => ServiceDetailScreen(listing: listing),
      ),
    );
  }

  List<String> _uniqueLocationLabels() {
    final set = <String>{};
    for (final r in _sourceResults) {
      final loc = (r['locationLabel'] as String?)?.trim();
      if (loc != null && loc.isNotEmpty) set.add(loc);
    }
    final list = set.toList()..sort();
    return list;
  }

  List<String> _imageUrlsForVenue(Map<String, dynamic> res, {int width = 500}) {
    final out = <String>[];
    void add(String? raw) {
      final resolved = resolveMediaUrl(raw);
      if (resolved != null && !out.contains(resolved)) out.add(resolved);
    }
    add(res['serviceImageUrl'] as String?);
    add(res['imageUrl'] as String?);
    final portfolio = res['portfolioImageUrls'];
    if (portfolio is List) {
      for (final img in portfolio) {
        add('$img');
      }
    }
    add(res['bannerUrl'] as String?);
    add(res['logoUrl'] as String?);
    final id = extractUnsplashPhotoId(res['img'] as String?);
    if (id != null) {
      final u = 'https://images.unsplash.com/photo-$id?q=80&w=$width&fit=crop';
      if (!out.contains(u)) out.add(u);
    }
    if (out.isEmpty) {
      final keys = res['categoryKeys'];
      if (keys is List) {
        for (final k in keys) {
          final placeholder = _categoryPlaceholders['$k'.trim()];
          if (placeholder != null) {
            add(placeholder);
            break;
          }
        }
      }
      if (out.isEmpty) {
        final cat = '${res['category'] ?? ''}'.trim();
        final placeholder = _categoryPlaceholders[cat];
        if (placeholder != null) add(placeholder);
      }
    }
    return out;
  }

  Widget _buildCategoryChips() {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _categoryChips.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final selected = _selectedChipIndex == index;
          return Material(
            color: selected ? AppColors.primary500 : AppColors.white,
            borderRadius: BorderRadius.circular(20),
            child: InkWell(
              onTap: () {
                setState(() => _selectedChipIndex = index);
                _triggerSearch();
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: selected ? AppColors.primary500 : AppColors.grey200,
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  _categoryChips[index].label,
                  style: AppTypography.body100.copyWith(
                    color: selected ? AppColors.white : AppColors.grey700,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canPop = widget.showBackButton && Navigator.canPop(context);
    final hero = _filteredResults.isNotEmpty ? _filteredResults.first : null;
    final gridItems = hero == null
        ? _filteredResults
        : _filteredResults.where((e) => e['id'] != hero['id']).toList();

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        toolbarHeight: 72,
        leadingWidth: canPop ? 56 : 16,
        leading: canPop
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
                onPressed: () => Navigator.pop(context),
              )
            : const SizedBox.shrink(),
        titleSpacing: 0,
        title: Padding(
          padding: EdgeInsets.only(right: canPop ? 8 : 16),
          child: Container(
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.grey25,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.grey100),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => _triggerSearch(),
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _triggerSearch(),
              style: AppTypography.body200.copyWith(color: AppColors.grey900),
              decoration: InputDecoration(
                hintText: 'searchPlaceholder'.tr(),
                hintStyle: AppTypography.body200.copyWith(color: AppColors.grey400),
                prefixIcon: Icon(Icons.search_rounded, color: AppColors.grey400, size: 22),
                suffixIcon: IconButton(
                  onPressed: () => _showFilterSheet(context),
                  icon: const Icon(Icons.tune_rounded, color: AppColors.grey700, size: 22),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
            child: Row(
              children: [
                TextButton.icon(
                  onPressed: () => setState(() => _showMap = !_showMap),
                  icon: Icon(_showMap ? Icons.list : Icons.map_outlined, size: 18),
                  label: Text(_showMap ? 'List' : 'Map'),
                ),
                TextButton.icon(
                  onPressed: _showSortSheet,
                  icon: const Icon(Icons.sort, size: 18),
                  label: const Text('Sort'),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: _buildCategoryChips(),
          ),
          Expanded(
            child: _catalogLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
                : _filteredResults.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.search_off_rounded, size: 64, color: AppColors.grey200),
                              const SizedBox(height: 16),
                              Text(
                                _activeCategoryKey != null
                                    ? 'searchNoCategoryResults'.tr()
                                    : 'noResults'.tr(),
                                textAlign: TextAlign.center,
                                style: AppTypography.sectionTitle.copyWith(color: AppColors.grey500),
                              ),
                            ],
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_showMap) ...[
                                _buildMapPanel(),
                                const SizedBox(height: 16),
                              ],
                              if (hero != null) ...[
                    const SizedBox(height: 22),
                    Text(
                      'serviceRecommendation'.tr(),
                      style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                    ),
                    const SizedBox(height: 12),
                    _buildHeroCard(hero),
                  ],
                  const SizedBox(height: 24),
                  Text(
                    'serviceFound'.tr(),
                    style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                  ),
                  const SizedBox(height: 14),
                  if (gridItems.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: Text(
                          'noResults'.tr(),
                          style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey400),
                        ),
                      ),
                    )
                  else
                    LayoutBuilder(
                      builder: (context, constraints) {
                        const gap = 12.0;
                        final w = (constraints.maxWidth - gap) / 2;
                        return Wrap(
                          spacing: gap,
                          runSpacing: gap,
                          children: gridItems
                              .map((r) => SizedBox(width: w, child: _buildGridCard(r)))
                              .toList(),
                        );
                      },
                    ),
                  ListPaginationBar(
                    page: _currentPage,
                    totalPages: _totalPages,
                    total: _total,
                    onPageChange: _goToPage,
                  ),
                            ],
                          ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroCard(Map<String, dynamic> res) {
    final cat = (res['category'] as String).tr();
    final subtitle = '$cat • ${res['rating']} (${res['reviews']}) • ${res['price']}';
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openDetail(res),
        borderRadius: BorderRadius.circular(20),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: SizedBox(
            height: 200,
            width: double.infinity,
            child: Stack(
              fit: StackFit.expand,
              children: [
                ChainedNetworkImage(
                  urls: _imageUrlsForVenue(res, width: 900),
                  fit: BoxFit.cover,
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary500,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'recommendationBadge'.tr(),
                      style: AppTypography.body100.copyWith(color: AppColors.white, fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: _favoriteButton(res),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(16, 32, 16, 16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppColors.black.withValues(alpha: 0.75),
                        ],
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          res['name'] as String,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.navigationTitle.copyWith(color: AppColors.white, height: 1.2),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          subtitle,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.body100.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGridCard(Map<String, dynamic> res) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openDetail(res),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                    child: AspectRatio(
                      aspectRatio: 1.05,
                      child: ChainedNetworkImage(
                        urls: _imageUrlsForVenue(res, width: 400),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _favoriteButton(res, iconSize: 16),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                child: Text(
                  res['name'] as String,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.navigationTitle.copyWith(color: AppColors.grey900, height: 1.25),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _FilterSearchSheet(
        locationOptions: _uniqueLocationLabels(),
        initialLocation: _appliedLocation,
        initialCategoryIndex: _appliedSheetCategoryIndex,
        initialMin: _appliedMinPrice ?? 100,
        initialMax: _appliedMaxPrice ?? 200,
        initialMinRating: _appliedMinRating,
        chipLabels: _categoryChips.map((c) => c.label).toList(),
        onApply: (loc, catIdx, minV, maxV, minRating) {
          Navigator.pop(ctx);
          setState(() {
            _appliedLocation = loc;
            _appliedSheetCategoryIndex = catIdx;
            _selectedChipIndex = catIdx;
            _appliedMinPrice = minV;
            _appliedMaxPrice = maxV;
            _appliedMinRating = minRating;
          });
          _triggerSearch();
        },
      ),
    );
  }
}

class _FilterSearchSheet extends StatefulWidget {
  const _FilterSearchSheet({
    required this.locationOptions,
    required this.initialLocation,
    required this.initialCategoryIndex,
    required this.initialMin,
    required this.initialMax,
    required this.initialMinRating,
    required this.chipLabels,
    required this.onApply,
  });

  final List<String> locationOptions;
  final String initialLocation;
  final int initialCategoryIndex;
  final double initialMin;
  final double initialMax;
  final double? initialMinRating;
  final List<String> chipLabels;
  final void Function(String location, int categoryIndex, double? minPrice, double? maxPrice, double? minRating)
      onApply;

  @override
  State<_FilterSearchSheet> createState() => _FilterSearchSheetState();
}

class _FilterSearchSheetState extends State<_FilterSearchSheet> {
  /// Dropdown index → minimum rating (null = no filter).
  static const List<double?> _ratingThresholds = [null, 4.0, 4.5, 4.8, 5.0];
  static const List<String> _ratingLabelKeys = [
    'ratingFilterAny',
    'ratingFilter40',
    'ratingFilter45',
    'ratingFilter48',
    'ratingFilter50',
  ];

  late String _location;
  late int _categoryIndex;
  late int _ratingOptionIndex;
  late final TextEditingController _minC;
  late final TextEditingController _maxC;

  static int _indexForMinRating(double? min) {
    if (min == null) return 0;
    for (var i = 0; i < _ratingThresholds.length; i++) {
      final t = _ratingThresholds[i];
      if (t != null && (t - min).abs() < 0.001) return i;
    }
    return 0;
  }

  @override
  void initState() {
    super.initState();
    final opts = widget.locationOptions;
    final init = widget.initialLocation.trim();
    if (init.isEmpty || !opts.contains(init)) {
      _location = '';
    } else {
      _location = init;
    }
    _categoryIndex = widget.initialCategoryIndex.clamp(0, widget.chipLabels.length - 1);
    _ratingOptionIndex = _indexForMinRating(widget.initialMinRating).clamp(0, _ratingThresholds.length - 1);
    _minC = TextEditingController(text: widget.initialMin.toStringAsFixed(0));
    _maxC = TextEditingController(text: widget.initialMax.toStringAsFixed(0));
  }

  @override
  void dispose() {
    _minC.dispose();
    _maxC.dispose();
    super.dispose();
  }

  InputDecoration _fieldDeco() {
    return InputDecoration(
      filled: true,
      fillColor: AppColors.grey25,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.78),
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: EdgeInsets.fromLTRB(24, 12, 24, 16 + bottomInset),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.grey200,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'filterSearchTitle'.tr(),
                textAlign: TextAlign.center,
                style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
              ),
              const SizedBox(height: 24),
              Text(
                'locationsLabel'.tr(),
                style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColors.grey25,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: _location.isEmpty
                        ? ''
                        : (widget.locationOptions.contains(_location) ? _location : ''),
                    items: [
                      DropdownMenuItem(
                        value: '',
                        child: Text('filterLocationAll'.tr(), style: AppTypography.body200),
                      ),
                      ...widget.locationOptions.map(
                        (e) => DropdownMenuItem(value: e, child: Text(e, style: AppTypography.body200)),
                      ),
                    ],
                    onChanged: (v) {
                      if (v != null) setState(() => _location = v);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'categoryLabel'.tr(),
                style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColors.grey25,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    isExpanded: true,
                    value: _categoryIndex,
                    items: List.generate(
                      widget.chipLabels.length,
                      (i) => DropdownMenuItem(
                        value: i,
                        child: Text(widget.chipLabels[i], style: AppTypography.body200),
                      ),
                    ),
                    onChanged: (v) {
                      if (v != null) setState(() => _categoryIndex = v);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'minimumRatingLabel'.tr(),
                style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColors.grey25,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    isExpanded: true,
                    value: _ratingOptionIndex,
                    items: List.generate(
                      _ratingThresholds.length,
                      (i) => DropdownMenuItem(
                        value: i,
                        child: Text(_ratingLabelKeys[i].tr(), style: AppTypography.body200),
                      ),
                    ),
                    onChanged: (v) {
                      if (v != null) setState(() => _ratingOptionIndex = v);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'priceMinimum'.tr(),
                          style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _minC,
                          keyboardType: TextInputType.number,
                          decoration: _fieldDeco(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'priceMaximum'.tr(),
                          style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _maxC,
                          keyboardType: TextInputType.number,
                          decoration: _fieldDeco(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),
              SizedBox(
                height: 54,
                child: ElevatedButton(
                  onPressed: () {
                    final minV = double.tryParse(_minC.text.trim());
                    final maxV = double.tryParse(_maxC.text.trim());
                    final minRating = _ratingThresholds[_ratingOptionIndex];
                    widget.onApply(_location, _categoryIndex, minV, maxV, minRating);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    'applyFilter'.tr(),
                    style: AppTypography.buttonLarge.copyWith(color: AppColors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
