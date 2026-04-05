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
  });

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

  static const List<AppNotification> mockAll = [
    AppNotification(
      sectionKey: 'today',
      listTitle: 'Appointment Reminder',
      preview: 'Your appointment with Euphoria Spa is tomorrow at 10:00 AM. Tap to view details.',
      timeShort: '08:23 AM',
      icon: Icons.calendar_today_rounded,
      detailTitle: 'Book Service',
      detailBody:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.',
      detailTimestampLine: 'Dec, 20 2024 • 08.40 AM',
      venueName: 'Euphoria Spa & Beauty Lounge',
      venueSubtitle: 'Premium wellness & beauty treatments',
      venueImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=200&fit=crop',
      packageLabel: 'Basic',
      beautician: 'Aria Harris',
      datesLine: 'Sun, 20 Dec 2024',
      price: r'$150.00',
      fee: r'$2.70',
      totalPrice: r'$152.70',
    ),
    AppNotification(
      sectionKey: 'today',
      listTitle: 'Special Offer Alert',
      preview: 'Get 20% off facial treatments this week only. Limited slots available at participating venues.',
      timeShort: '10:15 AM',
      icon: Icons.local_offer_rounded,
      detailTitle: 'Special Offer',
      detailBody:
          'Enjoy exclusive savings on selected services. Offer valid through Sunday. Book now to secure your preferred time.',
      detailTimestampLine: 'Dec, 20 2024 • 10.15 AM',
      venueName: 'Euphoria Spa & Beauty Lounge',
      venueSubtitle: 'Limited-time promotion',
      venueImageUrl: 'https://images.unsplash.com/photo-1519415387722-a1d040e86a9a?q=80&w=200&fit=crop',
      packageLabel: 'Facial Deluxe',
      beautician: 'Sofia Reyes',
      datesLine: 'Mon, 23 Dec 2024',
      price: r'$120.00',
      fee: r'$2.40',
      totalPrice: r'$122.40',
    ),
    AppNotification(
      sectionKey: 'yesterday',
      listTitle: 'Payment Confirmed',
      preview: 'Your payment of \$150.00 for Euphoria Spa was processed successfully. Thank you!',
      timeShort: '06:12 PM',
      icon: Icons.check_circle_outline_rounded,
      detailTitle: 'Payment Received',
      detailBody:
          'We have received your payment. A receipt has been sent to your email. You can view booking details anytime in the app.',
      detailTimestampLine: 'Dec, 19 2024 • 06.12 PM',
      venueName: 'Euphoria Spa & Beauty Lounge',
      venueSubtitle: 'Transaction complete',
      venueImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=200&fit=crop',
      packageLabel: 'Couples Package',
      beautician: 'Marcus Cole',
      datesLine: 'Fri, 27 Dec 2024',
      price: r'$150.00',
      fee: r'$2.70',
      totalPrice: r'$152.70',
      availedServices: [
        AvailedServiceLine(name: "Women's Haircut", price: r'$65.00'),
        AvailedServiceLine(name: "Men's Haircut", price: r'$35.00'),
        AvailedServiceLine(name: 'Couples massage add-on', price: r'$50.00'),
      ],
    ),
    AppNotification(
      sectionKey: 'yesterday',
      listTitle: 'Review Request',
      preview: 'How was your visit? Rate your experience and help others discover great salons near you.',
      timeShort: '02:30 PM',
      icon: Icons.rate_review_outlined,
      detailTitle: 'Share Your Feedback',
      detailBody:
          'Your opinion matters. Tap below to leave a quick review and earn loyalty points on your next booking.',
      detailTimestampLine: 'Dec, 19 2024 • 02.30 PM',
      venueName: 'Euphoria Spa & Beauty Lounge',
      venueSubtitle: 'We value your experience',
      venueImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=200&fit=crop',
      packageLabel: 'Haircut & Style',
      beautician: 'Ania Harris',
      datesLine: 'Wed, 18 Dec 2024',
      price: r'$45.00',
      fee: r'$1.50',
      totalPrice: r'$46.50',
    ),
  ];
}
