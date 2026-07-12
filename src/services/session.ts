/**
 * Session courante (provisoire).
 *
 * L'authentification (Firebase Auth) n'est pas encore implémentée. En attendant,
 * on expose un utilisateur courant fixe utilisé pour l'audit (creePar, modifiePar…).
 * À remplacer par le contexte d'authentification réel.
 */
import { ID } from '@/types/models';

export const UTILISATEUR_COURANT_ID: ID = 'u-demo';
export const UTILISATEUR_COURANT_NOM = 'Utilisateur démo';
