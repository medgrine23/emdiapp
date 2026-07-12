/**
 * Service du module Devis quantitatif (§3.2).
 *
 * Un devis = un en-tête (`Devis`) + des lignes (`LigneDevis`). Les totaux de
 * l'en-tête sont dénormalisés et recalculés à chaque changement de ligne
 * (cf. docs/02 §4.7). Le devis est lié à un Projet et sert de base de référence
 * budgétaire aux Achats, et de source à la Facturation.
 */
import { getRepository } from '@/services/repository';
import { ID } from '@/types/models';
import { Devis, LigneDevis, StatutDevis } from '@/types/models';

export const COLLECTION_DEVIS = 'devis';
export const COLLECTION_LIGNES_DEVIS = 'lignesDevis';

export const devisRepo = getRepository<Devis>(COLLECTION_DEVIS);
export const lignesDevisRepo = getRepository<LigneDevis>(COLLECTION_LIGNES_DEVIS);

export const LIBELLE_STATUT_DEVIS: Record<StatutDevis, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  converti: 'Converti',
};

export interface Totaux {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

/** Calcule les totaux à partir des lignes et du taux de TVA (%). */
export function calculerTotaux(lignes: Pick<LigneDevis, 'totalLigne'>[], tauxTVA: number): Totaux {
  const totalHT = lignes.reduce((s, l) => s + (l.totalLigne || 0), 0);
  const totalTVA = totalHT * (tauxTVA / 100);
  return {
    totalHT,
    totalTVA,
    totalTTC: totalHT + totalTVA,
  };
}

/**
 * Recalcule et persiste les totaux de l'en-tête à partir de ses lignes actives.
 * À appeler après toute mutation de ligne (ajout, modification, suppression).
 */
export async function recalculerDevis(devisId: ID, utilisateurId: ID): Promise<void> {
  const devis = await devisRepo.lire(devisId);
  if (!devis) return;
  const lignes = await lignesDevisRepo.lister({ filtre: { devisId } });
  const totaux = calculerTotaux(lignes, devis.tauxTVA);
  await devisRepo.modifier(devisId, totaux, utilisateurId);
}
