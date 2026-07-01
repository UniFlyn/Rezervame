/*
 * Loose type declarations for the vendored Rezervame Design System barrel.
 * The DS primitives are authored in JSX with runtime prop handling; for the
 * customer-web recreation we type them permissively so pages can compose them
 * freely without fighting the type-checker.
 */
import type { ComponentType } from "react";

type DSComponent = ComponentType<any>;

export const BrandIcon: DSComponent;

export const LoginModal: DSComponent;

export const BookingConfirmation: DSComponent;
export const DateSelector: DSComponent;
export const OptionCard: DSComponent;
export const PersonBookingGroup: DSComponent;
export const ReservationSummary: DSComponent;
export const TimeSlotSelector: DSComponent;

export const BusinessCard: DSComponent;
export const BusinessInfoPanel: DSComponent;
export const BusinessListItem: DSComponent;
export const BusinessResultCard: DSComponent;
export const CategoryCard: DSComponent;
export const PortfolioGallery: DSComponent;
export const PortfolioTile: DSComponent;
export const ServiceCard: DSComponent;
export const StaffCard: DSComponent;

export const InvoiceCard: DSComponent;
export const InvoiceTable: DSComponent;
export const MapCard: DSComponent;
export const MapControls: DSComponent;
export const MapMarker: DSComponent;
export const MapToggleButton: DSComponent;

export const Avatar: DSComponent;
export const Badge: DSComponent;
export const Button: DSComponent;
export const Checkbox: DSComponent;
export const Chip: DSComponent;
export const Glyph: DSComponent;
export const IconButton: DSComponent;
export const Input: DSComponent;
export const Radio: DSComponent;
export const Rating: DSComponent;
export const SearchBar: DSComponent;
export const Select: DSComponent;
export const SOCIAL_ICONS: Record<string, unknown>;
export const SOCIAL_LABELS: Record<string, string>;
export const SocialIcon: DSComponent;
export const SocialIconButton: DSComponent;
export const SocialLinks: DSComponent;
export const Switch: DSComponent;
export const Tabs: DSComponent;
export const TruncatedReveal: DSComponent;

export const EmptyState: DSComponent;
export const Modal: DSComponent;
export const NotificationItem: DSComponent;
export const Toast: DSComponent;
export const Tooltip: DSComponent;

export const HowItWorks: DSComponent;

export const CarouselSection: DSComponent;
export const Footer: DSComponent;
export const Header: DSComponent;
export const Menu: DSComponent;
export const MenuItem: DSComponent;
export const StickyBookingBar: DSComponent;

export const RELATIONSHIPS: string[];
export const AddPersonModal: DSComponent;
export const PersonCard: DSComponent;
export const RecipientBadge: DSComponent;
export const RecipientPicker: DSComponent;
