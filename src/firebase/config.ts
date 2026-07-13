/**
 * Initialisation Firebase (client Expo).
 *
 * Les valeurs sont lues depuis les variables d'environnement `EXPO_PUBLIC_*`
 * (voir `.env.example`). Renseigner `.env` avant de démarrer l'application.
 *
 * NB : la persistance Auth avec AsyncStorage doit être ajoutée quand le module
 * d'authentification sera implémenté (`initializeAuth` + `getReactNativePersistence`).
 */
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Firebase n'est initialisé QUE si un projet est configuré. En mode démo (sans
// clés), les exports restent indéfinis — ils ne sont utilisés que par les
// modules Firestore/Storage/Auth, eux-mêmes actifs uniquement en mode Firebase.
const configure = Boolean(firebaseConfig.projectId);

export const app: FirebaseApp | undefined = configure
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : undefined;

export const db = (configure ? getFirestore(app!) : undefined) as Firestore;
export const storage = (configure ? getStorage(app!) : undefined) as FirebaseStorage;
// NB : pour conserver la session entre deux lancements, remplacer par
// `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`
// (dépendance @react-native-async-storage/async-storage à ajouter).
export const auth = (configure ? getAuth(app!) : undefined) as Auth;
