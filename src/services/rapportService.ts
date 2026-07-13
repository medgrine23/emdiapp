/**
 * Service du module Rapport (§3.6).
 *
 * Rapports journaliers/hebdomadaires de chantier (météo, effectifs, remarques).
 * Les lignes d'avancement (`RapportTache`) METTENT À JOUR l'avancement des tâches
 * du Planning (§3.3) et justifient les factures de situation (§3.5). Les photos
 * du jour sont stockées dans la Documentation (§3.7).
 */
import { getRepository } from '@/services/repository';
import { tachesRepo } from '@/services/planningService';
import { ID, Rapport, RapportTache, StatutTache, TypeRapport } from '@/types/models';

export const COLLECTION_RAPPORTS = 'rapports';
export const COLLECTION_RAPPORTS_TACHE = 'rapportsTache';

export const rapportsRepo = getRepository<Rapport>(COLLECTION_RAPPORTS);
export const rapportsTacheRepo = getRepository<RapportTache>(COLLECTION_RAPPORTS_TACHE);

export const LIBELLE_TYPE_RAPPORT: Record<TypeRapport, string> = {
  journalier: 'Journalier',
  hebdomadaire: 'Hebdomadaire',
};

export const CONDITIONS_METEO = ['Ensoleillé', 'Nuageux', 'Pluie', 'Vent', 'Neige', 'Brouillard'];

/** Déduit le statut d'une tâche à partir de son avancement. */
export function statutDepuisAvancement(avancementPct: number): StatutTache {
  if (avancementPct >= 100) return StatutTache.Terminee;
  if (avancementPct > 0) return StatutTache.EnCours;
  return StatutTache.APlanifier;
}

/**
 * Propage l'avancement saisi dans un rapport vers la tâche du planning.
 * Le dernier rapport fait foi (docs/02 §4.5).
 */
export async function appliquerAvancementTache(
  tachePlanningId: ID,
  avancementPct: number,
  utilisateurId: ID
): Promise<void> {
  const tache = await tachesRepo.lire(tachePlanningId);
  if (!tache) return;
  await tachesRepo.modifier(
    tachePlanningId,
    { avancementPct, statut: statutDepuisAvancement(avancementPct) },
    utilisateurId
  );
}
