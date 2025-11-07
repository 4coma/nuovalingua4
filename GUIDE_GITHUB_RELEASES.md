# Guide de publication de l'APK sur GitHub Releases

## 📦 Créer une release GitHub

Pour que le lien de téléchargement sur la landing page fonctionne, vous devez créer une release GitHub avec l'APK.

### Méthode 1 : Via l'interface GitHub (recommandé)

1. **Aller sur GitHub** : https://github.com/4coma/nuovalingua4/releases/new

2. **Créer une nouvelle release** :
   - **Tag** : `v1.0.0` (ou la version actuelle)
   - **Titre** : `NuovaLingua v1.0.0`
   - **Description** : 
     ```markdown
     ## 🎉 Première version de NuovaLingua
     
     Application mobile pour apprendre l'italien de manière interactive.
     
     ### Fonctionnalités
     - Dictionnaire personnel évolutif
     - Apprentissage par association
     - Conversations avec IA
     - Compréhensions écrite et orale
     - Import d'articles web
     ```

3. **Attacher l'APK** :
   - Cliquez sur "Attach binaries"
   - Sélectionnez `landing-page/downloads/nuovalingua-latest.apk`
   - **IMPORTANT** : Renommez-le en `nuovalingua-latest.apk` dans GitHub (ou utilisez le nom exact dans le lien)

4. **Publier la release** : Cliquez sur "Publish release"

### Méthode 2 : Via GitHub CLI (plus rapide)

```bash
# Installer GitHub CLI si nécessaire
# sudo apt install gh  # ou brew install gh

# Se connecter
gh auth login

# Créer la release avec l'APK
gh release create v1.0.0 \
  landing-page/downloads/nuovalingua-latest.apk \
  --title "NuovaLingua v1.0.0" \
  --notes "Première version de NuovaLingua - Application mobile pour apprendre l'italien"
```

### Méthode 3 : Script automatisé

Créez un script `publish-release.sh` :

```bash
#!/bin/bash

VERSION="1.0.0"
APK_PATH="landing-page/downloads/nuovalingua-latest.apk"

# Vérifier que l'APK existe
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK non trouvé : $APK_PATH"
    echo "Générez d'abord l'APK avec : npm run build && npx cap sync android && cd android && ./gradlew assembleDebug"
    exit 1
fi

# Créer la release
gh release create "v$VERSION" \
  "$APK_PATH" \
  --title "NuovaLingua v$VERSION" \
  --notes "Version $VERSION de NuovaLingua

## 🎉 Nouvelle version

Application mobile pour apprendre l'italien de manière interactive.

### Installation
1. Téléchargez l'APK
2. Activez 'Sources inconnues' dans les paramètres Android
3. Installez l'application"

echo "✅ Release créée : https://github.com/4coma/nuovalingua4/releases/tag/v$VERSION"
```

## 🔄 Mettre à jour une release existante

Pour mettre à jour l'APK dans une release existante :

```bash
# Supprimer l'ancien asset (si nécessaire)
gh release delete-asset v1.0.0 nuovalingua-latest.apk

# Ajouter le nouvel APK
gh release upload v1.0.0 landing-page/downloads/nuovalingua-latest.apk
```

## 📝 Notes importantes

- Le lien sur la landing page pointe vers : `https://github.com/4coma/nuovalingua4/releases/latest/download/nuovalingua-latest.apk`
- Assurez-vous que le nom du fichier dans GitHub Releases correspond exactement à `nuovalingua-latest.apk`
- Pour chaque nouvelle version, créez une nouvelle release avec un tag de version (v1.0.1, v1.0.2, etc.)
- Le lien `/latest/download/` pointe automatiquement vers la dernière release

