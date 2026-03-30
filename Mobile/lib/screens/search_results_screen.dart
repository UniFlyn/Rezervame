import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
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

  final List<Map<String, dynamic>> _mockResults = [
    { 'id': 1, 'name': 'Luxe Hair Studio', 'category': 'hairService', 'rating': '4.9', 'reviews': '120', 'price': '$45.00', 'img': '1560066984-138dadb4c035' },
    { 'id': 2, 'name': 'Bliss Beauty', 'category': 'spaService', 'rating': '4.8', 'reviews': '89', 'price': '$45.00', 'img': '1544161515-4ab6ce6db874' },
    { 'id': 3, 'name': 'Nail Society', 'category': 'nailCare', 'rating': '4.7', 'reviews': '62', 'price': '$30.00', 'img': '1522337660859-02fbefca4702' },
    { 'id': 4, 'name': 'Brow Studio', 'category': 'beautyService', 'rating': '4.9', 'reviews': '194', 'price': '$32.75', 'img': '1487412947147-5cebf100ffc2' },
  ];

  @override
  void initState() {
    super.initState();
    _applyFilter();
  }

  void _applyFilter() {
    List<Map<String, dynamic>> results = List.from(_mockResults);

    // Apply onlyFeatured filter
    if (widget.onlyFeatured) {
      results = results.where((r) => double.parse(r['rating'] as String) >= 4.8).toList();
    }

    // Apply category filter
    if (widget.category != null) {
      results = results.where((r) {
        final catKey = r['category'] as String;
        final translatedCat = catKey.tr().toLowerCase();
        final selectedCat = widget.category!.toLowerCase();
        return translatedCat == selectedCat || catKey.toLowerCase() == selectedCat;
      }).toList();
    }

    setState(() {
      _filteredResults = results;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.category ?? 'hairService'.tr(),
          style: const TextStyle(color: Colors.black, fontSize: 18, fontWeight: FontWeight.w900),
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
        ],
      ),
      body: _isMapView ? _buildMapView() : _buildListView(),
      floatingActionButton: !_isMapView ? FloatingActionButton.extended(
        onPressed: () => setState(() => _isMapView = true),
        backgroundColor: const Color(0xFF0f2e4a),
        icon: const Icon(Icons.map, size: 18),
        label: Text('map'.tr().toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1)),
      ) : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildListView() {
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
        Container(
          decoration: const BoxDecoration(
            image: DecorationImage(
              image: NetworkImage('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-79.52,8.98,12,0/800x800?access_token=pk.eyJ1IjoiYmFyYmVyYXBwIiwiYSI6ImNsdGNnZDZpazBmajIyam50eHd3eHdncG0ifQ.placeholder'),
              fit: BoxFit.cover,
            ),
          ),
        ),
        // Mock Pins
        if (_filteredResults.isNotEmpty) ...[
          Positioned(top: 150, left: 100, child: _buildMapPin(context, _filteredResults[0]['price'], _filteredResults[0])),
          if (_filteredResults.length > 1)
            Positioned(top: 250, left: 200, child: _buildMapPin(context, _filteredResults[1]['price'], _filteredResults[1])),
          if (_filteredResults.length > 2)
            Positioned(top: 400, left: 150, child: _buildMapPin(context, _filteredResults[2]['price'], _filteredResults[2])),
        ],
        
        Positioned(
          bottom: 20, left: 20, right: 20,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
               if (_filteredResults.isNotEmpty)
               GestureDetector(
                 onTap: () {
                   Navigator.push(context, MaterialPageRoute(builder: (context) => VenueDetailsScreen(venue: _filteredResults[0])));
                 },
                 child: Container(
                   height: 120,
                   decoration: BoxDecoration(
                     color: Colors.white,
                     borderRadius: BorderRadius.circular(20),
                     boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20)],
                   ),
                   child: Row(
                     children: [
                       ClipRRect(
                         borderRadius: const BorderRadius.horizontal(left: Radius.circular(20)),
                         child: Image.network('https://images.unsplash.com/photo-${_filteredResults[0]['img']}?q=80&w=200&fit=crop', width: 120, height: 120, fit: BoxFit.cover),
                       ),
                       Expanded(
                         child: Padding(
                           padding: const EdgeInsets.all(12),
                           child: Column(
                             crossAxisAlignment: CrossAxisAlignment.start,
                             children: [
                               Text(_filteredResults[0]['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                               const SizedBox(height: 4),
                               Row(
                                 children: [
                                   const Icon(Icons.star, color: Colors.amber, size: 14),
                                   const SizedBox(width: 4),
                                   Text(_filteredResults[0]['rating'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                 ],
                                ),
                               const Spacer(),
                               Text(_filteredResults[0]['price'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFFff5a5f))),
                             ],
                           ),
                         ),
                       )
                     ],
                   ),
                 ),
               ),
               const SizedBox(height: 20),
               ElevatedButton(
                 onPressed: () => setState(() => _isMapView = false),
                 style: ElevatedButton.styleFrom(
                   backgroundColor: const Color(0xFF0f2e4a),
                   padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                 ),
                 child: Text('list'.tr().toUpperCase(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white)),
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
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: const Color(0xFFff5a5f), width: 2),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 5)],
        ),
        child: Text(price, style: const TextStyle(color: Color(0xFFff5a5f), fontWeight: FontWeight.w900, fontSize: 12)),
      ),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> res) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: Image.network('https://images.unsplash.com/photo-${res['img']}?q=80&w=500&fit=crop', height: 160, width: double.infinity, fit: BoxFit.cover),
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
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
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
            Text('filterTitle'.tr(), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
            const SizedBox(height: 30),
            _buildFilterSection('filterService'.tr(), ['hairService'.tr(), 'spaService'.tr(), 'beautyService'.tr()]),
            _buildFilterSection('filterRating'.tr(), ['5.0', '4.0+', '3.0+']),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0f2e4a),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('viewDetails'.tr().toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
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
          children: options.map((opt) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Text(opt, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          )).toList(),
        ),
        const SizedBox(height: 30),
      ],
    );
  }
}
