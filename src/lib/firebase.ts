import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAIgoOhVFBpdKmXc39k7vn0miGG8TTnZ0k",
  authDomain: "gen-lang-client-0180349739.firebaseapp.com",
  projectId: "gen-lang-client-0180349739",
  storageBucket: "gen-lang-client-0180349739.firebasestorage.app",
  messagingSenderId: "259120685523",
  appId: "1:259120685523:web:9c2f7b1b5156bf55c8cf26"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut };

// Helper to auto-sign in anonymously if not logged in
export async function ensureAuthenticated(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          resolve(userCredential.user);
        } catch (error: any) {
          console.warn("Anonymous authentication is disabled or restricted on this project:", error.message || error);
          // Resolve with null instead of rejecting so that the application can bootstrap
          // gracefully and let the user decide whether to log in with Google or use the Local Sandbox.
          resolve(null);
        }
      }
    });
  });
}

// Test Firebase connection
export async function testConnection() {
  try {
    // Attempting a server-side read check
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Firebase is offline. Check internet connection.");
    }
  }
}

// Invoke test connection
testConnection();
