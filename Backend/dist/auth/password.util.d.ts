export declare function isPasswordHash(stored: string): boolean;
export declare function hashPassword(plain: string): Promise<string>;
export declare function verifyPassword(plain: string, stored: string): Promise<boolean>;
export declare function maybeUpgradePasswordHash(plain: string, stored: string): Promise<string | null>;
