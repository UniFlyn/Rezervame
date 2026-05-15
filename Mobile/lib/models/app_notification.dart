import 'package:flutter/material.dart';

/// A single line item shown under "Availed services" on payment / booking details.
class AvailedServiceLine {
  const AvailedServiceLine({required this.name, required this.price});

  final String name;
  final String price;
}

/// Static notification entries for list + detail (matches product reference).
class AppNotification {
  const AppNotification({
    this.id,
    required this.sectionKey,
    required this.listTitle,
    required this.preview,
    required this.timeShort,
    required this.icon,
    required this.detailTitle,
    required this.detailBody,
    required this.detailTimestampLine,
    required this.venueName,
    required this.venueSubtitle,
    required this.venueImageUrl,
    required this.packageLabel,
    required this.beautician,
    required this.datesLine,
    required this.price,
    required this.fee,
    required this.totalPrice,
    this.availedServices = const [],
    this.showCommerceSection = true,
  });

  final String? id;

  /// `today` or `yesterday` for section headers.
  final String sectionKey;
  final String listTitle;
  final String preview;
  final String timeShort;
  final IconData icon;

  final String detailTitle;
  final String detailBody;
  final String detailTimestampLine;
  final String venueName;
  final String venueSubtitle;
  final String venueImageUrl;
  final String packageLabel;
  final String beautician;
  final String datesLine;
  final String price;
  final String fee;
  final String totalPrice;

  /// Shown between "Your order" and "Price details" when non-empty (e.g. payment receipt).
  final List<AvailedServiceLine> availedServices;

  /// When false, detail screen hides mock receipt / price blocks (API-driven notices).
  final bool showCommerceSection;

  static List<AppNotification> liveAll = [];
}
