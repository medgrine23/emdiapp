/**
 * Session courante.
 *
 * En mode démo (sans Firebase), l'utilisateur est fixe. Quand l'authentification
 * Firebase est active, `definirUtilisateurCourant()` est appelé par la couche
 * Auth pour renseigner l'utilisateur connecté ; l'audit (creePar, modifiePar…)
 * utilise alors son identifiant.
 *
 * Utiliser de préférence `utilisateurCourantId()` (valeur à jour). La constante
 * `UTILISATEUR_COURANT_ID` reste exposée pour la rétrocompatibilité du mode démo.
 */
import { ID } from '@/types/models';

const DEMO_ID: ID = 'u-demo';
const DEMO_NOM = 'Utilisateur démo';

let _id: ID = DEMO_ID;
let _nom = DEMO_NOM;

/** Identifiant de l'utilisateur courant (à jour). */
export const utilisateurCourantId = (): ID => _id;
/** Nom de l'utilisateur courant (à jour). */
export const utilisateurCourantNom = (): string => _nom;

/** Renseigne l'utilisateur connecté (appelé par la couche Auth). */
export function definirUtilisateurCourant(id: ID, nom?: string): void {
  _id = id;
  _nom = nom ?? id;
}

/** Réinitialise vers l'utilisateur démo (déconnexion). */
export function reinitialiserUtilisateurCourant(): void {
  _id = DEMO_ID;
  _nom = DEMO_NOM;
}

/** Rétrocompatibilité (mode démo). */
export const UTILISATEUR_COURANT_ID: ID = DEMO_ID;
export const UTILISATEUR_COURANT_NOM = DEMO_NOM;
