import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  Armchair,
  Baby,
  Car,
  Coffee,
  CreditCard,
  Droplets,
  Info,
  PawPrint,
  Plug,
  ShowerHead,
  Tv,
  Wind,
  Wifi,
} from 'lucide-react';

/** Maps seeded [Amenity.key] values to icons for Web venue + business profile. */
export function amenityLucideIcon(key: string): LucideIcon {
  switch (key) {
    case 'wifi':
      return Wifi;
    case 'parking':
      return Car;
    case 'wheelchair':
      return Accessibility;
    case 'ac':
      return Wind;
    case 'card_payment':
      return CreditCard;
    case 'coffee':
      return Coffee;
    case 'tv':
      return Tv;
    case 'charging':
      return Plug;
    case 'kids_friendly':
      return Baby;
    case 'water':
      return Droplets;
    case 'pet_friendly':
      return PawPrint;
    case 'shower':
      return ShowerHead;
    default:
      return Armchair;
  }
}
