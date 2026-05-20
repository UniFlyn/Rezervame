/// Shared appointment row for lists and invoice PDF.
class AppointmentSummary {
  const AppointmentSummary({
    required this.id,
    required this.venueName,
    required this.serviceName,
    required this.specialistName,
    required this.unsplashId,
    this.imageUrl,
    required this.dateLine,
    required this.timeLine,
    required this.locationLine,
    required this.price,
    required this.status,
    required this.refNumber,
    required this.isOngoing,
  });

  final String id;
  final String venueName;
  final String serviceName;
  final String specialistName;
  final String unsplashId;
  final String? imageUrl;
  final String dateLine;
  final String timeLine;
  final String locationLine;
  final String price;
  /// Web status: pending | confirmed | paid | rescheduled | completed | cancelled
  final String status;
  final String refNumber;
  final bool isOngoing;

  String get heroImageUrl {
    if (imageUrl != null && imageUrl!.isNotEmpty) return imageUrl!;
    if (unsplashId.isNotEmpty) {
      return 'https://images.unsplash.com/photo-$unsplashId?q=80&w=900&fit=crop';
    }
    return '';
  }

  String get listThumbUrl {
    if (imageUrl != null && imageUrl!.isNotEmpty) return imageUrl!;
    if (unsplashId.isNotEmpty) {
      return 'https://images.unsplash.com/photo-$unsplashId?q=80&w=400&fit=crop';
    }
    return '';
  }

  factory AppointmentSummary.fromReservationMap(Map<String, dynamic> m) {
    final status = '${m['status'] ?? 'pending'}'.toLowerCase();
    final ongoing = status == 'pending' ||
        status == 'confirmed' ||
        status == 'paid' ||
        status == 'rescheduled';
    return AppointmentSummary(
      id: '${m['id']}',
      venueName: m['venueName'] as String? ?? '',
      serviceName: m['serviceName'] as String? ?? m['service'] as String? ?? '',
      specialistName: m['staffName'] as String? ?? m['specialist'] as String? ?? '',
      unsplashId: (m['img'] as String?)?.trim() ?? '',
      imageUrl: m['imageUrl'] as String?,
      dateLine: m['date'] as String? ?? '',
      timeLine: m['time'] as String? ?? '',
      locationLine: m['location'] as String? ?? m['address'] as String? ?? '',
      price: m['price'] as String? ?? r'$0.00',
      status: status,
      refNumber: '${m['refNumber'] ?? m['id']}',
      isOngoing: ongoing,
    );
  }
}
