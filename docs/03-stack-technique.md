# 03 — Proposition de stack technique

> **Livrable n°3 du cahier des charges.**

## 1. Décision

| Couche | Choix | 
| --- | --- |
| Framework mobile | **Expo / React Native** (TypeScript) |
| Navigation | **Expo Router** (routing par fichiers) |
| Base de données | **Cloud Firestore** |
| Stockage fichiers/médias | **Firebase Storage** |
| Authentification | **Firebase Auth** |
| Temps réel | **Firestore listeners** (`onSnapshot`) |
| Notifications push | **Expo Notifications** + **Firebase Cloud Messaging** |
| Logique serveur | **Cloud Functions** (cascade d'archivage, conversion devis→facture, numérotation) |

## 2. Justification

### 2.1 Expo / React Native (recommandé par le CDC)

- Un seul code base **Android + iOS + web**, temps de compilation optimisés (§1 du CDC).
- Accès natif simple aux besoins du module Chat : **caméra, galerie, micro (notes vocales),
  sélecteur de fichiers**, via les modules Expo (`expo-image-picker`, `expo-av`,
  `expo-document-picker`).
- OTA updates (EAS Update) pour livrer des correctifs sans repasser par les stores.

### 2.2 Firebase plutôt que Node/PostgreSQL ou Laravel/PostgreSQL

Le point dimensionnant du cahier des charges est le **temps réel du module Chat** (§3.9) et
le partage de médias. Firebase répond directement à ce besoin :

| Critère | Firebase | Node/PostgreSQL | Laravel/PostgreSQL |
| --- | --- | --- | --- |
| Temps réel Chat | **Natif** (`onSnapshot`) | Serveur WebSocket à écrire/opérer | Reverb/Pusher à opérer |
| Médias (photo/vidéo/audio/fichier) | **Storage intégré** | Stockage objet + API à écrire | Idem |
| Authentification | **Intégrée** (email, tél, OAuth) | À implémenter | À implémenter |
| Offline / synchro chantier | **Cache Firestore natif** | À implémenter | À implémenter |
| Notifications push | **FCM intégré** | Service tiers | Service tiers |
| Infra à opérer | Managé (serverless) | Serveur + BDD à maintenir | Serveur + BDD à maintenir |
| Time-to-MVP | **Court** | Moyen | Moyen |

L'usage **mobile terrain** (chantier, connectivité variable) bénéficie fortement du **cache
hors-ligne** de Firestore et de la synchro automatique au retour du réseau.

### 2.3 Limites assumées & parades

- **Firestore n'est pas relationnel** → l'intégrité référentielle et les cascades reposent sur
  l'applicatif et les **Cloud Functions** / **Security Rules**. Le modèle (`docs/02`) reste
  toutefois relationnel par références, donc **portable vers PostgreSQL** si nécessaire.
- **Requêtes analytiques complexes** (reporting budgétaire transverse) → prévoir un export
  BigQuery (extension Firebase) plutôt que des agrégats Firestore coûteux.
- **Coût à l'échelle** (lectures facturées) → mitigé par la dénormalisation des totaux et la
  pagination.

## 3. Sécurité

- **Firestore Security Rules** = source de vérité du contrôle d'accès (RBAC par rôle/permission).
- Règles par collection et par action alignées sur le cycle de vie (`actif/archive/annule/supprime`) :
  ex. interdiction de modifier une entité `archive`, motif requis pour `annule`.
- Secrets serveur uniquement dans les Cloud Functions ; le client ne porte que les clés
  publiques `EXPO_PUBLIC_*`.

## 4. Qualité & outillage

- **TypeScript strict** (contrat de données partagé, `src/types/models.ts`).
- `tsc --noEmit` (typecheck) et `expo lint` en CI.
- Tests : **Jest** + **React Native Testing Library** (à ajouter avec les premiers modules).
- Builds & distribution : **EAS Build / EAS Submit**.

## 5. Environnements

| Env | Projet Firebase | Usage |
| --- | --- | --- |
| `dev` | `emdi-chantiers-dev` | Développement, émulateurs Firebase |
| `staging` | `emdi-chantiers-staging` | Recette |
| `prod` | `emdi-chantiers-prod` | Production |

Les émulateurs Firebase (Firestore, Auth, Storage, Functions) permettent le développement
local sans coût ni dépendance réseau.
