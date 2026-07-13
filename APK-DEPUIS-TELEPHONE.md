# 📱➡️📱 Obtenir l'app sur ton Android, sans ordinateur

Tout se fait **depuis le navigateur de ton téléphone**. Compte ~20 min la
première fois (surtout de l'attente). Suis les étapes **dans l'ordre**.

---

## 1) Créer un compte Expo (gratuit)

1. Va sur **<https://expo.dev>** → **Sign up**.
2. Crée le compte (email + mot de passe). Note-les.

## 2) Créer un « jeton » (token) Expo

Ce jeton autorise GitHub à lancer la fabrication à ta place.

1. Toujours sur expo.dev, ouvre **<https://expo.dev/accounts/[username]/settings/access-tokens>**
   (ou : ton avatar → **Account settings** → **Access tokens**).
2. Bouton **Create token** → donne un nom (ex. `github`) → **Create**.
3. **Copie** le jeton affiché (une longue suite de caractères). ⚠️ Il ne se
   réaffiche plus après : garde-le quelques minutes.

## 3) Coller le jeton dans GitHub (en secret)

1. Sur la page GitHub du projet **emdiapp**, ouvre l'onglet **Settings**
   (Réglages).
2. Menu de gauche : **Secrets and variables** → **Actions**.
3. Bouton **New repository secret**.
   - **Name** : `EXPO_TOKEN` (exactement ça, en majuscules).
   - **Secret** : colle le jeton copié à l'étape 2.
   - **Add secret**.

## 4) Lancer la fabrication

1. Sur GitHub, onglet **Actions**.
2. Dans la liste de gauche, choisis **« 📱 Fabriquer l'APK Android »**.
3. Bouton **Run workflow** → confirme **Run workflow**.
4. Ça démarre. La fabrication prend **~10–15 min** (la vraie construction se
   fait sur les serveurs Expo).

## 5) Récupérer et installer l'APK

1. Va sur **<https://expo.dev>** → ton projet → onglet **Builds**.
2. Quand le build est **Finished**, ouvre-le → bouton **Download** (ou scanne le
   QR / ouvre le lien) **depuis ton téléphone**.
3. Android va demander d'**autoriser l'installation** depuis cette source :
   accepte, puis **Installer**.
4. L'app **EMDI Chantiers** apparaît sur ton téléphone. 🎉

---

## En cas de souci

- **Le build échoue tout de suite** → le secret `EXPO_TOKEN` est mal nommé ou le
  jeton est invalide. Refais l'étape 2 et 3.
- **« project not configured »** → relance simplement le workflow (l'étape de
  liaison du projet se fait au premier passage).
- Copie-moi le message d'erreur affiché dans le journal (onglet Actions → le
  build rouge → clique l'étape en rouge) et je te débloque.

> 💡 **Plus simple si possible :** si tu peux emprunter un ordinateur ne
> serait-ce que 15 min, le [guide de démarrage](GUIDE-DEMARRAGE.md) permet
> d'obtenir l'app encore plus vite (aperçu navigateur ou APK).
