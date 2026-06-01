// Payment method helpers — aligned with Web paymentMethod.ts.

bool isCashPaymentMethod(String? method) {
  if (method == null || method.trim().isEmpty) return false;
  final s = method.toLowerCase().trim();
  return s.contains('cash') || s.contains('at venue');
}

String resolveBookingPaymentMethod({
  String? paymentMethod,
  Map<String, dynamic>? transaction,
}) {
  final tx = transaction?['paymentMethod'];
  final pref = paymentMethod;
  final raw = '${tx ?? pref ?? ''}'.trim();
  return raw;
}

String mapBookingItemUiStatus({
  String? status,
  String? transactionId,
  String? paymentMethod,
  Map<String, dynamic>? transaction,
}) {
  final payMethod = resolveBookingPaymentMethod(
    paymentMethod: paymentMethod,
    transaction: transaction,
  );
  final cash = isCashPaymentMethod(payMethod);
  final st = (status ?? '').toLowerCase();

  if (st == 'completed') return 'completed';
  if (st == 'cancelled' || st == 'rejected') return 'cancelled';
  if (st == 'rescheduled') return 'rescheduled';
  if (st == 'paid') return 'paid';
  if (st == 'approved' || st == 'confirmed') {
    if (transactionId != null && transactionId.isNotEmpty) {
      return 'paid';
    }
    if (cash) return 'cash_at_venue';
    return 'confirmed';
  }
  return 'pending';
}

String apiPaymentMethodForCheckoutTab(String tab) {
  switch (tab) {
    case 'yappy':
      return 'Yappy';
    case 'cash':
      return 'Cash Payment';
    case 'card':
    default:
      return 'Card Payment';
  }
}

/// Group-level status — aligned with Web `aggregateGroupUiStatus`.
String aggregateGroupUiStatus(List<String> itemStatuses) {
  final active = itemStatuses.where((s) => s != 'cancelled').toList();
  if (active.isEmpty) return 'cancelled';
  if (active.every((s) => s == 'completed')) return 'completed';
  if (active.any((s) => s == 'pending')) return 'pending';
  if (active.any((s) => s == 'rescheduled')) return 'rescheduled';
  if (active.any((s) => s == 'cash_at_venue')) return 'cash_at_venue';
  if (active.every((s) => s == 'paid')) return 'paid';
  return 'confirmed';
}

String apiPaymentMethodForPayTab(String tab) {
  switch (tab) {
    case 'yappy':
      return 'Yappy';
    case 'cash':
      return 'Cash Payment';
    case 'card':
    default:
      return 'Card Payment';
  }
}
