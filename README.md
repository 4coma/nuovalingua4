# NuovaLingua

Une application mobile pour apprendre l'italien de manière interactive et personnalisée. NuovaLingua combine exercices de vocabulaire, compréhensions écrite et orale, conversations avec une IA et révisions adaptatives pour vous aider à progresser efficacement.

## 🎯 Fonctionnalités principales

### 📚 Dictionnaire personnel évolutif

Le cœur de NuovaLingua : **votre dictionnaire personnel qui grandit avec vous**. 

- **Ajoutez des mots** depuis n'importe où : textes lus, articles web, conversations
- **Traductions contextuelles** : obtenez des traductions adaptées au contexte d'utilisation
- **Suivi de progression** : chaque mot est suivi avec son niveau de maîtrise
- **Révisions intelligentes** : le système vous propose de réviser les mots selon votre progression
- **Enrichissement continu** : votre dictionnaire s'enrichit naturellement au fil de vos lectures et conversations

### 🌐 Apprentissage depuis le web

- **Importez des articles** : collez l'URL d'un article italien et l'application extrait automatiquement le contenu
- **Traductions instantanées** : cliquez sur n'importe quel mot pour obtenir sa traduction contextuelle
- **Ajout au dictionnaire** : en un clic, ajoutez les mots intéressants à votre dictionnaire personnel
- **Textes sauvegardés** : gardez vos articles préférés pour les relire et progresser

### 🎧 Compréhensions orales

- **Textes audio générés** : écoutez des textes adaptés à votre niveau avec prononciation naturelle
- **Exercices d'écoute** : testez votre compréhension avec des questions sur les textes audio
- **Notifications quotidiennes** : recevez chaque jour un nouveau texte de compréhension orale

### 💬 Autres fonctionnalités

- **Apprendre** : Découvrez du vocabulaire organisé par catégories avec des exercices interactifs
- **Réviser** : Révisions personnalisées basées sur votre progression ou révisions complètes pour consolider vos acquis
- **Discuter** : Pratiquez l'italien en conversation avec une IA dans différents contextes (restaurant, voyage, travail...)
- **Compréhension écrite** : Lisez des textes adaptés à votre niveau avec questions de compréhension
- **Jeux** : Apprenez en vous amusant avec des jeux de paires de mots
- **Synchronisation** : Optionnellement, synchronisez vos données avec Firebase pour accéder à vos progrès sur plusieurs appareils

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- Android Studio (pour le développement Android)
- Capacitor CLI (installé globalement ou via npx)

### Installation des dépendances

```bash
npm install
```

### Lancer l'application en mode développement

```bash
npm start
```

L'application sera accessible sur `http://localhost:4200`

### Build pour production

```bash
npm run build
```

## 📱 Build Android

### Préparation

1. Assurez-vous d'avoir Android Studio installé avec le SDK Android
2. Configurez les variables d'environnement Android si nécessaire

### Générer l'APK

```bash
# Build de l'application web
npm run build

# Synchroniser avec Capacitor
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

Dans Android Studio, vous pourrez ensuite générer un APK signé ou un AAB pour la publication sur Google Play.

## ⚙️ Configuration

### Clés API (optionnel mais recommandé)

L'application fonctionne mieux si vous configurez vos propres clés API dans les préférences :

1. **Clé API OpenAI** : Pour les conversations avec l'IA et la génération de contenu
   - Obtenez votre clé sur [platform.openai.com](https://platform.openai.com)
   - Allez dans Préférences → Clé API OpenAI
   - Collez votre clé (commence par `sk-...`)

2. **Clé API Google Text-to-Speech** (optionnel) : Pour la prononciation audio des mots
   - Obtenez votre clé sur [Google Cloud Console](https://console.cloud.google.com)
   - Activez l'API Text-to-Speech
   - Allez dans Préférences → Clé API Google TTS
   - Collez votre clé (commence par `AIza...`)

### Synchronisation Firebase (optionnel)

Si vous souhaitez synchroniser vos données entre plusieurs appareils :

1. Créez un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activez Firestore Database et Authentication (mode anonyme)
3. Récupérez votre configuration Firebase dans les paramètres du projet
4. Allez dans Préférences → Synchronisation Firebase
5. Activez Firebase et remplissez les champs de configuration

**Note** : Toutes les clés API sont stockées localement sur votre appareil et ne sont jamais envoyées ailleurs que vers les services correspondants.

## 🛠️ Technologies utilisées

- **Angular** 19 - Framework frontend
- **Ionic** 8 - Framework UI mobile
- **Capacitor** 7 - Runtime natif pour Android
- **Firebase** - Backend optionnel pour la synchronisation
- **TypeScript** - Langage de développement
- **SCSS** - Styles

## 📂 Structure du projet

```
nuovalingua4/
├── src/
│   ├── app/
│   │   ├── components/     # Composants Angular
│   │   ├── services/       # Services métier
│   │   ├── models/         # Modèles de données
│   │   └── theme/          # Styles et thèmes
│   └── assets/             # Ressources statiques
├── android/                 # Projet Android natif
├── functions/               # Firebase Functions (optionnel)
└── www/                     # Build de production (généré)
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests e2e avec Playwright
npm run test:e2e

# Tests e2e en mode UI
npm run test:e2e:ui
```

## 📝 Notes de développement

- Les composants sont organisés de manière atomique (atoms → molecules → organisms)
- Chaque composant expose ses données via `@Input()` et `@Output()`
- Le code suit les conventions Angular avec des composants standalone
- Les styles utilisent SCSS avec des variables de thème centralisées

## 🔒 Sécurité

Consultez le fichier `SECURITY_AUDIT.md` pour plus d'informations sur la sécurité de l'application. En résumé :

- Aucune clé API n'est hardcodée dans le code
- Les secrets sont stockés localement sur l'appareil
- Le repository est sécurisé pour être rendu public

## 📄 Licence

Ce projet est privé. Tous droits réservés.

## 🤝 Contribution

Ce projet est actuellement en développement actif. Les contributions sont les bienvenues, mais merci de discuter des changements majeurs avant de créer une pull request.

---

Bon apprentissage de l'italien ! 🇮🇹

