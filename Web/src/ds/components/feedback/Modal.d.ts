import * as React from 'react';
export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  width?: number;
  showClose?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
/** Centered modal dialog with scrim + rounded shell (booking confirmation, etc). */
export declare const Modal: React.FC<ModalProps>;
export default Modal;
