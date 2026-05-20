import '../data/api_config.dart';

/// Resolves API media paths to absolute URLs (matches Web `venueCardImageSrc` behavior).
String? resolveMediaUrl(String? raw) {
  if (raw == null) return null;
  final s = raw.trim();
  if (s.isEmpty || s == 'null') return null;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) {
    return s;
  }
  if (s.startsWith('/')) {
    final apiBase = resolveApiBaseUrl();
    final origin = apiBase.replaceAll(RegExp(r'/api$'), '');
    return '$origin$s';
  }
  return s;
}

/// Unsplash photo id from a full unsplash URL, or the raw id if already short.
String? extractUnsplashPhotoId(String? raw) {
  if (raw == null) return null;
  final s = raw.trim();
  if (s.isEmpty) return null;
  if (s.startsWith('http') && s.contains('unsplash.com')) {
    final m = RegExp(r'photo-([a-zA-Z0-9_-]+)').firstMatch(s);
    return m?.group(1);
  }
  if (!s.startsWith('http') && !s.startsWith('data:') && s.length < 64) {
    return s.replaceFirst(RegExp(r'^photo-'), '');
  }
  return null;
}
