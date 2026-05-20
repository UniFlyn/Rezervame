import 'dart:convert';

import 'package:intl/intl.dart';

import 'image_url.dart';

/// Slot generation, staff availability, and booking group mapping — aligned with Web profile/reservation.

const _weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/// Web reservation status values.
typedef WebReservationStatus = String; // pending | confirmed | paid | rescheduled | completed | cancelled

List<String> generateSlotsForDay(List<Map<String, dynamic>>? schedule, DateTime day) {
  const defaultSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM',
  ];
  if (schedule == null || schedule.isEmpty) return defaultSlots;

  final dayName = _weekdays[day.weekday % 7];
  Map<String, dynamic>? matching;
  for (final s in schedule) {
    final d = '${s['day'] ?? ''}'.trim();
    if (d.toLowerCase() == dayName.toLowerCase()) {
      matching = s;
      break;
    }
  }
  if (matching == null) return defaultSlots;

  final hoursStr = '${matching['hours'] ?? ''}'.trim();
  if (hoursStr.toLowerCase() == 'closed') return [];

  final parts = hoursStr.split('-');
  if (parts.length != 2) return defaultSlots;

  final startMins = _parseToMinutes(parts[0].trim());
  var endMins = _parseToMinutes(parts[1].trim());
  if (endMins <= startMins) endMins = startMins + 540;

  final slots = <String>[];
  for (var mins = startMins; mins < endMins; mins += 30) {
    final h = mins ~/ 60;
    final m = mins % 60;
    final ampm = h >= 12 ? 'PM' : 'AM';
    final displayHour = h % 12 == 0 ? 12 : h % 12;
    slots.add('${displayHour.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')} $ampm');
  }
  return slots;
}

int _parseToMinutes(String t) {
  final m = RegExp(r'^(\d{1,2}):(\d{2})\s*(AM|PM)$', caseSensitive: false).firstMatch(t.trim());
  if (m == null) return 540;
  var h = int.parse(m.group(1)!);
  final mins = int.parse(m.group(2)!);
  final ampm = m.group(3)!.toUpperCase();
  if (ampm == 'PM' && h != 12) h += 12;
  if (ampm == 'AM' && h == 12) h = 0;
  return h * 60 + mins;
}

DateTime combineDateAndTime(DateTime day, String timeStr) {
  final d = DateTime(day.year, day.month, day.day);
  final m = RegExp(r'^(\d{1,2}):(\d{2})\s*(AM|PM)$', caseSensitive: false).firstMatch(timeStr.trim());
  if (m == null) {
    return d.add(const Duration(hours: 10, minutes: 30));
  }
  var h = int.parse(m.group(1)!);
  final min = int.parse(m.group(2)!);
  final ap = m.group(3)!.toUpperCase();
  if (ap == 'PM' && h != 12) h += 12;
  if (ap == 'AM' && h == 12) h = 0;
  return DateTime(d.year, d.month, d.day, h, min);
}

int parseDurationMinutes(Map<String, dynamic> service) {
  final time = '${service['time'] ?? service['duration'] ?? ''}';
  final m = RegExp(r'(\d+)\s*min', caseSensitive: false).firstMatch(time);
  if (m != null) return (int.tryParse(m.group(1)!) ?? 60).clamp(15, 480);
  final dur = service['duration'];
  if (dur is num) return dur.toInt().clamp(15, 480);
  return 60;
}

bool staffOffersService(Map<String, dynamic> member, String serviceId) {
  final ids = member['serviceIds'];
  if (ids == null) return true;
  if (ids is! List || ids.isEmpty) return true;
  return ids.map((e) => '$e').contains(serviceId);
}

({String mode, List<int> weekly, List<String> dates}) parseAvailability(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return (mode: 'weekly', weekly: [], dates: []);
  try {
    final j = jsonDecode(trimmed) as Map<String, dynamic>;
    if (j['v'] == 1 && j.containsKey('dates') && j['dates'] is List) {
      final dates = (j['dates'] as List).map((d) => '$d'.substring(0, 10)).where((d) => d.isNotEmpty).toSet().toList()..sort();
      return (mode: 'dates', weekly: [], dates: dates);
    }
    if (j['v'] == 1 && j['weekly'] is List) {
      final weekly = (j['weekly'] as List)
          .map((n) => (n as num).toInt())
          .where((n) => n >= 0 && n <= 6)
          .toSet()
          .toList()
        ..sort();
      return (mode: 'weekly', weekly: weekly, dates: []);
    }
  } catch (_) {}
  return (mode: 'weekly', weekly: [], dates: []);
}

bool staffAvailableOnDay(String? availabilityRaw, DateTime day) {
  final raw = (availabilityRaw ?? '').trim();
  if (raw.isEmpty) return true;
  final parsed = parseAvailability(raw);
  final ymd = '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
  if (parsed.mode == 'dates') {
    if (parsed.dates.isEmpty) return true;
    return parsed.dates.contains(ymd);
  }
  if (parsed.weekly.isEmpty) return true;
  return parsed.weekly.contains(day.weekday % 7);
}

bool isStaffBusyAtTime(List<Map<String, dynamic>> busySlots, DateTime day, String timeStr, {int durationMinutes = 30}) {
  if (busySlots.isEmpty) return false;
  final targetStart = combineDateAndTime(day, timeStr).millisecondsSinceEpoch;
  final targetEnd = targetStart + durationMinutes * 60000;
  for (final slot in busySlots) {
    final bStart = DateTime.tryParse('${slot['start']}')?.millisecondsSinceEpoch;
    final bEnd = DateTime.tryParse('${slot['end']}')?.millisecondsSinceEpoch;
    if (bStart == null || bEnd == null) continue;
    if (targetStart < bEnd && targetEnd > bStart) return true;
  }
  return false;
}

String mapItemStatusWeb(String? raw, {bool hasTransaction = false}) {
  final st = (raw ?? '').toLowerCase();
  if (st == 'completed') return 'completed';
  if (st == 'cancelled' || st == 'rejected') return 'cancelled';
  if (st == 'paid') return 'paid';
  if (st == 'rescheduled') return 'rescheduled';
  if (st == 'approved' || st == 'confirmed') {
    return hasTransaction ? 'paid' : 'confirmed';
  }
  return 'pending';
}

String refNumberFromId(String id) {
  var hash = 0;
  for (var i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.codeUnitAt(i);
    hash = hash & hash;
  }
  return '${hash.abs() % 90000 + 10000}';
}

String _venueImageFromBooking(Map<String, dynamic> b, Map<String, dynamic>? biz, Map<String, dynamic>? svc) {
  for (final candidate in [
    svc?['imageUrl'],
    biz?['bannerUrl'],
    biz?['logoUrl'],
  ]) {
    final resolved = resolveMediaUrl('$candidate');
    if (resolved != null) return resolved;
  }
  return '';
}

List<Map<String, dynamic>> groupAndMapBookings(List<Map<String, dynamic>> bookings, {String locale = 'en'}) {
  if (bookings.isEmpty) return [];
  final groups = <String, List<Map<String, dynamic>>>{};
  for (final b in bookings) {
    final biz = b['business'] as Map<String, dynamic>?;
    final businessId = '${b['businessId'] ?? biz?['id'] ?? ''}';
    final dateKey = '${b['date']}';
    final key = '${businessId}_$dateKey';
    groups.putIfAbsent(key, () => []).add(b);
  }
  return groups.values.map((g) => mapUserBookingGroup(g, locale: locale)).toList();
}

Map<String, dynamic> mapUserBookingGroup(List<Map<String, dynamic>> group, {String locale = 'en'}) {
  if (group.isEmpty) return {};
  final b = group.first;
  final date = DateTime.tryParse('${b['date']}')?.toLocal() ?? DateTime.now();
  final biz = b['business'] as Map<String, dynamic>?;
  final svc = b['service'] as Map<String, dynamic>?;
  final localeTag = locale == 'es' ? 'es_PA' : 'en_US';

  final dateDisplay = DateFormat.yMMMMd(localeTag).format(date);
  final timeDisplay = DateFormat.jm(localeTag).format(date);

  final items = group.map((item) {
    final itemSvc = item['service'] as Map<String, dynamic>?;
    final itemStaff = item['staff'] as Map<String, dynamic>?;
    final fm = item['familyMember'] as Map<String, dynamic>?;
    final txId = item['transactionId'];
    final priceNum = (item['price'] as num?) ?? 0;
    return {
      'id': '${item['id']}',
      'name': '${itemSvc?['name'] ?? 'Service'}',
      'price': priceNum.toStringAsFixed(2),
      'priceDisplay': '\$${priceNum.toStringAsFixed(2)}',
      'customerName': fm != null ? '${fm['name']}' : '${item['customerName'] ?? ''}',
      'staffName': '${itemStaff?['name'] ?? ''}',
      'status': mapItemStatusWeb('${item['status']}', hasTransaction: txId != null),
      'rawStatus': '${item['status']}',
      'isReviewed': item['isReviewed'] == true,
      'transactionId': txId,
    };
  }).toList();

  final activeItems = items.where((i) => i['status'] != 'cancelled').toList();
  String mainStatus;
  if (activeItems.isEmpty) {
    mainStatus = 'cancelled';
  } else if (activeItems.every((i) => i['status'] == 'completed')) {
    mainStatus = 'completed';
  } else if (activeItems.any((i) => i['status'] == 'pending')) {
    mainStatus = 'pending';
  } else if (activeItems.any((i) => i['status'] == 'rescheduled')) {
    mainStatus = 'rescheduled';
  } else if (activeItems.any((i) => i['status'] == 'paid')) {
    mainStatus = 'paid';
  } else {
    mainStatus = 'confirmed';
  }

  final subtotal = group.fold<double>(0, (sum, item) => sum + ((item['price'] as num?) ?? 0).toDouble());
  final taxAmount = group.fold<double>(0, (sum, item) {
    final stored = (item['taxAmount'] as num?) ?? 0;
    if (stored > 0) return sum + stored.toDouble();
    final taxPct = (biz?['taxPercentage'] as num?) ?? 0;
    return sum + (((item['price'] as num?) ?? 0).toDouble() * taxPct / 100);
  });
  final total = subtotal + taxAmount;
  final taxPct = (biz?['taxPercentage'] as num?) ?? 0;

  final staffName = '${b['staff'] is Map ? (b['staff'] as Map)['name'] : ''}'.trim();
  final customerName = fmNameFromBooking(b);

  return {
    'id': '${b['id']}',
    'bookingIds': group.map((g) => '${g['id']}').toList(),
    'refNumber': refNumberFromId('${b['id']}'),
    'venueName': '${biz?['name'] ?? '—'}',
    'serviceName': group.length > 1 ? '${group.length} Services' : '${svc?['name'] ?? '—'}',
    'service': group.length > 1 ? '${group.length} Services' : '${svc?['name'] ?? '—'}',
    'customerName': customerName,
    'staffName': staffName,
    'specialist': staffName,
    'professionalName': staffName,
    'date': dateDisplay,
    'time': timeDisplay,
    'dateIso': '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}',
    'status': mainStatus,
    'price': '\$${total.toStringAsFixed(2)}',
    'totalPrice': total,
    'subtotal': subtotal,
    'taxAmount': taxAmount,
    'taxPercentage': taxPct,
    'location': '${biz?['address'] ?? ''}',
    'address': '${biz?['address'] ?? ''}',
    'phone': '${biz?['phone'] ?? ''}',
    'imageUrl': _venueImageFromBooking(b, biz, svc),
    'img': _venueImageFromBooking(b, biz, svc),
    'businessId': '${b['businessId'] ?? biz?['id'] ?? ''}',
    'items': items,
    'isReviewed': items.every((i) => i['isReviewed'] == true),
    'paymentMethod': b['transaction'] is Map ? '${(b['transaction'] as Map)['paymentMethod'] ?? ''}' : '',
  };
}

String fmNameFromBooking(Map<String, dynamic> b) {
  final fm = b['familyMember'] as Map<String, dynamic>?;
  if (fm != null && '${fm['name']}'.trim().isNotEmpty) return '${fm['name']}';
  return '${b['customerName'] ?? ''}'.trim();
}

List<Map<String, dynamic>> parseScheduleFromBusiness(Map<String, dynamic>? biz) {
  if (biz == null) return [];
  final raw = biz['schedule'] ?? biz['hours'] ?? biz['openingHours'];
  if (raw is List) {
    return raw.cast<Map<String, dynamic>>();
  }
  if (raw is String && raw.trim().isNotEmpty) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) return decoded.cast<Map<String, dynamic>>();
    } catch (_) {}
  }
  return [];
}
