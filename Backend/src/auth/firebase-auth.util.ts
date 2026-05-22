import * as admin from 'firebase-admin';

let initialized = false;

function initFirebaseAdmin(): boolean {
  if (initialized) return true;
  if (admin.apps.length > 0) {
    initialized = true;
    return true;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey) {
    return false;
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  initialized = true;
  return true;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{
  uid: string;
  email: string;
  name?: string;
} | null> {
  if (!initFirebaseAdmin()) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = (decoded.email || '').trim().toLowerCase();
    if (!email) return null;
    return {
      uid: decoded.uid,
      email,
      name: decoded.name || decoded.email?.split('@')[0],
    };
  } catch {
    return null;
  }
}
