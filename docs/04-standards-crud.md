# 04 — Standards CRUD & cycle de vie (§2)

Le cahier des charges impose, pour **tous les modules sans exception**, six actions. Ce
document fige leur sémantique et leur implémentation de référence
([`src/services/crud.ts`](../src/services/crud.ts)).

## 1. Machine à états

```
                 creer()
                   │
                   ▼
   ┌───────────────────────────────┐
   │            ACTIF              │◄────────── modifier()
   └───┬───────────┬───────────┬───┘
       │archiver() │annuler()  │supprimer()
       ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌───────────┐
   │ARCHIVE │  │ ANNULE │  │ SUPPRIME  │
   │(lecture│  │(motif  │  │(soft-     │
   │ seule) │  │ requis)│  │ delete)   │
   └────────┘  └────────┘  └───────────┘
```

## 2. Sémantique des 6 actions

| Action | État résultant | Règles |
| --- | --- | --- |
| **Créer** | `actif` | Renseigne l'audit (`creeLe/creePar`) et initialise les champs de cycle de vie. |
| **Lire / Consulter** | — | Les listes **excluent `supprime`** par défaut (`filtreActifs`). Archivés visibles en lecture seule. |
| **Modifier** | `actif` | Interdit sur `archive` et `supprime`. Met à jour `modifieLe/modifiePar`. |
| **Supprimer** | `supprime` | **Soft-delete** : l'enregistrement est conservé (jamais de suppression physique). |
| **Archiver** | `archive` | Bascule en **lecture seule**. Conserve l'historique. Réversible (désarchivage) selon droits. |
| **Annuler** | `annule` | Pour un document **validé/émis** (facture, bon de commande…). **Motif obligatoire**, tracé dans `annulation`. |

## 3. Signature de référence

```ts
creer(collection, data, utilisateurId): Promise<ID>
lire(collection, id): Promise<T | null>
lister(collection, contraintes?, inclureSupprimes?): Promise<T[]>
modifier(collection, id, dataPartielle, utilisateurId): Promise<void>
supprimer(collection, id, utilisateurId): Promise<void>            // soft-delete
archiver(collection, id, utilisateurId): Promise<void>
annuler(collection, id, motif, utilisateurId): Promise<void>       // motif non vide requis
```

## 4. Distinction Supprimer vs Annuler vs Archiver

- **Supprimer** = erreur de saisie / brouillon inutile → masqué mais récupérable (soft-delete).
- **Annuler** = document ayant une valeur juridique/comptable (facture émise, commande envoyée)
  qui ne doit **jamais disparaître** : on trace un **motif** et on neutralise ses effets.
- **Archiver** = élément terminé/clôturé que l'on **conserve consultable** en lecture seule
  (chantier livré, devis refusé historisé).

## 5. À appliquer côté serveur (Security Rules)

Les règles Firestore doivent refléter cette machine à états, indépendamment du client :

- refuser toute écriture (hors désarchivage autorisé) sur un document `etat == 'archive'` ;
- exiger un `annulation.motif` non vide pour passer à `etat == 'annule'` ;
- n'autoriser le passage à `supprime`/`archive`/`annule` qu'aux rôles habilités ;
- ne jamais autoriser la suppression physique (`delete`) depuis le client.
