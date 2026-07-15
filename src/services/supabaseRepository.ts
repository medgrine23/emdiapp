/**
 * Implémentation Supabase de `Repository<T>` (temps réel via Postgres Changes).
 *
 * Toutes les entités sont stockées dans une table unique `entites` :
 *   - colonnes de méta (état, audit, soft-delete, archivage, annulation) ;
 *   - colonne `collection` (ex. 'projets', 'devis'…) pour l'aiguillage ;
 *   - colonne JSONB `data` portant les champs métier propres à chaque entité.
 * Voir `supabase/schema.sql` pour le schéma, les index et les règles RLS.
 *
 * La sémantique reproduit exactement `MemoryRepository`/`FirestoreRepository` (§2) :
 * timestamps ISO 8601, exclusion des `supprime` par défaut, tri par date de
 * création décroissante, filtrage métier appliqué côté client.
 *
 * Sélectionné automatiquement par `getRepository` quand un projet Supabase est
 * configuré (voir src/services/repository.ts).
 */
import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase, TABLE_ENTITES } from '@/supabase/config';
import {
  Annulation,
  EntiteBase,
  EtatEntite,
  Horodatage,
  ID,
} from '@/types/models';
import {
  Meta,
  OptionsListe,
  Repository,
  SansMeta,
} from '@/services/repository';

const maintenant = (): Horodatage => new Date().toISOString();

/** Clés de méta gérées en colonnes dédiées (jamais dans `data`). */
const CLES_META: Meta[] = [
  'id', 'etat', 'creeLe', 'creePar', 'modifieLe', 'modifiePar',
  'supprimeLe', 'supprimePar', 'archiveLe', 'archivePar', 'annulation',
];

/** Ligne telle que stockée / renvoyée par PostgREST. */
interface Ligne {
  id: string;
  collection: string;
  etat: string;
  cree_le: string;
  cree_par: string;
  modifie_le: string;
  modifie_par: string;
  supprime_le: string | null;
  supprime_par: string | null;
  archive_le: string | null;
  archive_par: string | null;
  annulation: Annulation | null;
  data: Record<string, unknown>;
}

function correspond(item: Record<string, unknown>, filtre?: Record<string, unknown>): boolean {
  if (!filtre) return true;
  return Object.entries(filtre).every(([k, v]) => item[k] === v);
}

/** Sépare les champs métier (→ `data`) des champs de méta. */
function extraireData(data: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!(CLES_META as string[]).includes(k)) out[k] = v;
  }
  return out;
}

/** Reconstruit une entité applicative depuis une ligne Postgres. */
function versEntite<T extends EntiteBase>(l: Ligne): T {
  return {
    id: l.id,
    etat: l.etat as EtatEntite,
    creeLe: l.cree_le,
    creePar: l.cree_par,
    modifieLe: l.modifie_le,
    modifiePar: l.modifie_par,
    supprimeLe: l.supprime_le,
    supprimePar: l.supprime_par,
    archiveLe: l.archive_le,
    archivePar: l.archive_par,
    annulation: l.annulation,
    ...(l.data ?? {}),
  } as T;
}

export class SupabaseRepository<T extends EntiteBase> implements Repository<T> {
  constructor(private readonly nomCollection: string) {}

  private filtrerTrier(items: T[], options?: OptionsListe): T[] {
    return items
      .filter((it) => {
        if (!options?.inclureSupprimes && it.etat === EtatEntite.Supprime) return false;
        return correspond(it as Record<string, unknown>, options?.filtre);
      })
      .sort((a, b) => (a.creeLe < b.creeLe ? 1 : -1));
  }

  private async lireLignes(): Promise<T[]> {
    const { data, error } = await supabase
      .from(TABLE_ENTITES)
      .select('*')
      .eq('collection', this.nomCollection);
    if (error) throw new Error(`Supabase: ${error.message}`);
    return (data as Ligne[]).map((l) => versEntite<T>(l));
  }

  async creer(data: SansMeta<T>, utilisateurId: ID): Promise<T> {
    const ts = maintenant();
    const ligne = {
      collection: this.nomCollection,
      etat: EtatEntite.Actif,
      cree_le: ts,
      cree_par: utilisateurId,
      modifie_le: ts,
      modifie_par: utilisateurId,
      supprime_le: null,
      supprime_par: null,
      archive_le: null,
      archive_par: null,
      annulation: null,
      data: extraireData(data as object),
    };
    const { data: inseree, error } = await supabase
      .from(TABLE_ENTITES)
      .insert(ligne)
      .select('*')
      .single();
    if (error) throw new Error(`Supabase: ${error.message}`);
    return versEntite<T>(inseree as Ligne);
  }

  async lire(id: ID): Promise<T | null> {
    const { data, error } = await supabase
      .from(TABLE_ENTITES)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase: ${error.message}`);
    return data ? versEntite<T>(data as Ligne) : null;
  }

  async lister(options?: OptionsListe): Promise<T[]> {
    return this.filtrerTrier(await this.lireLignes(), options);
  }

  souscrire(cb: (items: T[]) => void, options?: OptionsListe): () => void {
    let vivant = true;
    const emettre = () => {
      this.lireLignes()
        .then((items) => {
          if (vivant) cb(this.filtrerTrier(items, options));
        })
        .catch(() => {
          /* réseau : on garde la dernière liste connue */
        });
    };
    // Émission initiale immédiate.
    emettre();
    // Ré-émission à chaque changement de la collection (temps réel).
    const canal: RealtimeChannel = supabase
      .channel(`entites:${this.nomCollection}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_ENTITES, filter: `collection=eq.${this.nomCollection}` },
        () => emettre()
      )
      .subscribe();
    return () => {
      vivant = false;
      supabase.removeChannel(canal);
    };
  }

  async modifier(id: ID, data: Partial<SansMeta<T>>, utilisateurId: ID): Promise<void> {
    const courant = await this.lire(id);
    if (!courant) throw new Error(`Entité introuvable: ${id}`);
    if (courant.etat === EtatEntite.Archive) {
      throw new Error('Modification interdite : entité archivée (lecture seule).');
    }
    // Fusion des champs métier dans `data` (préserve les champs non fournis).
    const dataActuelle = extraireData(courant as object);
    const dataFusion = { ...dataActuelle, ...extraireData(data as object) };
    const { error } = await supabase
      .from(TABLE_ENTITES)
      .update({ data: dataFusion, modifie_le: maintenant(), modifie_par: utilisateurId })
      .eq('id', id);
    if (error) throw new Error(`Supabase: ${error.message}`);
  }

  async supprimer(id: ID, utilisateurId: ID): Promise<void> {
    const ts = maintenant();
    const { error } = await supabase
      .from(TABLE_ENTITES)
      .update({ etat: EtatEntite.Supprime, supprime_le: ts, supprime_par: utilisateurId, modifie_le: ts, modifie_par: utilisateurId })
      .eq('id', id);
    if (error) throw new Error(`Supabase: ${error.message}`);
  }

  async archiver(id: ID, utilisateurId: ID): Promise<void> {
    const ts = maintenant();
    const { error } = await supabase
      .from(TABLE_ENTITES)
      .update({ etat: EtatEntite.Archive, archive_le: ts, archive_par: utilisateurId, modifie_le: ts, modifie_par: utilisateurId })
      .eq('id', id);
    if (error) throw new Error(`Supabase: ${error.message}`);
  }

  async annuler(id: ID, motif: string, utilisateurId: ID): Promise<void> {
    const m = motif.trim();
    if (!m) throw new Error("L'annulation exige un motif obligatoire.");
    const annulation: Annulation = { annuleLe: maintenant(), annulePar: utilisateurId, motif: m };
    const { error } = await supabase
      .from(TABLE_ENTITES)
      .update({ etat: EtatEntite.Annule, annulation, modifie_le: maintenant(), modifie_par: utilisateurId })
      .eq('id', id);
    if (error) throw new Error(`Supabase: ${error.message}`);
  }
}
