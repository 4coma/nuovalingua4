# Deploy Railway

## Runtime

- Le build Angular de production sort dans `www/`.
- Railway utilise `railway.toml` :
  - `buildCommand = "npm run build:web"`
  - `startCommand = "npm start"`
- Le serveur Node `server.js` sert `www/` et applique un fallback SPA vers `index.html`.

## Variables Railway

Configurer dans Railway :

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GOOGLE_TTS_API_KEY`

Le front utilise les endpoints backend suivants :

- `POST /api/openai/chat`
- `POST /api/openai/speech`
- `POST /api/openai/transcriptions`
- `POST /api/google-tts`
- `GET /api/health`

## Firebase Auth

Configurer manuellement dans la console Firebase :

1. Activer `Email/Password` dans `Authentication > Sign-in method`.
2. Activer `Anonymous` si le mode invité doit rester disponible.
3. Ajouter les domaines Railway et le domaine custom dans `Authentication > Settings > Authorized domains`.

## Firestore

- Déployer les règles avec `npm run deploy:firestore:rules` si nécessaire.
- Les règles actuelles limitent l’accès au propriétaire du document `users/{uid}`.

## Données synchronisées

Les données utilisateur sont maintenant synchronisées avec Firebase :

- dictionnaire personnel
- conversations sauvegardées
- textes sauvegardés
- suivi vocabulaire
- POMs
- préférences utilisateur et notifications

## Clés API IA

Le mode SaaS web passe maintenant par le backend Railway :

- OpenAI : secret serveur `OPENAI_API_KEY`
- Google TTS : secret serveur `GOOGLE_TTS_API_KEY`

Les champs de clé API utilisateur restent compatibles en fallback legacy, mais ils ne sont plus nécessaires pour un déploiement Railway standard.
