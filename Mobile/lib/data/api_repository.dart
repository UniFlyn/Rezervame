import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../data/home_feed_content.dart';
import '../data/venue_catalog.dart';
import '../models/app_notification.dart';
import '../models/user_invoice.dart';
import '../models/venue_listing.dart';
import '../utils/booking_utils.dart';
import 'api_config.dart';
import 'auth_session.dart';
import 'user_location.dart';

String _notifSectionKeyFromIso(String iso) {
  final created = DateTime.tryParse(iso);
  if (created == null) return 'yesterday';
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final c = DateTime(created.year, created.month, created.day);
  if (c == today) return 'today';
  return 'yesterday';
}

String _notifTimeShort12(DateTime loc) {
  var h = loc.hour % 12;
  if (h == 0) h = 12;
  final m = loc.minute.toString().padLeft(2, '0');
  final ap = loc.hour >= 12 ? 'PM' : 'AM';
  return '$h:$m $ap';
}

String _notifDetailTimestampLine(String iso) {
  final created = DateTime.tryParse(iso)?.toLocal();
  if (created == null) return '';
  const wds = <String>['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = <String>[
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${wds[created.weekday - 1]} · ${months[created.month - 1]} ${created.day}, ${created.year} · ${_notifTimeShort12(created)}';
}

String _notifPreviewBody(String body) {
  final t = body.trim();
  if (t.length <= 120) return t;
  return '${t.substring(0, 117)}...';
}

class ApiRepository {
  ApiRepository({String? baseUrl}) : _baseUrl = baseUrl ?? resolveApiBaseUrl();

  final String _baseUrl;

  Future<Map<String, String>> _headers({bool auth = false}) async {
    final h = <String, String>{'Accept': 'application/json'};
    if (auth) {
      final t = await AuthSession.getToken();
      if (t != null && t.isNotEmpty) {
        h['Authorization'] = 'Bearer $t';
      }
    }
    return h;
  }

  Never _throwApiError(http.Response res, String fallback) {
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map && decoded['message'] != null) {
        throw Exception('${decoded['message']}');
      }
    } on Exception {
      rethrow;
    } catch (_) {}
    throw Exception(fallback);
  }

  /// Returns true when login succeeded and session was stored.
  Future<bool> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'email': email.trim().toLowerCase(), 'password': password}),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) return false;
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final user = data['user'] as Map<String, dynamic>?;
    final token = data['token'] as String?;
    if (user == null || token == null || user['role'] != 'USER') return false;
    await AuthSession.setToken(token);
    return true;
  }

  Future<bool> checkEmailExists(String email) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/auth/check-email'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'email': email.trim().toLowerCase()}),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Could not verify email');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['exists'] == true;
  }

  Future<bool> register({
    required String email,
    required String password,
    required String name,
    String? phone,
    String? address,
    String? gender,
    int? age,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({
        'email': email.trim().toLowerCase(),
        'password': password,
        'name': name.trim(),
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
        if (address != null && address.trim().isNotEmpty) 'address': address.trim(),
        if (gender != null && gender.trim().isNotEmpty) 'gender': gender.trim(),
        if (age != null) 'age': age,
      }),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Registration failed');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final user = data['user'] as Map<String, dynamic>?;
    final token = data['token'] as String?;
    if (user == null || token == null || user['role'] != 'USER') return false;
    await AuthSession.setToken(token);
    return true;
  }

  Future<void> logout() async {
    await AuthSession.setToken(null);
  }

  /// Current user profile — token only is persisted; name/avatar always from API.
  Future<Map<String, dynamic>?> fetchUserSession() async {
    final res = await http.get(Uri.parse('$_baseUrl/auth/user-session'), headers: await _headers(auth: true));
    if (res.statusCode == 401) return null;
    if (res.statusCode < 200 || res.statusCode >= 300) return null;
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> fetchInvoices({int page = 1, int limit = 10}) async {
    final uri = Uri.parse('$_baseUrl/mobile/invoices').replace(queryParameters: {
      'page': '$page',
      'limit': '$limit',
    });
    final res = await http.get(uri, headers: await _headers(auth: true));
    if (res.statusCode == 401) {
      return {'data': <UserInvoice>[], 'totalPages': 1, 'total': 0};
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return {'data': <UserInvoice>[], 'totalPages': 1, 'total': 0};
    }
    final body = jsonDecode(res.body);
    final List<Map<String, dynamic>> items;
    int totalPages = 1;
    int total = 0;
    if (body is Map<String, dynamic>) {
      items = (body['data'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
      totalPages = (body['totalPages'] as int?) ?? 1;
      total = (body['total'] as int?) ?? items.length;
    } else if (body is List) {
      items = body.cast<Map<String, dynamic>>();
      total = items.length;
    } else {
      return {'data': <UserInvoice>[], 'totalPages': 1, 'total': 0};
    }
    final data = items.map((it) {
      final lines = ((it['lines'] as List<dynamic>?) ?? [])
          .cast<Map<String, dynamic>>()
          .map((l) => InvoiceLineItem(title: '${l['title']}', amount: '\$${(l['amount'] as num).toStringAsFixed(2)}'))
          .toList();
      final total = (it['total'] as num?) ?? 0;
      final subtotal = (it['subtotal'] as num?) ?? 0;
      final tax = (it['tax'] as num?) ?? 0;
      final vi = '${it['venueImageUrl'] ?? ''}'.trim();
      return UserInvoice(
        id: '${it['id']}',
        number: '${it['number']}',
        venueName: '${it['venueName']}',
        issuedDate: '${it['issuedDate']}'.split('T').first,
        subtotal: '\$${subtotal.toStringAsFixed(2)}',
        tax: '\$${tax.toStringAsFixed(2)}',
        total: '\$${total.toStringAsFixed(2)}',
        statusKey: '${it['status']}'.toLowerCase() == 'completed' ? 'invoicePaid' : 'invoicePending',
        venueImageUrl: vi.isEmpty ? null : vi,
        locationLine: '${it['locationLine']}',
        lines: lines,
      );
    }).toList();
    return {'data': data, 'totalPages': totalPages, 'total': total};
  }

  List<Map<String, dynamic>> _bookingRowsFromJson(dynamic raw) {
    if (raw is! List) return [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  Future<Map<String, dynamic>> fetchBookings({int page = 1, int limit = 10, String locale = 'en'}) async {
    final uri = Uri.parse('$_baseUrl/mobile/bookings').replace(queryParameters: {
      'page': '$page',
      'limit': '$limit',
    });
    try {
      final res = await http
          .get(uri, headers: await _headers(auth: true))
          .timeout(const Duration(seconds: 30));
      if (res.statusCode == 401) {
        return {'ongoing': <Map<String, dynamic>>[], 'history': <Map<String, dynamic>>[], 'totalPages': 1, 'total': 0};
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return {'ongoing': <Map<String, dynamic>>[], 'history': <Map<String, dynamic>>[], 'totalPages': 1, 'total': 0};
      }
      final decoded = jsonDecode(res.body);
      if (decoded is! Map) {
        return {'ongoing': <Map<String, dynamic>>[], 'history': <Map<String, dynamic>>[], 'totalPages': 1, 'total': 0};
      }
      final data = Map<String, dynamic>.from(decoded);
      final ongoingRaw = _bookingRowsFromJson(data['ongoing']);
      final historyBlock = data['history'] is Map ? Map<String, dynamic>.from(data['history'] as Map) : null;
      final historyRaw = _bookingRowsFromJson(historyBlock?['data']);

      return {
        'ongoing': groupAndMapBookings(ongoingRaw, locale: locale),
        'history': groupAndMapBookings(historyRaw, locale: locale),
        'totalPages': (historyBlock?['totalPages'] as num?)?.toInt() ?? 1,
        'total': (historyBlock?['total'] as num?)?.toInt() ?? historyRaw.length,
      };
    } catch (_) {
      return {'ongoing': <Map<String, dynamic>>[], 'history': <Map<String, dynamic>>[], 'totalPages': 1, 'total': 0};
    }
  }

  Future<List<Map<String, dynamic>>> fetchBookingGroup(String bookingId) async {
    final res = await http.get(
      Uri.parse('$_baseUrl/mobile/bookings/$bookingId/group'),
      headers: await _headers(auth: true),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    final data = jsonDecode(res.body);
    if (data is! List) return [];
    return data.cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> fetchStaffBusySlots(String staffId, DateTime day) async {
    final ymd = '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
    final res = await http.get(
      Uri.parse('$_baseUrl/mobile/staff/$staffId/busy-slots?date=$ymd'),
      headers: await _headers(auth: true),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    final data = jsonDecode(res.body);
    if (data is! List) return [];
    return data.cast<Map<String, dynamic>>();
  }

  Future<bool> cancelBooking(String bookingId) async {
    final res = await http.patch(
      Uri.parse('$_baseUrl/mobile/bookings/$bookingId/cancel'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({}),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Could not cancel booking');
    }
    return true;
  }

  Future<bool> cancelBookingGroup(List<String> bookingIds) async {
    if (bookingIds.isEmpty) return true;
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/bookings/cancel-group'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({'bookingIds': bookingIds}),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Could not cancel bookings');
    }
    return true;
  }

  Future<bool> payBookingGroup({
    required List<String> bookingIds,
    String paymentMethod = 'Online',
    String? businessId,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/bookings/pay-group'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({
        'bookingIds': bookingIds,
        'paymentMethod': paymentMethod,
        if (businessId != null) 'businessId': businessId,
      }),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Payment failed');
    }
    return true;
  }

  Future<bool> completeBooking(String bookingId) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/bookings/$bookingId/complete'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({}),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Could not complete booking');
    }
    return true;
  }

  Future<bool> acceptReschedule(String bookingId) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/bookings/$bookingId/accept-reschedule'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({}),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Could not accept reschedule');
    }
    return true;
  }

  Future<bool> submitReviewGroup({
    required int businessRating,
    required String comment,
    required List<Map<String, dynamic>> services,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/reviews/group'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({
        'businessRating': businessRating,
        'comment': comment,
        'services': services,
      }),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Failed to submit review');
    }
    return true;
  }

  Future<Map<String, dynamic>?> updateFamilyMember({
    required String id,
    required String name,
    required int age,
    required String gender,
    String? email,
  }) async {
    final res = await http.patch(
      Uri.parse('$_baseUrl/mobile/family-members/$id'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name.trim(),
        'age': age,
        'gender': gender.trim(),
        if (email != null) 'email': email.trim().isEmpty ? null : email.trim(),
      }),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      _throwApiError(res, 'Failed to update family member');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Uri> _uriWithUserGeo(String relativePath) async {
    final base = Uri.parse(_baseUrl.endsWith('/') ? _baseUrl : '$_baseUrl/');
    final u = base.resolve(relativePath);
    final g = await UserLocation.getLastKnown();
    if (g == null) return u;
    return u.replace(queryParameters: {'userLat': '${g.lat}', 'userLng': '${g.lng}'});
  }

  Future<List<VenueListing>> fetchVenues() async {
    final res = await http.get(await _uriWithUserGeo('mobile/venues'), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final items = (body['data'] as List<dynamic>).cast<Map<String, dynamic>>();
    return items.map((it) {
      return VenueListing(
        id: VenueListing.resolveListingId(it['id'], businessId: it['businessId'] as String?),
        businessId: it['businessId'] as String?,
        name: '${it['name']}',
        categoryKey: '${it['categoryKey']}',
        rating: '${it['rating']}',
        reviews: '${it['reviews']}',
        price: '${it['price']}',
        lat: (it['lat'] as num).toDouble(),
        lng: (it['lng'] as num).toDouble(),
        unsplashImgId: it['unsplashImgId'] as String?,
        serviceImageUrl: (it['serviceImageUrl'] ?? it['imageUrl']) as String?,
        logoUrl: it['logoUrl'] as String?,
        bannerUrl: it['bannerUrl'] as String?,
        locationLabel: '${it['locationLabel']}',
        distanceLabel: '${it['distanceLabel']}',
        primaryServiceName: it['serviceName'] != null ? '${it['serviceName']}' : null,
        serviceDurationMinutes: (it['serviceDurationMinutes'] as num?)?.toInt(),
        amenityLabelsEn: (it['amenityLabelsEn'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
        amenityLabelsEs: (it['amenityLabelsEs'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
      );
    }).toList();
  }

  Future<Map<String, dynamic>> searchVenues({
    int page = 1,
    int limit = 20,
    String? search,
    String? category,
    String? sortBy = 'newest',
  }) async {
    final base = await _uriWithUserGeo('mobile/venues');
    final params = Map<String, String>.from(base.queryParameters);
    params['page'] = '$page';
    params['limit'] = '$limit';
    if (search != null && search.trim().isNotEmpty) params['search'] = search.trim();
    if (category != null && category.trim().isNotEmpty && category != 'all') params['category'] = category.trim();
    if (sortBy != null) params['sortBy'] = sortBy;

    final res = await http.get(base.replace(queryParameters: params), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return {'data': <VenueListing>[], 'total': 0};
    
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final items = (body['data'] as List<dynamic>).cast<Map<String, dynamic>>();
    final venues = items.map((it) {
      return VenueListing(
        id: VenueListing.resolveListingId(it['id'], businessId: it['businessId'] as String?),
        businessId: it['businessId'] as String?,
        name: '${it['name']}',
        categoryKey: '${it['categoryKey']}',
        rating: '${it['rating']}',
        reviews: '${it['reviews']}',
        price: '${it['price']}',
        lat: (it['lat'] as num).toDouble(),
        lng: (it['lng'] as num).toDouble(),
        unsplashImgId: it['unsplashImgId'] as String?,
        serviceImageUrl: (it['serviceImageUrl'] ?? it['imageUrl']) as String?,
        logoUrl: it['logoUrl'] as String?,
        bannerUrl: it['bannerUrl'] as String?,
        locationLabel: '${it['locationLabel']}',
        distanceLabel: '${it['distanceLabel']}',
        primaryServiceName: it['serviceName'] != null ? '${it['serviceName']}' : null,
        serviceDurationMinutes: (it['serviceDurationMinutes'] as num?)?.toInt(),
        amenityLabelsEn: (it['amenityLabelsEn'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
        amenityLabelsEs: (it['amenityLabelsEs'] as List<dynamic>?)?.map((e) => '$e').toList() ?? const [],
      );
    }).toList();

    return {
      'data': venues,
      'total': body['total'] ?? 0,
      'totalPages': body['totalPages'] ?? 1,
    };
  }

  /// Public business profile (no auth) — same payload as Web business panel mapping.
  Future<Map<String, dynamic>?> fetchBusinessPublicProfile(String businessId) async {
    final res = await http.get(await _uriWithUserGeo('business/$businessId'), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return null;
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> fetchBusinessServices(String businessId) async {
    final res =
        await http.get(Uri.parse('$_baseUrl/business/$businessId/services'), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic> && decoded['data'] != null) {
        final raw = decoded['data'] as List<dynamic>;
        return raw.cast<Map<String, dynamic>>();
      } else if (decoded is List<dynamic>) {
        return decoded.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchBusinessStaff(String businessId) async {
    final res =
        await http.get(Uri.parse('$_baseUrl/business/$businessId/staff'), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic> && decoded['data'] != null) {
        final raw = decoded['data'] as List<dynamic>;
        return raw.cast<Map<String, dynamic>>();
      } else if (decoded is List<dynamic>) {
        return decoded.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchBusinessReviews(String businessId) async {
    final res =
        await http.get(Uri.parse('$_baseUrl/business/$businessId/reviews'), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic> && decoded['data'] != null) {
        final raw = decoded['data'] as List<dynamic>;
        return raw.cast<Map<String, dynamic>>();
      } else if (decoded is List<dynamic>) {
        return decoded.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return [];
  }

  Future<List<String>> _collectStaffDisplayNames(List<VenueListing> venues) async {
    final names = <String>[];
    final seen = <String>{};
    for (final v in venues) {
      final bid = v.businessId;
      if (bid == null || bid.isEmpty) continue;
      try {
        final staff = await fetchBusinessStaff(bid);
        for (final m in staff) {
          final n = '${m['name']}'.trim();
          if (n.isEmpty) continue;
          if (seen.add(n)) names.add(n);
          if (names.length >= 10) return names;
        }
      } catch (_) {}
    }
    return names;
  }

  Future<List<AppNotification>> fetchNotifications() async {
    final res = await http.get(Uri.parse('$_baseUrl/mobile/notifications'), headers: await _headers(auth: true));
    if (res.statusCode == 401) return [];
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    final items = (jsonDecode(res.body) as List<dynamic>).cast<Map<String, dynamic>>();
    return items.map((raw) {
      final n = raw;
      final iso = '${n['createdAt'] ?? ''}';
      final isLean = n.containsKey('id') && n.containsKey('title') && iso.isNotEmpty;
      if (isLean) {
        final title = '${n['title'] ?? ''}';
        final body = '${n['body'] ?? ''}';
        final type = '${n['type'] ?? ''}';
        final created = DateTime.tryParse(iso)?.toLocal();
        return AppNotification(
          id: '${n['id']}',
          sectionKey: _notifSectionKeyFromIso(iso),
          listTitle: title,
          preview: _notifPreviewBody(body),
          timeShort: created != null ? _notifTimeShort12(created) : '',
          icon: Icons.notifications_active_rounded,
          detailTitle: title,
          detailBody: body,
          detailTimestampLine: _notifDetailTimestampLine(iso),
          venueName: '',
          venueSubtitle: type,
          venueImageUrl: '',
          packageLabel: '',
          beautician: '',
          datesLine: '',
          price: '',
          fee: '',
          totalPrice: '',
          showCommerceSection: false,
        );
      }
      return AppNotification(
        sectionKey: '${n['sectionKey'] ?? 'yesterday'}',
        listTitle: '${n['listTitle'] ?? ''}',
        preview: '${n['preview'] ?? ''}',
        timeShort: '${n['timeShort'] ?? ''}',
        icon: Icons.notifications_active_rounded,
        detailTitle: '${n['detailTitle'] ?? ''}',
        detailBody: '${n['detailBody'] ?? ''}',
        detailTimestampLine: '${n['detailTimestampLine'] ?? ''}',
        venueName: '${n['venueName'] ?? ''}',
        venueSubtitle: '${n['venueSubtitle'] ?? ''}',
        venueImageUrl: '${n['venueImageUrl'] ?? ''}',
        packageLabel: '${n['packageLabel'] ?? ''}',
        beautician: '${n['beautician'] ?? ''}',
        datesLine: '${n['datesLine'] ?? ''}',
        price: '${n['price'] ?? ''}',
        fee: '${n['fee'] ?? ''}',
        totalPrice: '${n['totalPrice'] ?? ''}',
        showCommerceSection: true,
      );
    }).toList();
  }

  /// Reload venues from Postgres and rebuild home feed sections (including staff names).
  Future<void> refreshCatalogAndHomeFeed() async {
    final venues = await fetchVenues();
    VenueCatalog.replaceAll(venues);
    final staffNames = await _collectStaffDisplayNames(venues);
    final categoryRows = await fetchPublicCategories();
    hydrateHomeFeedFromVenues(venues, staffNames: staffNames, categoryRows: categoryRows);
    final events = await fetchEvents();
    hydrateHomeFeedFromEvents(events);
  }

  Future<List<Map<String, dynamic>>> fetchPublicCategories() async {
    final res = await http.get(Uri.parse('$_baseUrl/public/categories'), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    return (jsonDecode(res.body) as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> fetchEvents() async {
    final res = await http.get(Uri.parse('$_baseUrl/mobile/events'), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    return (jsonDecode(res.body) as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> fetchJobs() async {
    final res = await http.get(Uri.parse('$_baseUrl/mobile/jobs'), headers: await _headers(auth: false));
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    return (jsonDecode(res.body) as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> fetchFavoriteVenueMaps() async {
    final res = await http.get(await _uriWithUserGeo('mobile/favorites'), headers: await _headers(auth: true));
    if (res.statusCode == 401 || res.statusCode < 200 || res.statusCode >= 300) return [];
    return (jsonDecode(res.body) as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<bool> addFavorite(String businessId) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/favorites'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({'businessId': businessId}),
    );
    return res.statusCode >= 200 && res.statusCode < 300;
  }

  Future<bool> removeFavorite(String businessId) async {
    final res = await http.delete(
      Uri.parse('$_baseUrl/mobile/favorites/$businessId'),
      headers: await _headers(auth: true),
    );
    return res.statusCode >= 200 && res.statusCode < 300;
  }

  Future<void> bootstrapMobileData() async {
    await refreshCatalogAndHomeFeed();
    final token = await AuthSession.getToken();
    if (token != null && token.isNotEmpty) {
      final notifications = await fetchNotifications();
      AppNotification.liveAll = notifications;
    } else {
      AppNotification.liveAll = [];
    }
  }

  Future<bool> submitReview({
    required String bookingId,
    required int staffRating,
    required int businessRating,
    required String comment,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/reviews'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({
        'bookingId': bookingId,
        'staffRating': staffRating,
        'businessRating': businessRating,
        'comment': comment,
      }),
    );
    return res.statusCode >= 200 && res.statusCode < 300;
  }

  Future<Map<String, dynamic>?> updateUserProfile({
    required String name,
    required String phone,
    required String email,
    String? avatar,
    String? gender,
  }) async {
    final res = await http.patch(
      Uri.parse('$_baseUrl/auth/user-session'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name.trim(),
        'phone': phone.trim(),
        'email': email.trim().toLowerCase(),
        if (avatar != null) 'avatar': avatar,
        if (gender != null && gender.trim().isNotEmpty) 'gender': gender.trim(),
      }),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final decoded = jsonDecode(res.body);
      throw Exception(decoded is Map && decoded.containsKey('message') ? decoded['message'] : 'Failed to update profile');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<bool> updateUserPassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final res = await http.patch(
      Uri.parse('$_baseUrl/auth/user-password'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final decoded = jsonDecode(res.body);
      throw Exception(decoded is Map && decoded.containsKey('message') ? decoded['message'] : 'Failed to update password');
    }
    return true;
  }

  Future<List<Map<String, dynamic>>> fetchFamilyMembers() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/mobile/family-members'),
      headers: await _headers(auth: true),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) return [];
    return (jsonDecode(res.body) as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>?> createFamilyMember({
    required String name,
    required int age,
    required String gender,
    String? email,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/family-members'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name.trim(),
        'age': age,
        'gender': gender.trim(),
        if (email != null && email.trim().isNotEmpty) 'email': email.trim(),
      }),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final decoded = jsonDecode(res.body);
      throw Exception(decoded is Map && decoded.containsKey('message') ? decoded['message'] : 'Failed to add family member');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<bool> deleteFamilyMember(String id) async {
    final res = await http.delete(
      Uri.parse('$_baseUrl/mobile/family-members/$id'),
      headers: await _headers(auth: true),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final decoded = jsonDecode(res.body);
      throw Exception(decoded is Map && decoded.containsKey('message') ? decoded['message'] : 'Failed to delete family member');
    }
    return true;
  }

  Future<Map<String, dynamic>?> createBooking({
    required String businessId,
    required String serviceId,
    required String date,
    String? staffId,
    String? familyMemberId,
    String? paymentMethod,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/mobile/bookings'),
      headers: {...await _headers(auth: true), 'Content-Type': 'application/json'},
      body: jsonEncode({
        'businessId': businessId,
        'serviceId': serviceId,
        'date': date,
        if (staffId != null && staffId.isNotEmpty) 'staffId': staffId,
        if (familyMemberId != null && familyMemberId.isNotEmpty) 'familyMemberId': familyMemberId,
        if (paymentMethod != null && paymentMethod.isNotEmpty) 'paymentMethod': paymentMethod,
      }),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final decoded = jsonDecode(res.body);
      throw Exception(decoded is Map && decoded.containsKey('message') ? decoded['message'] : 'Failed to create booking');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
