# 01 — Architecture générale

## 1. Principe directeur

L'application est construite autour d'un **nœud central unique : le Projet (chantier)**.
Tous les autres modules portent une clé étrangère `projetId` et n'existent que dans le
contexte d'un chantier (à l'exception des référentiels globaux : entreprise, rôles, taxes,
utilisateurs). Cette contrainte garantit la cohérence relationnelle exigée par le cahier
des charges (§3).

```
                              ┌────────────────────┐
                              │      PROJET        │  ← nœud central
                              │ (chantier)         │
                              └─────────┬──────────┘
             ┌──────────────┬──────────┼───────────┬───────────────┐
             │              │          │           │               │
        ┌────▼────┐   ┌─────▼────┐ ┌───▼────┐ ┌────▼─────┐   ┌──────▼──────┐
        │  DEVIS  │   │ PLANNING │ │ ACHAT  │ │ RAPPORT  │   │ FACTURATION │
        │ quantit.│   │ (Gantt)  │ │        │ │          │   │             │
        └────┬────┘   └────┬─────┘ └───┬────┘ └────┬─────┘   └──────▲──────┘
             │             │           │           │                │
             │ référence   │ tâche↔    │ contrôle  │ met à jour     │ alimente
             │ budgétaire  │ ligne     │ budget    │ avancement     │
             └─────────────┴───────────┴───────────┴────────────────┘
                                   │
                  ┌────────────────┼─────────────────┐
            ┌─────▼──────┐  ┌──────▼──────┐   ┌───────▼────────┐
            │ DOCUMENTA. │  │ CHAT INTERNE│   │  PARAMÈTRES    │
            │ (GED, PJ)  │  │ (temps réel)│   │ (rôles, taxes) │
            └────────────┘  └─────────────┘   └────────────────┘
```

## 2. Interconnexions clés (§3)

| Source | Cible | Nature de la liaison |
| --- | --- | --- |
| Tous les modules | **Projet** | FK `projetId`. Archivage en cascade proposé à la suppression/archivage du projet. |
| **Devis** → Achat | Ligne de devis → ligne d'achat | Base de référence : alerte si l'achat dépasse quantité/prix du devis. |
| **Devis** → Facturation | Devis → facture | Conversion en factures d'acompte / situation / solde selon l'avancement. |
| **Planning** ↔ Devis | Tâche Gantt → ligne de devis | Chaque tâche peut être associée à une ligne du devis (`ligneDevisId`). |
| **Planning** ↔ Chat | Tâche → conversation | Ouverture d'une discussion liée à une tâche (`Conversation.tachePlanningId`). |
| **Rapport** → Planning | Rapport → tâche | Met à jour l'avancement des tâches (`RapportTache.avancementPct`). |
| **Rapport** → Facturation | Rapport d'avancement → situation de travaux | Justifie les factures de situation. |
| **Rapport** → Documentation | Photos du jour | `Rapport.photoIds` pointe vers des `Document`. |
| **Documentation** → tous | Pièces jointes | `LiaisonDocument` (polymorphe) attache un document à n'importe quelle entité. |
| **Chat** → Planning/Devis/Rapport | Partage métier | `Message.partage` embarque une référence (`PartageMetier`) pour créer du contexte. |
| **Paramètres** → tous | Rôles & permissions | Contrôle d'accès (RBAC) et configuration (taxes, entreprise, notifications). |

## 3. Découpage applicatif

- **Couche présentation** — Écrans Expo Router sous `app/`. Un dossier de route par module.
- **Couche domaine / types** — `src/types/models.ts` : contrat de données partagé, miroir du MCD.
- **Couche services** — `src/services/` : accès Firestore. `crud.ts` factorise les 6 actions
  standard (§2). Un service par module viendra s'appuyer dessus.
- **Couche infrastructure** — `src/firebase/config.ts` : initialisation Firebase (Firestore,
  Storage, Auth).

## 4. Contrôle d'accès (RBAC)

Les rôles (`Admin`, `Chef de chantier`, `Magasinier`, `Commercial`, `Comptable`, `Ouvrier`,
`Lecteur`) sont définis dans le module **Paramètres**. Les autorisations sont appliquées à
deux niveaux :

1. **Client** — masquage/désactivation des actions selon `Utilisateur.role` / `permissions`.
2. **Serveur** — **Firestore Security Rules** (source de vérité, non contournable). À définir
   lors de l'implémentation, par collection et par action.

## 5. Temps réel

Le module **Chat** et les vues collaboratives (planning, rapports) s'appuient sur les
**listeners Firestore** (`onSnapshot`) : pas de serveur WebSocket à opérer. Les médias
(photos, vidéos, notes vocales, fichiers) transitent par **Firebase Storage**, seule l'URL
étant stockée dans le message.

## 6. Stratégie d'évolution

Le scaffold livré expose déjà les 9 routes et le contrat de données. L'implémentation d'un
module consiste à : (a) écrire son service au-dessus de `crud.ts`, (b) remplacer l'écran
placeholder par les écrans liste/détail/formulaire, (c) ajouter les Security Rules
correspondantes.
