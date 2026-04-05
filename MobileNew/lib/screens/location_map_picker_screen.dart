import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'login_screen.dart';

class _AddressItem {
  const _AddressItem({
    required this.title,
    required this.subtitle,
    required this.distanceKm,
    required this.point,
  });

  final String title;
  final String subtitle;
  final String distanceKm;
  final LatLng point;
}

/// Full map + address sheet (reference: “Choose Location” picker).
class LocationMapPickerScreen extends StatefulWidget {
  const LocationMapPickerScreen({super.key});

  @override
  State<LocationMapPickerScreen> createState() => _LocationMapPickerScreenState();
}

class _LocationMapPickerScreenState extends State<LocationMapPickerScreen> {
  static final LatLng _mapCenter = LatLng(32.7872, -117.2521);

  final List<_AddressItem> _addresses = const [
    _AddressItem(
      title: 'Houses',
      subtitle: 'Beverly Hills, California',
      distanceKm: '1.2 KM',
      point: LatLng(34.0736, -118.4004),
    ),
    _AddressItem(
      title: 'Hotels',
      subtitle: 'Hotel del Coronado, San Diego',
      distanceKm: '4.3 KM',
      point: LatLng(32.6804, -117.1784),
    ),
    _AddressItem(
      title: 'Warehouses',
      subtitle: 'UPS Worldport, Louisville, Kentucky',
      distanceKm: '3.1 KM',
      point: LatLng(38.1743, -85.7364),
    ),
  ];

  final TextEditingController _searchController = TextEditingController();

  void _finishToLogin() {
    Navigator.pushAndRemoveUntil<void>(
      context,
      MaterialPageRoute<void>(builder: (context) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sheetHeight = MediaQuery.of(context).size.height * 0.46;

    return Scaffold(
      backgroundColor: AppColors.white,
      body: Column(
        children: [
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
                  options: MapOptions(
                    initialCenter: _mapCenter,
                    initialZoom: 11,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.rezervame.app',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: const LatLng(34.05, -118.35),
                          width: 72,
                          height: 36,
                          child: _mapLabel('House'),
                        ),
                        Marker(
                          point: const LatLng(32.68, -117.18),
                          width: 72,
                          height: 36,
                          child: _mapLabel('Hotels'),
                        ),
                        Marker(
                          point: const LatLng(32.85, -117.12),
                          width: 88,
                          height: 36,
                          child: _mapLabel('Warehouses'),
                        ),
                      ],
                    ),
                  ],
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Expanded(
                          child: Text(
                            'Choose Location',
                            textAlign: TextAlign.center,
                            style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.more_vert, color: AppColors.grey900),
                          onPressed: () {},
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  right: 16,
                  bottom: 24,
                  child: FloatingActionButton(
                    onPressed: () {},
                    backgroundColor: AppColors.primary500,
                    elevation: 4,
                    child: const Icon(Icons.my_location, color: AppColors.white),
                  ),
                ),
              ],
            ),
          ),
          Container(
            height: sheetHeight,
            decoration: const BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [
                BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 16,
                  offset: Offset(0, -4),
                ),
              ],
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search here',
                      hintStyle: AppTypography.body200.copyWith(color: AppColors.grey400),
                      prefixIcon: const Icon(Icons.search, color: AppColors.grey400),
                      filled: true,
                      fillColor: AppColors.grey25,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Your Address',
                    style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                  ),
                  const SizedBox(height: 16),
                  ..._addresses.map(
                    (a) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Material(
                        color: AppColors.grey25,
                        borderRadius: BorderRadius.circular(16),
                        child: InkWell(
                          onTap: _finishToLogin,
                          borderRadius: BorderRadius.circular(16),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            child: Row(
                              children: [
                                const Icon(Icons.location_on, color: AppColors.primary500, size: 28),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(a.title, style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900)),
                                      const SizedBox(height: 4),
                                      Text(
                                        a.subtitle,
                                        style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  a.distanceKm,
                                  style: AppTypography.body100.copyWith(
                                    color: AppColors.grey500,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _finishToLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary500,
                        foregroundColor: AppColors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text('Continue', style: AppTypography.buttonLarge),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _mapLabel(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.12),
            blurRadius: 6,
          ),
        ],
      ),
      child: Text(
        text,
        style: AppTypography.body100.copyWith(fontWeight: FontWeight.w800, color: AppColors.grey900, fontSize: 11),
      ),
    );
  }
}
