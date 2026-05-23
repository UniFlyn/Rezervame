import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';
import '../widgets/list_pagination_bar.dart';
import 'service_detail_screen.dart';

class MyFavoritesScreen extends StatefulWidget {
  const MyFavoritesScreen({super.key});

  @override
  State<MyFavoritesScreen> createState() => _MyFavoritesScreenState();
}

class _MyFavoritesScreenState extends State<MyFavoritesScreen> {
  final ApiRepository _repo = ApiRepository();
  List<Map<String, dynamic>> _favorites = [];
  bool _loading = true;
  bool _loggedIn = false;
  String? _error;
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  static const int _pageSize = 12;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({int? page}) async {
    final nextPage = page ?? _page;
    setState(() {
      _loading = true;
      _error = null;
      _page = nextPage;
    });
    final token = await AuthSession.getToken();
    if (token == null || token.isEmpty) {
      if (!mounted) return;
      setState(() {
        _loggedIn = false;
        _favorites = [];
        _loading = false;
      });
      return;
    }
    try {
      final res = await _repo.fetchFavoriteVenueMaps(page: nextPage, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _loggedIn = true;
        _favorites = (res['data'] as List<Map<String, dynamic>>?) ?? [];
        _total = (res['total'] as int?) ?? _favorites.length;
        _totalPages = (res['totalPages'] as int?) ?? 1;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loggedIn = true;
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _removeFavorite(String businessId) async {
    final ok = await _repo.removeFavorite(businessId);
    if (!ok || !mounted) return;
    setState(() {
      _favorites.removeWhere((m) => '${m['businessId']}' == businessId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('myFavorites'.tr(), style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900)),
        centerTitle: false,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.grey900), onPressed: () => Navigator.pop(context)),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary500,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
            : !_loggedIn
                ? ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      const SizedBox(height: 80),
                      Icon(Icons.lock_outline, size: 64, color: AppColors.grey100),
                      const SizedBox(height: 16),
                      Text(
                        'favoritesSignIn'.tr(),
                        textAlign: TextAlign.center,
                        style: AppTypography.body200.copyWith(color: AppColors.grey500),
                      ),
                    ],
                  )
                : _error != null
                    ? ListView(
                        padding: const EdgeInsets.all(24),
                        children: [
                          Text('favoritesLoadError'.tr(), style: AppTypography.body200.copyWith(color: AppColors.grey500)),
                          const SizedBox(height: 8),
                          Text(_error!, style: AppTypography.body100.copyWith(color: AppColors.grey400)),
                        ],
                      )
                    : _favorites.isEmpty
                        ? ListView(
                            padding: const EdgeInsets.all(24),
                            children: [
                              Center(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 80),
                                  child: Column(
                                    children: [
                                      Icon(Icons.favorite_border, size: 80, color: AppColors.grey100),
                                      const SizedBox(height: 16),
                                      Text('noFavorites'.tr(), style: AppTypography.body200.copyWith(color: AppColors.grey300)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(20),
                            itemCount: _favorites.length + 1,
                            itemBuilder: (context, index) {
                              if (index == _favorites.length) {
                                return ListPaginationBar(
                                  page: _page,
                                  totalPages: _totalPages,
                                  total: _total,
                                  onPageChange: (p) => _load(page: p),
                                );
                              }
                              final fav = _favorites[index];
                              final bid = '${fav['businessId'] ?? ''}';
                              return GestureDetector(
                                onTap: () {
                                  Navigator.push<void>(
                                    context,
                                    MaterialPageRoute<void>(
                                      builder: (context) => ServiceDetailScreen(listing: VenueListing.fromFavoriteMap(fav)),
                                    ),
                                  );
                                },
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 20),
                                  decoration: BoxDecoration(
                                    color: AppColors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: AppColors.grey50),
                                    boxShadow: [
                                      BoxShadow(color: AppColors.black.withValues(alpha: 0.04), blurRadius: 15, offset: const Offset(0, 5)),
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      ClipRRect(
                                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(15)),
                                        child: SizedBox(
                                          width: 100,
                                          height: 100,
                                          child: ChainedNetworkImage(
                                            urls: ChainedNetworkImage.chainFrom(
                                              fav['imageUrl'] as String?,
                                              fav['unsplashImgId'] as String?,
                                              w: 250,
                                            ),
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              '${fav['name'] ?? ''}',
                                              style: AppTypography.homeSectionTitle.copyWith(
                                                color: AppColors.grey900,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              (fav['categoryKey'] as String? ?? 'hairService').tr(),
                                              style: AppTypography.body100.copyWith(color: AppColors.grey400),
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              children: [
                                                const Icon(Icons.star, color: Colors.amber, size: 14),
                                                const SizedBox(width: 4),
                                                Text('${fav['rating'] ?? ''}', style: AppTypography.heading200),
                                                const SizedBox(width: 4),
                                                Text(
                                                  '(${fav['reviews'] ?? '0'})',
                                                  style: AppTypography.body100.copyWith(color: AppColors.grey400),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.favorite, color: AppColors.primary500),
                                        onPressed: bid.isEmpty ? null : () => _removeFavorite(bid),
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
      ),
    );
  }
}
