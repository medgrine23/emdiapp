# 📱 Guide pour voir l'application

Ce guide est écrit pour un **grand débutant**. Suis les étapes dans l'ordre.
Tu as **trois façons** de voir l'app, de la plus rapide à la plus « vraie ».

> Dans tous les cas, il faut un **ordinateur** (Windows ou Mac) pour préparer.
> Copie-colle les commandes **exactement**. Une « commande » se tape dans le
> **Terminal** (Mac) ou **PowerShell / Invite de commandes** (Windows).

---

## 🧰 Étape 0 — À installer une seule fois

1. **Node.js** (le moteur qui fait tourner l'app) :
   va sur <https://nodejs.org>, télécharge la version **LTS**, installe-la
   (clique « Suivant » jusqu'au bout).
2. **Le code de l'app** sur ton ordinateur :
   - Sur la page GitHub du projet, bouton vert **« Code » → « Download ZIP »**.
   - Décompresse le ZIP (clic droit → Extraire). Tu obtiens un dossier `emdiapp`.
3. **Ouvrir le dossier dans le terminal** :
   - Windows : ouvre le dossier, clique dans la barre d'adresse, tape `powershell`,
     puis Entrée.
   - Mac : ouvre l'app **Terminal**, tape `cd ` (avec un espace), glisse le dossier
     `emdiapp` dessus, puis Entrée.
4. **Installer les composants** (à faire une fois, ça prend quelques minutes) :
   ```bash
   npm install
   ```

Voilà, la préparation est finie. Choisis maintenant une des 3 façons ci-dessous.

---

## 🌐 Façon 1 — Aperçu dans le navigateur (le plus rapide)

Pour **jeter un œil** au design tout de suite, sur ton ordinateur :

```bash
npx expo start --web
```

Ton navigateur s'ouvre avec l'application. 👍

> ⚠️ La caméra, le micro (notes vocales) et l'appareil photo ne marchent pas dans
> le navigateur — c'est normal, c'est juste un aperçu. Tout le reste (projets,
> devis, planning, chat en texte…) fonctionne.

Pour arrêter : reviens au terminal et fais **Ctrl + C**.

---

## 📲 Façon 2 — Sur ton téléphone avec « Expo Go »

1. Installe l'application gratuite **Expo Go** depuis le Play Store (Android) ou
   l'App Store (iPhone).
2. Sur l'ordinateur, dans le dossier de l'app :
   ```bash
   npx expo start
   ```
3. Un **QR code** apparaît dans le terminal.
   - **Android** : ouvre Expo Go → « Scan QR code » → scanne.
   - **iPhone** : ouvre l'appareil photo → vise le QR code → touche la notification.
4. L'app se lance sur ton téléphone. 🎉

> Le téléphone et l'ordinateur doivent être sur le **même Wi-Fi**.
> Si Expo Go affiche un message de version incompatible, utilise la **Façon 3**.

---

## 🏗️ Façon 3 — Installer un vrai fichier Android (APK)

C'est la version « pour de vrai » : un fichier que tu installes comme n'importe
quelle app, sans garder l'ordinateur allumé. La fabrication se fait **dans le
cloud** (gratuit).

1. Crée un compte gratuit sur <https://expo.dev> (juste email + mot de passe).
2. Sur l'ordinateur :
   ```bash
   npm install -g eas-cli
   eas login
   eas build -p android --profile preview
   ```
   - `eas login` : entre l'email et le mot de passe du compte Expo.
   - La première fois, réponds **oui** aux questions (création du projet).
3. La fabrication prend ~10–15 min. À la fin, tu obtiens un **lien** (et un QR
   code). Ouvre-le **sur ton téléphone Android** et **installe** le fichier.
   - Android demandera d'**autoriser l'installation** depuis cette source :
     accepte.
4. L'app **EMDI Chantiers** apparaît dans ton téléphone. ✅

---

## ❓ Mode démo vs vraies données

- Sans configuration, l'app tourne en **mode démo** : des données d'exemple sont
  déjà là (projet scolaire, devis, planning…). Parfait pour découvrir.
- Pour connecter la **vraie base de données** (Firebase, temps réel, comptes),
  voir [`docs/05-integration-firebase.md`](docs/05-integration-firebase.md).
  On le fera ensemble quand tu voudras.

---

## 🆘 En cas de souci

- « `npm` ou `npx` n'est pas reconnu » → Node.js n'est pas installé ou il faut
  **fermer et rouvrir** le terminal après l'installation.
- Une commande semble bloquée → c'est peut-être normal (elle travaille). Laisse
  finir. Pour tout arrêter : **Ctrl + C**.
- Note le message d'erreur exact et envoie-le moi, je te guide.
