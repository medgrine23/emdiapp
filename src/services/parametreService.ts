/**
 * Service du module Paramètres (§3.8).
 *
 * Regroupe la configuration transverse : entreprise (singleton), rôles &
 * permissions (RBAC), taxes, préférences de notification, ainsi que les
 * référentiels clients et fournisseurs.
 */
import { fournisseursRepo } from '@/services/achatService';
import { clientsRepo } from '@/services/projetService';
import { getRepository } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import {
  Entreprise,
  ParametreNotification,
  Role,
  RoleUtilisateur,
  Taxe,
} from '@/types/models';

export { clientsRepo, fournisseursRepo };

export const COLLECTION_ENTREPRISE = 'entreprise';
export const COLLECTION_ROLES = 'roles';
export const COLLECTION_TAXES = 'taxes';
export const COLLECTION_NOTIFICATIONS = 'parametresNotification';

export const entrepriseRepo = getRepository<Entreprise>(COLLECTION_ENTREPRISE);
export const rolesRepo = getRepository<Role>(COLLECTION_ROLES);
export const taxesRepo = getRepository<Taxe>(COLLECTION_TAXES);
export const notificationsRepo = getRepository<ParametreNotification>(COLLECTION_NOTIFICATIONS);

export const LIBELLE_ROLE: Record<RoleUtilisateur, string> = {
  admin: 'Administrateur',
  chef_chantier: 'Chef de chantier',
  magasinier: 'Magasinier',
  commercial: 'Commercial',
  comptable: 'Comptable',
  ouvrier: 'Ouvrier',
  lecteur: 'Lecteur',
};

/** Catalogue des permissions (une par module fonctionnel). */
export const CATALOGUE_PERMISSIONS: { cle: string; libelle: string }[] = [
  { cle: 'projets', libelle: 'Projets' },
  { cle: 'devis', libelle: 'Devis' },
  { cle: 'planning', libelle: 'Planning' },
  { cle: 'achats', libelle: 'Achats' },
  { cle: 'facturation', libelle: 'Facturation' },
  { cle: 'rapports', libelle: 'Rapports' },
  { cle: 'documentation', libelle: 'Documentation' },
  { cle: 'chat', libelle: 'Chat' },
  { cle: 'parametres', libelle: 'Paramètres' },
];

/** Types de notification configurables. */
export const CATALOGUE_NOTIFICATIONS: { type: string; libelle: string }[] = [
  { type: 'nouveau_message', libelle: 'Nouveau message (chat)' },
  { type: 'facture_echue', libelle: 'Facture échue' },
  { type: 'tache_en_retard', libelle: 'Tâche en retard' },
  { type: 'livraison_recue', libelle: 'Livraison reçue' },
  { type: 'nouveau_rapport', libelle: 'Nouveau rapport' },
];

/** Récupère l'entreprise (singleton), en la créant au besoin. */
export async function getEntreprise(): Promise<Entreprise> {
  const existantes = await entrepriseRepo.lister();
  if (existantes.length > 0) return existantes[0];
  return entrepriseRepo.creer({ nom: 'Mon entreprise' }, UTILISATEUR_COURANT_ID);
}
