/**
 * Service du module Facturation (§3.5).
 *
 * Une facture = en-tête (`Facture`) + lignes (`LigneFacture`), avec suivi des
 * `Paiement` et des `Relance`. La facturation est alimentée par le Devis
 * quantitatif (conversion devis → facture) et par les rapports d'avancement.
 */
import { devisRepo, lignesDevisRepo } from '@/services/devisService';
import { calculerTotaux } from '@/services/devisService';
import { getRepository } from '@/services/repository';
import {
  Facture,
  ID,
  LigneFacture,
  ModePaiement,
  Paiement,
  Relance,
  StatutDevis,
  StatutFacture,
  TypeFacture,
} from '@/types/models';

export const COLLECTION_FACTURES = 'factures';
export const COLLECTION_LIGNES_FACTURE = 'lignesFacture';
export const COLLECTION_PAIEMENTS = 'paiements';
export const COLLECTION_RELANCES = 'relances';

export const facturesRepo = getRepository<Facture>(COLLECTION_FACTURES);
export const lignesFactureRepo = getRepository<LigneFacture>(COLLECTION_LIGNES_FACTURE);
export const paiementsRepo = getRepository<Paiement>(COLLECTION_PAIEMENTS);
export const relancesRepo = getRepository<Relance>(COLLECTION_RELANCES);

export const LIBELLE_STATUT_FACTURE: Record<StatutFacture, string> = {
  brouillon: 'Brouillon',
  emise: 'Émise',
  payee_partiel: 'Payée partiellement',
  payee: 'Payée',
  en_retard: 'En retard',
  annulee: 'Annulée',
};

export const LIBELLE_TYPE_FACTURE: Record<TypeFacture, string> = {
  acompte: 'Acompte',
  situation: 'Situation',
  solde: 'Solde',
  avoir: 'Avoir',
};

export const LIBELLE_MODE_PAIEMENT: Record<ModePaiement, string> = {
  virement: 'Virement',
  cheque: 'Chèque',
  especes: 'Espèces',
  carte: 'Carte',
};

/** Reste à payer d'une facture. */
export const resteAPayer = (f: Facture): number => Math.max(0, f.totalTTC - f.montantPaye);

/** Recalcule les totaux de l'en-tête à partir de ses lignes actives. */
export async function recalculerFacture(factureId: ID, utilisateurId: ID): Promise<void> {
  const facture = await facturesRepo.lire(factureId);
  if (!facture) return;
  const lignes = await lignesFactureRepo.lister({ filtre: { factureId } });
  const totaux = calculerTotaux(lignes, facture.tauxTVA);
  await facturesRepo.modifier(factureId, totaux, utilisateurId);
}

/**
 * Recalcule le montant payé (somme des paiements) et met à jour le statut de
 * paiement. N'ajuste pas le statut d'une facture en brouillon ou annulée.
 */
export async function recalculerPaiements(factureId: ID, utilisateurId: ID): Promise<void> {
  const facture = await facturesRepo.lire(factureId);
  if (!facture) return;
  const paiements = await paiementsRepo.lister({ filtre: { factureId } });
  const montantPaye = paiements.reduce((s, p) => s + (p.montant || 0), 0);

  let statut = facture.statut;
  if (facture.statut !== StatutFacture.Brouillon && facture.statut !== StatutFacture.Annulee) {
    if (montantPaye <= 0) statut = StatutFacture.Emise;
    else if (montantPaye < facture.totalTTC) statut = StatutFacture.PayeePartiel;
    else statut = StatutFacture.Payee;
  }
  await facturesRepo.modifier(factureId, { montantPaye, statut }, utilisateurId);
}

/**
 * Convertit un devis en facture : crée l'en-tête et importe les lignes du devis.
 * Marque le devis comme converti (§3.2 / §3.5).
 */
export async function convertirDevisEnFacture(
  devisId: ID,
  factureId: ID,
  utilisateurId: ID
): Promise<void> {
  const facture = await facturesRepo.lire(factureId);
  if (!facture) return;
  const lignes = await lignesDevisRepo.lister({ filtre: { devisId } });
  for (const l of lignes) {
    await lignesFactureRepo.creer(
      {
        factureId,
        projetId: facture.projetId,
        designation: l.designation,
        unite: l.unite,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        totalLigne: l.totalLigne,
      },
      utilisateurId
    );
  }
  await recalculerFacture(factureId, utilisateurId);
  await devisRepo.modifier(devisId, { statut: StatutDevis.Converti }, utilisateurId);
}
