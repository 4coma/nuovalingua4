# Configuration des Firebase Functions pour l'extraction de contenu web

Ce guide explique comment configurer et déployer les Firebase Functions pour l'extraction de contenu web dans NuovaLingua.

## 📋 Prérequis

1. **Node.js 18+** installé
2. **Firebase CLI** installé : `npm install -g firebase-tools`
3. **Projet Firebase** créé avec Functions activées
4. **Compte Google** avec accès au projet Firebase

## 🚀 Installation

### 1. Initialiser Firebase dans le projet

```bash
cd /home/pierre/Git/nuovalingua4/nuovalingua4
firebase login
firebase init functions
```

Lors de l'initialisation, sélectionnez :
- **JavaScript** comme langage
- **ESLint** pour le linting
- **Install dependencies** maintenant

### 2. Configurer les dépendances Angular

Ajoutez Firebase Functions à votre application Angular :

```bash
npm install @angular/fire
```

### 3. Configurer Firebase dans Angular

Dans `src/app/app.config.ts` ou `src/main.ts`, ajoutez :

```typescript
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFunctions, getFunctions } from '@angular/fire/functions';

// Configuration Firebase
const firebaseConfig = {
  // Vos clés de configuration Firebase
};

// Dans les providers
providers: [
  // ... autres providers
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideFunctions(() => getFunctions()),
]
```

## 🔧 Déploiement des Functions

### 1. Déployer les Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 2. Vérifier le déploiement

```bash
firebase functions:list
```

## 🧪 Test des Functions

### 1. Test local avec l'émulateur

```bash
firebase emulators:start --only functions
```

### 2. Test de la fonction d'extraction

```typescript
// Dans votre composant Angular
const result = await this.webExtractionService.extractContent('https://example.com').toPromise();
console.log(result);
```

## 📝 Utilisation

### Interface utilisateur

L'interface utilisateur est déjà intégrée dans le composant `AddTextModalComponent` :

1. **Sélection du mode** : Utilisez le segment pour choisir entre "Saisie manuelle" et "Depuis une URL"
2. **Saisie d'URL** : Entrez l'URL du contenu à extraire
3. **Extraction** : Cliquez sur "Extraire le contenu"
4. **Prévisualisation** : Le contenu extrait s'affiche dans le champ de texte

### Service Angular

Le service `WebExtractionService` fournit :

- `extractContent(url: string)` : Extrait le contenu d'une URL
- `testConnection()` : Teste la connectivité
- `isValidUrl(url: string)` : Valide une URL

## 🔒 Sécurité

### Limitations recommandées

1. **Rate limiting** : Limitez le nombre d'appels par utilisateur
2. **Validation d'URL** : Vérifiez les domaines autorisés
3. **Taille de contenu** : Limitez la taille du contenu extrait (actuellement 50 000 caractères)
4. **Timeout** : Timeout de 30 secondes pour éviter les blocages

### Configuration CORS

Les Functions sont configurées pour accepter les appels depuis votre domaine Angular.

## 🐛 Dépannage

### Erreurs courantes

1. **"Functions not configured"** : Vérifiez que Firebase Functions est initialisé
2. **"Permission denied"** : Vérifiez les règles de sécurité Firebase
3. **"Timeout"** : Augmentez le timeout dans la Firebase Function
4. **"URL inaccessible"** : Vérifiez que l'URL est accessible publiquement

### Logs

Consultez les logs Firebase :

```bash
firebase functions:log
```

## 📊 Monitoring

### Métriques importantes

1. **Temps d'exécution** des Functions
2. **Taux d'erreur** des extractions
3. **Utilisation des ressources** (CPU, mémoire)
4. **Coût** des appels Functions

### Alertes recommandées

- Taux d'erreur > 10%
- Temps d'exécution > 30 secondes
- Coût quotidien > seuil défini

## 🔄 Mise à jour

Pour mettre à jour les Functions :

1. Modifiez le code dans `functions/index.js`
2. Testez localement avec l'émulateur
3. Déployez : `firebase deploy --only functions`

## 💡 Améliorations futures

1. **Cache** : Implémenter un cache Redis pour les URLs déjà extraites
2. **Compression** : Compresser le contenu extrait
3. **Analyse** : Ajouter l'analyse de sentiment ou de difficulté du texte
4. **Multi-langue** : Détecter automatiquement la langue du contenu
5. **Images** : Extraire et traiter les images du contenu

## 📚 Ressources

- [Documentation Firebase Functions](https://firebase.google.com/docs/functions)
- [Documentation Puppeteer](https://pptr.dev/)
- [Documentation Cheerio](https://cheerio.js.org/)
- [Angular Fire](https://github.com/angular/angularfire)
