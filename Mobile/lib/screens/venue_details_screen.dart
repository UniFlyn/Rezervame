import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class VenueDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> venue;
  const VenueDetailsScreen({super.key, required this.venue});

  @override
  State<VenueDetailsScreen> createState() => _VenueDetailsScreenState();
}

class _VenueDetailsScreenState extends State<VenueDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();

  final List<Map<String, dynamic>> _mockServices = [
    { 'id': 1, 'name': 'Corte de cabello para mujer', 'desc': 'Corte y peinado profesional adaptado a tus preferencias', 'time': '60 min', 'price': '\$65.00', 'tag': 'Todos' },
    { 'id': 2, 'name': 'Corte de cabello para hombre', 'desc': 'Corte clásico o moderno, realizado con precisión', 'time': '45 min', 'price': '\$35.00', 'tag': 'Más vendidos' },
    { 'id': 3, 'name': 'Coloración de cabello', 'desc': 'Servicio completo de color con productos de alta gama', 'time': '3-4 h', 'price': '\$120.00', 'tag': 'Promociones' },
    { 'id': 4, 'name': 'Highlights', 'desc': 'Reflejos parciales para aportar dimensión', 'time': '2 h', 'price': '\$140.00', 'tag': 'Todos' },
  ];

  final List<Map<String, dynamic>> _mockTeam = [
    { 'id': 1, 'name': 'Mateo Ríos', 'role': 'Estilista Senior', 'rating': '4.8', 'img': '1503951914875-452162b0f3f1' },
    { 'id': 2, 'name': 'Mateo Ríos', 'role': 'Estilista Senior', 'rating': '4.9', 'img': '1503951914875-452162b0f3f1' },
    { 'id': 3, 'name': 'Mateo Ríos', 'role': 'Estilista Senior', 'rating': '4.5', 'img': '1503951914875-452162b0f3f1' },
    { 'id': 4, 'name': 'Mateo Ríos', 'role': 'Estilista Senior', 'rating': '4.2', 'img': '1503951914875-452162b0f3f1' },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(child: _buildVenueHeader()),
          SliverPersistentHeader(
            pinned: true,
            delegate: _SliverAppBarDelegate(
              TabBar(
                controller: _tabController,
                labelColor: Colors.black,
                unselectedLabelColor: Colors.grey,
                indicatorColor: const Color(0xFFff5a5f),
                indicatorWeight: 3,
                labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5),
                tabs: [
                  Tab(text: 'venueServicios'.tr()),
                  Tab(text: 'venueEquipo'.tr()),
                  Tab(text: 'venueReseñas'.tr()),
                  Tab(text: 'venueAmenidades'.tr()),
                ],
              ),
            ),
          ),
          SliverFillRemaining(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildServicesTab(),
                _buildTeamTab(),
                _buildReviewsTab(),
                _buildAmenitiesTab(),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomAction(),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 250,
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              'https://images.unsplash.com/photo-${widget.venue['img']}?q=80&w=800&fit=crop',
              fit: BoxFit.cover,
            ),
            Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black.withOpacity(0.4), Colors.transparent, Colors.black.withOpacity(0.4)]))),
          ],
        ),
      ),
      actions: [
        IconButton(icon: const Icon(Icons.share_outlined, color: Colors.white), onPressed: () {}),
        IconButton(icon: const Icon(Icons.favorite_border, color: Colors.white), onPressed: () {}),
      ],
    );
  }

  Widget _buildVenueHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFFff5a5f).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: const Text('NUEVO', style: TextStyle(color: Color(0xFFff5a5f), fontSize: 10, fontWeight: FontWeight.w900)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(widget.venue['name'], style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.star, color: Colors.amber, size: 18),
              const SizedBox(width: 4),
              const Text('4.9', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
              const SizedBox(width: 4),
              Text('(217 reseñas)', style: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.w700, fontSize: 13)),
              const Spacer(),
              const Icon(Icons.location_on_outlined, color: Colors.grey, size: 18),
              const SizedBox(width: 4),
              const Text('0.5 km', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Nuestro salón de belleza combina diseño moderno y servicios premium en el corazón de la ciudad.',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13, height: 1.5, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesTab() {
    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: _mockServices.length,
      separatorBuilder: (_, __) => const SizedBox(height: 20),
      itemBuilder: (context, index) {
        final s = _mockServices[index];
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(child: Text(s['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16))),
                  Text(s['price'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFFff5a5f))),
                ],
              ),
              const SizedBox(height: 8),
              Text(s['desc'], style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(Icons.access_time, size: 14, color: Colors.grey.shade300),
                  const SizedBox(width: 6),
                  Text(s['time'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.grey)),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFff5a5f),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                    child: Text('bookBtn'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.white)),
                  )
                ],
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildTeamTab() {
    return GridView.builder(
      padding: const EdgeInsets.all(20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.7,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: _mockTeam.length,
      itemBuilder: (context, index) {
        final m = _mockTeam[index];
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Column(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: Image.network('https://images.unsplash.com/photo-${m['img']}?q=80&w=400&fit=crop', width: double.infinity, fit: BoxFit.cover),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    Text(m['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text(m['role'], style: const TextStyle(color: Color(0xFFff5a5f), fontSize: 10, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 12),
                        const SizedBox(width: 4),
                        Text(m['rating'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                      ],
                    )
                  ],
                ),
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildReviewsTab() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('4.9 / 5.0', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF1e293b))),
                const SizedBox(height: 4),
                Row(
                  children: List.generate(5, (i) => const Icon(Icons.star, color: Colors.amber, size: 16)),
                ),
                const SizedBox(height: 4),
                Text('basado en 217 reseñas', style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.w700)),
              ],
            ),
            OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF1e293b), width: 2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              child: const Text('ESCRIBIR RESEÑA', style: TextStyle(color: Color(0xFF1e293b), fontWeight: FontWeight.w900, fontSize: 11)),
            ),
          ],
        ),
        const SizedBox(height: 32),
        _buildReviewCard('Lucía Fernández', 'Hace 2 días', 5, 'Fui por un balayage y quedé encantada. El trato de Mateo es excepcional y los productos que usan son de primer nivel. El ambiente del salón es súper relajante.'),
        _buildReviewCard('Roberto Gómez', 'Hace 1 semana', 5, 'Excelente servicio de barbería. Muy profesional y detallista. Definitivamente volveré.'),
        _buildReviewCard('Ana Martínez', 'Hace 2 semanas', 4, 'Me encantó el resultado del tinte, aunque tuve que esperar un poco más de lo previsto para ser atendida.'),
      ],
    );
  }

  Widget _buildReviewCard(String name, String date, int rating, String comment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFf8fafc),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              Text(date, style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (i) => Icon(Icons.star, color: i < rating ? Colors.amber : Colors.grey.shade200, size: 14)),
          ),
          const SizedBox(height: 12),
          Text(comment, style: TextStyle(color: Colors.grey.shade600, fontSize: 13, height: 1.5, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildAmenitiesTab() {
    final amenities = [
      {'icon': Icons.wifi, 'label': 'Wi-Fi Gratis'},
      {'icon': Icons.local_parking, 'label': 'Estacionamiento'},
      {'icon': Icons.coffee, 'label': 'Café y Bebidas'},
      {'icon': Icons.ac_unit, 'label': 'Aire Acondicionado'},
      {'icon': Icons.credit_card, 'label': 'Acepta Tarjetas'},
      {'icon': Icons.child_care, 'label': 'Área para Niños'},
    ];

    return GridView.builder(
      padding: const EdgeInsets.all(24),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 2.2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: amenities.length,
      itemBuilder: (context, index) {
        final a = amenities[index];
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(a['icon'] as IconData, color: const Color(0xFFff5a5f), size: 18),
              const SizedBox(width: 12),
              Expanded(child: Text(a['label'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: -0.2))),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBottomAction() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, -5))],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFff5a5f),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 8,
              shadowColor: const Color(0xFFff5a5f).withOpacity(0.4),
            ),
            child: const Text('RESERVAR AHORA', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
          ),
        ),
      ),
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;
  _SliverAppBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(color: Colors.white, child: _tabBar);
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
