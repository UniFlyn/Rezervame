import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'venue_details_screen.dart';

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
      'category': 'Beauty Salon',
    },
    {
      'id': 2,
      'name': 'Bliss Beauty Spa',
      'rating': '4.8',
      'reviews': '(89)',
      'price': '\$65.00',
      'img': '1544161515-4ab6ce6db874',
      'category': 'Spa & Wellness',
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
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('myFavorites'.tr(), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 20)),
        centerTitle: false,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black), onPressed: () => Navigator.pop(context)),
      ),
      body: _favorites.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.favorite_border, size: 80, color: Colors.grey.shade200),
                const SizedBox(height: 16),
                Text('noFavorites'.tr(), style: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.w700)),
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
                   Navigator.push(context, MaterialPageRoute(builder: (context) => VenueDetailsScreen(venue: fav)));
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey.shade100),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 5))],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.horizontal(left: Radius.circular(23)),
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
                            Text(fav['name'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                            const SizedBox(height: 2),
                            Text(fav['category'] as String, style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 12)),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.star, color: Colors.amber, size: 14),
                                const SizedBox(width: 4),
                                Text(fav['rating'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                                const SizedBox(width: 4),
                                Text(fav['reviews'] as String, style: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.w600, fontSize: 12)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.favorite, color: Color(0xFFff5a5f)),
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
