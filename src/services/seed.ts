/**
 * Données de démonstration (mode mémoire).
 *
 * Peuple quelques clients et projets au premier lancement pour que l'application
 * soit navigable sans backend. Sans effet si Firebase est configuré ou si des
 * données existent déjà. À supprimer en production.
 */
import { fournisseursRepo } from '@/services/achatService';
import { devisRepo, lignesDevisRepo, recalculerDevis } from '@/services/devisService';
import { clientsRepo, projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { StatutDevis, StatutProjet } from '@/types/models';

let fait = false;

export async function amorcerDonnees(): Promise<void> {
  if (fait) return;
  fait = true;

  const existants = await projetsRepo.lister();
  if (existants.length > 0) return;

  const u = UTILISATEUR_COURANT_ID;

  const clientA = await clientsRepo.creer(
    { nom: 'Mairie de Béjaïa', type: 'collectivite', email: 'contact@bejaia.dz', telephone: '+213 34 00 00 00', adresse: 'Béjaïa' },
    u
  );
  const clientB = await clientsRepo.creer(
    { nom: 'SARL Amimer Énergie', type: 'entreprise', email: 'projets@amimer.dz', telephone: '+213 34 11 11 11', adresse: 'Ihaddaden, Béjaïa' },
    u
  );

  await fournisseursRepo.creer({ nom: 'Matériaux du Nord', contact: 'M. Kaci', telephone: '+213 34 22 22 22', adresse: 'Béjaïa' }, u);
  await fournisseursRepo.creer({ nom: 'Sarl Bâti-Pro', contact: 'Mme Ould', telephone: '+213 34 33 33 33', adresse: 'Akbou' }, u);

  const projetA = await projetsRepo.creer(
    {
      nom: 'Réhabilitation groupe scolaire',
      reference: 'CH-2026-001',
      description: 'Rénovation de 12 salles de classe et mise aux normes.',
      localisation: { adresse: 'Rue de la Liberté', ville: 'Béjaïa', codePostal: '06000' },
      clientId: clientA.id,
      budgetAlloue: 18_500_000,
      statut: StatutProjet.EnCours,
      dateDebutPrev: '2026-03-01T00:00:00.000Z',
      dateFinPrev: '2026-09-30T00:00:00.000Z',
    },
    u
  );

  // Devis d'exemple avec quelques lignes, rattaché au premier projet.
  const devisA = await devisRepo.creer(
    {
      projetId: projetA.id,
      numero: 'DEV-2026-001',
      date: '2026-02-15T00:00:00.000Z',
      statut: StatutDevis.Envoye,
      tauxTVA: 19,
      totalHT: 0,
      totalTVA: 0,
      totalTTC: 0,
    },
    u
  );
  const lignes = [
    { designation: 'Démolition cloisons existantes', unite: 'm²', quantite: 180, prixUnitaire: 1200 },
    { designation: 'Enduit et peinture salles', unite: 'm²', quantite: 640, prixUnitaire: 950 },
    { designation: 'Remplacement menuiseries', unite: 'u', quantite: 24, prixUnitaire: 45000 },
  ];
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    await lignesDevisRepo.creer(
      { ...l, totalLigne: l.quantite * l.prixUnitaire, devisId: devisA.id, projetId: projetA.id, ordre: i + 1 },
      u
    );
  }
  await recalculerDevis(devisA.id, u);

  await projetsRepo.creer(
    {
      nom: 'Construction hangar industriel',
      reference: 'CH-2026-002',
      description: 'Hangar métallique 2 000 m² avec bureaux attenants.',
      localisation: { adresse: 'Zone industrielle', ville: 'Ihaddaden', codePostal: '06000' },
      clientId: clientB.id,
      budgetAlloue: 42_000_000,
      statut: StatutProjet.Brouillon,
      dateDebutPrev: '2026-08-01T00:00:00.000Z',
      dateFinPrev: '2027-04-30T00:00:00.000Z',
    },
    u
  );
}
