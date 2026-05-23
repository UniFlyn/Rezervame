import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Persists user language choice (`en` | `es`).
class LocalePreferences {
  LocalePreferences._();

  static const _key = 'rezervame_app_locale';

  static Future<Locale?> loadSavedLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_key)?.trim().toLowerCase();
    if (code == 'es') return const Locale('es');
    if (code == 'en') return const Locale('en');
    return null;
  }

  static Future<void> saveLocale(Locale locale) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, locale.languageCode);
  }
}
