import 'package:shared_preferences/shared_preferences.dart';

/// Persists only the session token. User profile fields come from `/auth/user-session`.
class AuthSession {
  static const _tokenKey = 'rezervame_token';
  static const _expiresKey = 'rezervame_session_expires_at';

  static Future<String?> getToken() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_tokenKey);
  }

  static Future<void> setToken(String? value, {String? sessionExpiresAt}) async {
    final p = await SharedPreferences.getInstance();
    if (value == null || value.isEmpty) {
      await p.remove(_tokenKey);
      await p.remove(_expiresKey);
    } else {
      await p.setString(_tokenKey, value);
      if (sessionExpiresAt != null && sessionExpiresAt.isNotEmpty) {
        await p.setString(_expiresKey, sessionExpiresAt);
      }
    }
  }

  static Future<bool> isSessionExpired() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_expiresKey);
    if (raw == null || raw.isEmpty) return false;
    final expires = DateTime.tryParse(raw);
    if (expires == null) return false;
    return DateTime.now().isAfter(expires);
  }
}
