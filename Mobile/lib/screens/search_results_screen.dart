import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'venue_details_screen.dart';

class SearchResultsScreen extends StatefulWidget {
  final String? category;
  final bool onlyFeatured;
  const SearchResultsScreen({super.key, this.category, this.onlyFeatured = false});

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  bool _isMapView = false;
  late List<Map<String, dynamic>> _filteredResults;
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, dynamic>> _mockResults = [
    { 'id': 1, 'name': 'Luxe Hair Studio', 'category': 'hairService', 'rating': '4.9', 'reviews': '120', 'price': '\$45.00', 'img': '1560066984-138dadb4c035', 'lat': 8.98, 'lng': -79.52 },
    { 'id': 2, 'name': 'Bliss Beauty', 'category': 'spaService', 'rating': '4.8', 'reviews': '89', 'price': '\$45.00', 'img': '1544161515-4ab6ce6db874', 'lat': 8.99, 'lng': -79.51 },
    { 'id': 3, 'name': 'Nail Society', 'category': 'nailCare', 'rating': '4.7', 'reviews': '62', 'price': '\$30.00', 'img': '1522337660859-02fbefca4702', 'lat': 8.97, 'lng': -79.53 },
    { 'id': 4, 'name': 'Brow Studio', 'category': 'beautyService', 'rating': '4.9', 'reviews': '194', 'price': '\$32.75', 'img': '1487412947147-5cebf100ffc2', 'lat': 8.985, 'lng': -79.525 },
  ];

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.category ?? '';
    _applyFilter();
  }

  void _applyFilter() {
    List<Map<String, dynamic>> results = List.from(_mockResults);

    // Apply onlyFeatured filter
    if (widget.onlyFeatured) {
      results = results.where((r) => double.parse(r['rating'] as String) >= 4.8).toList();
    }

    // Apply search/category filter
    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      results = results.where((r) {
        final name = r['name'].toString().toLowerCase();
        final catKey = r['category'] as String;
        final translatedCat = catKey.tr().toLowerCase();
        return name.contains(query) || translatedCat.contains(query) || catKey.toLowerCase().contains(query);
      }).toList();
    }

    setState(() {
      _filteredResults = results;
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        toolbarHeight: 80,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Container(
          height: 45,
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: (val) => _applyFilter(),
            decoration: InputDecoration(
              hintText: 'searchPlaceholder'.tr(),
              prefixIcon: const Icon(Icons.search, size: 20, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(_isMapView ? Icons.list : Icons.map_outlined, color: Colors.black),
            onPressed: () => setState(() => _isMapView = !_isMapView),
          ),
          IconButton(
            icon: const Icon(Icons.tune, color: Colors.black),
            onPressed: () => _showFilterSheet(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isMapView ? _buildMapView() : _buildListView(),
      floatingActionButton: !_isMapView ? FloatingActionButton.extended(
        onPressed: () => setState(() => _isMapView = true),
        backgroundColor: const Color(0xFF0f2e4a),
        icon: const Icon(Icons.map, size: 18),
        label: Text('map'.tr().toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1, color: Colors.white)),
      ) : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildListView() {
    if (_filteredResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text('noResults'.tr(), style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w700)),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      itemCount: _filteredResults.length,
      itemBuilder: (context, index) {
        final res = _filteredResults[index];
        return _buildResultCard(res);
      },
    );
  }

  Widget _buildMapView() {
    return Stack(
      children: [
        FlutterMap(
          options: MapOptions(
            initialCenter: LatLng(8.98, -79.52),
            initialZoom: 13,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.rezervame.app',
            ),
            MarkerLayer(
              markers: _filteredResults.map((res) {
                return Marker(
                  point: LatLng(res['lat'], res['lng']),
                  width: 80,
                  height: 40,
                  child: _buildMapPin(context, res['price'], res),
                );
              }).toList(),
            ),
          ],
        ),
        
        if (_filteredResults.isNotEmpty)
        Positioned(
          bottom: 20, left: 20, right: 20,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
               GestureDetector(
                 onTap: () {
                   Navigator.push(context, MaterialPageRoute(builder: (context) => VenueDetailsScreen(venue: _filteredResults[0])));
                 },
                 child: Container(
                   height: 110,
                   decoration: BoxDecoration(
                     color: Colors.white,
                     borderRadius: BorderRadius.circular(20),
                     boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20)],
                   ),
                   child: Row(
                     children: [
                       ClipRRect(
                         borderRadius: const BorderRadius.horizontal(left: Radius.circular(20)),
                         child: Image.network('https://images.unsplash.com/photo-${_filteredResults[0]['img']}?q=80&w=200&fit=crop', width: 110, height: 110, fit: BoxFit.cover),
                       ),
                       Expanded(
                         child: Padding(
                           padding: const EdgeInsets.all(12),
                           child: Column(
                             crossAxisAlignment: CrossAxisAlignment.start,
                             children: [
                               Text(_filteredResults[0]['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                               const SizedBox(height: 4),
                               Row(
                                 children: [
                                   const Icon(Icons.star, color: Colors.amber, size: 14),
                                   const SizedBox(width: 4),
                                   Text(_filteredResults[0]['rating'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                 ],
                                ),
                               const Spacer(),
                               Text(_filteredResults[0]['price'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFFff5a5f))),
                             ],
                           ),
                         ),
                       )
                     ],
                   ),
                 ),
               ),
               const SizedBox(height: 16),
               ElevatedButton.icon(
                 onPressed: () => setState(() => _isMapView = false),
                 icon: const Icon(Icons.list, size: 18),
                 label: Text('list'.tr().toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
                 style: ElevatedButton.styleFrom(
                   backgroundColor: const Color(0xFF0f2e4a),
                   foregroundColor: Colors.white,
                   padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                 ),
               )
            ],
          ),
        )
      ],
    );
  }

  Widget _buildMapPin(BuildContext context, String price, Map<String, dynamic> res) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => VenueDetailsScreen(venue: res)));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFff5a5f), width: 1.5),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
        ),
        child: Center(
          child: Text(price, style: const TextStyle(color: Color(0xFFff5a5f), fontWeight: FontWeight.w900, fontSize: 11)),
        ),
      ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> res) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VenueDetailsScreen(venue: res),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: Image.network('https://images.unsplash.com/photo-${res['img']}?q=80&w=500&fit=crop', height: 160, width: double.infinity, fit: BoxFit.cover),
                ),
                Positioned(
                  top: 12, right: 12,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: const Icon(Icons.favorite_border, color: Color(0xFFff5a5f), size: 18),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(res['category'].toString().tr().toUpperCase(), style: const TextStyle(color: Color(0xFFff5a5f), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 14),
                          const SizedBox(width: 4),
                          Text(res['rating'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                        ],
                      )
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(res['name'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 16, color: Colors.grey.shade400),
                      const SizedBox(width: 4),
                      Text('Avenida Balboa • 0.5 km', style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w600)),
                      const Spacer(),
                      Text(res['price'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => VenueDetailsScreen(venue: res),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFff5a5f),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text('bookBtn'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                    ),
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 30),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('filterTitle'.tr(), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('clearFilters'.tr(), style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 30),
            _buildFilterSection('filterService'.tr(), ['filterAll'.tr(), 'hairService'.tr(), 'spaService'.tr(), 'beautyService'.tr()]),
            _buildFilterSection('filterRating'.tr(), ['filterAll'.tr(), '5.0', '4.0+', '3.0+']),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0f2e4a),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('applyFilters'.tr().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900)),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildFilterSection(String title, List<String> options) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.grey)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: options.map((opt) => InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: opt.contains('All') || opt.contains('Todos') ? const Color(0xFFff5a5f).withOpacity(0.1) : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: opt.contains('All') || opt.contains('Todos') ? const Color(0xFFff5a5f) : Colors.grey.shade200),
              ),
              child: Text(opt, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: opt.contains('All') || opt.contains('Todos') ? const Color(0xFFff5a5f) : Colors.black)),
            ),
          )).toList(),
        ),
        const SizedBox(height: 30),
      ],
    );
  }
}
