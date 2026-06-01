/// Normalize legacy (`card`/`cash`) and new (`wompi`/`pay_at_venue`) payment-config API shapes.
Map<String, dynamic> normalizePaymentConfig(Map<String, dynamic>? cfg) {
  final raw = cfg ?? <String, dynamic>{};
  final defaultCommission = (raw['defaultCommission'] as num?)?.toDouble() ?? 15.0;
  final rawMethods = raw['methods'];
  final methods = <Map<String, dynamic>>[];

  if (rawMethods is List) {
    for (final item in rawMethods) {
      if (item is! Map) continue;
      final m = Map<String, dynamic>.from(item);
      final rawId = '${m['id'] ?? ''}';
      final id = _mapMethodId(rawId);
      final enabled = m['enabled'] != false;
      final configured = m['configured'] is bool
          ? m['configured'] as bool
          : _inferConfigured(rawId, raw);

      var label = '${m['label'] ?? ''}'.trim();
      if (label.isEmpty) {
        if (id == 'wompi') {
          label = 'Card';
        } else if (id == 'yappy') {
          label = 'Yappy';
        } else {
          label = 'Pay by visit';
        }
      }

      methods.add({
        'id': id,
        'label': label,
        'enabled': enabled,
        'configured': configured,
      });
    }
  }

  if (methods.isEmpty) {
    final payAtVenue =
        raw['cashPayEnabled'] != false && raw['payAtVenueEnabled'] != false;
    methods.addAll([
      {'id': 'wompi', 'label': 'Card', 'enabled': false, 'configured': false},
      {'id': 'yappy', 'label': 'Yappy', 'enabled': false, 'configured': false},
      {
        'id': 'pay_at_venue',
        'label': 'Pay by visit',
        'enabled': payAtVenue,
        'configured': true,
      },
    ]);
  }

  return {
    'defaultCommission': defaultCommission,
    'methods': methods,
  };
}

String _mapMethodId(String rawId) {
  if (rawId == 'wompi' || rawId == 'card') return 'wompi';
  if (rawId == 'yappy') return 'yappy';
  return 'pay_at_venue';
}

bool _inferConfigured(String rawId, Map<String, dynamic> cfg) {
  if (rawId == 'cash' || rawId == 'pay_at_venue') return true;
  if (rawId == 'wompi' || rawId == 'card') {
    return cfg['wompiConfigured'] == true || cfg['stripeEnabled'] == true;
  }
  if (rawId == 'yappy') return cfg['yappyConfigured'] == true;
  return false;
}

bool isPaymentMethodSelectable(Map<String, dynamic> method) {
  return method['enabled'] != false && method['configured'] == true;
}

String pickDefaultPaymentMethodId(List<Map<String, dynamic>> methods) {
  final selectable = methods.where(isPaymentMethodSelectable).toList();
  for (final m in selectable) {
    if ('${m['id']}' == 'pay_at_venue') return 'pay_at_venue';
  }
  if (selectable.isNotEmpty) return '${selectable.first['id']}';
  return 'pay_at_venue';
}

List<Map<String, dynamic>> selectablePaymentMethods(
  List<Map<String, dynamic>> methods,
) {
  return methods.where(isPaymentMethodSelectable).toList();
}
