import * as React from 'react';
export interface LoginModalProps {
  open?: boolean;
  /** Coral wordmark PNG; falls back to the text wordmark. */
  logoSrc?: string;
  title?: string;
  helper?: string;
  /** Spinner CTA + disabled inputs. */
  loading?: boolean;
  /** Force an error message (e.g. server-side). Local validation also sets one. */
  error?: string;
  /** Called with the validated email. */
  onSubmit?: (email: string) => void;
  onGoogle?: () => void;
  onClose?: () => void;
  onHelp?: () => void;
  style?: React.CSSProperties;
}
/**
 * Login / Sign-up modal — base auth surface (email-first + Google). Centered
 * over a scrim, brand mark, Continuar CTA, divider, Google button, legal text.
 * States: default · loading · invalid-email error · disabled (empty) · responsive.
 * @startingPoint section="Auth" subtitle="Login / sign-up modal" viewport="480x620"
 */
export declare const LoginModal: React.FC<LoginModalProps>;
export default LoginModal;
