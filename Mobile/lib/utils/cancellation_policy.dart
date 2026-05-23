// Customer cancellation rules — mirrors shared/cancellationPolicy.ts and backend util.

class CancellationPolicyConfig {
  const CancellationPolicyConfig({required this.allowed, required this.hoursBefore});

  final bool allowed;
  final int hoursBefore;

  factory CancellationPolicyConfig.fromBusiness(Map<String, dynamic>? business) {
    if (business == null) {
      return const CancellationPolicyConfig(allowed: true, hoursBefore: 24);
    }
    final allowed = business['cancellationAllowed'] != false;
    final raw = business['cancellationHoursBefore'];
    final hours = raw is num ? raw.toInt() : int.tryParse('$raw') ?? 24;
    return CancellationPolicyConfig(allowed: allowed, hoursBefore: hours < 0 ? 24 : hours);
  }
}

String formatCancellationPolicyMessage(CancellationPolicyConfig policy, {bool isEn = true}) {
  if (!policy.allowed) {
    return isEn
        ? 'This business does not allow cancellations.'
        : 'Este negocio no permite cancelaciones.';
  }
  if (policy.hoursBefore <= 0) {
    return isEn
        ? 'You may cancel anytime before your appointment.'
        : 'Puedes cancelar en cualquier momento antes de tu cita.';
  }
  return isEn
      ? 'Cancellations must be done ${policy.hoursBefore}h before.'
      : 'Las cancelaciones deben hacerse ${policy.hoursBefore}h antes.';
}

String policyMessageForBooking({
  required String status,
  required DateTime? appointmentAt,
  String? transactionId,
  CancellationPolicyConfig? policy,
  bool isEn = true,
}) {
  final s = status.toLowerCase();
  if (s == 'pending' && (transactionId == null || transactionId.isEmpty)) {
    return isEn
        ? 'You may cancel before the venue accepts your booking.'
        : 'Puedes cancelar antes de que el negocio acepte tu reserva.';
  }
  return formatCancellationPolicyMessage(policy ?? const CancellationPolicyConfig(allowed: true, hoursBefore: 24), isEn: isEn);
}

bool canCustomerCancelBooking({
  required String rawStatus,
  required DateTime? appointmentAt,
  String? transactionId,
  CancellationPolicyConfig? policy,
  DateTime? now,
}) {
  final status = rawStatus.trim();
  if (status == 'Completed' || status == 'Cancelled' || status == 'Rejected') {
    return false;
  }
  if (status == 'Pending' && (transactionId == null || transactionId.isEmpty)) {
    return true;
  }
  final p = policy ?? const CancellationPolicyConfig(allowed: true, hoursBefore: 24);
  if (!p.allowed) return false;
  if (appointmentAt == null || p.hoursBefore <= 0) return true;
  final clock = now ?? DateTime.now();
  final deadline = appointmentAt.subtract(Duration(hours: p.hoursBefore));
  return !clock.isAfter(deadline);
}
