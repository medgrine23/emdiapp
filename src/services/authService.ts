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
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/firebase/config';
import { firebaseConfigure } from '@/services/repository';
import { definirUtilisateurCourant, reinitialiserUtilisateurCourant } from '@/services/session';
import { RoleUtilisateur } from '@/types/models';

export const authDisponible = firebaseConfigure;

/** Permissions par défaut d'un nouvel utilisateur (non-admin). */
const PERMISSIONS_DEFAUT = ['projets', 'planning', 'rapports', 'achats', 'documentation', 'chat'];

export async function connexion(email: string, motDePasse: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, motDePasse);
  return cred.user;
}

/**
 * Crée le compte Auth et auto-provisionne le profil `utilisateurs/{uid}`
 * (rôle non-admin) nécessaire au contrôle d'accès (RBAC). Le premier
 * administrateur est promu manuellement depuis la console Firebase.
 */
export async function inscription(email: string, motDePasse: string, nom?: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, motDePasse);
  const uid = cred.user.uid;
  const ts = new Date().toISOString();
  await setDoc(doc(db, 'utilisateurs', uid), {
    nom: nom ?? email,
    prenom: '',
    email,
    role: RoleUtilisateur.ChefChantier,
    permissions: PERMISSIONS_DEFAUT,
    actif: true,
    etat: 'actif',
    creeLe: ts,
    creePar: uid,
    modifieLe: ts,
    modifiePar: uid,
    supprimeLe: null,
    supprimePar: null,
    archiveLe: null,
    archivePar: null,
    annulation: null,
  });
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
