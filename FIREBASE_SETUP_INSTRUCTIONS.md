# 🔥 Instructions de Configuration Firebase pour NuovaLingua

## 📋 Étapes à effectuer manuellement

### 1. **Créer un projet Firebase**

1. Va sur [Firebase Console](https://console.firebase.google.com/)
2. Clique sur **"Créer un projet"**
3. Nomme ton projet : `nuovalingua4`
4. Active Google Analytics (recommandé)
5. Crée le projet

### 2. **Activer les services Firebase**

Dans la console Firebase de ton projet `nuovalingua4` :

#### A. **Firebase Functions**
1. Va dans **"Functions"** dans le menu de gauche
2. Clique sur **"Commencer"**
3. Suis les instructions pour activer l'API Cloud Functions
4. Choisis un plan (Spark gratuit suffit pour commencer)

#### B. **Firebase Hosting (optionnel)**
1. Va dans **"Hosting"** dans le menu de gauche
2. Clique sur **"Commencer"**
3. Suis les instructions pour activer l'API Firebase Hosting

### 3. **Se connecter à Firebase depuis ton terminal**

```bash
cd /home/pierre/Git/nuovalingua4/nuovalingua4
npx firebase-tools login
```

Suis les instructions pour t'authentifier avec ton compte Google.

### 4. **Configurer le projet Firebase**

```bash
# Initialiser Firebase dans ton projet
npx firebase-tools init
```

**Réponses aux questions :**
- **Which Firebase features do you want to set up?** → `Functions` et `Hosting`
- **Please select an option** → `Use an existing project`
- **Select a default Firebase project** → `nuovalingua4`
- **What language would you like to use?** → `JavaScript`
- **Do you want to use ESLint?** → `No`
- **Do you want to install dependencies now?** → `Yes`
- **What do you want to use as your public directory?** → `www`
- **Configure as a single-page app?** → `Yes`
- **Set up automatic builds?** → `No`

### 5. **Déployer les Firebase Functions**

```bash
# Exécuter le script de déploiement
./deploy-firebase.sh
```

Ou manuellement :
```bash
cd functions
npm install
cd ..
npx firebase-tools deploy --only functions
```

### 6. **Configurer Angular pour Firebase Functions**

#### A. **Installer Angular Fire**

```bash
npm install @angular/fire
```

#### B. **Configurer Firebase dans Angular**

Modifie `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "nuovalingua4.firebaseapp.com",
    projectId: "nuovalingua4",
    storageBucket: "nuovalingua4.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
  }
};
```

**Où trouver ces valeurs :**
1. Va dans **"Paramètres du projet"** (icône d'engrenage)
2. Scroll vers le bas jusqu'à **"Vos applications"**
3. Clique sur **"</>"** pour ajouter une app web
4. Copie les valeurs de configuration

#### C. **Mettre à jour app.config.ts**

```typescript
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { environment } from '../environments/environment';

// Dans les providers
providers: [
  // ... autres providers
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideFunctions(() => getFunctions()),
]
```

#### D. **Basculer vers le vrai service**

Dans `src/app/components/add-text-modal/add-text-modal.component.ts` :

```typescript
// Remplacer
import { WebExtractionService } from '../../services/web-extraction.service';

// Par
import { WebExtractionFirebaseService } from '../../services/web-extraction-firebase.service';
```

Et dans le constructeur :
```typescript
constructor(
  private modalController: ModalController,
  private toastController: ToastController,
  private savedTextsService: SavedTextsService,
  private webExtractionService: WebExtractionFirebaseService  // ← Changement ici
) {}
```

## 🧪 **Test de l'extraction**

1. Lance ton app Angular : `ng serve`
2. Va dans le modal "Ajouter un texte"
3. Bascule sur "Depuis une URL"
4. Saisis une URL d'article italien (ex: https://www.corriere.it/)
5. Clique sur "Extraire le contenu"

## 🔍 **Vérification du déploiement**

### **Voir les Functions déployées :**
```bash
npx firebase-tools functions:list
```

### **Voir les logs des Functions :**
```bash
npx firebase-tools functions:log
```

### **Tester une Function directement :**
```bash
curl -X POST https://us-central1-nuovalingua4.cloudfunctions.net/testFunction \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🚨 **Dépannage**

### **Erreur de permissions :**
```bash
npx firebase-tools login --reauth
```

### **Erreur de déploiement :**
```bash
npx firebase-tools deploy --only functions --debug
```

### **Functions non trouvées :**
Vérifie que le projet ID dans `.firebaserc` correspond à ton projet Firebase.

### **Erreur CORS :**
Les Functions sont configurées pour accepter les appels depuis n'importe quelle origine. Si tu as des problèmes, vérifie la configuration CORS dans `functions/index.js`.

## 💰 **Coûts**

- **Spark Plan (gratuit)** : 2M invocations/mois, 40k GB-sec/mois
- **Blaze Plan (payant)** : $0.40 par million d'invocations après le gratuit

Pour l'extraction de contenu web, le plan gratuit devrait largement suffire pour les tests et le développement.

## 🎯 **Prochaines étapes**

Une fois configuré :
1. Teste l'extraction avec différentes URLs
2. Optimise les sélecteurs de contenu dans `functions/index.js`
3. Ajoute la gestion d'erreurs spécifiques
4. Configure le monitoring et les alertes
5. Ajoute un cache pour éviter les extractions répétées

---

**Besoin d'aide ?** Consulte les logs Firebase ou contacte-moi pour le dépannage !
