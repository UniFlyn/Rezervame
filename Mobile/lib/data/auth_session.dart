import 'package:shared_preferences/shared_preferences.dart';

/// Persists only the session token. User profile fields come from `/auth/user-session`.
class AuthSession {
  static const _tokenKey = 'rezervame_token';

  static Future<String?> getToken() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_tokenKey);
  }

  static Future<void> setToken(String? value) async {
    final p = await SharedPreferences.getInstance();
    if (value == null || value.isEmpty) {
      await p.remove(_tokenKey);
    } else {
      await p.setString(_tokenKey, value);
    }
  }
}
