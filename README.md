# EMDI Chantiers

Application mobile de **gestion centralisée de chantiers de construction** — du devis à la
facturation, avec communication d'équipe temps réel.

> Ce dépôt contient le **premier lot : Fondations** (livrables 1 & 3 du cahier des charges) :
> modèle de données validé, proposition de stack et **scaffold Expo/React Native prêt à démarrer**.
> Les modules fonctionnels seront implémentés après validation du modèle de données.

## Stack retenue

| Couche | Technologie |
| --- | --- |
| Application mobile | **Expo / React Native** (TypeScript, Expo Router) |
| Base de données | **Cloud Firestore** (temps réel, relationnel par références) |
| Fichiers / médias | **Firebase Storage** |
| Authentification | **Firebase Auth** |
| Temps réel (Chat) | **Firestore listeners** (natif, pas de serveur WebSocket à opérer) |

Justification détaillée : [`docs/03-stack-technique.md`](docs/03-stack-technique.md).

## Documentation (livrables)

| Document | Contenu |
| --- | --- |
| [`docs/01-architecture.md`](docs/01-architecture.md) | Architecture générale et interconnexion des 9 modules |
| [`docs/02-modele-de-donnees.md`](docs/02-modele-de-donnees.md) | **MCD / schéma relationnel** (diagramme + collections Firestore) |
| [`docs/03-stack-technique.md`](docs/03-stack-technique.md) | Choix technologiques argumentés |
| [`docs/04-standards-crud.md`](docs/04-standards-crud.md) | Standards CRUD / soft-delete / archivage / annulation (§2) |

## Démarrage

```bash
npm install
cp .env.example .env   # renseigner les clés Firebase
npm start              # puis 'a' (Android), 'i' (iOS) ou 'w' (web)
```

> Un projet Firebase doit être créé (Firestore + Storage + Auth) et les clés
> reportées dans `.env`. Voir `.env.example`.

## Structure du projet

```
app/                     Écrans (Expo Router)
  index.tsx              Accueil : accès aux 9 modules
  (modules)/<module>/    Un écran placeholder par module (§3)
src/
  types/models.ts        Types TypeScript = miroir du MCD
  services/crud.ts       Helpers CRUD standards (§2) sur Firestore
  firebase/config.ts     Initialisation Firebase
  modules/registry.ts    Registre des 9 modules
  components/            Composants partagés
  theme/                 Palette et espacements
docs/                    Livrables (architecture, MCD, stack, standards)
```

## Les 9 modules (cahier des charges §3)

| Module | État |
| --- | --- |
| **Projet** (nœud central) | ✅ Implémenté — liste, détail, formulaire, 6 actions standard (§2) |
| **Devis quantitatif** | ✅ Implémenté — en-tête + lignes, calcul HT/TVA/TTC, lien Projet |
| Planning (Gantt) | ⬜ Placeholder |
| Achats | ⬜ Placeholder |
| **Facturation** | ✅ Implémenté — conversion devis→facture, lignes, paiements, relances |
| Rapports | ⬜ Placeholder |
| Documentation (GED) | ⬜ Placeholder |
| Chat interne | ⬜ Placeholder |
| Paramètres | ⬜ Placeholder |

Le module **Projet** sert de patron de référence : couche `Repository` réactive
(`src/services/repository.ts`, implémentation mémoire pour tourner sans backend),
service (`src/services/projetService.ts`), hooks (`src/hooks/useRepository.ts`) et
écrans liste/détail/formulaire. Les modules suivants reprendront ce patron.

> **Mode démo** : sans clés Firebase, les données sont en mémoire et amorcées avec
> des projets d'exemple (`src/services/seed.ts`). Renseigner `.env` basculera vers
> Firestore (adaptateur à finaliser).
