# Héberger l'application sur Supabase

Ce guide explique, pas à pas, comment brancher **MDI Build** sur **Supabase**
(la base de données en ligne qui stockera tous les chantiers, devis, factures,
etc.). Tout se fait depuis un navigateur — aucun ordinateur nécessaire.

> **Modèle white-label : 1 entreprise = 1 projet Supabase.**
> Chaque client à qui vous revendez l'application aura **son propre projet
> Supabase**, totalement isolé des autres. Vous refaites simplement ce guide
> une fois par client.

L'application est **déjà prête** : dès que les 2 clés Supabase sont renseignées,
elle utilise Supabase automatiquement (sinon elle reste en mode démonstration).

---

## Étape 1 — Créer un projet Supabase (gratuit)

1. Aller sur **https://supabase.com** et cliquer **Start your project**.
2. Se connecter (avec GitHub ou un e-mail).
3. Cliquer **New project**.
4. Remplir :
   - **Name** : par ex. `mdi-build-nomclient`
   - **Database Password** : choisir un mot de passe fort et **le noter**
     (il sert pour l'administration ; l'app n'en a pas besoin).
   - **Region** : choisir la plus proche (ex. *West EU (Paris)* ou
     *Central EU (Frankfurt)*).
5. Cliquer **Create new project** puis patienter ~2 minutes (mise en route).

---

## Étape 2 — Créer les tables (copier-coller un script)

1. Dans le projet Supabase, menu de gauche → **SQL Editor**.
2. Cliquer **New query**.
3. Ouvrir le fichier **`supabase/schema.sql`** de ce dépôt, **copier tout son
   contenu**, le coller dans l'éditeur.
4. Cliquer **Run** (en bas à droite). Le message *Success. No rows returned*
   confirme que tout est en place (table, index, temps réel, sécurité).

> Le script est **ré-exécutable sans risque** : vous pouvez le relancer si besoin.

---

## Étape 3 — Récupérer les 2 clés

1. Menu de gauche → **Project Settings** (l'engrenage) → **API**.
2. Noter deux valeurs :
   - **Project URL** — ressemble à `https://abcdefgh.supabase.co`
   - **Project API keys → `anon` `public`** — une longue chaîne commençant par
     `eyJ...`

> La clé **`anon` `public`** est **faite pour être embarquée dans l'app** :
> ce n'est pas un secret. La sécurité est assurée par les règles **RLS** du
> script SQL. ⚠️ **Ne jamais utiliser la clé `service_role`** dans l'app.

---

## Étape 4 — Renseigner les clés dans l'application

Deux façons — choisissez la plus simple pour vous :

### Option simple (recommandée) : vous me donnez les 2 valeurs
Collez-moi dans la conversation le **Project URL** et la clé **`anon public`**.
Je les ajoute au fichier de build (`eas.json`) et je pousse la modification.
Vous n'aurez plus qu'à **relancer un build APK** (voir `APK-DEPUIS-TELEPHONE.md`).

### Option manuelle : vous éditez `eas.json` sur GitHub
1. Sur GitHub, ouvrir le fichier **`eas.json`** → crayon **✎** (Edit).
2. Dans le profil `preview`, ajouter un bloc `env` avec vos 2 valeurs :

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" },
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "https://VOTRE-PROJET.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ...votre-cle-anon..."
  }
}
```

3. **Commit** la modification.
4. Relancer un build (onglet **Actions** → *Fabriquer l'APK Android* →
   *Run workflow*), puis installer le nouvel APK.

---

## Étape 5 — Vérifier

- Ouvrez l'application (nouvel APK) et créez un projet.
- Dans Supabase → **Table Editor** → table **`entites`** : la nouvelle ligne
  apparaît (colonne `collection` = `projets`).
- Les données sont maintenant **partagées et synchronisées en temps réel**
  entre tous les téléphones connectés au même projet Supabase.

---

## Ce qui est fait / ce qui viendra ensuite

**Déjà en place** ✅
- Base de données Supabase (les 6 actions : créer, consulter, modifier,
  supprimer, archiver, annuler) avec **synchronisation temps réel**.
- Bascule automatique : Supabase si configuré, sinon Firebase, sinon démo.

**Prochaines étapes (optionnelles, à faire ensuite)**
- **Comptes utilisateurs Supabase** (connexion e-mail / mot de passe) et
  activation de la sécurité renforcée (Option B du script SQL).
- **Stockage des fichiers** (photos de chantier, PDF) sur Supabase Storage.
- **Notifications push** même application fermée (via Firebase — lot séparé).

---

## Aide-mémoire (résumé ultra-court)

1. supabase.com → **New project**
2. **SQL Editor** → coller `supabase/schema.sql` → **Run**
3. **Project Settings → API** → copier **URL** + clé **anon public**
4. Me les envoyer (ou les mettre dans `eas.json` → `preview.env`)
5. **Relancer un build APK** et installer
