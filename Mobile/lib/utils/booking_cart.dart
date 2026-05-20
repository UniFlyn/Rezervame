import 'package:flutter/foundation.dart';
import '../models/booking_cart_line.dart';

class BookingCart extends ChangeNotifier {
  BookingCart._privateConstructor();
  static final BookingCart instance = BookingCart._privateConstructor();

  String? businessId;
  String? venueName;
  String? heroImageUrl;
  List<Map<String, dynamic>>? specialists;

  final List<BookingCartLine> _lines = [];

  List<BookingCartLine> get lines => List.unmodifiable(_lines);

  int get itemCount => _lines.length;
  bool get isEmpty => _lines.isEmpty;
  bool get isNotEmpty => _lines.isNotEmpty;

  void setCart({
    required String bId,
    required String name,
    required String img,
    required List<BookingCartLine> items,
    List<Map<String, dynamic>>? team,
  }) {
    businessId = bId;
    venueName = name;
    heroImageUrl = img;
    specialists = team;
    _lines.clear();
    _lines.addAll(items);
    notifyListeners();
  }

  void addLine(BookingCartLine item) {
    _lines.add(item);
    notifyListeners();
  }

  void removeLine(String serviceId) {
    final index = _lines.indexWhere((l) => l.id == serviceId);
    if (index != -1) {
      _lines.removeAt(index);
      if (_lines.isEmpty) {
        clear();
      } else {
        notifyListeners();
      }
    }
  }

  void clear() {
    businessId = null;
    venueName = null;
    heroImageUrl = null;
    specialists = null;
    _lines.clear();
    notifyListeners();
  }
}
