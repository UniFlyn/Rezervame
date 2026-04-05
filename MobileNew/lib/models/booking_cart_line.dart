/// Single service line in the booking / checkout cart.
class BookingCartLine {
  const BookingCartLine({
    required this.id,
    required this.name,
    required this.durationLabel,
    required this.priceLabel,
    required this.priceValue,
  });

  final String id;
  final String name;
  final String durationLabel;
  final String priceLabel;
  final double priceValue;

  static double parsePriceLabel(String label) {
    final cleaned = label.replaceAll(RegExp(r'[^\d.]'), '');
    return double.tryParse(cleaned) ?? 0;
  }
}
