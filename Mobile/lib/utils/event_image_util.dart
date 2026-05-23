/// Resolve event cover URLs from API `imageKey` (http, data URI, or Unsplash id).
String resolveEventImageUrl(String? imageKey) {
  final key = (imageKey ?? '').trim();
  if (key.isEmpty) return '';
  if (key.startsWith('http') || key.startsWith('/') || key.startsWith('data:')) {
    return key;
  }
  final id = key.replaceFirst(RegExp(r'^photo-'), '');
  return 'https://images.unsplash.com/photo-$id?q=80&w=800&fit=crop';
}
