export declare function verifyFirebaseIdToken(idToken: string): Promise<{
    uid: string;
    email: string;
    name?: string;
} | null>;
