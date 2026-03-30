import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/mock_auth.dart';
import 'login_screen.dart';
import 'main_navigation.dart';
import 'search_results_screen.dart';
import 'notifications_screen.dart';
import 'venue_details_screen.dart';
import 'events_screen.dart';
import 'pricing_screen.dart';
import 'jobs_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        title: Row(
          children: [
            const Text(
               'rez',
               style: TextStyle(color: Color(0xFFff5a5f), fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1),
            ),
            Stack(
               alignment: Alignment.center,
               children: const [
                 Icon(Icons.access_time_filled, color: Color(0xFFff5a5f), size: 24),
                 Icon(Icons.check, color: Color(0xFF0f2e4a), size: 14),
               ],
            ),
            const Text(
               'rvame',
               style: TextStyle(color: Color(0xFFff5a5f), fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsScreen()));
            },
            icon: const Icon(Icons.notifications_none_rounded, color: Colors.black, size: 26),
          ),
          TextButton(
             onPressed: () {
               if (context.locale.languageCode == 'en') {
                 context.setLocale(const Locale('es'));
               } else {
                 context.setLocale(const Locale('en'));
               }
             },
             child: Text(
               context.locale.languageCode == 'en' ? 'ES' : 'EN',
               style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
             ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // HERO
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 260,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    image: DecorationImage(
                      image: AssetImage('assets/HeroSection.png'),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Container(color: Colors.black.withOpacity(0.4)),
                ),
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 20),
                        Text(
                          'heroTitle'.tr(),
                          style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, height: 1.1),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'heroSubtitle'.tr(),
                          style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 24),
                        Container(
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: InkWell(
                            onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const SearchResultsScreen()));
                            },
                            child: Row(
                              children: [
                                const Icon(Icons.search, color: Colors.grey, size: 20),
                                const SizedBox(width: 12),
                                Expanded(child: Text('searchPlaceholder'.tr(), style: const TextStyle(color: Colors.grey, fontSize: 14, fontWeight: FontWeight.w500))),
                                Container(
                                  width: 34, height: 34,
                                  decoration: const BoxDecoration(color: Color(0xFFff5a5f), shape: BoxShape.circle),
                                  child: const Icon(Icons.tune, color: Colors.white, size: 16),
                                )
                              ],
                            ),
                          ),
                        )
                      ],
                    ),
                  ),
                )
              ],
            ),
            const SizedBox(height: 40),

            // CATEGORIES
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('chooseCategory'.tr(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                  const SizedBox(height: 4),
                  Text('chooseCategorySub'.tr(), style: TextStyle(fontSize: 13, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 140,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                physics: const BouncingScrollPhysics(),
                children: [
                   _buildCircleCategory(context, 'hairService'.tr(), '1,245 ${'places'.tr()}', '1560066984-138dadb4c035'),
                   _buildCircleCategory(context, 'spaService'.tr(), '284 ${'places'.tr()}', '1544161515-4ab6ce6db874'),
                   _buildCircleCategory(context, 'beautyService'.tr(), '434 ${'places'.tr()}', '1487412947147-5cebf100ffc2'),
                   _buildCircleCategory(context, 'nailCare'.tr(), '220 ${'places'.tr()}', '1522337660859-02fbefca4702'),
                   _buildCircleCategory(context, 'barber'.tr(), '29 ${'places'.tr()}', '1585747860715-2ba37e788b70'),
                ],
              ),
            ),
            const SizedBox(height: 40),

            // FEATURED SERVICES
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('featuredServicesTitle'.tr(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                          const SizedBox(height: 4),
                          Text('featuredServicesSub2'.tr(), style: TextStyle(fontSize: 13, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                        ],
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const SearchResultsScreen(onlyFeatured: true)));
                        },
                        child: Text('viewAllFeatured'.tr(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFFff5a5f))),
                      )
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 250,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      clipBehavior: Clip.none,
                      physics: const BouncingScrollPhysics(),
                      children: [
                        _buildFeaturedCard(context, 'featCut'.tr(), 'Luxe Hair Studio', '\$45.00', '4.9', '45 ${'min'.tr()}', '1560066984-138dadb4c035', 1),
                        _buildFeaturedCard(context, 'featNails'.tr(), 'Nail Society', '\$30.00', '4.8', '60 ${'min'.tr()}', '1522337660859-02fbefca4702', 3),
                        _buildFeaturedCard(context, 'featMassage'.tr(), 'Bliss Beauty Spa', '\$65.00', '5.0', '90 ${'min'.tr()}', '1544161515-4ab6ce6db874', 2),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),

            // UPCOMING EVENTS (NEW)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('upcomingEvents'.tr(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                      TextButton(
                        onPressed: () {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => EventsScreen()));
                        },
                        child: Text('viewAllFeatured'.tr(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFFff5a5f))),
                      )
                    ],
                  ),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => EventsScreen())),
                    child: Container(
                      height: 160,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        image: const DecorationImage(
                          image: NetworkImage('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&fit=crop'),
                          fit: BoxFit.cover,
                        ),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
                          ),
                        ),
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('eventMasterclass'.tr(), style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
                            const SizedBox(height: 4),
                            Text('eventDate1'.tr(), style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 50),

            // BEST BUSINESSES
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('bestNear'.tr(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5), maxLines: 2),
                  const SizedBox(height: 4),
                  Text('bestNearSub'.tr(), style: TextStyle(fontSize: 13, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 24),
                  Column(
                    children: [
                      {
                        'name': 'Luxe Hair Studio',
                        'rating': '4.9',
                        'reviews': '120',
                        'price': '\$45.00',
                        'img': '1560066984-138dadb4c035',
                        'tags': ['tagCut'.tr(), 'tagColor'.tr(), 'tagStyle'.tr()],
                        'id': 1
                      },
                      {
                        'name': 'Bliss Beauty Spa',
                        'rating': '4.8',
                        'reviews': '89',
                        'price': '\$65.00',
                        'img': '1544161515-4ab6ce6db874',
                        'tags': ['tagMassage'.tr(), 'tagFacial'.tr(), 'tagSauna'.tr()],
                        'id': 2
                      },
                      {
                        'name': 'Nail Society',
                        'rating': '4.7',
                        'reviews': '62',
                        'price': '\$25.00',
                        'img': '1487412947147-5cebf100ffc2',
                        'tags': ['tagNails'.tr(), 'tagPedicure'.tr(), 'tagGel'.tr()],
                        'id': 3
                      },
                      {
                        'name': 'The Gentlemen\'s Club',
                        'rating': '4.9',
                        'reviews': '210',
                        'price': '\$35.00',
                        'img': '1503951914875-452162b0f3f1',
                        'tags': ['tagBarber'.tr(), 'tagBeard'.tr(), 'tagFacial'.tr()],
                        'id': 4
                      },
                      {
                        'name': 'Aura Skin Care',
                        'rating': '4.8',
                        'reviews': '77',
                        'price': '\$120.00',
                        'img': '1564832486372-f628308223a7',
                        'tags': ['tagSkin'.tr(), 'tagLaser'.tr(), 'tagPeeling'.tr()],
                        'id': 5
                      },
                      {
                        'name': 'Urban Barber',
                        'rating': '4.6',
                        'reviews': '145',
                        'price': '\$30.00',
                        'img': '1585747860715-2ba37e788b70',
                        'tags': ['tagFades'.tr(), 'tagClassic'.tr(), 'tagShave'.tr()],
                        'id': 6
                      },
                      {
                        'name': 'Elite Aesthetics',
                        'rating': '4.9',
                        'reviews': '312',
                        'price': '\$200.00',
                        'img': '1522337660859-02fbefca4702',
                        'tags': ['tagBody'.tr(), 'tagFacial'.tr(), 'tagSculpt'.tr()],
                        'id': 7
                      },
                      {
                        'name': 'Modern Nails',
                        'rating': '4.7',
                        'reviews': '92',
                        'price': '\$55.00',
                        'img': '1519014816541-da1916305741',
                        'tags': ['tagNailArt'.tr(), 'tagAcrylic'.tr(), 'tagGel'.tr()],
                        'id': 8
                      },
                      {
                        'name': 'Viking Barber',
                        'rating': '4.5',
                        'reviews': '84',
                        'price': '\$40.00',
                        'img': '1532715088550-62f09305f765',
                        'tags': ['tagBeard'.tr(), 'tagHotTowel'.tr(), 'tagOldSchool'.tr()],
                        'id': 9
                      },
                      {
                        'name': 'Serene Yoga',
                        'rating': '4.9',
                        'reviews': '156',
                        'price': '\$40.00',
                        'img': '1544367562803-44252e3c46aa',
                        'tags': ['tagYoga'.tr(), 'tagPrivate'.tr()],
                        'id': 10
                      },
                      {
                        'name': 'Glow Tanning',
                        'rating': '4.4',
                        'reviews': '63',
                        'price': '\$35.00',
                        'img': '1562322140-10f67175f053',
                        'tags': ['tagSpray'.tr()],
                        'id': 11
                      },
                      {
                        'name': 'Diamond Dental',
                        'rating': '4.9',
                        'reviews': '204',
                        'price': '\$150.00',
                        'img': '1588776814546-1ffcf47267a5',
                        'tags': ['tagDental'.tr(), 'tagWhite'.tr()],
                        'id': 12
                      },
                      {
                        'name': 'Brows & Co',
                        'rating': '4.8',
                        'reviews': '118',
                        'price': '\$250.00',
                        'img': '1487515201422-2252b45a80b0',
                        'tags': ['tagMicro'.tr(), 'tagLash'.tr()],
                        'id': 13
                      },
                      {
                        'name': 'Rustic Grooming',
                        'rating': '4.6',
                        'reviews': '95',
                        'price': '\$45.00',
                        'img': '1503951914875-452162b0f3f1',
                        'tags': ['tagCut'.tr(), 'tagTrim'.tr(), 'tagStyle'.tr()],
                        'id': 14
                      },
                      {
                        'name': 'Velvet Spa',
                        'rating': '4.7',
                        'reviews': '132',
                        'price': '\$75.00',
                        'img': '1544161515-4ab6ce6db874',
                        'tags': ['tagMassage'.tr(), 'tagColor'.tr(), 'tagSteam'.tr()],
                        'id': 15
                      },
                    ].map((biz) => _buildBusinessCard(
                      context, 
                      biz['name'] as String, 
                      biz['rating'] as String, 
                      '(${biz['reviews']} ${'reviews'.tr()})', 
                      biz['price'] as String, 
                      biz['img'] as String, 
                      biz['tags'] as List<String>, 
                      biz['id'] as int
                    )).toList(),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: TextButton(
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const SearchResultsScreen(onlyFeatured: false)));
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                           Text('viewAllBiz'.tr(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.black)),
                           const SizedBox(width: 4),
                           const Icon(Icons.arrow_forward, size: 14, color: Colors.black),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircleCategory(BuildContext context, String title, String stat, String imgId) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => SearchResultsScreen(category: title)));
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFFff5a5f), Color(0xFFff9a9e)]),
                boxShadow: [BoxShadow(color: const Color(0xFFff5a5f).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6))],
              ),
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  image: DecorationImage(image: NetworkImage('https://images.unsplash.com/photo-$imgId?q=80&w=250&fit=crop'), fit: BoxFit.cover),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF1e293b))),
            const SizedBox(height: 2),
            Text(stat, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturedCard(BuildContext context, String title, String salon, String price, String rating, String duration, String imgId, int id) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => VenueDetailsScreen(venue: {'id': id, 'name': salon, 'img': imgId})));
      },
      child: Container(
        width: 200,
        margin: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 110,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                image: DecorationImage(image: NetworkImage('https://images.unsplash.com/photo-$imgId?q=80&w=400&fit=crop'), fit: BoxFit.cover),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 8, left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.black.withOpacity(0.85), borderRadius: BorderRadius.circular(8)),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 12),
                          const SizedBox(width: 4),
                          Text(rating, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, height: 1.2), maxLines: 2, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFFff5a5f).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(price, style: const TextStyle(color: Color(0xFFff5a5f), fontSize: 11, fontWeight: FontWeight.w900)),
                )
              ],
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey.shade100))),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(child: Text(salon, style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 12, color: Colors.grey.shade400),
                      const SizedBox(width: 4),
                      Text(duration, style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.w600)),
                    ],
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildBusinessCard(BuildContext context, String name, String rating, String reviews, String price, String imgId, List<String> tags, int id) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => VenueDetailsScreen(venue: {'id': id, 'name': name, 'img': imgId})));
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 15, offset: const Offset(0, 8))],
        ),
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 180,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                image: DecorationImage(image: NetworkImage('https://images.unsplash.com/photo-$imgId?q=80&w=800&fit=crop'), fit: BoxFit.cover),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 12, right: 12,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                      child: const Icon(Icons.favorite_border, color: Color(0xFFff5a5f), size: 20),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1e293b))),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 18),
                          const SizedBox(width: 4),
                          Text(rating, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                          Text(' ($reviews)', style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 18, color: Colors.grey.shade400),
                      const SizedBox(width: 4),
                      Text('Avenida Balboa', style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 13)),
                      const Spacer(),
                      Text('• 0.5 km', style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: tags.map((tag) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(6), border: Border.all(color: Colors.grey.shade100)),
                      child: Text(tag, style: TextStyle(color: Colors.grey.shade700, fontSize: 10, fontWeight: FontWeight.w800)),
                    )).toList(),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Divider(color: Colors.grey.shade100, thickness: 1.5),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.schedule, size: 18, color: Colors.grey.shade400),
                          const SizedBox(width: 6),
                          Text('${'nextAppt'.tr()} ', style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w600)),
                          Text('${'today'.tr()} 3:00 PM', style: const TextStyle(color: Colors.black87, fontSize: 12, fontWeight: FontWeight.w800)),
                        ],
                      ),
                      Text(price, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.black)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => VenueDetailsScreen(venue: {'id': id, 'name': name, 'img': imgId})));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFfd5b60), 
                        foregroundColor: Colors.white, 
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        shadowColor: const Color(0xFFfd5b60).withOpacity(0.3),
                      ),
                      child: Text('bookBtn'.tr(), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
