export const environment = {
  production: true,
  backendApiEnabled: true,
  apiBaseUrl: '/api',
  llmApiUrl: '/api/openai/chat',
  openaiApiKey: 'REMOVED_API_KEY', // Clé API pour production
  openaiModel: 'gpt-4.1-nano', // Modèle à utiliser en production
  openaiApiUrl: '/api/openai/chat',
  openaiSpeechApiUrl: '/api/openai/speech',
  openaiTranscriptionApiUrl: '/api/openai/transcriptions',
  googleTtsApiUrl: '/api/google-tts',
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
