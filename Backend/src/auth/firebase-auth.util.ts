import * as admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';

const DEFAULT_FIREBASE_PROJECT_ID = 'rezerveme-1fce5';
const oauthClient = new OAuth2Client();

let adminInitialized = false;
let adminInitError: string | null = null;

/** Normalize private key from Render/env (quoted, literal \\n, or real newlines). */
export function normalizeFirebasePrivateKey(raw: string | undefined): string {
  if (!raw) return '';
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }
  return key.trim();
}

export function getFirebaseProjectId(): string {
  return process.env.FIREBASE_PROJECT_ID?.trim() || DEFAULT_FIREBASE_PROJECT_ID;
}

export function isFirebaseAdminConfigured(): boolean {
  const projectId = getFirebaseProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizeFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  return Boolean(projectId && clientEmail && privateKey.includes('BEGIN PRIVATE KEY'));
}

/** Health: public-key verification works with project id only; admin SDK is optional. */
export function getFirebaseAdminStatus(): 'ok' | 'missing' | 'invalid' {
  if (!getFirebaseProjectId()) return 'missing';
  if (isFirebaseAdminConfigured()) {
    if (adminInitError) return 'invalid';
    if (adminInitialized || admin.apps.length > 0) return 'ok';
    return initFirebaseAdmin() ? 'ok' : 'invalid';
  }
  return 'ok';
}

function initFirebaseAdmin(): boolean {
  if (adminInitialized) return true;
  if (admin.apps.length > 0) {
    adminInitialized = true;
    return true;
  }
  if (!isFirebaseAdminConfigured()) return false;

  const projectId = getFirebaseProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!.trim();
  const privateKey = normalizeFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    adminInitialized = true;
    adminInitError = null;
    return true;
  } catch (err) {
    adminInitError = err instanceof Error ? err.message : String(err);
    console.error('[Firebase Admin] init failed:', adminInitError);
    return false;
  }
}

async function verifyWithGooglePublicKeys(
  idToken: string,
  projectId: string,
): Promise<{ uid: string; email: string; name?: string } | null> {
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: projectId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub) return null;

  const expectedIss = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIss) {
    console.error('[Firebase Auth] unexpected iss:', payload.iss);
    return null;
  }

  const email = (payload.email || '').trim().toLowerCase();
  if (!email) return null;

  return {
    uid: payload.sub,
    email,
    name: payload.name || email.split('@')[0],
  };
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{
  uid: string;
  email: string;
  name?: string;
} | null> {
  const token = (idToken || '').trim();
  if (!token) return null;

  const projectId = getFirebaseProjectId();

  if (isFirebaseAdminConfigured() && initFirebaseAdmin()) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      const email = (decoded.email || '').trim().toLowerCase();
      if (!email) return null;
      return {
        uid: decoded.uid,
        email,
        name: decoded.name || decoded.email?.split('@')[0],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Firebase Admin] verifyIdToken failed, trying public keys:', msg.slice(0, 160));
    }
  }

  try {
    return await verifyWithGooglePublicKeys(token, projectId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Firebase Auth] public key verify failed:', msg.slice(0, 200));
    return null;
  }
}
