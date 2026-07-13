# 05 — Intégration Firebase

Ce document décrit le passage du **mode démo** (données en mémoire) au **backend
Firebase** (Firestore temps réel, Storage, Auth).

## 1. Bascule automatique

`getRepository(collection)` (`src/services/repository.ts`) choisit l'implémentation
selon la présence de `EXPO_PUBLIC_FIREBASE_PROJECT_ID` :

- **absente** → `MemoryRepository` (mode démo, données amorcées) ;
- **présente** → `FirestoreRepository` (`src/services/firestoreRepository.ts`),
  temps réel via `onSnapshot`.

Aucune modification des écrans n'est nécessaire : ils consomment l'interface
`Repository` (mêmes 6 actions §2, mêmes hooks `useCollection`/`useDocument`).

## 2. Mise en route

1. Créer un projet Firebase (console) et une application Web.
2. Activer **Firestore**, **Storage** et **Authentication** (méthode e-mail/mot de passe).
3. Copier les clés dans `.env` (voir `.env.example`).
4. Déployer les règles de sécurité :
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
5. Lancer l'app : elle utilise désormais Firestore. Les données de démo
   (`src/services/seed.ts`) ne s'amorcent que si la collection `projets` est vide —
   à retirer en production.

### Développement local (émulateurs)

`firebase.json` configure les émulateurs Auth/Firestore/Storage :
```bash
firebase emulators:start
```
Pour cibler les émulateurs, brancher `connectFirestoreEmulator` / `connectAuthEmulator`
dans `src/firebase/config.ts` (en développement uniquement).

## 3. Sécurité (règles)

- **`firestore.rules`** — reflètent le RBAC (§3.8) et la machine à états (§2) :
  lecture pour les authentifiés, écriture soumise à la permission du module,
  **aucune suppression physique** (soft-delete uniquement), écriture interdite
  sur une entité `archive` (hors désarchivage), passage à `annule` conditionné à
  un **motif non vide**.
- **`storage.rules`** — accès authentifié, taille limitée à 50 Mo.

Le contrôle d'accès serveur est la **source de vérité** ; le masquage côté client
(rôles/permissions) n'est qu'ergonomique.

## 4. Reste à finaliser (dernier lot)

| Sujet | Détail |
| --- | --- |
| **Auth — UI** | ✅ Fait — écran de connexion (`src/auth/LoginScreen.tsx`) + gating racine (`app/_layout.tsx`) via `AuthProvider`. |
| **Persistance Auth** | Ajouter `@react-native-async-storage/async-storage` et remplacer `getAuth` par `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` dans `config.ts` pour conserver la session entre lancements. |
| **Médias** | ✅ Fait — `src/services/mediaService.ts` (expo-image-picker / expo-document-picker / expo-av) branché sur le Chat (photo/galerie/fichier/note vocale) et la GED ; `persisterMedia()` téléverse via Storage en mode Firebase, conserve l'URI local en mode démo. |
| **Timestamps serveur** | `FirestoreRepository` stocke des dates ISO côté client (cohérence des types). Passer à `serverTimestamp()` si l'horodatage serveur est requis (nécessite une normalisation Timestamp → ISO en lecture). |
| **Index** | Les listes filtrent/trient côté client (pas d'index composite requis). Si le volume l'exige, passer au tri/filtre serveur et déclarer les index dans `firestore.indexes.json`. |
| **Cascade d'archivage** | Implémenter l'archivage en cascade projet (§3.1) via une Cloud Function. |
| **Numérotation & conversions** | Numéros de devis/factures/BC et règles de conversion peuvent être fiabilisés côté Cloud Functions (transactions). |
