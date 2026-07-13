/**
 * Service du module Planning / Gantt (§3.3).
 *
 * Gère les tâches (`TachePlanning`) et leurs dépendances typées
 * (`DependanceTache` : Fin-Début, Début-Début, Fin-Fin, Début-Fin + décalage).
 * Une tâche peut être rattachée à une ligne du devis quantitatif. L'avancement
 * saisi ici est mis à jour par les rapports de chantier (§3.6).
 */
import { getRepository } from '@/services/repository';
import {
  DependanceTache,
  EntiteBase,
  Horodatage,
  ID,
  StatutTache,
  TachePlanning,
  TypeDependance,
} from '@/types/models';

/** DependanceTache dotée du cycle de vie standard pour passer par le repository générique. */
export type DependanceEntite = DependanceTache & EntiteBase;

export const COLLECTION_TACHES = 'tachesPlanning';
export const COLLECTION_DEPENDANCES = 'dependancesTache';

export const tachesRepo = getRepository<TachePlanning>(COLLECTION_TACHES);
export const dependancesRepo = getRepository<DependanceEntite>(COLLECTION_DEPENDANCES);

export const LIBELLE_STATUT_TACHE: Record<StatutTache, string> = {
  a_planifier: 'À planifier',
  en_cours: 'En cours',
  en_retard: 'En retard',
  terminee: 'Terminée',
};

export const LIBELLE_TYPE_DEPENDANCE: Record<TypeDependance, string> = {
  FD: 'Fin → Début',
  DD: 'Début → Début',
  FF: 'Fin → Fin',
  DF: 'Début → Fin',
};

const MS_JOUR = 24 * 60 * 60 * 1000;

/** Nombre de jours entre deux dates (peut être négatif). */
export function joursEntre(a: Horodatage, b: Horodatage): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / MS_JOUR);
}

/** Durée en jours (inclusive) d'une tâche. */
export function calculerDuree(dateDebut: Horodatage, dateFin: Horodatage): number {
  return Math.max(1, joursEntre(dateDebut, dateFin) + 1);
}

export interface PlagePlanning {
  debut: Horodatage;
  fin: Horodatage;
  totalJours: number;
}

/** Plage temporelle englobant toutes les tâches (pour dimensionner le Gantt). */
export function plagePlanning(taches: TachePlanning[]): PlagePlanning | null {
  if (taches.length === 0) return null;
  let debut = taches[0].dateDebut;
  let fin = taches[0].dateFin;
  for (const t of taches) {
    if (t.dateDebut < debut) debut = t.dateDebut;
    if (t.dateFin > fin) fin = t.dateFin;
  }
  return { debut, fin, totalJours: calculerDuree(debut, fin) };
}

/** Couleur d'une tâche selon son statut (pour la barre de Gantt). */
export const COULEUR_STATUT: Record<StatutTache, string> = {
  a_planifier: '#8895A0',
  en_cours: '#1B6C99',
  en_retard: '#C62828',
  terminee: '#2E7D32',
};
