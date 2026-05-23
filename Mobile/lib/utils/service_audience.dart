/// Service audience filters — parity with Web [VenueClient] tag matching.
bool matchesServiceAudience(String? tag, List<String> keywords) {
  final t = (tag ?? '').toLowerCase();
  if (t.isEmpty) return false;
  return keywords.any((k) => t.contains(k.toLowerCase()));
}

bool serviceMatchesAudienceFilter(String? tag, String filterId) {
  switch (filterId) {
    case 'women':
      return matchesServiceAudience(tag, ['mujer', 'woman', 'women', 'female', 'femenin']);
    case 'men':
      return matchesServiceAudience(tag, ['hombre', 'man', 'men', 'male', 'masculin', 'barber']);
    case 'kids':
      return matchesServiceAudience(tag, ['niño', 'nino', 'kid', 'kids', 'child', 'children', 'infant']);
    default:
      return true;
  }
}

List<Map<String, String>> buildServiceAudienceFilters(List<Map<String, dynamic>> services) {
  final filters = <Map<String, String>>[
    {'id': 'all', 'label': 'ALL'},
  ];
  if (services.any((s) => serviceMatchesAudienceFilter('${s['tag']}', 'women'))) {
    filters.add({'id': 'women', 'label': 'Women'});
  }
  if (services.any((s) => serviceMatchesAudienceFilter('${s['tag']}', 'men'))) {
    filters.add({'id': 'men', 'label': 'Men'});
  }
  if (services.any((s) => serviceMatchesAudienceFilter('${s['tag']}', 'kids'))) {
    filters.add({'id': 'kids', 'label': 'Children'});
  }
  return filters;
}
