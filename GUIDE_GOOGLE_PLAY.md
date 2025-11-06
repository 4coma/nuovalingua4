# Guide de Publication sur Google Play Store - NuovaLingua

## 📋 Checklist de préparation

### 1. ✅ Configuration Android de base

**À modifier avant publication :**

- [ ] **Application ID** : Actuellement `io.ionic.starter` → À changer en `com.nuovalingua.app` (ou votre domaine)
- [ ] **Version** : Actuellement `versionCode: 1`, `versionName: "1.0"` → OK pour première publication
- [ ] **Target SDK** : Actuellement 33 → Recommandé de mettre à jour vers 34 (Android 14)
- [ ] **App Name** : Actuellement "nuovalingua4" → Peut être amélioré

### 2. 🔐 Signature de l'application (OBLIGATOIRE)

Pour publier sur Google Play, vous devez signer votre application avec une clé de signature.

#### Créer un keystore

```bash
cd android/app
keytool -genkey -v -keystore nuovalingua-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias nuovalingua
```

**Informations à fournir :**
- Nom et prénom : Votre nom
- Unité organisationnelle : NuovaLingua (ou votre organisation)
- Organisation : Votre organisation
- Ville : Votre ville
- État/Région : Votre région
- Code pays : FR (ou votre code pays)

**⚠️ IMPORTANT** : 
- Sauvegardez le fichier `nuovalingua-release-key.jks` dans un endroit sûr
- Notez le mot de passe du keystore
- Notez l'alias et son mot de passe
- **NE COMMITEZ JAMAIS** le fichier `.jks` dans Git (déjà dans .gitignore)

#### Configurer Gradle pour utiliser le keystore

Créer un fichier `android/keystore.properties` (déjà dans .gitignore) :

```properties
storePassword=votre_mot_de_passe_keystore
keyPassword=votre_mot_de_passe_alias
keyAlias=nuovalingua
storeFile=../app/nuovalingua-release-key.jks
```

Modifier `android/app/build.gradle` pour utiliser le keystore en release.

### 3. 📱 Assets nécessaires pour Google Play

#### Icônes
- [ ] **Icône haute résolution** : 512x512 px (PNG, sans transparence)
- [ ] **Icône adaptative** : Déjà présent dans `resources/android/icon/`

#### Captures d'écran (obligatoires)
- [ ] **Téléphone** : Au moins 2 captures (max 8)
  - Résolution minimale : 320px
  - Résolution maximale : 3840px
  - Ratio : 16:9 ou 9:16
- [ ] **Tablette 7 pouces** : Au moins 1 capture (optionnel mais recommandé)
- [ ] **Tablette 10 pouces** : Au moins 1 capture (optionnel mais recommandé)

**Formats acceptés** : PNG ou JPEG (24 bits)

#### Graphiques promotionnels
- [ ] **Graphique de fonctionnalité** : 1024x500 px (optionnel)
- [ ] **Bannière TV** : 1280x720 px (optionnel)

### 4. 📝 Contenu de la fiche Play Store

#### Informations de base
- [ ] **Titre** : NuovaLingua (50 caractères max)
- [ ] **Description courte** : 80 caractères max
  - Exemple : "Apprenez l'italien avec un dictionnaire personnel évolutif et des exercices interactifs"
- [ ] **Description complète** : 4000 caractères max
  - Utiliser le contenu du README comme base
- [ ] **Catégorie** : Éducation
- [ ] **Classification de contenu** : Tout public

#### Mots-clés et SEO
- [ ] **Mots-clés** : italien, apprentissage, langue, vocabulaire, dictionnaire, exercices

### 5. 🔒 Permissions et confidentialité

#### Permissions actuelles dans AndroidManifest.xml
- ✅ INTERNET (nécessaire pour les appels API)
- ✅ RECORD_AUDIO (pour la prononciation)
- ✅ POST_NOTIFICATIONS (pour les rappels de révision)
- ⚠️ WRITE_EXTERNAL_STORAGE / READ_EXTERNAL_STORAGE : À vérifier si nécessaire

#### Politique de confidentialité
- [ ] **Créer une politique de confidentialité** (obligatoire)
  - Expliquer quelles données sont collectées
  - Expliquer comment les données sont utilisées
  - Mentionner Firebase (si utilisé)
  - Mentionner que les clés API sont stockées localement
  - URL à héberger (peut être sur GitHub Pages)

### 6. 🧪 Tests avant publication

- [ ] Tester l'application sur plusieurs appareils Android
- [ ] Tester toutes les fonctionnalités principales
- [ ] Vérifier que les permissions sont correctement demandées
- [ ] Tester la connexion Internet et les appels API
- [ ] Vérifier le comportement hors ligne
- [ ] Tester sur différentes versions d'Android (minSdkVersion 23 = Android 6.0)

### 7. 📦 Génération du bundle AAB

Google Play requiert un **Android App Bundle (AAB)** plutôt qu'un APK.

```bash
# Build de l'application web
npm run build

# Synchroniser avec Capacitor
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

Dans Android Studio :
1. Build → Generate Signed Bundle / APK
2. Choisir "Android App Bundle"
3. Sélectionner le keystore créé précédemment
4. Choisir "release" comme build variant
5. Générer le bundle

Le fichier `.aab` sera généré dans `android/app/release/`

### 8. 🚀 Publication sur Google Play Console

#### Prérequis
- [ ] Compte développeur Google Play (25$ USD, paiement unique)
- [ ] Accès à [Google Play Console](https://play.google.com/console)

#### Étapes de publication
1. Créer une nouvelle application
2. Remplir les informations de base
3. Uploader le bundle AAB
4. Remplir le contenu de la fiche (description, captures, etc.)
5. Configurer la classification de contenu
6. Définir la disponibilité (pays, prix)
7. Soumettre pour révision

### 9. ⚙️ Modifications de code nécessaires

#### Fichiers à modifier :

**android/app/build.gradle** :
- Changer `applicationId` de `io.ionic.starter` à `com.nuovalingua.app`
- Ajouter la configuration de signature pour release

**capacitor.config.ts** :
- Changer `appId` de `io.ionic.starter` à `com.nuovalingua.app`

**android/app/src/main/res/values/strings.xml** :
- Vérifier que `app_name` est correct

### 10. 📊 Suivi après publication

- [ ] Surveiller les crash reports dans Google Play Console
- [ ] Répondre aux avis utilisateurs
- [ ] Préparer les mises à jour futures (incrémenter versionCode)

## 🔧 Scripts utiles

### Générer un AAB signé (après configuration du keystore)

```bash
cd android
./gradlew bundleRelease
```

Le fichier sera dans : `android/app/build/outputs/bundle/release/app-release.aab`

### Vérifier la signature du bundle

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

## ⚠️ Points d'attention

1. **Application ID** : Une fois publié, vous ne pourrez plus changer l'application ID
2. **Version Code** : Doit être incrémenté à chaque mise à jour
3. **Keystore** : Perdre le keystore signifie ne plus pouvoir mettre à jour l'app
4. **Permissions** : Google Play vérifie que les permissions sont justifiées
5. **Politique de confidentialité** : Obligatoire si vous collectez des données

## 📚 Ressources

- [Documentation Google Play Console](https://support.google.com/googleplay/android-developer)
- [Guide Capacitor Android](https://capacitorjs.com/docs/android)
- [Politique de confidentialité - Template](https://www.privacypolicygenerator.info/)

