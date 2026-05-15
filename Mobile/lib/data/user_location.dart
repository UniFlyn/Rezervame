import 'package:shared_preferences/shared_preferences.dart';

/// Optional WGS84 point for distance labels on venue APIs (`userLat` / `userLng` query params).
class UserLocation {
  static const _latKey = 'rezervame_user_lat';
  static const _lngKey = 'rezervame_user_lng';

  static Future<void> setLastKnown(double? lat, double? lng) async {
    final p = await SharedPreferences.getInstance();
    if (lat == null || lng == null) {
      await p.remove(_latKey);
      await p.remove(_lngKey);
      return;
    }
    await p.setDouble(_latKey, lat);
    await p.setDouble(_lngKey, lng);
  }

  static Future<({double lat, double lng})?> getLastKnown() async {
    final p = await SharedPreferences.getInstance();
    if (!p.containsKey(_latKey) || !p.containsKey(_lngKey)) return null;
    final lat = p.getDouble(_latKey);
    final lng = p.getDouble(_lngKey);
    if (lat == null || lng == null) return null;
    return (lat: lat, lng: lng);
  }
}
