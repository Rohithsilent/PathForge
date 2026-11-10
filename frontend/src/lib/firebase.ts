/**
 * Firebase configuration and initialization.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/ and create a new project
 * 2. Click "Add app" → Web app icon (</>)
 * 3. Copy the firebaseConfig object below and replace the placeholder values
 * 4. In Firebase Console → Authentication → Sign-in method → enable "Google"
 * 5. In Firebase Console → Project Settings → Service Accounts → Generate new private key
 *    → save as backend/serviceAccountKey.json
 * 6. Update FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json in backend/.env
 *
 * Frontend env vars needed in frontend/.env.local:
 *   NEXT_PUBLIC_FIREBASE_API_KEY=...
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
 *   NEXT_PUBLIC_FIREBASE_APP_ID=...
 */
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    signOut,
    Auth,
    User,
    UserCredential
} from "firebase/auth"

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pathforge-87c24.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pathforge-87c24",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

// Initialize Firebase (only once — Next.js hot-reload safe)
let app: FirebaseApp
let auth: Auth

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
} else {
    app = getApps()[0]
}

auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: "select_account" })

/**
 * Sign in with Google popup. Returns the Firebase UserCredential.
 * The caller should then call getIdToken() and send it to the backend.
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
    return signInWithPopup(auth, googleProvider)
}

/**
 * Sign in with Google full-page redirect.
 * Bypasses all browser pop-up blockers, ad blockers, and third-party cookie restrictions.
 */
export const signInWithGoogleRedirect = async (): Promise<void> => {
    return signInWithRedirect(auth, googleProvider)
}

/**
 * Process the redirect result after returning from Google Sign-In.
 */
export const getGoogleRedirectResult = async (): Promise<UserCredential | null> => {
    if (typeof window === "undefined" || !auth) return null
    return getRedirectResult(auth)
}

/**
 * Listen for auth state changes (crucial for redirect sign-in).
 */
export const onAuthUserChange = (callback: (user: User | null) => void) => {
    if (typeof window === "undefined" || !auth) return () => {}
    return onAuthStateChanged(auth, callback)
}

/**
 * Sign out the current Firebase user.
 */
export const firebaseSignOut = async (): Promise<void> => {
    if (typeof window === "undefined" || !auth) return
    return signOut(auth)
}

/**
 * Returns true if Firebase is configured (env vars are set).
 */
export const isFirebaseConfigured = (): boolean => {
    return !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    )
}

export { auth, googleProvider }
export default app
