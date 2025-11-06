# Téléchargement direct de l'APK

## Méthode simple : Téléchargement direct depuis le site

Au lieu de publier sur Google Play Store, vous pouvez simplement rendre l'APK disponible en téléchargement direct sur votre site web.

## 🚀 Générer l'APK

### Option 1 : APK Debug (rapide, pour tester)

```bash
# Build de l'application web
npm run build

# Synchroniser avec Capacitor
npx cap sync android

# Générer l'APK debug
cd android
./gradlew assembleDebug
```

L'APK sera dans : `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2 : APK Release signé (recommandé pour distribution)

```bash
# Créer le keystore (une seule fois)
cd android
./setup-keystore.sh

# Générer l'APK signé
cd ..
./build-apk.sh
```

L'APK sera dans : `releases/nuovalingua-release-[timestamp].apk`

## 📁 Mettre l'APK sur le site

1. **Copier l'APK vers le dossier downloads** :
```bash
cp releases/nuovalingua-release-*.apk landing-page/downloads/nuovalingua-latest.apk
```

2. **Le lien sur le site fonctionnera automatiquement** :
   - Le bouton "Télécharger l'APK" sur la landing page pointe vers `downloads/nuovalingua-latest.apk`

## 🌐 Héberger le site

### Option 1 : GitHub Pages (gratuit)

1. Créer une branche `gh-pages` ou activer GitHub Pages dans les paramètres du repo
2. Le dossier `landing-page/` sera accessible publiquement
3. L'APK sera téléchargeable directement

### Option 2 : Netlify / Vercel (gratuit)

1. Connecter votre repo GitHub
2. Déployer le dossier `landing-page/`
3. L'APK sera accessible

### Option 3 : Votre propre serveur

1. Uploadez le contenu de `landing-page/` sur votre serveur
2. Assurez-vous que le dossier `downloads/` est accessible
3. Configurez les en-têtes HTTP pour permettre le téléchargement d'APK

## 📱 Installation sur Android

Les utilisateurs devront :
1. Télécharger l'APK depuis le site
2. Autoriser l'installation depuis "Sources inconnues" dans les paramètres Android
3. Installer l'application

## ⚠️ Notes importantes

- **APK Debug** : Plus simple à générer, mais Android peut avertir l'utilisateur
- **APK Release signé** : Plus professionnel, recommandé pour distribution
- **Mise à jour** : Remplacez simplement `nuovalingua-latest.apk` pour mettre à jour
- **Version** : Vous pouvez aussi garder plusieurs versions avec des noms différents

## 🔄 Mise à jour de l'APK

Quand vous voulez publier une nouvelle version :

1. Incrémentez `versionCode` et `versionName` dans `android/app/build.gradle`
2. Régénérez l'APK avec `./build-apk.sh`
3. Remplacez `landing-page/downloads/nuovalingua-latest.apk`
4. Commit et push

C'est tout ! Beaucoup plus simple que Google Play Store pour commencer.

