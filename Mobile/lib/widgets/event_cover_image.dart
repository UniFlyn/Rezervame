import 'dart:convert';

import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/event_image_util.dart';

/// Event hero image from API `imageKey` (network, data URI, or placeholder).
class EventCoverImage extends StatelessWidget {
  const EventCoverImage({
    super.key,
    required this.imageKey,
    this.height = 200,
    this.width,
    this.borderRadius,
    this.fit = BoxFit.cover,
  });

  final String? imageKey;
  final double height;
  final double? width;
  final BorderRadius? borderRadius;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.zero;
    final key = (imageKey ?? '').trim();

    Widget placeholder() => SizedBox(
          height: height,
          width: width ?? double.infinity,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: AppColors.grey100,
              borderRadius: radius,
            ),
            child: const Center(
              child: Icon(Icons.event_rounded, color: AppColors.grey400, size: 44),
            ),
          ),
        );

    if (key.isEmpty) {
      return ClipRRect(borderRadius: radius, child: placeholder());
    }

    if (key.startsWith('data:image/')) {
      try {
        final bytes = base64Decode(key.split(',').last);
        return ClipRRect(
          borderRadius: radius,
          child: SizedBox(
            height: height,
            width: width ?? double.infinity,
            child: Image.memory(bytes, width: double.infinity, height: height, fit: fit),
          ),
        );
      } catch (_) {
        return ClipRRect(borderRadius: radius, child: placeholder());
      }
    }

    final url = resolveEventImageUrl(key);
    if (url.isEmpty) {
      return ClipRRect(borderRadius: radius, child: placeholder());
    }

    return ClipRRect(
      borderRadius: radius,
      child: SizedBox(
        height: height,
        width: width ?? double.infinity,
        child: Image.network(
          url,
          width: double.infinity,
          height: height,
          fit: fit,
          errorBuilder: (_, __, ___) => placeholder(),
        ),
      ),
    );
  }
}
