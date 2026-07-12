/**
 * Modèle de données de l'application (miroir du MCD — voir docs/02-modele-de-donnees.md).
 *
 * Chaque entité métier étend `EntiteBase`, qui porte les champs standards imposés
 * par le cahier des charges §2 : audit, soft-delete, archivage et annulation avec motif.
 * Le module Projet est le nœud central : toutes les entités rattachées à un chantier
 * portent une clé étrangère `projetId`.
 */

export type ID = string;
export type Horodatage = string; // ISO 8601 (Firestore Timestamp sérialisé côté client)

/** États du cycle de vie communs à toutes les entités (cf. §2 Exigences globales). */
export enum EtatEntite {
  Actif = 'actif',
  Archive = 'archive', // lecture seule
  Annule = 'annule', // document validé puis annulé, motif obligatoire
  Supprime = 'supprime', // soft-delete
}

/** Traçabilité d'une annulation — le motif est OBLIGATOIRE (§2). */
export interface Annulation {
  annuleLe: Horodatage;
  annulePar: ID; // Utilisateur.id
  motif: string; // non vide
}

/** Socle commun : audit + soft-delete + archivage + annulation. */
export interface EntiteBase {
  id: ID;
  etat: EtatEntite;

  // Audit
  creeLe: Horodatage;
  creePar: ID;
  modifieLe: Horodatage;
  modifiePar: ID;

  // Soft-delete
  supprimeLe?: Horodatage | null;
  supprimePar?: ID | null;

  // Archivage (lecture seule)
  archiveLe?: Horodatage | null;
  archivePar?: ID | null;

  // Annulation (avec motif)
  annulation?: Annulation | null;
}

/** Toute entité rattachée à un chantier porte cette clé étrangère. */
export interface EntiteProjet extends EntiteBase {
  projetId: ID;
}

/* ------------------------------------------------------------------ */
/* Référentiels transverses                                            */
/* ------------------------------------------------------------------ */

export enum RoleUtilisateur {
  Admin = 'admin',
  ChefChantier = 'chef_chantier',
  Magasinier = 'magasinier',
  Commercial = 'commercial',
  Comptable = 'comptable',
  Ouvrier = 'ouvrier',
  Lecteur = 'lecteur',
}

export interface Utilisateur extends EntiteBase {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: RoleUtilisateur;
  permissions: string[]; // permissions fines surchargeant le rôle
  actif: boolean;
}

export type TypeClient = 'particulier' | 'entreprise' | 'collectivite';

export interface Client extends EntiteBase {
  nom: string;
  type: TypeClient;
  contact?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  siret?: string;
}

export interface Fournisseur extends EntiteBase {
  nom: string;
  contact?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
}

/* ------------------------------------------------------------------ */
/* 3.1 — Module Projet (cœur du système)                              */
/* ------------------------------------------------------------------ */

export enum StatutProjet {
  Brouillon = 'brouillon',
  EnCours = 'en_cours',
  Suspendu = 'suspendu',
  Termine = 'termine',
  Livre = 'livre',
}

export interface Localisation {
  adresse: string;
  ville?: string;
  codePostal?: string;
  latitude?: number;
  longitude?: number;
}

export interface Projet extends EntiteBase {
  nom: string;
  description?: string;
  reference: string; // code chantier
  localisation: Localisation;
  clientId: ID; // FK -> Client
  budgetAlloue: number;
  statut: StatutProjet;
  dateDebutPrev?: Horodatage;
  dateFinPrev?: Horodatage;
  dateDebutReel?: Horodatage;
  dateFinReel?: Horodatage;
}

/* ------------------------------------------------------------------ */
/* 3.2 — Module Devis Quantitatif                                     */
/* ------------------------------------------------------------------ */

export enum StatutDevis {
  Brouillon = 'brouillon',
  Envoye = 'envoye',
  Accepte = 'accepte',
  Refuse = 'refuse',
  Converti = 'converti', // converti en facturation
}

export interface Devis extends EntiteProjet {
  numero: string;
  date: Horodatage;
  validiteJours?: number;
  statut: StatutDevis;
  tauxTVA: number; // %
  totalHT: number; // dénormalisé (somme des lignes)
  totalTVA: number;
  totalTTC: number;
}

export interface LigneDevis extends EntiteProjet {
  devisId: ID; // FK -> Devis
  ordre: number;
  designation: string;
  unite: string; // u, m², m³, ml, forfait...
  quantite: number;
  prixUnitaire: number;
  totalLigne: number; // quantite * prixUnitaire
}

/* ------------------------------------------------------------------ */
/* 3.3 — Module Planning (Gantt)                                      */
/* ------------------------------------------------------------------ */

export enum StatutTache {
  APlanifier = 'a_planifier',
  EnCours = 'en_cours',
  EnRetard = 'en_retard',
  Terminee = 'terminee',
}

export interface TachePlanning extends EntiteProjet {
  ligneDevisId?: ID | null; // FK optionnelle -> LigneDevis
  nom: string;
  dateDebut: Horodatage;
  dateFin: Horodatage;
  dureeJours: number;
  avancementPct: number; // 0..100
  statut: StatutTache;
  responsableId?: ID | null; // Utilisateur
  ordre: number;
}

export type TypeDependance = 'FD' | 'DD' | 'FF' | 'DF'; // Fin-Début, Début-Début, ...

export interface DependanceTache {
  id: ID;
  projetId: ID;
  tachePredecesseurId: ID;
  tacheSuccesseurId: ID;
  type: TypeDependance;
  decalageJours: number; // lag/lead
}

/* ------------------------------------------------------------------ */
/* 3.4 — Module Achat                                                 */
/* ------------------------------------------------------------------ */

export enum StatutDemandeAchat {
  Brouillon = 'brouillon',
  Soumise = 'soumise',
  Validee = 'validee',
  Rejetee = 'rejetee',
  Commandee = 'commandee',
}

export interface DemandeAchat extends EntiteProjet {
  numero: string;
  date: Horodatage;
  demandeurId: ID; // Utilisateur
  statut: StatutDemandeAchat;
}

export enum StatutBonCommande {
  Brouillon = 'brouillon',
  Envoye = 'envoye',
  ReceptionPartielle = 'reception_partielle',
  Receptionne = 'receptionne',
}

export interface BonCommande extends EntiteProjet {
  demandeAchatId?: ID | null;
  fournisseurId: ID; // FK -> Fournisseur
  numero: string;
  date: Horodatage;
  statut: StatutBonCommande;
  totalHT: number;
}

export interface LigneAchat extends EntiteProjet {
  bonCommandeId?: ID | null;
  demandeAchatId?: ID | null;
  ligneDevisId?: ID | null; // référence pour le contrôle budgétaire vs devis
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  totalLigne: number;
}

export interface Livraison extends EntiteProjet {
  bonCommandeId: ID;
  date: Horodatage;
  receptionnePar: ID; // Utilisateur
  conforme: boolean;
  remarques?: string;
}

/* ------------------------------------------------------------------ */
/* 3.5 — Module Facturation                                           */
/* ------------------------------------------------------------------ */

export type TypeFacture = 'acompte' | 'situation' | 'solde' | 'avoir';

export enum StatutFacture {
  Brouillon = 'brouillon',
  Emise = 'emise',
  PayeePartiel = 'payee_partiel',
  Payee = 'payee',
  EnRetard = 'en_retard',
  Annulee = 'annulee',
}

export interface Facture extends EntiteProjet {
  devisId?: ID | null; // source (alimentée par le devis)
  numero: string;
  type: TypeFacture;
  date: Horodatage;
  dateEcheance?: Horodatage;
  statut: StatutFacture;
  tauxTVA: number; // %
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  montantPaye: number;
}

export interface LigneFacture extends EntiteProjet {
  factureId: ID;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  totalLigne: number;
}

export type ModePaiement = 'virement' | 'cheque' | 'especes' | 'carte';

export interface Paiement extends EntiteProjet {
  factureId: ID;
  date: Horodatage;
  montant: number;
  mode: ModePaiement;
  reference?: string;
}

export interface Relance extends EntiteProjet {
  factureId: ID;
  date: Horodatage;
  niveau: number; // 1, 2, 3...
  canal: 'email' | 'sms' | 'courrier' | 'appel';
}

/* ------------------------------------------------------------------ */
/* 3.6 — Module Rapport                                               */
/* ------------------------------------------------------------------ */

export type TypeRapport = 'journalier' | 'hebdomadaire';

export interface Meteo {
  condition: string; // ensoleillé, pluie, neige...
  temperatureC?: number;
  intemperie: boolean; // arrêt chantier pour intempérie
}

export interface Rapport extends EntiteProjet {
  type: TypeRapport;
  date: Horodatage;
  auteurId: ID; // Utilisateur
  meteo?: Meteo;
  effectifPresent: number;
  remarques?: string;
  avancementGlobalPct?: number;
  photoIds: ID[]; // FK -> Document (photos du jour)
}

/** Ligne de rapport qui met à jour l'avancement d'une tâche du planning. */
export interface RapportTache extends EntiteProjet {
  rapportId: ID;
  tachePlanningId: ID; // FK -> TachePlanning
  avancementPct: number;
  commentaire?: string;
}

/* ------------------------------------------------------------------ */
/* 3.7 — Module Documentation (GED)                                   */
/* ------------------------------------------------------------------ */

export type TypeDocument =
  | 'plan'
  | 'fiche_technique'
  | 'permis'
  | 'photo'
  | 'video'
  | 'audio'
  | 'contrat'
  | 'autre';

export interface Document extends EntiteBase {
  projetId?: ID | null; // souvent rattaché à un projet, parfois global
  nom: string;
  type: TypeDocument;
  url: string; // Firebase Storage
  mimeType: string;
  tailleOctets: number;
  uploadePar: ID;
}

/**
 * Liaison polymorphe : attache un document à n'importe quelle entité
 * (une tâche, une ligne de devis, un rapport, un message de chat...).
 */
export interface LiaisonDocument {
  id: ID;
  documentId: ID;
  projetId?: ID | null;
  entiteType: string; // ex: 'tache_planning', 'devis', 'rapport'
  entiteId: ID;
}

/* ------------------------------------------------------------------ */
/* 3.8 — Module Paramètres                                            */
/* ------------------------------------------------------------------ */

export interface Entreprise extends EntiteBase {
  nom: string;
  logoUrl?: string;
  adresse?: string;
  siret?: string;
  numeroTVA?: string;
  telephone?: string;
  email?: string;
}

export interface Role extends EntiteBase {
  nom: string;
  cle: RoleUtilisateur;
  permissions: string[];
}

export interface Taxe extends EntiteBase {
  nom: string;
  taux: number; // %
  parDefaut: boolean;
}

export interface ParametreNotification extends EntiteBase {
  utilisateurId: ID;
  type: string; // 'nouveau_message', 'facture_echue', ...
  canal: 'push' | 'email' | 'sms';
  actif: boolean;
}

/* ------------------------------------------------------------------ */
/* 3.9 — Module Chat Interne                                          */
/* ------------------------------------------------------------------ */

export type TypeConversation = 'directe' | 'groupe' | 'tache';

export interface Conversation extends EntiteBase {
  projetId?: ID | null; // conversation rattachée à un chantier ou transverse
  nom?: string;
  type: TypeConversation;
  participantIds: ID[]; // Utilisateur[]
  tachePlanningId?: ID | null; // conversation ouverte depuis une tâche du planning
  dernierMessageLe?: Horodatage;
}

export type TypeMessage = 'texte' | 'image' | 'video' | 'audio' | 'fichier' | 'partage';

/** Type d'objet métier partagé dans une conversation (§3.9 liaisons métiers). */
export type EntitePartagee = 'tache_planning' | 'ligne_devis' | 'rapport' | 'document' | 'projet';

export interface PartageMetier {
  entiteType: EntitePartagee;
  entiteId: ID;
  apercu?: string; // libellé affiché dans la bulle
}

export interface Message extends EntiteBase {
  conversationId: ID;
  projetId?: ID | null;
  auteurId: ID;
  type: TypeMessage;
  contenu?: string; // texte
  mediaUrl?: string; // photo/vidéo/audio/fichier (Storage)
  mediaMimeType?: string;
  dureeSecondes?: number; // notes vocales / vidéos
  partage?: PartageMetier | null; // message de type 'partage'
  envoyeLe: Horodatage;
}

export interface AccuseLecture {
  id: ID;
  messageId: ID;
  utilisateurId: ID;
  luLe: Horodatage;
}
