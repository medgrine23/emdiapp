import { aDepassement, evaluerDepassement } from '@/services/achatService';
import { calculerTotaux } from '@/services/devisService';
import { formaterTaille } from '@/services/documentService';
import { resteAPayer } from '@/services/factureService';
import { calculerDuree, joursEntre, plagePlanning } from '@/services/planningService';
import { statutDepuisAvancement } from '@/services/rapportService';
import { Facture, StatutTache, TachePlanning } from '@/types/models';

describe('Devis — calcul des totaux', () => {
  test('somme HT + TVA + TTC', () => {
    const t = calculerTotaux([{ totalLigne: 100 }, { totalLigne: 200 }], 19);
    expect(t.totalHT).toBe(300);
    expect(t.totalTVA).toBeCloseTo(57);
    expect(t.totalTTC).toBeCloseTo(357);
  });

  test('liste vide → zéro', () => {
    expect(calculerTotaux([], 19)).toEqual({ totalHT: 0, totalTVA: 0, totalTTC: 0 });
  });
});

describe('Achat — contrôle budgétaire vs devis (§3.2/§3.4)', () => {
  const ref = { quantite: 5, prixUnitaire: 100 };

  test('dépassement de quantité', () => {
    const d = evaluerDepassement({ quantite: 6, prixUnitaire: 100 }, ref);
    expect(d.depassementQuantite).toBe(true);
    expect(d.depassementPrix).toBe(false);
    expect(aDepassement(d)).toBe(true);
  });

  test('dépassement de prix', () => {
    const d = evaluerDepassement({ quantite: 5, prixUnitaire: 120 }, ref);
    expect(d.depassementPrix).toBe(true);
    expect(aDepassement(d)).toBe(true);
  });

  test('conforme au devis', () => {
    const d = evaluerDepassement({ quantite: 5, prixUnitaire: 100 }, ref);
    expect(aDepassement(d)).toBe(false);
  });

  test('sans ligne de devis de référence → pas de dépassement', () => {
    expect(aDepassement(evaluerDepassement({ quantite: 999, prixUnitaire: 999 }, null))).toBe(false);
  });
});

describe('Planning — helpers de dates', () => {
  test('durée inclusive', () => {
    expect(calculerDuree('2026-03-01', '2026-03-01')).toBe(1);
    expect(calculerDuree('2026-03-01', '2026-03-10')).toBe(10);
  });

  test('jours entre deux dates', () => {
    expect(joursEntre('2026-03-01', '2026-03-04')).toBe(3);
  });

  test('plage englobant les tâches', () => {
    const taches = [
      { dateDebut: '2026-03-05', dateFin: '2026-03-10' },
      { dateDebut: '2026-03-01', dateFin: '2026-03-08' },
    ] as TachePlanning[];
    const plage = plagePlanning(taches);
    expect(plage?.debut).toBe('2026-03-01');
    expect(plage?.fin).toBe('2026-03-10');
    expect(plage?.totalJours).toBe(10);
  });

  test('plage nulle si aucune tâche', () => {
    expect(plagePlanning([])).toBeNull();
  });
});

describe('Rapport — statut déduit de l\'avancement', () => {
  test('0 % → à planifier', () => expect(statutDepuisAvancement(0)).toBe(StatutTache.APlanifier));
  test('50 % → en cours', () => expect(statutDepuisAvancement(50)).toBe(StatutTache.EnCours));
  test('100 % → terminée', () => expect(statutDepuisAvancement(100)).toBe(StatutTache.Terminee));
});

describe('Facturation — reste à payer', () => {
  test('total - payé, borné à zéro', () => {
    expect(resteAPayer({ totalTTC: 1000, montantPaye: 300 } as Facture)).toBe(700);
    expect(resteAPayer({ totalTTC: 1000, montantPaye: 1200 } as Facture)).toBe(0);
  });
});

describe('Documentation — taille lisible', () => {
  test('formats', () => {
    expect(formaterTaille(0)).toBe('—');
    expect(formaterTaille(500)).toBe('500 o');
    expect(formaterTaille(1024)).toBe('1.0 Ko');
    expect(formaterTaille(2_400_000)).toBe('2.3 Mo');
  });
});
