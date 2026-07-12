/**
 * Données de démonstration (mode mémoire).
 *
 * Peuple quelques clients et projets au premier lancement pour que l'application
 * soit navigable sans backend. Sans effet si Firebase est configuré ou si des
 * données existent déjà. À supprimer en production.
 */
import { clientsRepo, projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { StatutProjet } from '@/types/models';

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

  await projetsRepo.creer(
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
