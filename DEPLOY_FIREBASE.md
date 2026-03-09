# Déploiement Firebase Hosting (landing + app web)

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
# Vérifier le projet actif
firebase use nuovalingua-b0aa0

# (Optionnel) créer le site hosting dédié à l'app web si absent
firebase hosting:sites:create nuovalingua-app

# Associer les targets locaux (si nécessaire)
firebase target:apply hosting nuovalingua-web nuovalingua-web
firebase target:apply hosting nuovalingua-app nuovalingua-app
```

### Déployer la landing page (target `nuovalingua-web`)

```bash
npm run deploy:web:landing
```

### Déployer l'application web Angular (target `nuovalingua-app`)

```bash
npm run deploy:web:app
```

### Déployer les deux

```bash
npm run deploy:web:all
```

### Déployer les règles Firestore (recommandé avec authentification)

```bash
npm run deploy:firestore:rules
```

## URLs attendues

- Landing page: site Firebase `nuovalingua-web`
- App web Angular: site Firebase `nuovalingua-app`

Les URLs finales dépendent des sites effectivement créés dans Firebase Hosting.

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

3. **Redéployer la landing page** :
```bash
npm run deploy:web:landing
```

## Configuration actuelle

- **Target landing** : `nuovalingua-web` -> `public: landing-page`
- **Target app web** : `nuovalingua-app` -> `public: www`
- **Projet Firebase** : `nuovalingua-b0aa0`
- **APK** : `landing-page/downloads/nuovalingua-latest.apk`
- **Règles Firestore** : `firestore.rules` (accès limité au document de l'utilisateur connecté)

## Notes

- L'APK est actuellement un APK debug. Pour la production, utilisez un APK signé avec `build-apk.sh`
- Le fichier `.gitignore` exclut les APK du dépôt Git, mais ils seront déployés sur Firebase
- Les headers HTTP sont configurés pour servir correctement les fichiers APK
- Activez dans Firebase Authentication au moins `Email/Password` (et/ou `Anonymous`) pour permettre la synchronisation liée à l'utilisateur.
