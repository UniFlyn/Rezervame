import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../data/user_location.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'location_map_picker_screen.dart';
import 'login_screen.dart';

/// Post-onboarding location step (reference: “Choose your Location”).
class ChooseLocationScreen extends StatefulWidget {
  const ChooseLocationScreen({super.key});

  @override
  State<ChooseLocationScreen> createState() => _ChooseLocationScreenState();
}

class _ChooseLocationScreenState extends State<ChooseLocationScreen> {
  static final LatLng _previewCenter = LatLng(34.0736, -118.4004);

  final TextEditingController _searchController = TextEditingController();

  Future<void> _goToLogin() async {
    await UserLocation.setLastKnown(_previewCenter.latitude, _previewCenter.longitude);
    if (!mounted) return;
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
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: 0.5,
                      minHeight: 4,
                      backgroundColor: AppColors.grey100,
                      color: AppColors.primary500,
                    ),
                  ),
                ),
                const SizedBox(width: 48),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Choose your Location',
                  style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
                ),
                const SizedBox(height: 12),
                Text(
                  'We use your location to show nearby salons and available appointment times tailored to you.',
                  style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search your location',
                hintStyle: AppTypography.body200.copyWith(color: AppColors.grey400),
                prefixIcon: const Icon(Icons.search, color: AppColors.grey400),
                filled: true,
                fillColor: AppColors.grey25,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(builder: (context) => const LocationMapPickerScreen()),
                );
              },
              icon: const Icon(Icons.map_outlined, color: AppColors.primary500),
              label: Text(
                'Set Location',
                style: AppTypography.heading200.copyWith(color: AppColors.primary500),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.primary500, width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(height: 28),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'Current Location',
              style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(
                  children: [
                    FlutterMap(
                      options: MapOptions(
                        initialCenter: _previewCenter,
                        initialZoom: 14,
                        interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.rezervame.app',
                        ),
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: _previewCenter,
                              width: 48,
                              height: 48,
                              child: const Icon(Icons.location_on, color: AppColors.primary500, size: 48),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Positioned(
                      left: 12,
                      bottom: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.black.withValues(alpha: 0.08),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        child: Text(
                          'House',
                          style: AppTypography.body100.copyWith(fontWeight: FontWeight.w700, color: AppColors.grey900),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _goToLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: AppColors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('Use Current Location', style: AppTypography.buttonLarge),
              ),
            ),
          ),
        ],
        ),
      ),
    );
  }
}
