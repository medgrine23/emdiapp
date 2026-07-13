/**
 * Données de démonstration (mode mémoire).
 *
 * Peuple quelques clients et projets au premier lancement pour que l'application
 * soit navigable sans backend. Sans effet si Firebase est configuré ou si des
 * données existent déjà. À supprimer en production.
 */
import { fournisseursRepo } from '@/services/achatService';
import { devisRepo, lignesDevisRepo, recalculerDevis } from '@/services/devisService';
import { calculerDuree, dependancesRepo, tachesRepo } from '@/services/planningService';
import { clientsRepo, projetsRepo } from '@/services/projetService';
import { attacherDocument, documentsRepo } from '@/services/documentService';
import { rapportsRepo, rapportsTacheRepo } from '@/services/rapportService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { StatutDevis, StatutProjet, StatutTache } from '@/types/models';

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

  // Tâches de planning (Gantt) d'exemple, rattachées au projet scolaire.
  const planTaches = [
    { nom: 'Démolition', debut: '2026-03-02', fin: '2026-03-13', av: 100, statut: StatutTache.Terminee },
    { nom: 'Gros œuvre', debut: '2026-03-16', fin: '2026-04-24', av: 60, statut: StatutTache.EnCours },
    { nom: 'Menuiseries', debut: '2026-04-27', fin: '2026-05-15', av: 0, statut: StatutTache.APlanifier },
    { nom: 'Peinture & finitions', debut: '2026-05-18', fin: '2026-06-19', av: 0, statut: StatutTache.APlanifier },
  ];
  const idsTaches: string[] = [];
  for (let i = 0; i < planTaches.length; i++) {
    const t = planTaches[i];
    const debut = new Date(t.debut).toISOString();
    const fin = new Date(t.fin).toISOString();
    const cree = await tachesRepo.creer(
      {
        projetId: projetA.id,
        nom: t.nom,
        dateDebut: debut,
        dateFin: fin,
        dureeJours: calculerDuree(debut, fin),
        avancementPct: t.av,
        statut: t.statut,
        ligneDevisId: null,
        responsableId: null,
        ordre: i + 1,
      },
      u
    );
    idsTaches.push(cree.id);
  }
  // Enchaînement Fin → Début entre tâches successives.
  for (let i = 1; i < idsTaches.length; i++) {
    await dependancesRepo.creer(
      { projetId: projetA.id, tachePredecesseurId: idsTaches[i - 1], tacheSuccesseurId: idsTaches[i], type: 'FD', decalageJours: 0 },
      u
    );
  }

  // Rapport de chantier d'exemple, avec un avancement de tâche.
  const rapportA = await rapportsRepo.creer(
    {
      projetId: projetA.id,
      type: 'journalier',
      date: '2026-03-20T00:00:00.000Z',
      auteurId: u,
      meteo: { condition: 'Ensoleillé', temperatureC: 22, intemperie: false },
      effectifPresent: 8,
      remarques: 'Coulage de la dalle du rez-de-chaussée réalisé.',
      avancementGlobalPct: 45,
      photoIds: [],
    },
    u
  );
  await rapportsTacheRepo.creer(
    { rapportId: rapportA.id, projetId: projetA.id, tachePlanningId: idsTaches[1], avancementPct: 60, commentaire: 'Élévation des murs porteurs en cours.' },
    u
  );

  // Documentation (GED) d'exemple.
  await documentsRepo.creer(
    { projetId: projetA.id, nom: 'Plan de masse RDC', type: 'plan', url: '', mimeType: 'application/pdf', tailleOctets: 2_400_000, uploadePar: u },
    u
  );
  await documentsRepo.creer(
    { projetId: projetA.id, nom: 'Permis de construire', type: 'permis', url: '', mimeType: 'application/pdf', tailleOctets: 850_000, uploadePar: u },
    u
  );
  const photoJour = await documentsRepo.creer(
    { projetId: projetA.id, nom: 'Photo dalle RDC', type: 'photo', url: '', mimeType: 'image/jpeg', tailleOctets: 1_200_000, uploadePar: u },
    u
  );
  // La photo du jour est rattachée au rapport (liaison polymorphe §3.7).
  await attacherDocument(photoJour.id, 'rapport', rapportA.id, projetA.id, u);

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
