/**
 * Service d'authentification (Firebase Auth).
 *
 * Fournit connexion / inscription / déconnexion et un observateur d'état.
 * À la connexion, l'utilisateur courant de la session est renseigné pour
 * l'audit (creePar/modifiePar). N'a d'effet que si Firebase est configuré.
 */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { auth } from '@/firebase/config';
import { firebaseConfigure } from '@/services/repository';
import { definirUtilisateurCourant, reinitialiserUtilisateurCourant } from '@/services/session';

export const authDisponible = firebaseConfigure;

export async function connexion(email: string, motDePasse: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, motDePasse);
  return cred.user;
}

export async function inscription(email: string, motDePasse: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, motDePasse);
  return cred.user;
}

export async function deconnexion(): Promise<void> {
  await signOut(auth);
}

/**
 * Observe l'état d'authentification et synchronise la session courante.
 * Renvoie la fonction de désabonnement.
 */
export function observerAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      definirUtilisateurCourant(user.uid, user.displayName ?? user.email ?? user.uid);
    } else {
      reinitialiserUtilisateurCourant();
    }
    cb(user);
  });
}
