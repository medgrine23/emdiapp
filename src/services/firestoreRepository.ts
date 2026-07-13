/**
 * Implémentation Firestore de `Repository<T>` (temps réel via onSnapshot).
 *
 * Respecte exactement la sémantique de MemoryRepository (§2) :
 *   - les timestamps sont stockés en ISO 8601 (cohérence avec les types `Horodatage`) ;
 *   - `lister`/`souscrire` excluent les entités `supprime` par défaut et trient
 *     par date de création décroissante ;
 *   - le filtrage complet (y compris valeurs `undefined`) est appliqué côté client,
 *     les clauses `where` Firestore servant d'optimisation sur les valeurs définies.
 *
 * Sélectionné automatiquement par `getRepository` quand un projet Firebase est
 * configuré (voir src/services/repository.ts).
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '@/firebase/config';
import {
  Annulation,
  EntiteBase,
  EtatEntite,
  Horodatage,
  ID,
} from '@/types/models';
import {
  OptionsListe,
  Repository,
  SansMeta,
} from '@/services/repository';

const maintenant = (): Horodatage => new Date().toISOString();

function correspond(item: Record<string, unknown>, filtre?: Record<string, unknown>): boolean {
  if (!filtre) return true;
  return Object.entries(filtre).every(([k, v]) => item[k] === v);
}

export class FirestoreRepository<T extends EntiteBase> implements Repository<T> {
  constructor(private readonly nomCollection: string) {}

  private ref() {
    return collection(db, this.nomCollection);
  }

  /** Clauses where Firestore sur les seules valeurs définies (optimisation). */
  private contraintes(filtre?: Record<string, unknown>): QueryConstraint[] {
    if (!filtre) return [];
    return Object.entries(filtre)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => where(k, '==', v));
  }

  private filtrerTrier(items: T[], options?: OptionsListe): T[] {
    return items
      .filter((it) => {
        if (!options?.inclureSupprimes && it.etat === EtatEntite.Supprime) return false;
        return correspond(it as Record<string, unknown>, options?.filtre);
      })
      .sort((a, b) => (a.creeLe < b.creeLe ? 1 : -1));
  }

  async creer(data: SansMeta<T>, utilisateurId: ID): Promise<T> {
    const ts = maintenant();
    const doc = {
      ...(data as object),
      etat: EtatEntite.Actif,
      creeLe: ts,
      creePar: utilisateurId,
      modifieLe: ts,
      modifiePar: utilisateurId,
      supprimeLe: null,
      supprimePar: null,
      archiveLe: null,
      archivePar: null,
      annulation: null,
    };
    const ref = await addDoc(this.ref(), doc);
    return { ...(doc as object), id: ref.id } as T;
  }

  async lire(id: ID): Promise<T | null> {
    const snap = await getDoc(doc(db, this.nomCollection, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
  }

  async lister(options?: OptionsListe): Promise<T[]> {
    const snap = await getDocs(query(this.ref(), ...this.contraintes(options?.filtre)));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
    return this.filtrerTrier(items, options);
  }

  souscrire(cb: (items: T[]) => void, options?: OptionsListe): () => void {
    const q = query(this.ref(), ...this.contraintes(options?.filtre));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      cb(this.filtrerTrier(items, options));
    });
  }

  async modifier(id: ID, data: Partial<SansMeta<T>>, utilisateurId: ID): Promise<void> {
    const courant = await this.lire(id);
    if (courant && courant.etat === EtatEntite.Archive) {
      throw new Error('Modification interdite : entité archivée (lecture seule).');
    }
    await updateDoc(doc(db, this.nomCollection, id), {
      ...(data as object),
      modifieLe: maintenant(),
      modifiePar: utilisateurId,
    });
  }

  async supprimer(id: ID, utilisateurId: ID): Promise<void> {
    await updateDoc(doc(db, this.nomCollection, id), {
      etat: EtatEntite.Supprime,
      supprimeLe: maintenant(),
      supprimePar: utilisateurId,
      modifieLe: maintenant(),
      modifiePar: utilisateurId,
    });
  }

  async archiver(id: ID, utilisateurId: ID): Promise<void> {
    await updateDoc(doc(db, this.nomCollection, id), {
      etat: EtatEntite.Archive,
      archiveLe: maintenant(),
      archivePar: utilisateurId,
      modifieLe: maintenant(),
      modifiePar: utilisateurId,
    });
  }

  async annuler(id: ID, motif: string, utilisateurId: ID): Promise<void> {
    const m = motif.trim();
    if (!m) throw new Error("L'annulation exige un motif obligatoire.");
    const annulation: Annulation = { annuleLe: maintenant(), annulePar: utilisateurId, motif: m };
    await updateDoc(doc(db, this.nomCollection, id), {
      etat: EtatEntite.Annule,
      annulation,
      modifieLe: maintenant(),
      modifiePar: utilisateurId,
    });
  }
}
