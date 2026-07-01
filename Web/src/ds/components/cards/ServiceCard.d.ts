import * as React from 'react';
export interface ServiceCardProps {
  name: string;
  description?: string;
  duration?: string;
  price: number | string;
  currency?: string;
  /** Coral selected treatment. */
  selected?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}
/**
 * Service line-item card for a venue's service list.
 * @startingPoint section="Cards" subtitle="Service line-item with price + CTA" viewport="700x150"
 */
export declare const ServiceCard: React.FC<ServiceCardProps>;
export default ServiceCard;
