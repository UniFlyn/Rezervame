import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
// import '../data/venue_catalog.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';
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
  late final TextEditingController _searchController;
  int _selectedChipIndex = 0;

  double? _appliedMinPrice;
  double? _appliedMaxPrice;
  double? _appliedMinRating;
  String _appliedLocation = '';
  int _appliedSheetCategoryIndex = 0;

  List<Map<String, dynamic>> _sourceResults = [];
  List<Map<String, dynamic>> _filteredResults = [];
  bool _catalogLoading = true;
  // bool _loadingMore = false;
  int _currentPage = 1;
  // int _totalPages = 1;

  static const List<String?> _chipCategoryKeys = [null, 'hairService', 'beautyService', 'spaService', 'nailCare'];

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
    if (widget.categoryKey != null && widget.categoryKey!.trim().isNotEmpty) {
      _syncChipFromCategoryKey();
    } else {
      _syncChipFromCategoryParam();
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _bootstrapCatalog();
    });
  }

  Future<void> _bootstrapCatalog({bool refresh = true}) async {
    if (refresh) {
      setState(() {
        _catalogLoading = true;
        _currentPage = 1;
        _filteredResults = [];
        _sourceResults = [];
      });
    }

    final query = _searchController.text.trim();
    final categoryKey = _selectedChipIndex == 0 ? null : _chipCategoryKeys[_selectedChipIndex];

    final res = await ApiRepository().searchVenues(
      page: _currentPage,
      search: query,
      category: categoryKey,
    );

    if (!mounted) return;

    setState(() {
      final List<VenueListing> venues = res['data'] as List<VenueListing>;
      final List<Map<String, dynamic>> mapped = venues.map((v) => v.toSearchMap()).toList();
      
      if (refresh) {
        _sourceResults = mapped;
      } else {
        _sourceResults.addAll(mapped);
      }
      
      // _totalPages = res['totalPages'] ?? 1;
      _catalogLoading = false;
      // _loadingMore = false;
    });
    _applyFilter();
  }

  // void _loadMore() {
  //   if (_currentPage < _totalPages && !_loadingMore) {
  //     setState(() {
  //       _loadingMore = true;
  //       _currentPage++;
  //     });
  //     _bootstrapCatalog(refresh: false);
  //   }
  // }

  void _triggerSearch() {
    _bootstrapCatalog(refresh: true);
  }

  void _syncChipFromCategoryKey() {
    final raw = widget.categoryKey?.trim();
    if (raw == null || raw.isEmpty) return;
    if (raw == 'barber') {
      _selectedChipIndex = 1;
      return;
    }
    for (var i = 1; i < _chipCategoryKeys.length; i++) {
      final key = _chipCategoryKeys[i];
      if (key != null && key == raw) {
        _selectedChipIndex = i;
        return;
      }
    }
  }

  void _syncChipFromCategoryParam() {
    final c = widget.category;
    if (c == null || c.isEmpty) return;
    for (var i = 1; i < _chipCategoryKeys.length; i++) {
      final key = _chipCategoryKeys[i];
      if (key != null && c == key.tr()) {
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

  bool _matchesChip(Map<String, dynamic> r, int chipIndex) {
    if (chipIndex <= 0) return true;
    final cat = r['category'] as String;
    final key = _chipCategoryKeys[chipIndex];
    if (key == 'hairService') {
      return cat == 'hairService' || cat == 'barber';
    }
    return cat == key;
  }

  void _applyFilter() {
    var results = List<Map<String, dynamic>>.from(_sourceResults);

    if (widget.onlyFeatured) {
      results = results.where((r) => double.parse(r['rating'] as String) >= 4.8).toList();
    }

    results = results.where((r) => _matchesChip(r, _selectedChipIndex)).toList();

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

    if (_appliedMinRating != null) {
      results = results.where((r) {
        final rating = double.tryParse(r['rating'] as String) ?? 0;
        return rating >= _appliedMinRating!;
      }).toList();
    }

    if (_appliedLocation.isNotEmpty) {
      results = results
          .where((r) => (r['locationLabel'] as String? ?? '').trim() == _appliedLocation.trim())
          .toList();
    }

    results.sort(
      (a, b) => double.parse(b['rating'] as String).compareTo(double.parse(a['rating'] as String)),
    );

    setState(() => _filteredResults = results);
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

  String _listImageUrl(Map<String, dynamic> res, {int width = 500}) {
    final custom = res['imageUrl'] as String?;
    if (custom != null && custom.isNotEmpty) return custom;
    final img = res['img'] as String? ?? '';
    if (img.isEmpty) return custom ?? '';
    return 'https://images.unsplash.com/photo-$img?q=80&w=$width&fit=crop';
  }

  String _chipLabel(int i) {
    switch (i) {
      case 0:
        return 'searchChipAll'.tr();
      case 1:
        return 'searchChipHair'.tr();
      case 2:
        return 'searchChipFacial'.tr();
      case 3:
        return 'searchChipSpa'.tr();
      case 4:
        return 'searchChipNails'.tr();
      default:
        return '';
    }
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
      body: _catalogLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
          : _filteredResults.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.search_off_rounded, size: 64, color: AppColors.grey200),
                      const SizedBox(height: 16),
                      Text(
                        'noResults'.tr(),
                        style: AppTypography.sectionTitle.copyWith(color: AppColors.grey500),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      itemCount: _chipCategoryKeys.length,
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
                                _chipLabel(index),
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
                  ),
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
                ],
              ),
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
                  urls: ChainedNetworkImage.chainFrom(
                    _listImageUrl(res, width: 900),
                    res['img'] as String?,
                    w: 900,
                  ),
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
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
                    child: const Icon(Icons.favorite_border, color: AppColors.primary500, size: 20),
                  ),
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
                        urls: ChainedNetworkImage.chainFrom(
                          _listImageUrl(res, width: 400),
                          res['img'] as String?,
                          w: 400,
                        ),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
                      child: const Icon(Icons.favorite_border, color: AppColors.primary500, size: 16),
                    ),
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
        chipLabels: List.generate(_chipCategoryKeys.length, _chipLabel),
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
