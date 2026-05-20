import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'app_colors.dart';
import 'app_typography.dart';

/// Backend rejects data URIs larger than ~300KB ([safeImageUrl] in API).
const int kMaxAvatarDataUriLength = 280000;

/// Picks an image from gallery or camera and returns a `data:image/...;base64,...` URI.
Future<String?> pickAvatarDataUri(BuildContext context) async {
  final source = await showModalBottomSheet<ImageSource>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (ctx) => SafeArea(
      child: Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: AppColors.primary500),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AppColors.primary500),
              title: const Text('Take a photo'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
          ],
        ),
      ),
    ),
  );

  if (source == null || !context.mounted) return null;

  final picker = ImagePicker();
  final file = await picker.pickImage(
    source: source,
    maxWidth: 400,
    maxHeight: 400,
    imageQuality: 65,
  );
  if (file == null) return null;

  final bytes = await file.readAsBytes();
  final dataUri = bytesToAvatarDataUri(bytes, pathHint: file.path);
  if (dataUri == null && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Image is too large. Please choose a smaller photo.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
  return dataUri;
}

/// Encodes [bytes] as a JPEG data URI, re-compressing if over [kMaxAvatarDataUriLength].
String? bytesToAvatarDataUri(Uint8List bytes, {String? pathHint}) {
  final lower = (pathHint ?? '').toLowerCase();
  final isPng = lower.endsWith('.png');
  final mime = isPng ? 'image/png' : 'image/jpeg';
  var dataUri = 'data:$mime;base64,${base64Encode(bytes)}';

  if (dataUri.length <= kMaxAvatarDataUriLength) return dataUri;

  // Retry as JPEG with lower quality by re-picking isn't available — ask user to use a smaller image.
  if (!isPng) {
    return null;
  }

  dataUri = 'data:image/jpeg;base64,${base64Encode(bytes)}';
  if (dataUri.length <= kMaxAvatarDataUriLength) return dataUri;
  return null;
}

/// Circle avatar from http(s) URL, data URI, or initials fallback.
Widget buildProfileAvatar({
  required String? imageUrl,
  required String initials,
  double radius = 60,
}) {
  final url = (imageUrl ?? '').trim();

  if (url.startsWith('data:')) {
    final bytes = _decodeDataUri(url);
    if (bytes != null) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: AppColors.grey100,
        backgroundImage: MemoryImage(bytes),
      );
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.grey100,
      backgroundImage: NetworkImage(url),
    );
  }

  return CircleAvatar(
    radius: radius,
    backgroundColor: AppColors.grey100,
    child: Text(
      initials,
      style: AppTypography.heading300.copyWith(
        color: AppColors.grey700,
        fontSize: radius * 0.45,
      ),
    ),
  );
}

Uint8List? _decodeDataUri(String dataUri) {
  final comma = dataUri.indexOf(',');
  if (comma < 0) return null;
  try {
    return base64Decode(dataUri.substring(comma + 1));
  } catch (_) {
    return null;
  }
}
