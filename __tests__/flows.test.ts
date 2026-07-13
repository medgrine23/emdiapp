import { devisRepo, lignesDevisRepo, recalculerDevis } from '@/services/devisService';
import {
  convertirDevisEnFacture,
  facturesRepo,
  lignesFactureRepo,
  paiementsRepo,
  recalculerFacture,
  recalculerPaiements,
} from '@/services/factureService';
import { tachesRepo } from '@/services/planningService';
import { appliquerAvancementTache } from '@/services/rapportService';
import { StatutDevis, StatutFacture, StatutTache } from '@/types/models';

const U = 'u-test';

async function creerDevisAvecLignes(numero: string) {
  const devis = await devisRepo.creer(
    { projetId: 'p1', numero, date: '2026-01-01T00:00:00.000Z', statut: StatutDevis.Envoye, tauxTVA: 19, totalHT: 0, totalTVA: 0, totalTTC: 0 },
    U
  );
  const lignes = [
    { designation: 'L1', unite: 'u', quantite: 2, prixUnitaire: 100 },
    { designation: 'L2', unite: 'u', quantite: 1, prixUnitaire: 300 },
  ];
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    await lignesDevisRepo.creer({ ...l, totalLigne: l.quantite * l.prixUnitaire, devisId: devis.id, projetId: 'p1', ordre: i + 1 }, U);
  }
  return devis;
}

describe('Devis — recalcul des totaux depuis les lignes', () => {
  test('agrège les lignes actives dans l\'en-tête', async () => {
    const devis = await creerDevisAvecLignes('DEV-R1');
    await recalculerDevis(devis.id, U);
    const relu = await devisRepo.lire(devis.id);
    expect(relu?.totalHT).toBe(500); // 200 + 300
    expect(relu?.totalTTC).toBeCloseTo(595); // +19%
  });
});

describe('Facturation — conversion devis → facture (§3.5)', () => {
  test('importe les lignes et marque le devis converti', async () => {
    const devis = await creerDevisAvecLignes('DEV-C1');
    await recalculerDevis(devis.id, U);
    const facture = await facturesRepo.creer(
      { projetId: 'p1', devisId: devis.id, numero: 'FAC-1', type: 'situation', date: '2026-02-01T00:00:00.000Z', statut: StatutFacture.Brouillon, tauxTVA: 19, totalHT: 0, totalTVA: 0, totalTTC: 0, montantPaye: 0 },
      U
    );
    await convertirDevisEnFacture(devis.id, facture.id, U);

    const lignes = await lignesFactureRepo.lister({ filtre: { factureId: facture.id } });
    expect(lignes).toHaveLength(2);
    const facturee = await facturesRepo.lire(facture.id);
    expect(facturee?.totalHT).toBe(500);
    const devisConverti = await devisRepo.lire(devis.id);
    expect(devisConverti?.statut).toBe(StatutDevis.Converti);
  });
});

describe('Facturation — suivi des paiements', () => {
  test('met à jour le montant payé et le statut', async () => {
    const facture = await facturesRepo.creer(
      { projetId: 'p1', numero: 'FAC-P1', type: 'situation', date: '2026-02-01T00:00:00.000Z', statut: StatutFacture.Emise, tauxTVA: 0, totalHT: 1000, totalTVA: 0, totalTTC: 1000, montantPaye: 0 },
      U
    );

    await paiementsRepo.creer({ factureId: facture.id, projetId: 'p1', date: '2026-02-05T00:00:00.000Z', montant: 400, mode: 'virement' }, U);
    await recalculerPaiements(facture.id, U);
    let relu = await facturesRepo.lire(facture.id);
    expect(relu?.montantPaye).toBe(400);
    expect(relu?.statut).toBe(StatutFacture.PayeePartiel);

    await paiementsRepo.creer({ factureId: facture.id, projetId: 'p1', date: '2026-02-10T00:00:00.000Z', montant: 600, mode: 'cheque' }, U);
    await recalculerPaiements(facture.id, U);
    relu = await facturesRepo.lire(facture.id);
    expect(relu?.montantPaye).toBe(1000);
    expect(relu?.statut).toBe(StatutFacture.Payee);
  });
});

describe('Rapport → Planning — propagation de l\'avancement (§3.6)', () => {
  test('met à jour l\'avancement et le statut de la tâche', async () => {
    const tache = await tachesRepo.creer(
      { projetId: 'p1', nom: 'T1', dateDebut: '2026-03-01T00:00:00.000Z', dateFin: '2026-03-05T00:00:00.000Z', dureeJours: 5, avancementPct: 0, statut: StatutTache.APlanifier, ligneDevisId: null, responsableId: null, ordre: 1 },
      U
    );
    await appliquerAvancementTache(tache.id, 100, U);
    const relu = await tachesRepo.lire(tache.id);
    expect(relu?.avancementPct).toBe(100);
    expect(relu?.statut).toBe(StatutTache.Terminee);
  });
});
