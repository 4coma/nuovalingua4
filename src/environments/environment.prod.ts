export const environment = {
  production: true,
  llmApiUrl: 'https://api.example.com/llm',  // Replace with actual LLM API endpoint
  openaiApiKey: 'REMOVED_API_KEY', // Clé API pour production
  openaiModel: 'gpt-4.1-nano', // Modèle à utiliser en production
  openaiApiUrl: 'https://api.openai.com/v1/chat/completions',
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
