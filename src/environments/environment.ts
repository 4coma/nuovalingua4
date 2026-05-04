// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  backendApiEnabled: true,
  apiBaseUrl: '/api',
  openaiApiKey: 'REMOVED_API_KEY', // À remplir avec votre clé API OpenAI
  openaiModel: 'gpt-4.1-nano', // ou 'gpt-3.5-turbo' selon le modèle souhaité
  openaiApiUrl: '/api/openai/chat',
  openaiSpeechApiUrl: '/api/openai/speech',
  openaiTranscriptionApiUrl: '/api/openai/transcriptions',
  googleTtsApiUrl: '/api/google-tts',
  llmApiUrl: '/api/openai/chat',
  // Configuration Firebase Web embarquée dans l'app (ne pas demander à l'utilisateur final).
  // Remplir ces valeurs avec le SDK config de l'app Web Firebase.
  firebaseConfig: {
    apiKey: 'AIzaSyDrtmweVit3A3Xk_BHsZTnLa7odKFzecbw',
    authDomain: 'nuovalingua-b0aa0.firebaseapp.com',
    projectId: 'nuovalingua-b0aa0',
    storageBucket: 'nuovalingua-b0aa0.firebasestorage.app',
    messagingSenderId: '45630107899',
    appId: '1:45630107899:web:a55328a09b3d377dfc405e'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
