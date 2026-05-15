/// Shared appointment row for My Appointments, details, and invoice PDF.
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
    required this.statusKey,
    required this.ticketId,
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
  /// Translation key, e.g. [resConfirmed], [resPast].
  final String statusKey;
  final String ticketId;
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

  /// From legacy maps used in [MyReservationsScreen].
  factory AppointmentSummary.fromReservationMap(Map<String, dynamic> m) {
    final status = m['status'] as String? ?? 'resConfirmed';
    final ongoing = status == 'resConfirmed' || status == 'resUpcoming';
    return AppointmentSummary(
      id: '${m['id']}',
      venueName: m['venueName'] as String? ?? '',
      serviceName: m['service'] as String? ?? '',
      specialistName: m['specialist'] as String? ?? '',
      unsplashId: (m['img'] as String?)?.trim() ?? '',
      imageUrl: m['imageUrl'] as String?,
      dateLine: m['date'] as String? ?? '',
      timeLine: m['time'] as String? ?? '',
      locationLine: m['location'] as String? ?? '',
      price: m['price'] as String? ?? r'$0.00',
      statusKey: status,
      ticketId: m['ticketId'] as String? ?? 'RZV-${m['id']}-XKL',
      isOngoing: ongoing,
    );
  }
}
