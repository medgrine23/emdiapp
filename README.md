# EMDI Chantiers

Application mobile de **gestion centralisée de chantiers de construction** — du devis à la
facturation, avec communication d'équipe temps réel.

> **Les 9 modules fonctionnels sont implémentés** au-dessus des fondations (MCD, stack,
> architecture). L'application tourne de bout en bout en **mode démo** (données en mémoire,
> amorcées) et **bascule automatiquement vers Firestore temps réel** dès que les clés
> Firebase sont renseignées (`.env`). Adaptateur Firestore, Storage, service Auth et règles
> de sécurité livrés — voir [`docs/05-integration-firebase.md`](docs/05-integration-firebase.md).

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
| [`docs/05-integration-firebase.md`](docs/05-integration-firebase.md) | Bascule Firestore/Storage/Auth + règles de sécurité |

## Démarrage

> 🟢 **Grand débutant ?** Suivez le [**Guide de démarrage pas-à-pas**](GUIDE-DEMARRAGE.md)
> (aperçu navigateur, Expo Go, ou APK Android).

```bash
npm install
cp .env.example .env   # renseigner les clés Firebase (optionnel : mode démo sinon)
npm start              # puis 'a' (Android), 'i' (iOS) ou 'w' (web)
```

> Un projet Firebase doit être créé (Firestore + Storage + Auth) et les clés
> reportées dans `.env`. Voir `.env.example`.

## Tests & vérifications

```bash
npm test         # tests unitaires de la logique métier (Jest)
npm run typecheck # vérification TypeScript
```

Les tests (`__tests__/`) couvrent la machine à états (§2), le calcul des totaux,
le contrôle budgétaire achat vs devis, la conversion devis→facture, le suivi des
paiements et la propagation de l'avancement rapport→planning.

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
| **Planning (Gantt)** | ✅ Implémenté — diagramme de Gantt, dépendances typées, avancement |
| **Achats** | ✅ Implémenté — bons de commande, contrôle budgétaire vs devis, livraisons |
| **Facturation** | ✅ Implémenté — conversion devis→facture, lignes, paiements, relances |
| **Rapports** | ✅ Implémenté — journalier/hebdo, météo, effectifs, MAJ avancement Planning |
| **Documentation (GED)** | ✅ Implémenté — registre typé, filtre projet, liaison polymorphe |
| **Chat interne** | ✅ Implémenté — conversations, messages, partage métier (temps réel Firebase à brancher) |
| **Paramètres** | ✅ Implémenté — entreprise, rôles/permissions, taxes, clients, fournisseurs, notifications |

Le module **Projet** sert de patron de référence : couche `Repository` réactive
(`src/services/repository.ts`, implémentation mémoire pour tourner sans backend),
service (`src/services/projetService.ts`), hooks (`src/hooks/useRepository.ts`) et
écrans liste/détail/formulaire. Les modules suivants reprendront ce patron.

> **Mode démo** : sans clés Firebase, les données sont en mémoire et amorcées avec
> des projets d'exemple (`src/services/seed.ts`). Renseigner `.env` basculera vers
> Firestore (adaptateur à finaliser).
