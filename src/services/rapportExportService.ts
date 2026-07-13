/**
 * Génération de rapports de synthèse exportables (§3.6 étendu).
 *
 * Agrège les données des modules choisis sur une période donnée, produit une
 * structure de sections (titre + colonnes + lignes) et le HTML correspondant.
 * Le HTML sert à la fois au PDF (expo-print) et à l'Excel (.xls lit le HTML).
 *
 * Ce module reste sans dépendance native (agrégation + HTML) ; l'écriture des
 * fichiers est dans src/services/exportFichiers.ts.
 */
import { bonsCommandeRepo, fournisseursRepo, LIBELLE_STATUT_BON_COMMANDE } from '@/services/achatService';
import { devisRepo, LIBELLE_STATUT_DEVIS } from '@/services/devisService';
import {
  facturesRepo,
  LIBELLE_STATUT_FACTURE,
  LIBELLE_TYPE_FACTURE,
  resteAPayer,
} from '@/services/factureService';
import { getEntreprise } from '@/services/parametreService';
import { LIBELLE_STATUT_TACHE, tachesRepo } from '@/services/planningService';
import { LIBELLE_STATUT_PROJET, projetsRepo } from '@/services/projetService';
import { piecesRepo } from '@/services/quantitatifService';
import { LIBELLE_TYPE_RAPPORT, rapportsRepo } from '@/services/rapportService';
import { formaterDate, formaterMontant } from '@/utils/format';

export type TypePeriode = 'journalier' | 'hebdomadaire' | 'mensuel' | 'personnalise';

export const MODULES_RAPPORT: { cle: string; libelle: string }[] = [
  { cle: 'projets', libelle: 'Projets' },
  { cle: 'quantitatif', libelle: 'Quantitatif (métré)' },
  { cle: 'devis', libelle: 'Devis' },
  { cle: 'achats', libelle: 'Achats' },
  { cle: 'facturation', libelle: 'Facturation' },
  { cle: 'planning', libelle: 'Planning' },
  { cle: 'rapports', libelle: 'Rapports de chantier' },
];

export const LIBELLE_PERIODE: Record<TypePeriode, string> = {
  journalier: 'Journalier',
  hebdomadaire: 'Hebdomadaire',
  mensuel: 'Mensuel',
  personnalise: 'Période personnalisée',
};

const p2 = (n: number) => String(n).padStart(2, '0');
const versChaine = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

/** Bornes 'AAAA-MM-JJ' d'une période prédéfinie (par rapport à aujourd'hui). */
export function presetPeriode(type: Exclude<TypePeriode, 'personnalise'>): { debut: string; fin: string } {
  const n = new Date();
  if (type === 'journalier') {
    const j = versChaine(n);
    return { debut: j, fin: j };
  }
  if (type === 'hebdomadaire') {
    const jour = (n.getDay() + 6) % 7; // 0 = lundi
    const lundi = new Date(n);
    lundi.setDate(n.getDate() - jour);
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);
    return { debut: versChaine(lundi), fin: versChaine(dimanche) };
  }
  // mensuel
  const debut = new Date(n.getFullYear(), n.getMonth(), 1);
  const fin = new Date(n.getFullYear(), n.getMonth() + 1, 0);
  return { debut: versChaine(debut), fin: versChaine(fin) };
}

export interface SectionRapport {
  titre: string;
  colonnes: string[];
  lignes: string[][];
}

export interface RapportGenere {
  titre: string;
  sousTitre: string;
  sections: SectionRapport[];
}

export interface OptionsRapport {
  projetId: string | null; // null = tous les projets
  debut: string; // 'AAAA-MM-JJ'
  fin: string;
  modules: string[];
}

/** Construit le rapport agrégé selon la période et les modules sélectionnés. */
export async function construireRapport(o: OptionsRapport): Promise<RapportGenere> {
  const opt = o.projetId ? { filtre: { projetId: o.projetId } } : undefined;
  const dans = (dateISO?: string) => {
    if (!dateISO) return true;
    const jour = dateISO.slice(0, 10);
    return jour >= o.debut && jour <= o.fin;
  };
  const sections: SectionRapport[] = [];

  if (o.modules.includes('projets')) {
    const items = o.projetId
      ? ([await projetsRepo.lire(o.projetId)].filter(Boolean) as NonNullable<Awaited<ReturnType<typeof projetsRepo.lire>>>[])
      : await projetsRepo.lister();
    sections.push({
      titre: 'Projets',
      colonnes: ['Référence', 'Nom', 'Statut', 'Budget'],
      lignes: items.map((p) => [p.reference, p.nom, LIBELLE_STATUT_PROJET[p.statut], formaterMontant(p.budgetAlloue)]),
    });
  }

  if (o.modules.includes('quantitatif')) {
    const items = await piecesRepo.lister(opt);
    sections.push({
      titre: 'Quantitatif (métré)',
      colonnes: ['Pièce', 'Surface sol', 'Surface murs', 'Volume'],
      lignes: items.map((p) => [p.nom, `${p.surfaceSol} m²`, `${p.surfaceMurs} m²`, `${p.volume} m³`]),
    });
  }

  if (o.modules.includes('devis')) {
    const items = (await devisRepo.lister(opt)).filter((d) => dans(d.date));
    sections.push({
      titre: 'Devis',
      colonnes: ['Numéro', 'Date', 'Statut', 'Total TTC'],
      lignes: items.map((d) => [d.numero, formaterDate(d.date), LIBELLE_STATUT_DEVIS[d.statut], formaterMontant(d.totalTTC)]),
    });
  }

  if (o.modules.includes('achats')) {
    const fournisseurs = await fournisseursRepo.lister();
    const nomF = (id: string) => fournisseurs.find((f) => f.id === id)?.nom ?? '—';
    const items = (await bonsCommandeRepo.lister(opt)).filter((b) => dans(b.date));
    sections.push({
      titre: 'Achats (bons de commande)',
      colonnes: ['Numéro', 'Date', 'Fournisseur', 'Statut', 'Total HT'],
      lignes: items.map((b) => [b.numero, formaterDate(b.date), nomF(b.fournisseurId), LIBELLE_STATUT_BON_COMMANDE[b.statut], formaterMontant(b.totalHT)]),
    });
  }

  if (o.modules.includes('facturation')) {
    const items = (await facturesRepo.lister(opt)).filter((f) => dans(f.date));
    sections.push({
      titre: 'Facturation',
      colonnes: ['Numéro', 'Date', 'Type', 'TTC', 'Payé', 'Reste'],
      lignes: items.map((f) => [
        f.numero,
        formaterDate(f.date),
        LIBELLE_TYPE_FACTURE[f.type],
        formaterMontant(f.totalTTC),
        formaterMontant(f.montantPaye),
        formaterMontant(resteAPayer(f)),
      ]),
    });
  }

  if (o.modules.includes('planning')) {
    // Tâches dont la période chevauche l'intervalle demandé.
    const items = (await tachesRepo.lister(opt)).filter(
      (t) => t.dateDebut.slice(0, 10) <= o.fin && t.dateFin.slice(0, 10) >= o.debut
    );
    sections.push({
      titre: 'Planning',
      colonnes: ['Tâche', 'Début', 'Fin', 'Avancement', 'Statut'],
      lignes: items.map((t) => [t.nom, formaterDate(t.dateDebut), formaterDate(t.dateFin), `${t.avancementPct} %`, LIBELLE_STATUT_TACHE[t.statut]]),
    });
  }

  if (o.modules.includes('rapports')) {
    const items = (await rapportsRepo.lister(opt)).filter((r) => dans(r.date));
    sections.push({
      titre: 'Rapports de chantier',
      colonnes: ['Date', 'Type', 'Météo', 'Effectif', 'Remarques'],
      lignes: items.map((r) => [
        formaterDate(r.date),
        LIBELLE_TYPE_RAPPORT[r.type],
        r.meteo?.condition ?? '—',
        String(r.effectifPresent),
        r.remarques ?? '',
      ]),
    });
  }

  const entreprise = await getEntreprise();
  const projet = o.projetId ? await projetsRepo.lire(o.projetId) : null;
  return {
    titre: `${entreprise.nom} — Rapport d'activité`,
    sousTitre: `${projet ? `Projet ${projet.reference} · ` : 'Tous projets · '}Du ${formaterDate(o.debut)} au ${formaterDate(o.fin)}`,
    sections,
  };
}

const echapper = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Construit le document HTML (utilisé pour le PDF et l'Excel). */
export function construireHtml(rapport: RapportGenere): string {
  const sections = rapport.sections
    .map((s) => {
      const thead = s.colonnes.map((c) => `<th>${echapper(c)}</th>`).join('');
      const rows = s.lignes.length
        ? s.lignes.map((l) => `<tr>${l.map((c) => `<td>${echapper(String(c))}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${s.colonnes.length}" class="vide">Aucune donnée sur la période.</td></tr>`;
      return `<h2>${echapper(s.titre)}</h2>
      <table><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: Arial, sans-serif; color: #14232e; padding: 16px; }
    h1 { color: #0B3D5C; font-size: 20px; margin: 0; }
    .sub { color: #55697a; font-size: 13px; margin: 4px 0 18px; }
    h2 { color: #0B3D5C; font-size: 15px; margin: 18px 0 6px; border-bottom: 2px solid #E8900A; padding-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #0B3D5C; color: #fff; text-align: left; padding: 6px 8px; }
    td { border-bottom: 1px solid #d7e0e7; padding: 6px 8px; }
    .vide { color: #55697a; font-style: italic; text-align: center; }
  </style></head><body>
    <h1>${echapper(rapport.titre)}</h1>
    <div class="sub">${echapper(rapport.sousTitre)}</div>
    ${sections}
  </body></html>`;
}
