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

  String get heroImageUrl =>
      (imageUrl != null && imageUrl!.isNotEmpty)
          ? imageUrl!
          : 'https://images.unsplash.com/photo-$unsplashId?q=80&w=900&fit=crop';

  String get listThumbUrl =>
      (imageUrl != null && imageUrl!.isNotEmpty)
          ? imageUrl!
          : 'https://images.unsplash.com/photo-$unsplashId?q=80&w=400&fit=crop';

  /// From legacy maps used in [MyReservationsScreen].
  factory AppointmentSummary.fromReservationMap(Map<String, dynamic> m) {
    final status = m['status'] as String? ?? 'resConfirmed';
    final ongoing = status == 'resConfirmed' || status == 'resUpcoming';
    return AppointmentSummary(
      id: '${m['id']}',
      venueName: m['venueName'] as String? ?? '',
      serviceName: m['service'] as String? ?? '',
      specialistName: m['specialist'] as String? ?? 'Marco Tulio',
      unsplashId: m['img'] as String? ?? '1560066984-138dadb4c035',
      imageUrl: m['imageUrl'] as String?,
      dateLine: m['date'] as String? ?? '',
      timeLine: m['time'] as String? ?? '',
      locationLine: m['location'] as String? ?? 'Calle 50, Plaza Sigma, Panama City',
      price: m['price'] as String? ?? r'$0.00',
      statusKey: status,
      ticketId: m['ticketId'] as String? ?? 'RZV-${m['id']}-XKL',
      isOngoing: ongoing,
    );
  }
}
