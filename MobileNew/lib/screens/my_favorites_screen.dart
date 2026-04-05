import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../models/venue_listing.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'service_detail_screen.dart';

class MyFavoritesScreen extends StatefulWidget {
  const MyFavoritesScreen({super.key});

  @override
  State<MyFavoritesScreen> createState() => _MyFavoritesScreenState();
}

class _MyFavoritesScreenState extends State<MyFavoritesScreen> {
  final List<Map<String, dynamic>> _favorites = [
    {
      'id': 1,
      'name': 'Luxe Hair Studio',
      'rating': '4.9',
      'reviews': '(120)',
      'price': '\$45.00',
      'img': '1560066984-138dadb4c035',
      'category': 'hairService'.tr(),
    },
    {
      'id': 2,
      'name': 'Bliss Beauty Spa',
      'rating': '4.8',
      'reviews': '(89)',
      'price': '\$65.00',
      'img': '1544161515-4ab6ce6db874',
      'category': 'spaService'.tr(),
    },
    {
      'id': 3,
      'name': 'The Gentlemen\'s Club',
      'rating': '4.7',
      'reviews': '(210)',
      'price': '\$35.00',
      'img': '1503951914875-452162b0f3f1',
      'category': 'barber'.tr(),
    },
    {
      'id': 4,
      'name': 'Nail Society',
      'rating': '4.9',
      'reviews': '(56)',
      'price': '\$25.00',
      'img': '1522337660859-02fbefca4702',
      'category': 'nailCare'.tr(),
    },
    {
      'id': 5,
      'name': 'Urban Barber',
      'rating': '4.6',
      'reviews': '(145)',
      'price': '\$30.00',
      'img': '1585747860715-2ba37e788b70',
      'category': 'barber'.tr(),
    },
    {
      'id': 6,
      'name': 'Aura Skin Care',
      'rating': '4.8',
      'reviews': '(77)',
      'price': '\$120.00',
      'img': '1487412947147-5cebf100ffc2',
      'category': 'beautyService'.tr(),
    },
    {
      'id': 7,
      'name': 'Elite Aesthetics',
      'rating': '4.9',
      'reviews': '(312)',
      'price': '\$200.00',
      'img': '1522337660859-02fbefca4702',
      'category': 'beautyService'.tr(),
    },
    {
      'id': 8,
      'name': 'Modern Nails',
      'rating': '4.7',
      'reviews': '(92)',
      'price': '\$55.00',
      'img': '1519014816541-da1916305741',
      'category': 'nailCare'.tr(),
    },
    {
      'id': 9,
      'name': 'Viking Barber',
      'rating': '4.5',
      'reviews': '(84)',
      'price': '\$40.00',
      'img': '1532715088550-62f09305f765',
      'category': 'barber'.tr(),
    },
    {
      'id': 10,
      'name': 'Serene Yoga',
      'rating': '4.9',
      'reviews': '(156)',
      'price': '\$40.00',
      'img': '1544367562803-44252e3c46aa',
      'category': 'spaService'.tr(),
    },
    {
      'id': 11,
      'name': 'Glow Tanning',
      'rating': '4.4',
      'reviews': '(63)',
      'price': '\$35.00',
      'img': '1562322140-10f67175f053',
      'category': 'beautyService'.tr(),
    },
    {
      'id': 12,
      'name': 'Diamond Dental',
      'rating': '4.9',
      'reviews': '(204)',
      'price': '\$150.00',
      'img': '1588776814546-1ffcf47267a5',
      'category': 'beautyService'.tr(),
    },
    {
      'id': 13,
      'name': 'Brows & Co',
      'rating': '4.8',
      'reviews': '(118)',
      'price': '\$250.00',
      'img': '1487515201422-2252b45a80b0',
      'category': 'beautyService'.tr(),
    },
    {
      'id': 14,
      'name': 'Rustic Grooming',
      'rating': '4.6',
      'reviews': '(95)',
      'price': '\$45.00',
      'img': '1503951914875-452162b0f3f1',
      'category': 'barber'.tr(),
    },
    {
      'id': 15,
      'name': 'Velvet Spa',
      'rating': '4.7',
      'reviews': '(132)',
      'price': '\$75.00',
      'img': '1544161515-4ab6ce6db874',
      'category': 'spaService'.tr(),
    },
  ];

  void _removeFavorite(int id) {
    setState(() {
      _favorites.removeWhere((f) => f['id'] == id);
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
      body: _favorites.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.favorite_border, size: 80, color: AppColors.grey100),
                const SizedBox(height: 16),
                Text('noFavorites'.tr(), style: AppTypography.body200.copyWith(color: AppColors.grey300)),
              ],
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: _favorites.length,
            itemBuilder: (context, index) {
              final fav = _favorites[index];
              return GestureDetector(
                onTap: () {
                  Navigator.push(
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
                    boxShadow: [BoxShadow(color: AppColors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 5))],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.horizontal(left: Radius.circular(15)),
                          image: DecorationImage(
                            image: NetworkImage('https://images.unsplash.com/photo-${fav['img']}?q=80&w=250&fit=crop'),
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
                              fav['name'] as String,
                              style: AppTypography.homeSectionTitle.copyWith(
                                color: AppColors.grey900,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(fav['category'] as String, style: AppTypography.body100.copyWith(color: AppColors.grey400)),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.star, color: Colors.amber, size: 14),
                                const SizedBox(width: 4),
                                Text(fav['rating'] as String, style: AppTypography.heading200),
                                const SizedBox(width: 4),
                                Text(fav['reviews'] as String, style: AppTypography.body100.copyWith(color: AppColors.grey400)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.favorite, color: AppColors.primary500),
                        onPressed: () => _removeFavorite(fav['id'] as int),
                      ),
                      const SizedBox(width: 8),
                    ],
                  ),
                ),
              );
            },
          ),
    );
  }
}
