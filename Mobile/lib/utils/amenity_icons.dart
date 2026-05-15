import 'package:flutter/material.dart';

/// Matches seeded [Amenity.key] values from the backend.
IconData amenityIconForKey(String key) {
  switch (key) {
    case 'wifi':
      return Icons.wifi_rounded;
    case 'parking':
      return Icons.local_parking_rounded;
    case 'wheelchair':
      return Icons.accessible_rounded;
    case 'ac':
      return Icons.ac_unit_rounded;
    case 'card_payment':
      return Icons.credit_card_rounded;
    case 'coffee':
      return Icons.coffee_rounded;
    case 'tv':
      return Icons.tv_rounded;
    case 'charging':
      return Icons.electrical_services_rounded;
    case 'kids_friendly':
      return Icons.child_care_rounded;
    case 'water':
      return Icons.water_drop_rounded;
    case 'pet_friendly':
      return Icons.pets_rounded;
    case 'shower':
      return Icons.shower_rounded;
    default:
      return Icons.checkroom_rounded;
  }
}
