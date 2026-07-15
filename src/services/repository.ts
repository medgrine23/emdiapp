/**
 * Couche d'accès aux données (Repository).
 *
 * Abstrait le stockage derrière une interface unique portant les 6 actions
 * standard du cahier des charges §2. Deux implémentations :
 *   - `MemoryRepository` : en mémoire, réactive (pub/sub) — permet de faire tourner
 *     et démontrer l'application SANS projet Firebase configuré.
 *   - (à venir) `FirestoreRepository` : au-dessus de src/services/crud.ts.
 *
 * `getRepository(collection)` renvoie un singleton par collection. Le choix de
 * l'implémentation se fait via `EXPO_PUBLIC_FIREBASE_PROJECT_ID` : en son absence,
 * on reste en mémoire (mode démo/dev).
 */
import {
  Annulation,
  EntiteBase,
  EtatEntite,
  Horodatage,
  ID,
} from '@/types/models';

/** Champs gérés automatiquement par le repository (non fournis à la création). */
export type Meta =
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
  | 'annulation';

export type SansMeta<T extends EntiteBase> = Omit<T, Meta>;

export interface OptionsListe {
  /** Inclure les entités soft-deleted (masquées par défaut). */
  inclureSupprimes?: boolean;
  /** Filtre d'égalité simple, ex. { projetId: 'p1' }. */
  filtre?: Record<string, unknown>;
}

export interface Repository<T extends EntiteBase> {
  creer(data: SansMeta<T>, utilisateurId: ID): Promise<T>;
  lire(id: ID): Promise<T | null>;
  lister(options?: OptionsListe): Promise<T[]>;
  /** Abonnement réactif : rappelé à chaque changement. Renvoie la fonction de désabonnement. */
  souscrire(cb: (items: T[]) => void, options?: OptionsListe): () => void;
  modifier(id: ID, data: Partial<SansMeta<T>>, utilisateurId: ID): Promise<void>;
  supprimer(id: ID, utilisateurId: ID): Promise<void>; // soft-delete
  archiver(id: ID, utilisateurId: ID): Promise<void>;
  annuler(id: ID, motif: string, utilisateurId: ID): Promise<void>; // motif obligatoire
}

const maintenant = (): Horodatage => new Date().toISOString();

let compteurId = 0;
const genererId = (): ID =>
  `${Date.now().toString(36)}-${(compteurId++).toString(36)}`;

function correspond(item: Record<string, unknown>, filtre?: Record<string, unknown>): boolean {
  if (!filtre) return true;
  return Object.entries(filtre).every(([k, v]) => item[k] === v);
}

export class MemoryRepository<T extends EntiteBase> implements Repository<T> {
  private readonly donnees = new Map<ID, T>();
  private readonly abonnes = new Set<() => void>();

  private notifier(): void {
    this.abonnes.forEach((fn) => fn());
  }

  private filtrer(options?: OptionsListe): T[] {
    const items = [...this.donnees.values()].filter((it) => {
      if (!options?.inclureSupprimes && it.etat === EtatEntite.Supprime) return false;
      return correspond(it as Record<string, unknown>, options?.filtre);
    });
    return items.sort((a, b) => (a.creeLe < b.creeLe ? 1 : -1)); // plus récent d'abord
  }

  async creer(data: SansMeta<T>, utilisateurId: ID): Promise<T> {
    const id = genererId();
    const ts = maintenant();
    const item = {
      ...(data as object),
      id,
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
    } as T;
    this.donnees.set(id, item);
    this.notifier();
    return item;
  }

  async lire(id: ID): Promise<T | null> {
    return this.donnees.get(id) ?? null;
  }

  async lister(options?: OptionsListe): Promise<T[]> {
    return this.filtrer(options);
  }

  souscrire(cb: (items: T[]) => void, options?: OptionsListe): () => void {
    const emettre = () => cb(this.filtrer(options));
    this.abonnes.add(emettre);
    emettre();
    return () => {
      this.abonnes.delete(emettre);
    };
  }

  private muter(id: ID, patch: Partial<T>): void {
    const courant = this.donnees.get(id);
    if (!courant) throw new Error(`Entité introuvable: ${id}`);
    this.donnees.set(id, { ...courant, ...patch });
    this.notifier();
  }

  async modifier(id: ID, data: Partial<SansMeta<T>>, utilisateurId: ID): Promise<void> {
    const courant = this.donnees.get(id);
    if (courant && courant.etat === EtatEntite.Archive) {
      throw new Error('Modification interdite : entité archivée (lecture seule).');
    }
    this.muter(id, {
      ...(data as Partial<T>),
      modifieLe: maintenant(),
      modifiePar: utilisateurId,
    } as Partial<T>);
  }

  async supprimer(id: ID, utilisateurId: ID): Promise<void> {
    this.muter(id, {
      etat: EtatEntite.Supprime,
      supprimeLe: maintenant(),
      supprimePar: utilisateurId,
      modifieLe: maintenant(),
      modifiePar: utilisateurId,
    } as Partial<T>);
  }

  async archiver(id: ID, utilisateurId: ID): Promise<void> {
    this.muter(id, {
      etat: EtatEntite.Archive,
      archiveLe: maintenant(),
      archivePar: utilisateurId,
      modifieLe: maintenant(),
      modifiePar: utilisateurId,
    } as Partial<T>);
  }

  async annuler(id: ID, motif: string, utilisateurId: ID): Promise<void> {
    const m = motif.trim();
    if (!m) throw new Error("L'annulation exige un motif obligatoire.");
    const annulation: Annulation = {
      annuleLe: maintenant(),
      annulePar: utilisateurId,
      motif: m,
    };
    this.muter(id, {
      etat: EtatEntite.Annule,
      annulation,
      modifieLe: maintenant(),
      modifiePar: utilisateurId,
    } as Partial<T>);
  }
}

/** Vrai si un projet Firebase est configuré (stockage Firestore). */
export const firebaseConfigure = Boolean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);

/** Vrai si un projet Supabase est configuré (stockage Supabase, prioritaire). */
export const supabaseConfigure = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

/** Vrai si un backend réel (Supabase ou Firestore) est configuré. */
export const backendConfigure = supabaseConfigure || firebaseConfigure;

const registre = new Map<string, Repository<EntiteBase>>();

/**
 * Renvoie le repository (singleton) d'une collection. Ordre de priorité :
 *   1. Supabase (temps réel) si un projet Supabase est configuré ;
 *   2. Firestore (temps réel) si un projet Firebase est configuré ;
 *   3. mémoire (mode démo/dev) sinon.
 * Les modules backend sont chargés paresseusement pour ne rien initialiser en
 * mode démo.
 */
export function getRepository<T extends EntiteBase>(collection: string): Repository<T> {
  let repo = registre.get(collection);
  if (!repo) {
    if (supabaseConfigure) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SupabaseRepository } = require('@/services/supabaseRepository');
      repo = new SupabaseRepository(collection) as Repository<EntiteBase>;
    } else if (firebaseConfigure) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { FirestoreRepository } = require('@/services/firestoreRepository');
      repo = new FirestoreRepository(collection) as Repository<EntiteBase>;
    } else {
      repo = new MemoryRepository<EntiteBase>();
    }
    registre.set(collection, repo);
  }
  return repo as Repository<T>;
}
