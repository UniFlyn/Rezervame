import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { app } from "./firebase";

export async function signInWithGooglePopup(): Promise<string> {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const token = await result.user.getIdToken();
  if (!token) throw new Error("Google sign-in did not return a token");
  return token;
}
