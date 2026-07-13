/**
 * Initialisation Firebase (client Expo).
 *
 * Les valeurs sont lues depuis les variables d'environnement `EXPO_PUBLIC_*`
 * (voir `.env.example`). Renseigner `.env` avant de démarrer l'application.
 *
 * NB : la persistance Auth avec AsyncStorage doit être ajoutée quand le module
 * d'authentification sera implémenté (`initializeAuth` + `getReactNativePersistence`).
 */
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
// NB : pour conserver la session entre deux lancements, remplacer par
// `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`
// (dépendance @react-native-async-storage/async-storage à ajouter).
export const auth = getAuth(app);
