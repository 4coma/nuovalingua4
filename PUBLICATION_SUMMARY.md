# Scripts et guides pour la publication sur Google Play

## 📋 Fichiers créés

- `GUIDE_GOOGLE_PLAY.md` - Guide complet de publication
- `PRIVACY_POLICY.md` - Politique de confidentialité
- `GOOGLE_PLAY_CONTENT.md` - Contenu pour la fiche Play Store
- `android/setup-keystore.sh` - Script pour créer le keystore
- `build-release.sh` - Script pour générer le bundle AAB
- `android/keystore.properties.example` - Template de configuration

## 🚀 Étapes rapides pour publier

### 1. Créer le keystore

```bash
cd android
./setup-keystore.sh
```

Suivez les instructions pour créer le keystore et configurer `keystore.properties`.

### 2. Générer le bundle AAB

```bash
./build-release.sh
```

Le fichier `.aab` sera généré dans `android/app/build/outputs/bundle/release/app-release.aab`

### 3. Préparer les assets

- **Icône 512x512** : Créez une icône haute résolution depuis `resources/icon.png`
- **Captures d'écran** : Utilisez les captures dans `landing-page/images/` et créez-en d'autres si nécessaire
- **Politique de confidentialité** : Hébergez `PRIVACY_POLICY.md` (GitHub Pages, Netlify, etc.)

### 4. Publier sur Google Play Console

1. Créez un compte développeur (25$ USD)
2. Créez une nouvelle application
3. Uploadez le bundle AAB
4. Remplissez les informations depuis `GOOGLE_PLAY_CONTENT.md`
5. Uploadez les captures d'écran et l'icône
6. Ajoutez le lien vers la politique de confidentialité
7. Soumettez pour révision

## ⚙️ Modifications effectuées

- ✅ Application ID changé : `io.ionic.starter` → `com.nuovalingua.app`
- ✅ App Name amélioré : `nuovalingua4` → `NuovaLingua`
- ✅ Version mise à jour : `1.0.0`
- ✅ Target SDK mis à jour : 33 → 34
- ✅ Configuration de signature ajoutée dans `build.gradle`
- ✅ Tous les fichiers de configuration mis à jour

## 📝 Notes importantes

- Le keystore et `keystore.properties` sont dans `.gitignore` et ne seront pas commités
- Sauvegardez le keystore dans un endroit sûr (perdre le keystore = impossible de mettre à jour l'app)
- La première publication peut prendre 1-3 jours de révision par Google
- Après publication, incrémentez `versionCode` pour chaque mise à jour

