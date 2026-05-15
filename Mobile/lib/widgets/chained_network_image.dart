import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
/// Loads a network image and, on failure, tries further URLs. No stock-photo fallbacks — ends on neutral fill.
class ChainedNetworkImage extends StatelessWidget {
  const ChainedNetworkImage({
    super.key,
    required this.urls,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.alignment = Alignment.center,
  });

  final List<String> urls;
  final BoxFit fit;
  final double? width;
  final double? height;
  final Alignment alignment;

  static String _unsplash(String id, int w) =>
      'https://images.unsplash.com/photo-$id?q=80&w=$w&fit=crop';

  /// Single Unsplash URL when [unsplashId] is a photo id; empty when absent (caller shows neutral placeholder).
  static List<String> urlsForUnsplashId(String? unsplashId, {int w = 500}) {
    final primary = (unsplashId ?? '').trim();
    if (primary.isEmpty) return [];
    return [_unsplash(primary, w)];
  }

  /// [primaryUrl] first (e.g. catalog URL), then Unsplash chain for [unsplashId].
  static List<String> chainFrom(
    String? primaryUrl,
    String? unsplashId, {
    int w = 500,
  }) {
    final out = <String>[];
    final p = primaryUrl?.trim() ?? '';
    if (p.isNotEmpty) out.add(p);
    for (final u in urlsForUnsplashId(unsplashId, w: w)) {
      if (!out.contains(u)) out.add(u);
    }
    return out;
  }

  @override
  Widget build(BuildContext context) {
    Widget child = _ChainedInner(urls: urls, fit: fit, width: width, height: height);
    if (width != null || height != null) {
      child = SizedBox(width: width, height: height, child: child);
    }
    return child;
  }
}

class _ChainedInner extends StatelessWidget {
  const _ChainedInner({
    required this.urls,
    required this.fit,
    this.width,
    this.height,
  });

  final List<String> urls;
  final BoxFit fit;
  final double? width;
  final double? height;

  Widget _layer(int i) {
    if (i >= urls.length) {
      return ColoredBox(color: AppColors.grey200);
    }
    return Image.network(
      urls[i],
      fit: fit,
      width: width,
      height: height,
      errorBuilder: (_, __, ___) => _layer(i + 1),
    );
  }

  @override
  Widget build(BuildContext context) => _layer(0);
}
