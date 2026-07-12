/**
 * Service du module Achat (§3.4).
 *
 * Centré sur le Bon de commande fournisseur (`BonCommande` + `LigneAchat`) et le
 * suivi des `Livraison`. Chaque ligne d'achat peut référencer une ligne du Devis
 * quantitatif : le service évalue alors un DÉPASSEMENT budgétaire (quantité ou
 * prix supérieurs au devis) — exigence §3.2/§3.4.
 */
import { lignesDevisRepo } from '@/services/devisService';
import { getRepository } from '@/services/repository';
import {
  BonCommande,
  Fournisseur,
  ID,
  LigneAchat,
  LigneDevis,
  Livraison,
  StatutBonCommande,
} from '@/types/models';

export const COLLECTION_FOURNISSEURS = 'fournisseurs';
export const COLLECTION_BONS_COMMANDE = 'bonsCommande';
export const COLLECTION_LIGNES_ACHAT = 'lignesAchat';
export const COLLECTION_LIVRAISONS = 'livraisons';

export const fournisseursRepo = getRepository<Fournisseur>(COLLECTION_FOURNISSEURS);
export const bonsCommandeRepo = getRepository<BonCommande>(COLLECTION_BONS_COMMANDE);
export const lignesAchatRepo = getRepository<LigneAchat>(COLLECTION_LIGNES_ACHAT);
export const livraisonsRepo = getRepository<Livraison>(COLLECTION_LIVRAISONS);

export const LIBELLE_STATUT_BON_COMMANDE: Record<StatutBonCommande, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  reception_partielle: 'Réception partielle',
  receptionne: 'Réceptionné',
};

/** Recalcule le total HT de l'en-tête à partir de ses lignes actives. */
export async function recalculerBonCommande(bonCommandeId: ID, utilisateurId: ID): Promise<void> {
  const bc = await bonsCommandeRepo.lire(bonCommandeId);
  if (!bc) return;
  const lignes = await lignesAchatRepo.lister({ filtre: { bonCommandeId } });
  const totalHT = lignes.reduce((s, l) => s + (l.totalLigne || 0), 0);
  await bonsCommandeRepo.modifier(bonCommandeId, { totalHT }, utilisateurId);
}

export interface Depassement {
  depassementPrix: boolean;
  depassementQuantite: boolean;
}

/** Évalue un dépassement d'une ligne d'achat par rapport à sa ligne de devis. */
export function evaluerDepassement(
  ligne: Pick<LigneAchat, 'quantite' | 'prixUnitaire'>,
  ref: Pick<LigneDevis, 'quantite' | 'prixUnitaire'> | null | undefined
): Depassement {
  if (!ref) return { depassementPrix: false, depassementQuantite: false };
  return {
    depassementPrix: ligne.prixUnitaire > ref.prixUnitaire,
    depassementQuantite: ligne.quantite > ref.quantite,
  };
}

export const aDepassement = (d: Depassement): boolean => d.depassementPrix || d.depassementQuantite;

/** Récupère la ligne de devis référencée (pour affichage du budget de référence). */
export async function ligneDevisReference(ligneDevisId?: ID | null): Promise<LigneDevis | null> {
  if (!ligneDevisId) return null;
  return lignesDevisRepo.lire(ligneDevisId);
}
