import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/image_url.dart';
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
    final p = resolveMediaUrl(primaryUrl);
    if (p != null) out.add(p);
    final id = extractUnsplashPhotoId(unsplashId) ?? extractUnsplashPhotoId(primaryUrl);
    for (final u in urlsForUnsplashId(id, w: w)) {
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
    // Filter out null-like or empty strings dynamically
    final validUrls = urls
        .map((u) => resolveMediaUrl(u.trim()) ?? '')
        .where((u) => u.isNotEmpty && u != 'null')
        .toList();

    if (i >= validUrls.length) {
      return Container(
        color: AppColors.grey200,
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.image_not_supported_outlined,
                color: AppColors.grey400,
                size: 40,
              ),
              SizedBox(height: 8),
              Text(
                'No image',
                style: TextStyle(
                  color: AppColors.grey400,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    String url = validUrls[i];
    try {
      if (!kIsWeb && Platform.isAndroid) {
        url = url.replaceAll('localhost', '10.0.2.2').replaceAll('127.0.0.1', '10.0.2.2');
      }
    } catch (_) {}

    if (url.startsWith('data:image')) {
      try {
        final comma = url.indexOf(',');
        if (comma > 0) {
          final bytes = base64Decode(url.substring(comma + 1));
          return Image.memory(
            bytes,
            fit: fit,
            width: width,
            height: height,
            errorBuilder: (_, __, ___) => _layer(i + 1),
          );
        }
      } catch (_) {}
      return _layer(i + 1);
    }

    return Image.network(
      url,
      fit: fit,
      width: width,
      height: height,
      errorBuilder: (_, __, ___) => _layer(i + 1),
    );
  }

  @override
  Widget build(BuildContext context) => _layer(0);
}
