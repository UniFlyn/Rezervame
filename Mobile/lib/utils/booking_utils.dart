import 'dart:convert';

import 'package:intl/intl.dart';

import 'image_url.dart';
import 'cancellation_policy.dart';
import 'payment_method.dart';

/// Mirrors Web `computeBookingTotals`.
({double subtotal, double taxAmount, double taxPercentage, double commissionAmount, double commissionPercent, double totalPrice})
    computeBookingTotals(
  List<Map<String, dynamic>> group,
  double taxPercentage,
  double commissionPercent,
) {
  final subtotal = group.fold<double>(0, (sum, item) => sum + _bookingPrice(item));
  final taxPct = taxPercentage.isFinite && taxPercentage >= 0 ? taxPercentage : 0;
  final taxAmount = group.fold<double>(0, (sum, item) {
    final storedRaw = item['taxAmount'];
    final stored = storedRaw is num ? storedRaw.toDouble() : (double.tryParse('$storedRaw') ?? 0);
    if (stored > 0) return sum + stored;
    return sum + (_bookingPrice(item) * taxPct / 100);
  });
  final commPct = commissionPercent.isFinite && commissionPercent >= 0 ? commissionPercent : 15;
  final commissionAmount = double.parse(((subtotal * commPct) / 100).toStringAsFixed(2));
  final totalPrice = double.parse((subtotal + commissionAmount + taxAmount).toStringAsFixed(2));
  return (
    subtotal: subtotal,
    taxAmount: taxAmount,
    taxPercentage: taxPct.toDouble(),
    commissionAmount: commissionAmount,
    commissionPercent: commPct.toDouble(),
    totalPrice: totalPrice,
  );
}

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

bool isSameLocalDay(DateTime a, DateTime b) {
  return a.year == b.year && a.month == b.month && a.day == b.day;
}

/// True when [day] is today and [timeStr] is not strictly after the current clock time (8:00 → past at 8:00).
bool isTimeSlotInPast(DateTime day, String timeStr, {DateTime? now}) {
  final clock = now ?? DateTime.now();
  if (!isSameLocalDay(day, clock)) return false;
  return !combineDateAndTime(day, timeStr).isAfter(clock);
}

/// Drops past slots when booking for today; future days unchanged.
List<String> filterBookableTimeSlots(List<String> slots, DateTime day, {DateTime? now}) {
  final clock = now ?? DateTime.now();
  if (!isSameLocalDay(day, clock)) return slots;
  return slots.where((t) => !isTimeSlotInPast(day, t, now: clock)).toList();
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

String mapItemStatusWeb(
  String? raw, {
  String? transactionId,
  String? paymentMethod,
  Map<String, dynamic>? transaction,
}) {
  return mapBookingItemUiStatus(
    status: raw,
    transactionId: transactionId,
    paymentMethod: paymentMethod,
    transaction: transaction,
  );
}

double _bookingPrice(Map<String, dynamic> item) {
  final p = item['price'];
  if (p is num) return p.toDouble();
  return double.tryParse('$p') ?? 0;
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

String _safeDateDisplay(DateTime date, String localeTag) {
  try {
    return DateFormat.yMMMMd(localeTag).format(date);
  } catch (_) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

String _safeTimeDisplay(DateTime date, String localeTag) {
  try {
    return DateFormat.jm(localeTag).format(date);
  } catch (_) {
    var h = date.hour % 12;
    if (h == 0) h = 12;
    final m = date.minute.toString().padLeft(2, '0');
    final ap = date.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $ap';
  }
}

/// Last-resort card shape when [mapUserBookingGroup] fails (keeps list usable).
Map<String, dynamic> minimalBookingGroupFromRaw(Map<String, dynamic> b) {
  final id = '${b['id'] ?? ''}'.trim();
  if (id.isEmpty) return {};
  final biz = b['business'] is Map ? Map<String, dynamic>.from(b['business'] as Map) : null;
  final svc = b['service'] is Map ? Map<String, dynamic>.from(b['service'] as Map) : null;
  final date = DateTime.tryParse('${b['date']}')?.toLocal() ?? DateTime.now();
  final priceNum = _bookingPrice(b);
  final statusRaw = '${b['status'] ?? ''}'.toLowerCase();
  final status = statusRaw.contains('cancel')
      ? 'cancelled'
      : statusRaw.contains('complete')
          ? 'completed'
          : statusRaw.contains('paid')
              ? 'paid'
              : 'pending';
  return {
    'id': id,
    'bookingIds': [id],
    'refNumber': refNumberFromId(id),
    'venueName': '${biz?['name'] ?? 'Venue'}',
    'serviceName': '${svc?['name'] ?? 'Service'}',
    'service': '${svc?['name'] ?? 'Service'}',
    'date': _safeDateDisplay(date, 'en_US'),
    'time': _safeTimeDisplay(date, 'en_US'),
    'status': status,
    'price': '\$${priceNum.toStringAsFixed(2)}',
    'totalPrice': priceNum,
    'subtotal': priceNum,
    'taxAmount': 0.0,
    'taxPercentage': 0,
    'location': '${biz?['address'] ?? ''}',
    'address': '${biz?['address'] ?? ''}',
    'imageUrl': _venueImageFromBooking(b, biz, svc),
    'img': _venueImageFromBooking(b, biz, svc),
    'businessId': '${b['businessId'] ?? biz?['id'] ?? ''}',
    'items': [
      {
        'id': id,
        'name': '${svc?['name'] ?? 'Service'}',
        'price': priceNum.toStringAsFixed(2),
        'status': status,
        'rawStatus': '${b['status'] ?? ''}',
      },
    ],
  };
}

String _appointmentDayKey(dynamic iso) {
  final d = DateTime.tryParse('$iso')?.toLocal();
  if (d == null) return 'unknown';
  final y = d.year;
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y-$m-$day';
}

String bookingGroupKey(Map<String, dynamic> b) {
  final gid = '${b['bookingGroupId'] ?? ''}'.trim();
  if (gid.isNotEmpty) return 'gid_$gid';
  final biz = b['business'] as Map<String, dynamic>?;
  final businessId = '${b['businessId'] ?? biz?['id'] ?? ''}';
  return '${businessId}_${_appointmentDayKey(b['date'])}';
}

List<Map<String, dynamic>> groupAndMapBookings(
  List<Map<String, dynamic>> bookings, {
  String locale = 'en',
  double commissionPercent = 15,
}) {
  if (bookings.isEmpty) return [];
  try {
    final groups = <String, List<Map<String, dynamic>>>{};
    for (final b in bookings) {
      final key = bookingGroupKey(b);
      groups.putIfAbsent(key, () => []).add(b);
    }
    final rows = groups.entries.map((e) {
      final g = e.value;
      g.sort((a, b) {
        final da = DateTime.tryParse('${a['date']}') ?? DateTime.fromMillisecondsSinceEpoch(0);
        final db = DateTime.tryParse('${b['date']}') ?? DateTime.fromMillisecondsSinceEpoch(0);
        return da.compareTo(db);
      });
      return {
        'res': mapUserBookingGroup(g, locale: locale, commissionPercent: commissionPercent),
        'sort': DateTime.tryParse('${g.first['date']}')?.millisecondsSinceEpoch ?? 0,
      };
    }).toList();
    rows.sort((a, b) => (b['sort'] as int).compareTo(a['sort'] as int));
    return rows.map((r) => r['res'] as Map<String, dynamic>).toList();
  } catch (_) {
    return bookings
        .map((b) => mapUserBookingGroup([b], locale: locale, commissionPercent: commissionPercent))
        .where((m) => m.isNotEmpty)
        .toList();
  }
}

Map<String, dynamic> mapUserBookingGroup(
  List<Map<String, dynamic>> group, {
  String locale = 'en',
  double commissionPercent = 15,
}) {
  if (group.isEmpty) return {};
  final b = group.first;
  final dates = group
      .map((row) => DateTime.tryParse('${row['date']}')?.toLocal())
      .whereType<DateTime>()
      .toList()
    ..sort();
  final date = dates.isNotEmpty ? dates.first : DateTime.now();
  final biz = b['business'] as Map<String, dynamic>?;
  final svc = b['service'] as Map<String, dynamic>?;
  final cancelPolicy = CancellationPolicyConfig.fromBusiness(biz);
  final localeTag = 'en_US';
  final isEn = locale.startsWith('en');

  final dateDisplay = _safeDateDisplay(date, localeTag);
  final timeDisplay = dates.length <= 1
      ? _safeTimeDisplay(date, localeTag)
      : '${_safeTimeDisplay(dates.first, localeTag)} – ${_safeTimeDisplay(dates.last, localeTag)}';

  final items = group.map((item) {
    final itemSvc = item['service'] as Map<String, dynamic>?;
    final itemStaff = item['staff'] as Map<String, dynamic>?;
    final fm = item['familyMember'] as Map<String, dynamic>?;
    final txId = item['transactionId'];
    final tx = item['transaction'] is Map ? Map<String, dynamic>.from(item['transaction'] as Map) : null;
    final payMethod = resolveBookingPaymentMethod(
      paymentMethod: '${item['paymentMethod'] ?? ''}',
      transaction: tx,
    );
    final priceNum = _bookingPrice(item);
    final itemDate = DateTime.tryParse('${item['date']}')?.toLocal();
    final rawStatus = '${item['status']}';
    final itemCanCancel = item['canCancel'] == true ||
        canCustomerCancelBooking(
          rawStatus: rawStatus,
          appointmentAt: itemDate,
          transactionId: txId?.toString(),
          policy: cancelPolicy,
        );
    return {
      'id': '${item['id']}',
      'name': '${itemSvc?['name'] ?? 'Service'}',
      'price': priceNum.toStringAsFixed(2),
      'priceDisplay': '\$${priceNum.toStringAsFixed(2)}',
      'customerName': fm != null ? '${fm['name']}' : '${item['customerName'] ?? ''}',
      'staffName': '${itemStaff?['name'] ?? ''}',
      'status': mapItemStatusWeb(
        '${item['status']}',
        transactionId: txId?.toString(),
        paymentMethod: payMethod,
        transaction: tx,
      ),
      'rawStatus': rawStatus,
      'isReviewed': item['isReviewed'] == true,
      'transactionId': txId,
      'canCancel': itemCanCancel,
      'appointmentAt': itemDate?.toIso8601String(),
    };
  }).toList();

  final mainStatus = aggregateGroupUiStatus(
    items.map((i) => '${i['status']}').toList(),
  );

  final taxPctRaw = biz?['taxPercentage'];
  final taxPct = taxPctRaw is num ? taxPctRaw.toDouble() : (double.tryParse('$taxPctRaw') ?? 0);
  final totals = computeBookingTotals(group, taxPct, commissionPercent);

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
    'price': '\$${totals.totalPrice.toStringAsFixed(2)}',
    'totalPrice': totals.totalPrice,
    'subtotal': totals.subtotal,
    'taxAmount': totals.taxAmount,
    'taxPercentage': totals.taxPercentage,
    'commissionAmount': totals.commissionAmount,
    'commissionPercent': totals.commissionPercent,
    'location': '${biz?['address'] ?? ''}',
    'address': '${biz?['address'] ?? ''}',
    'phone': '${biz?['phone'] ?? ''}',
    'imageUrl': _venueImageFromBooking(b, biz, svc),
    'img': _venueImageFromBooking(b, biz, svc),
    'businessId': '${b['businessId'] ?? biz?['id'] ?? ''}',
    'items': items,
    'isReviewed': items.every((i) => i['isReviewed'] == true),
    'paymentMethod': b['transaction'] is Map
        ? '${(b['transaction'] as Map)['paymentMethod'] ?? ''}'
        : '${b['paymentMethod'] ?? ''}',
    'cancellationAllowed': cancelPolicy.allowed,
    'cancellationHoursBefore': cancelPolicy.hoursBefore,
    'cancellationPolicyMessage': policyMessageForBooking(
      status: '${b['status']}',
      appointmentAt: date,
      transactionId: b['transactionId']?.toString(),
      policy: cancelPolicy,
      isEn: isEn,
    ),
    'canCancelAny': items.any((i) => i['canCancel'] == true),
  };
}

String fmNameFromBooking(Map<String, dynamic> b) {
  final fm = b['familyMember'] as Map<String, dynamic>?;
  if (fm != null && '${fm['name']}'.trim().isNotEmpty) return '${fm['name']}';
  return '${b['customerName'] ?? ''}'.trim();
}

String formatStaffStatValue(dynamic value, {String emptyLabel = '—'}) {
  if (value == null) return emptyLabel;
  if (value is num && value.isFinite) return '${value.toInt()}';
  final s = '$value'.trim();
  if (s.isEmpty || s == '—') return emptyLabel;
  final n = num.tryParse(s);
  if (n != null) return '${n.toInt()}';
  return s;
}

bool _staffAvailableForServiceOnDay(
  List<Map<String, dynamic>> staffForService,
  DateTime day,
) {
  return staffForService.any((m) => staffAvailableOnDay('${m['availability'] ?? ''}', day));
}

/// Next bookable time: today → next 30-min slot after now; if none left → tomorrow's open time, etc.
String getNextSlotForService(
  String serviceId,
  List<Map<String, dynamic>> team, {
  List<Map<String, dynamic>>? schedule,
}) {
  final staffForService = team.where((m) => staffOffersService(m, serviceId)).toList();
  if (staffForService.isEmpty) return '—';

  final now = DateTime.now();
  final sched = schedule ?? <Map<String, dynamic>>[];

  for (var i = 0; i < 14; i++) {
    final d = DateTime(now.year, now.month, now.day + i);
    if (!_staffAvailableForServiceOnDay(staffForService, d)) continue;

    final slots = generateSlotsForDay(sched.isEmpty ? null : sched, d);
    if (slots.isEmpty) continue;

    final bookable = filterBookableTimeSlots(slots, d, now: now);
    if (bookable.isNotEmpty) return bookable.first;
  }
  return '—';
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
