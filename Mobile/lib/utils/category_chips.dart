/// Dynamic category chips from `/public/categories` (same source as home & admin).

class CategoryChipOption {
  const CategoryChipOption({required this.key, required this.label});

  /// `null` means "All services".
  final String? key;
  final String label;
}

List<CategoryChipOption> buildCategoryChipOptions(
  List<Map<String, dynamic>> apiRows, {
  required bool isEnglish,
  required String allLabel,
}) {
  final chips = <CategoryChipOption>[CategoryChipOption(key: null, label: allLabel)];
  for (final row in apiRows) {
    final key = '${row['key'] ?? ''}'.trim();
    if (key.isEmpty) continue;
    final label = isEnglish
        ? '${row['labelEn'] ?? row['label'] ?? key}'.trim()
        : '${row['labelEs'] ?? row['labelEn'] ?? row['label'] ?? key}'.trim();
    if (label.isEmpty) continue;
    chips.add(CategoryChipOption(key: key, label: label));
  }
  return chips;
}

Map<String, String> categoryPlaceholderUrls(List<Map<String, dynamic>> apiRows) {
  final out = <String, String>{};
  for (final row in apiRows) {
    final key = '${row['key'] ?? ''}'.trim();
    final url = '${row['imageUrl'] ?? ''}'.trim();
    if (key.isNotEmpty && url.isNotEmpty) out[key] = url;
  }
  return out;
}

bool venueMatchesCategoryKey(Map<String, dynamic> venue, String categoryKey) {
  final needle = categoryKey.trim().toLowerCase();
  if (needle.isEmpty) return true;
  final keys = venue['categoryKeys'];
  if (keys is List) {
    for (final k in keys) {
      if ('$k'.toLowerCase() == needle) return true;
    }
  }
  final primary = '${venue['category'] ?? venue['categoryKey'] ?? ''}'.toLowerCase();
  return primary == needle;
}
