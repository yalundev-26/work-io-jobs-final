import { initializeApp } from 'firebase/app'
import { initializeAuth, browserSessionPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBY6zs1autFClVsCIAtazqxG8E8JegKm_E",
  authDomain: "worldwidefreelancerjobs.firebaseapp.com",
  projectId: "worldwidefreelancerjobs",
  storageBucket: "worldwidefreelancerjobs.firebasestorage.app",
  messagingSenderId: "104988752107",
  appId: "1:104988752107:web:fb48524d264fe238c9a6ae",
  measurementId: "G-06822C4SVJ"
}

const app = initializeApp(firebaseConfig)

// Use session persistence so stale auth tokens don't linger across browser sessions
// This prevents "accounts:lookup 400" errors from deleted test phone numbers
export const auth = initializeAuth(app, { persistence: browserSessionPersistence })
