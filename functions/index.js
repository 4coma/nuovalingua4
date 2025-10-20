const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');
const http = require('http');

// Initialiser Firebase Admin
admin.initializeApp();

/**
 * Firebase Function pour extraire le contenu textuel d'une URL (version ultra-légère)
 * Utilise uniquement les modules Node.js natifs - compatible plan Spark gratuit
 */
exports.extractWebContent = functions.https.onCall(async (data, context) => {
  try {
    const { url } = data;

    // Validation de l'URL
    if (!url || typeof url !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'URL requise');
    }

    // Validation basique de l'URL
    try {
      new URL(url);
    } catch (error) {
      throw new functions.https.HttpsError('invalid-argument', 'URL invalide');
    }


    // Extraire le contenu HTML de l'URL
    const html = await fetchUrl(url);
    
    // Extraire le contenu textuel avec un parser simple
    const content = extractTextFromHtml(html);
    const title = extractTitleFromHtml(html);

    // Nettoyer le contenu
    const cleanContent = cleanText(content);

    // Limiter la longueur
    const finalContent = cleanContent.length > 50000 
      ? cleanContent.substring(0, 50000) + '...'
      : cleanContent;

    // Vérifier que le contenu n'est pas vide
    if (!finalContent || finalContent.length < 50) {
      throw new functions.https.HttpsError('failed-precondition', 'Impossible d\'extraire du contenu valide de cette URL');
    }


    return {
      success: true,
      content: finalContent,
      title: title,
      url: url,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erreur dans extractWebContent:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Erreur interne lors de l\'extraction du contenu');
  }
});

/**
 * Fonction utilitaire pour récupérer le contenu HTML d'une URL
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NuovaLingua-ContentExtractor/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it,fr,en;q=0.9',
        'Connection': 'keep-alive'
      },
      timeout: 30000
    }, (response) => {
      let data = '';
      
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout lors de la récupération de l\'URL'));
    });
  });
}

/**
 * Parser HTML simple pour extraire le texte
 */
function extractTextFromHtml(html) {
  // Supprimer les balises script et style
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Supprimer les balises de navigation et publicité
  const unwantedTags = [
    'nav', 'header', 'footer', 'aside', 'menu', 'navigation',
    'advertisement', 'ads', 'social', 'comments', 'related'
  ];
  
  unwantedTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>[\s\S]*?<\/${tag}>`, 'gi');
    text = text.replace(regex, '');
  });
  
  // Supprimer toutes les balises HTML
  text = text.replace(/<[^>]*>/g, '');
  
  // Décoder les entités HTML communes
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  return text;
}

/**
 * Extraire le titre de la page
 */
function extractTitleFromHtml(html) {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return extractTextFromHtml(h1Match[1]).trim();
  }
  
  return 'Sans titre';
}

/**
 * Nettoyer le texte extrait
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/\n\s*\n/g, '\n\n') // Nettoyer les sauts de ligne
    .trim();
}

/**
 * Fonction de test pour vérifier que les Firebase Functions fonctionnent
 */
exports.testFunction = functions.https.onCall(async (data, context) => {
  return {
    message: 'Firebase Functions sont opérationnelles (version Spark ultra-légère)',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    features: ['HTML parsing', 'Text extraction', 'URL fetching']
  };
});