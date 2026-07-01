"use client";
/*
 * Rezervame Design System — vendored barrel for the Web app.
 * Re-exports every DS primitive (identical source to the design-system kit) so
 * the customer web looks and behaves exactly as defined in the design system.
 * Everything below this "use client" boundary is bundled for the client.
 */

export { BrandIcon } from "./assets/brand-icons/BrandIcon.jsx";

export { LoginModal } from "./components/auth/LoginModal.jsx";

export { BookingConfirmation } from "./components/booking/BookingConfirmation.jsx";
export { DateSelector } from "./components/booking/DateSelector.jsx";
export { OptionCard } from "./components/booking/OptionCard.jsx";
export { PersonBookingGroup } from "./components/booking/PersonBookingGroup.jsx";
export { ReservationSummary } from "./components/booking/ReservationSummary.jsx";
export { TimeSlotSelector } from "./components/booking/TimeSlotSelector.jsx";

export { BusinessCard } from "./components/cards/BusinessCard.jsx";
export { BusinessInfoPanel } from "./components/cards/BusinessInfoPanel.jsx";
export { BusinessListItem } from "./components/cards/BusinessListItem.jsx";
export { BusinessResultCard } from "./components/cards/BusinessResultCard.jsx";
export { CategoryCard } from "./components/cards/CategoryCard.jsx";
export { PortfolioGallery } from "./components/cards/PortfolioGallery.jsx";
export { PortfolioTile } from "./components/cards/PortfolioTile.jsx";
export { ServiceCard } from "./components/cards/ServiceCard.jsx";
export { StaffCard } from "./components/cards/StaffCard.jsx";

export { InvoiceCard } from "./components/commerce/InvoiceCard.jsx";
export { InvoiceTable } from "./components/commerce/InvoiceTable.jsx";
export { MapCard } from "./components/commerce/MapCard.jsx";
export { MapControls } from "./components/commerce/MapControls.jsx";
export { MapMarker } from "./components/commerce/MapMarker.jsx";
export { MapToggleButton } from "./components/commerce/MapToggleButton.jsx";

export { Avatar } from "./components/core/Avatar.jsx";
export { Badge } from "./components/core/Badge.jsx";
export { Button } from "./components/core/Button.jsx";
export { Checkbox } from "./components/core/Checkbox.jsx";
export { Chip } from "./components/core/Chip.jsx";
export { Glyph } from "./components/core/Glyph.jsx";
export { IconButton } from "./components/core/IconButton.jsx";
export { Input } from "./components/core/Input.jsx";
export { Radio } from "./components/core/Radio.jsx";
export { Rating } from "./components/core/Rating.jsx";
export { SearchBar } from "./components/core/SearchBar.jsx";
export { Select } from "./components/core/Select.jsx";
export { SOCIAL_ICONS, SOCIAL_LABELS, SocialIcon } from "./components/core/SocialIcon.jsx";
export { SocialIconButton } from "./components/core/SocialIconButton.jsx";
export { SocialLinks } from "./components/core/SocialLinks.jsx";
export { Switch } from "./components/core/Switch.jsx";
export { Tabs } from "./components/core/Tabs.jsx";
export { TruncatedReveal } from "./components/core/TruncatedReveal.jsx";

export { EmptyState } from "./components/feedback/EmptyState.jsx";
export { Modal } from "./components/feedback/Modal.jsx";
export { NotificationItem } from "./components/feedback/NotificationItem.jsx";
export { Toast } from "./components/feedback/Toast.jsx";
export { Tooltip } from "./components/feedback/Tooltip.jsx";

export { HowItWorks } from "./components/marketing/HowItWorks.jsx";

export { CarouselSection } from "./components/navigation/CarouselSection.jsx";
export { Footer } from "./components/navigation/Footer.jsx";
export { Header } from "./components/navigation/Header.jsx";
export { Menu, MenuItem } from "./components/navigation/Menu.jsx";
export { StickyBookingBar } from "./components/navigation/StickyBookingBar.jsx";

export { RELATIONSHIPS, AddPersonModal } from "./components/people/AddPersonModal.jsx";
export { PersonCard } from "./components/people/PersonCard.jsx";
export { RecipientBadge } from "./components/people/RecipientBadge.jsx";
export { RecipientPicker } from "./components/people/RecipientPicker.jsx";
