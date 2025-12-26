import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBh3BkcGcvvUAXgaE7OGelHF67-42__bvI",
  authDomain: "vibe-1d719.firebaseapp.com",
  projectId: "vibe-1d719",
  storageBucket: "vibe-1d719.firebasestorage.app",
  messagingSenderId: "94247313580",
  appId: "1:94247313580:web:5b0a557d564f1e361c3f09",
  measurementId: "G-0QRWDNGGPN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
