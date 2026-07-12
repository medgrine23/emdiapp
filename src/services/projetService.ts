/**
 * Service du module Projet (§3.1) — nœud central du système.
 * S'appuie sur le repository générique (6 actions standard §2).
 */
import { getRepository } from '@/services/repository';
import { Client, Projet } from '@/types/models';

export const COLLECTION_PROJETS = 'projets';
export const COLLECTION_CLIENTS = 'clients';

export const projetsRepo = getRepository<Projet>(COLLECTION_PROJETS);
export const clientsRepo = getRepository<Client>(COLLECTION_CLIENTS);

/** Libellé lisible de l'état d'avancement d'un statut projet. */
export const LIBELLE_STATUT_PROJET: Record<Projet['statut'], string> = {
  brouillon: 'Brouillon',
  en_cours: 'En cours',
  suspendu: 'Suspendu',
  termine: 'Terminé',
  livre: 'Livré',
};
