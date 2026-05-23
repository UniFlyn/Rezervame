import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../data/user_location.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'login_screen.dart';

class _AddressItem {
  const _AddressItem({
    required this.title,
    required this.subtitle,
    required this.point,
  });

  final String title;
  final String subtitle;
  final LatLng point;
}

/// Map + address picker with GPS and OpenStreetMap Nominatim search (web parity).
class LocationMapPickerScreen extends StatefulWidget {
  const LocationMapPickerScreen({super.key, this.selectOnly = false});

  final bool selectOnly;

  @override
  State<LocationMapPickerScreen> createState() => _LocationMapPickerScreenState();
}

class _LocationMapPickerScreenState extends State<LocationMapPickerScreen> {
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();

  LatLng _mapCenter = const LatLng(8.9824, -79.5199);
  List<_AddressItem> _addresses = [];
  bool _locating = false;
  bool _searching = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _bootstrapLocation();
  }

  Future<void> _bootstrapLocation() async {
    final saved = await UserLocation.getLastKnown();
    if (saved != null) {
      final label = await UserLocation.getDisplayLabel(
        fallback: '${saved.lat.toStringAsFixed(4)}, ${saved.lng.toStringAsFixed(4)}',
      );
      setState(() {
        _mapCenter = LatLng(saved.lat, saved.lng);
        _addresses = [
          _AddressItem(
            title: 'Saved location',
            subtitle: label,
            point: LatLng(saved.lat, saved.lng),
          ),
        ];
      });
      _mapController.move(_mapCenter, 13);
      return;
    }
    await _useCurrentLocation(silent: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _useCurrentLocation({bool silent = false}) async {
    setState(() {
      _locating = true;
      _error = null;
    });
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        if (!silent && mounted) {
          setState(() {
            _error = 'Location permission is required to find venues near you.';
            _locating = false;
          });
        } else if (mounted) {
          setState(() => _locating = false);
        }
        return;
      }

      final pos = await Geolocator.getCurrentPosition();
      final point = LatLng(pos.latitude, pos.longitude);
      final label = await _reverseGeocode(point);
      if (!mounted) return;
      setState(() {
        _mapCenter = point;
        _addresses = [
          _AddressItem(
            title: 'Current location',
            subtitle: label,
            point: point,
          ),
        ];
        _locating = false;
      });
      _mapController.move(point, 14);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (!silent) _error = 'Could not get your location. Try search instead.';
        _locating = false;
      });
    }
  }

  Future<String> _reverseGeocode(LatLng point) async {
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.latitude}&lon=${point.longitude}',
      );
      final res = await http.get(uri, headers: const {'User-Agent': 'rezerveme-mobile/1.0'});
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        final display = body['display_name'] as String?;
        if (display != null && display.trim().isNotEmpty) return display.trim();
      }
    } catch (_) {}
    return '${point.latitude.toStringAsFixed(5)}, ${point.longitude.toStringAsFixed(5)}';
  }

  Future<void> _searchAddresses(String query) async {
    final q = query.trim();
    if (q.length < 3) return;
    setState(() {
      _searching = true;
      _error = null;
    });
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${Uri.encodeComponent(q)}',
      );
      final res = await http.get(uri, headers: const {'User-Agent': 'rezerveme-mobile/1.0'});
      if (res.statusCode < 200 || res.statusCode >= 300) throw Exception('Search failed');
      final list = jsonDecode(res.body) as List<dynamic>;
      final items = list.map((raw) {
        final m = raw as Map<String, dynamic>;
        final lat = double.tryParse('${m['lat']}') ?? 0;
        final lon = double.tryParse('${m['lon']}') ?? 0;
        final name = '${m['display_name']}';
        final short = name.length > 72 ? '${name.substring(0, 72)}…' : name;
        return _AddressItem(
          title: '${m['type'] ?? 'Place'}'.toString().toUpperCase(),
          subtitle: short,
          point: LatLng(lat, lon),
        );
      }).toList();
      if (!mounted) return;
      setState(() {
        _addresses = items;
        _searching = false;
        if (items.isNotEmpty) {
          _mapCenter = items.first.point;
          _mapController.move(_mapCenter, 12);
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _searching = false;
        _error = 'Could not search addresses. Check your connection.';
      });
    }
  }

  Future<void> _applyLocation(_AddressItem item) async {
    await UserLocation.setLastKnown(
      item.point.latitude,
      item.point.longitude,
      label: item.subtitle,
    );
    if (!mounted) return;
    if (widget.selectOnly) {
      Navigator.pop(context, true);
      return;
    }
    Navigator.pushAndRemoveUntil<void>(
      context,
      MaterialPageRoute<void>(builder: (context) => const LoginScreen()),
      (_) => false,
    );
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
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _mapCenter,
                    initialZoom: 11,
                    onTap: (_, point) async {
                      final label = await _reverseGeocode(point);
                      if (!mounted) return;
                      setState(() {
                        _addresses = [
                          _AddressItem(title: 'Pinned location', subtitle: label, point: point),
                        ];
                        _mapCenter = point;
                      });
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.rezervame.app',
                    ),
                    MarkerLayer(
                      markers: _addresses
                          .map(
                            (a) => Marker(
                              point: a.point,
                              width: 40,
                              height: 40,
                              child: const Icon(Icons.location_on, color: AppColors.primary500, size: 36),
                            ),
                          )
                          .toList(),
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
                        const SizedBox(width: 48),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  right: 16,
                  bottom: 24,
                  child: FloatingActionButton(
                    onPressed: _locating ? null : () => _useCurrentLocation(),
                    backgroundColor: AppColors.primary500,
                    elevation: 4,
                    child: _locating
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white),
                          )
                        : const Icon(Icons.my_location, color: AppColors.white),
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
                    onSubmitted: _searchAddresses,
                    decoration: InputDecoration(
                      hintText: 'Search city, street, or place',
                      hintStyle: AppTypography.body200.copyWith(color: AppColors.grey400),
                      prefixIcon: const Icon(Icons.search, color: AppColors.grey400),
                      suffixIcon: _searching
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary500),
                              ),
                            )
                          : IconButton(
                              icon: const Icon(Icons.search, color: AppColors.primary500),
                              onPressed: () => _searchAddresses(_searchController.text),
                            ),
                      filled: true,
                      fillColor: AppColors.grey25,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: AppTypography.body100.copyWith(color: AppColors.error)),
                  ],
                  const SizedBox(height: 24),
                  Text(
                    'Your Address',
                    style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                  ),
                  const SizedBox(height: 16),
                  if (_addresses.isEmpty)
                    Text(
                      'Search for a place or use your current location.',
                      style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
                    )
                  else
                    ..._addresses.map(
                      (a) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Material(
                          color: AppColors.grey25,
                          borderRadius: BorderRadius.circular(16),
                          child: InkWell(
                            onTap: () => _applyLocation(a),
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
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  if (_addresses.isNotEmpty)
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () => _applyLocation(_addresses.first),
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
}
