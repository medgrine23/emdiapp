/**
 * Helpers CRUD standard imposés par le cahier des charges §2.
 *
 * Toutes les entités métier doivent supporter, SANS EXCEPTION :
 *   Créer · Lire · Modifier · Supprimer (soft-delete) · Archiver · Annuler (motif obligatoire).
 *
 * Ce module fournit une implémentation générique au-dessus de Firestore.
 * Les collections respectent le MCD (voir docs/02-modele-de-donnees.md).
 *
 * Les requêtes de lecture doivent, par défaut, exclure les entités supprimées
 * (etat != 'supprime') — cf. `filtreActifs`.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '@/firebase/config';
import { EtatEntite, type EntiteBase, type ID } from '@/types/models';

/** Contrainte à ajouter aux lectures pour masquer les entités soft-deleted. */
export const filtreActifs = (): QueryConstraint =>
  where('etat', '!=', EtatEntite.Supprime);

type SansMeta<T> = Omit<
  T,
  | 'id'
  | 'etat'
  | 'creeLe'
  | 'creePar'
  | 'modifieLe'
  | 'modifiePar'
  | 'supprimeLe'
  | 'supprimePar'
  | 'archiveLe'
  | 'archivePar'
  | 'annulation'
>;

/** CRÉER — insère une entité à l'état actif avec l'audit initial. */
export async function creer<T extends EntiteBase>(
  nomCollection: string,
  data: SansMeta<T>,
  utilisateurId: ID
): Promise<ID> {
  const ref = await addDoc(collection(db, nomCollection), {
    ...data,
    etat: EtatEntite.Actif,
    creeLe: serverTimestamp(),
    creePar: utilisateurId,
    modifieLe: serverTimestamp(),
    modifiePar: utilisateurId,
    supprimeLe: null,
    supprimePar: null,
    archiveLe: null,
    archivePar: null,
    annulation: null,
  });
  return ref.id;
}

/** LIRE — récupère une entité par son id. */
export async function lire<T extends EntiteBase>(
  nomCollection: string,
  id: ID
): Promise<T | null> {
  const snap = await getDoc(doc(db, nomCollection, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

/** LISTER — récupère les entités, en excluant les supprimées par défaut. */
export async function lister<T extends EntiteBase>(
  nomCollection: string,
  contraintes: QueryConstraint[] = [],
  inclureSupprimes = false
): Promise<T[]> {
  const cs = inclureSupprimes ? contraintes : [filtreActifs(), ...contraintes];
  const snap = await getDocs(query(collection(db, nomCollection), ...cs));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

/** MODIFIER — met à jour les champs fournis + audit. Interdit si archivée. */
export async function modifier<T extends EntiteBase>(
  nomCollection: string,
  id: ID,
  data: Partial<SansMeta<T>>,
  utilisateurId: ID
): Promise<void> {
  await updateDoc(doc(db, nomCollection, id), {
    ...data,
    modifieLe: serverTimestamp(),
    modifiePar: utilisateurId,
  });
}

/** SUPPRIMER — soft-delete (l'enregistrement est conservé en base). */
export async function supprimer(
  nomCollection: string,
  id: ID,
  utilisateurId: ID
): Promise<void> {
  await updateDoc(doc(db, nomCollection, id), {
    etat: EtatEntite.Supprime,
    supprimeLe: serverTimestamp(),
    supprimePar: utilisateurId,
    modifieLe: serverTimestamp(),
    modifiePar: utilisateurId,
  });
}

/** ARCHIVER — bascule l'entité en lecture seule. */
export async function archiver(
  nomCollection: string,
  id: ID,
  utilisateurId: ID
): Promise<void> {
  await updateDoc(doc(db, nomCollection, id), {
    etat: EtatEntite.Archive,
    archiveLe: serverTimestamp(),
    archivePar: utilisateurId,
    modifieLe: serverTimestamp(),
    modifiePar: utilisateurId,
  });
}

/** ANNULER — annule un document validé. Le motif est OBLIGATOIRE (§2). */
export async function annuler(
  nomCollection: string,
  id: ID,
  motif: string,
  utilisateurId: ID
): Promise<void> {
  const m = motif.trim();
  if (!m) {
    throw new Error("L'annulation exige un motif obligatoire.");
  }
  await updateDoc(doc(db, nomCollection, id), {
    etat: EtatEntite.Annule,
    annulation: { annuleLe: serverTimestamp(), annulePar: utilisateurId, motif: m },
    modifieLe: serverTimestamp(),
    modifiePar: utilisateurId,
  });
}
