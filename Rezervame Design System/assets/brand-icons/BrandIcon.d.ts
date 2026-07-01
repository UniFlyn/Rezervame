import * as React from 'react';
export type BrandIconName =
  | "AppleBrandingAppleBackgroundBlack"
  | "AppleWhite"
  | "FacebookTypeFacebookStyleColouredLabel"
  | "FacebookWhite"
  | "GoogleTypeGoogleStyleColouredLabel"
  | "GoogleWhite"
  | "InstagramTypeInstagramStyleColouredLabel"
  | "InstagramWhite"
  | "LinkedinTypeLinkedinStyleColouredLabel"
  | "LinkedinWhite"
  | "Tiktok"
  | "YoutubeTypeYoutubeStyleColouredLabel"
  | "YoutubeWhite"
  | "PaymentMethodAmexSize16"
  | "PaymentMethodAmexSize24"
  | "PaymentMethodAmexSize48"
  | "PaymentMethodMastercardSize16"
  | "PaymentMethodMastercardSize24"
  | "PaymentMethodMastercardSize48"
  | "PaymentMethodVisaSize16"
  | "PaymentMethodVisaSize24"
  | "PaymentMethodVisaSize48";

export interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  /** Brand / payment logo name (see icon-data.js for the full map). */
  name: BrandIconName | string;
  size?: number | string;
}
/** Brand & payment-method logos extracted from the Rezervame Figma (Visa, Mastercard, Amex, Google, Facebook, Instagram, YouTube, TikTok, LinkedIn, Apple). Full-color SVGs — do not recolor coloured variants. */
export declare const BrandIcon: React.FC<BrandIconProps>;
export default BrandIcon;
