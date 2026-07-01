import * as React from 'react';
export interface PersonGroupService {
  name: string;
  /** Secondary line (duration, "pro · time", etc.). */
  meta?: React.ReactNode;
  /** Number (auto "$") or preformatted node. */
  price?: number | React.ReactNode;
  /** Show a per-row remove button. */
  onRemove?: () => void;
  /** Show a per-row "Cambiar" recipient action. */
  onChange?: () => void;
}
export interface PersonBookingGroupProps {
  name?: string;
  /** Relationship label (ignored when self → "Tu cuenta"). */
  subtitle?: string;
  /** Account-owner block → user glyph + "Tu cuenta". */
  self?: boolean;
  services?: PersonGroupService[];
  /** Show the "Agregar servicio para esta persona" CTA. */
  onAddService?: () => void;
  addLabel?: string;
  /** Show a per-person remove control. */
  onRemovePerson?: () => void;
  emptyHint?: string;
  style?: React.CSSProperties;
}
/** A person block nesting the services assigned to one recipient. */
export declare const PersonBookingGroup: React.FC<PersonBookingGroupProps>;
export default PersonBookingGroup;
