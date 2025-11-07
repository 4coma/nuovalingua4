# Déploiement de la landing page sur Firebase Hosting

## Prérequis

1. **Installer Firebase CLI** (si ce n'est pas déjà fait) :
```bash
npm install -g firebase-tools
```

2. **Se connecter à Firebase** :
```bash
firebase login
```

## Déploiement

### Première fois (initialisation)

Si c'est la première fois que vous déployez ce projet :

```bash
# Initialiser Firebase Hosting (si nécessaire)
firebase init hosting

# Sélectionner le projet existant : nuovalingua-web-extractor
# Répertoire public : landing-page
# Single-page app : Oui
# Overwrite index.html : Non (on a déjà notre index.html)
```

### Déploiement

Une fois configuré, pour déployer la landing page :

```bash
firebase deploy --only hosting
```

La landing page sera accessible à l'URL fournie par Firebase (généralement `https://nuovalingua-web-extractor.web.app` ou similaire).

## Mise à jour de l'APK

Quand vous générez un nouvel APK :

1. **Générer l'APK** :
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

2. **Copier l'APK vers le dossier downloads** :
```bash
cp android/app/build/outputs/apk/debug/app-debug.apk landing-page/downloads/nuovalingua-latest.apk
```

3. **Redéployer sur Firebase** :
```bash
firebase deploy --only hosting
```

## Configuration actuelle

- **Répertoire public** : `landing-page`
- **Projet Firebase** : `nuovalingua-web-extractor`
- **APK** : `landing-page/downloads/nuovalingua-latest.apk` (5.2 MB)

## Notes

- L'APK est actuellement un APK debug. Pour la production, utilisez un APK signé avec `build-apk.sh`
- Le fichier `.gitignore` exclut les APK du dépôt Git, mais ils seront déployés sur Firebase
- Les headers HTTP sont configurés pour servir correctement les fichiers APK

