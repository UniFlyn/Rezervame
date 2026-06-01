/// S3 image URLs shared with Web/Admin (`shared/s3Assets.json`).
class S3Assets {
  S3Assets._();

  static const String publicBaseUrl =
      'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com';

  static const String bucket = 'rezervame-assets-abs';

  static const Map<String, String> defaultCategories = {
    'hairService':
        'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/hairService.jpg',
    'spaService':
        'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/spaService.jpg',
    'nailCare':
        'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/nailCare.jpg',
    'beautyService':
        'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/beautyService.jpg',
    'barber':
        'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/barber.jpg',
    'Massage':
        'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/Massage.jpg',
    'massage':
        'https://rezervame-assets-abs.s3.ap-southeast-2.amazonaws.com/uploads/defaults/categories/massage.jpg',
    'tattoo':
        'https://images.unsplash.com/photo-1560707303-4e980ce876ad?q=80&w=600&fit=crop',
    'yoga':
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&fit=crop',
    'estetica':
        'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&fit=crop',
    'dermatology':
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&fit=crop',
  };

  static String? defaultCategoryUrl(String key) {
    final k = key.trim();
    if (k.isEmpty) return null;
    return defaultCategories[k] ?? defaultCategories[k.toLowerCase()];
  }

  static bool isS3PublicUrl(String? url) {
    if (url == null || url.trim().isEmpty) return false;
    return url.startsWith(publicBaseUrl) || url.contains('$bucket.s3.');
  }
}
