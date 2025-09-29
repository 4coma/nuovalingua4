# 🔥 Configuration Firebase pour NuovaLingua

## 📋 Structure des données Firebase

### Collection principale : `users`
```
users/
├── {userId}/
│   ├── personalDictionary: DictionaryWord[]
│   ├── conversations: Conversation[]
│   ├── statistics: UserStatistics
│   ├── settings: UserSettings
│   ├── savedTexts: SavedText[]
│   └── metadata: UserMetadata
```

### Détail des données synchronisées

#### **1. Dictionnaire personnel** (`personalDictionary`)
- Mots ajoutés par l'utilisateur
- Traductions et langues
- Dates d'ajout et de révision
- Statut "connu" ou "à apprendre"

#### **2. Conversations IA** (`conversations`)
- Sessions de discussion avec l'IA
- Contexte et paramètres
- Tours de conversation (utilisateur + IA)
- Feedback et corrections
- Timestamps et durée

#### **3. Statistiques** (`statistics`)
- Nombre total de mots appris
- Nombre de conversations
- Temps d'étude total
- Série de jours
- Activité quotidienne

#### **4. Paramètres** (`settings`)
- Préférences de notification
- Configuration des exercices
- Clés API (masquées)
- Paramètres d'interface

#### **5. Textes sauvegardés** (`savedTexts`)
- Textes de compréhension sauvegardés
- Titre, contenu, difficulté
- Langue et nombre de mots
- Date de sauvegarde

## 🚀 Configuration pour le développement

### 1. Créer un projet Firebase

1. **Aller sur [console.firebase.google.com](https://console.firebase.google.com)**
2. **Créer un nouveau projet** ou sélectionner un projet existant
3. **Nommer le projet** : `nuovalingua-dev` (ou votre choix)
4. **Désactiver Google Analytics** (optionnel pour le dev)

### 2. Configurer Firestore

1. **Aller dans "Firestore Database"**
2. **Créer une base de données**
3. **Choisir "Mode test"** (pour le développement)
4. **Sélectionner une région** (europe-west1 recommandé)

### 3. Configurer l'authentification

1. **Aller dans "Authentication"**
2. **Onglet "Sign-in method"**
3. **Activer "Anonymous"** (authentification anonyme)
4. **Sauvegarder**

### 4. Obtenir la configuration

1. **Aller dans "Paramètres du projet"** (⚙️)
2. **Onglet "Vos applications"**
3. **Cliquer sur "Ajouter une application"**
4. **Choisir "Web"** (</>)
5. **Nommer l'app** : `nuovalingua-web`
6. **Copier la configuration Firebase**

### 5. Configuration Firestore (Règles de sécurité)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les utilisateurs
    match /users/{userId} {
      // Seul l'utilisateur connecté peut accéder à ses données
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Règles pour les tests de connexion
    match /test/{document} {
      // Permettre la lecture/écriture pour les tests
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔧 Configuration dans l'app

### 1. Lancer le serveur de développement

```bash
ionic serve
```

### 2. Configurer Firebase dans les préférences

1. **Aller dans Préférences** → Synchronisation Firebase
2. **Activer Firebase**
3. **Remplir les champs** avec votre configuration :
   - **API Key** : `AIza...`
   - **Auth Domain** : `votre-projet.firebaseapp.com`
   - **Project ID** : `votre-projet-id`
   - **Storage Bucket** : `votre-projet.appspot.com`
   - **Messaging Sender ID** : `123456789`
   - **App ID** : `1:123456789:web:abcdef`

### 3. Tester la connexion

1. **Cliquer sur "Tester la connexion Firebase"**
2. **Vérifier le message de succès** ✅
3. **Vérifier dans la console Firebase** que le document de test est créé

### 4. Migrer les données

1. **Cliquer sur "Migrer mes données vers Firebase"**
2. **Confirmer la migration**
3. **Vérifier dans Firestore** que les données sont bien présentes

## 📊 Vérification des données

### Dans la console Firebase

1. **Aller dans Firestore Database**
2. **Vérifier la collection `users`**
3. **Ouvrir le document utilisateur**
4. **Vérifier les sous-collections** :
   - `personalDictionary`
   - `conversations`
   - `statistics`
   - `settings`
   - `savedTexts`

### Structure attendue

```json
{
  "personalDictionary": [
    {
      "id": "word_1234567890",
      "sourceWord": "casa",
      "targetWord": "maison",
      "sourceLang": "it",
      "targetLang": "fr",
      "dateAdded": 1696000000000,
      "isKnown": false
    }
  ],
  "conversations": [
    {
      "id": "conv_1234567890",
      "context": {
        "topic": "restaurant",
        "level": "intermediate"
      },
      "turns": [
        {
          "speaker": "user",
          "message": "Ciao, vorrei prenotare un tavolo",
          "timestamp": "2023-09-29T19:30:00Z"
        }
      ],
      "startTime": "2023-09-29T19:30:00Z",
      "language": "it"
    }
  ],
  "statistics": {
    "totalWordsLearned": 150,
    "totalConversations": 25,
    "totalStudyTime": 3600000,
    "streakDays": 7
  },
  "settings": {
    "notificationsEnabled": true,
    "wordAssociationsCount": 10
  },
  "savedTexts": [
    {
      "id": "text_1234567890",
      "title": "Il ristorante",
      "content": "Ciao, vorrei prenotare...",
      "language": "it",
      "difficulty": "intermediate"
    }
  ]
}
```

## 🐛 Dépannage

### Erreur de connexion
- Vérifier que tous les champs Firebase sont remplis
- Vérifier que l'authentification anonyme est activée
- Vérifier les règles Firestore

### Erreur de migration
- Vérifier que des données locales existent
- Vérifier la connexion Firebase
- Consulter la console du navigateur

### Données manquantes
- Vérifier que la migration s'est bien déroulée
- Vérifier les règles Firestore
- Vérifier que l'utilisateur est bien connecté

## 🔒 Sécurité

- **Authentification anonyme** : Chaque utilisateur a un ID unique
- **Règles Firestore** : Seul l'utilisateur peut accéder à ses données
- **Données locales** : Conservées en local + synchronisées
- **Clés API** : Stockées localement, jamais exposées

## 📱 Production

Pour la production, il faudra :
1. **Créer un projet Firebase séparé**
2. **Configurer les règles de sécurité appropriées**
3. **Activer l'authentification par email** (optionnel)
4. **Configurer les quotas et limites**
5. **Mettre en place la surveillance**

---

**Note** : Cette configuration est optimisée pour le développement. Pour la production, consultez la documentation Firebase officielle.
