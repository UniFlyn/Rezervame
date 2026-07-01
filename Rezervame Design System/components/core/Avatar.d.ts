import * as React from 'react';
export interface AvatarProps {
  src?: string;
  alt?: string;
  /** Used for initials fallback. */
  name?: string;
  size?: number;
  /** Coral ring (current user / featured). */
  ring?: boolean;
  status?: 'online' | 'offline';
  style?: React.CSSProperties;
}
/** Circular avatar with initials fallback, optional coral ring and status dot. */
export declare const Avatar: React.FC<AvatarProps>;
export default Avatar;
