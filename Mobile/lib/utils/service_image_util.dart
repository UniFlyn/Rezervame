import '../models/venue_listing.dart';
import 'image_url.dart';

/// Collects resolved portfolio URLs (gallery, then banner, then logo).
List<String> businessPortfolioUrls({
  List<String>? gallery,
  String? bannerUrl,
  String? logoUrl,
}) {
  final out = <String>[];
  void add(String? raw) {
    final resolved = resolveMediaUrl(raw);
    if (resolved != null && !out.contains(resolved)) out.add(resolved);
  }
  if (gallery != null) {
    for (final u in gallery) {
      add(u);
    }
  }
  add(bannerUrl);
  add(logoUrl);
  return out;
}

/// Stable pick from [portfolio] so the same [seed] always gets the same image.
String? pickPortfolioImageUrl(List<String> portfolio, String seed) {
  if (portfolio.isEmpty) return null;
  final idx = VenueListing.stableHash32(seed) % portfolio.length;
  return portfolio[idx];
}

/// Service image first, then a deterministic portfolio image, then remaining portfolio URLs.
List<String> serviceImageUrlsChain({
  String? serviceImageUrl,
  List<String> portfolioUrls = const [],
  String? seed,
}) {
  final out = <String>[];
  void add(String? raw) {
    final resolved = resolveMediaUrl(raw);
    if (resolved != null && !out.contains(resolved)) out.add(resolved);
  }

  add(serviceImageUrl);

  final portfolio = portfolioUrls
      .map((u) => resolveMediaUrl(u))
      .whereType<String>()
      .where((u) => u.isNotEmpty)
      .toList();

  final key = (seed ?? '').trim();
  if (portfolio.isNotEmpty) {
    if (key.isNotEmpty) {
      add(pickPortfolioImageUrl(portfolio, key));
      final start = VenueListing.stableHash32(key) % portfolio.length;
      for (var i = 0; i < portfolio.length; i++) {
        add(portfolio[(start + i) % portfolio.length]);
      }
    } else {
      for (final u in portfolio) {
        add(u);
      }
    }
  }
  return out;
}
