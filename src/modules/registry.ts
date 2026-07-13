/**
 * Registre des 9 modules fonctionnels (cf. cahier des charges §3).
 * Pilote l'écran d'accueil et la navigation. Chaque module dispose d'un écran
 * placeholder sous `app/(modules)/<route>` prêt à être implémenté.
 */
import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';

type NomIcone = ComponentProps<typeof Feather>['name'];

export interface ModuleApp {
  cle: string;
  route: string;
  titre: string;
  description: string;
  icone: NomIcone; // jeu d'icônes vectorielles (Feather)
}

export const MODULES: ModuleApp[] = [
  {
    cle: 'projets',
    route: '/(modules)/projets',
    titre: 'Projets',
    description: 'Chantiers : localisation, client, budget, dates. Nœud central du système.',
    icone: 'home',
  },
  {
    cle: 'devis',
    route: '/(modules)/devis',
    titre: 'Devis quantitatif',
    description: 'Quantités, prix unitaires, totaux et génération des offres.',
    icone: 'file-text',
  },
  {
    cle: 'planning',
    route: '/(modules)/planning',
    titre: 'Planning (Gantt)',
    description: 'Suivi temporel des tâches et gestion des dépendances.',
    icone: 'calendar',
  },
  {
    cle: 'achats',
    route: '/(modules)/achats',
    titre: 'Achats',
    description: 'Demandes, bons de commande fournisseurs et livraisons.',
    icone: 'shopping-cart',
  },
  {
    cle: 'facturation',
    route: '/(modules)/facturation',
    titre: 'Facturation',
    description: 'Factures clients, suivi des paiements et relances.',
    icone: 'file',
  },
  {
    cle: 'rapports',
    route: '/(modules)/rapports',
    titre: 'Rapports',
    description: 'Rapports journaliers/hebdo : météo, effectifs, avancement.',
    icone: 'clipboard',
  },
  {
    cle: 'documentation',
    route: '/(modules)/documentation',
    titre: 'Documentation',
    description: 'GED : plans, fiches techniques, permis, pièces jointes.',
    icone: 'folder',
  },
  {
    cle: 'chat',
    route: '/(modules)/chat',
    titre: 'Chat interne',
    description: 'Messagerie sécurisée : textes, médias, partage métier.',
    icone: 'message-circle',
  },
  {
    cle: 'parametres',
    route: '/(modules)/parametres',
    titre: 'Paramètres',
    description: 'Rôles, permissions, taxes, entreprise, notifications.',
    icone: 'settings',
  },
];
