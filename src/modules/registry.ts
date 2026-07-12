/**
 * Registre des 9 modules fonctionnels (cf. cahier des charges §3).
 * Pilote l'écran d'accueil et la navigation. Chaque module dispose d'un écran
 * placeholder sous `app/(modules)/<route>` prêt à être implémenté.
 */
export interface ModuleApp {
  cle: string;
  route: string;
  titre: string;
  description: string;
  icone: string; // emoji provisoire, à remplacer par un jeu d'icônes
}

export const MODULES: ModuleApp[] = [
  {
    cle: 'projets',
    route: '/(modules)/projets',
    titre: 'Projets',
    description: 'Chantiers : localisation, client, budget, dates. Nœud central du système.',
    icone: '🏗️',
  },
  {
    cle: 'devis',
    route: '/(modules)/devis',
    titre: 'Devis quantitatif',
    description: 'Quantités, prix unitaires, totaux et génération des offres.',
    icone: '📐',
  },
  {
    cle: 'planning',
    route: '/(modules)/planning',
    titre: 'Planning (Gantt)',
    description: 'Suivi temporel des tâches et gestion des dépendances.',
    icone: '📅',
  },
  {
    cle: 'achats',
    route: '/(modules)/achats',
    titre: 'Achats',
    description: 'Demandes, bons de commande fournisseurs et livraisons.',
    icone: '🛒',
  },
  {
    cle: 'facturation',
    route: '/(modules)/facturation',
    titre: 'Facturation',
    description: 'Factures clients, suivi des paiements et relances.',
    icone: '🧾',
  },
  {
    cle: 'rapports',
    route: '/(modules)/rapports',
    titre: 'Rapports',
    description: 'Rapports journaliers/hebdo : météo, effectifs, avancement.',
    icone: '📋',
  },
  {
    cle: 'documentation',
    route: '/(modules)/documentation',
    titre: 'Documentation',
    description: 'GED : plans, fiches techniques, permis, pièces jointes.',
    icone: '📁',
  },
  {
    cle: 'chat',
    route: '/(modules)/chat',
    titre: 'Chat interne',
    description: 'Messagerie sécurisée : textes, médias, partage métier.',
    icone: '💬',
  },
  {
    cle: 'parametres',
    route: '/(modules)/parametres',
    titre: 'Paramètres',
    description: 'Rôles, permissions, taxes, entreprise, notifications.',
    icone: '⚙️',
  },
];
