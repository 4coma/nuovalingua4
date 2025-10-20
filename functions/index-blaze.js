const functions = require('firebase-functions');
const admin = require('firebase-admin');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// Initialiser Firebase Admin
admin.initializeApp();

/**
 * Firebase Function pour extraire le contenu textuel d'une URL
 * Utilise Puppeteer pour le rendu JavaScript et Cheerio pour l'extraction
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


    // Configuration de Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Configuration de la page
    await page.setUserAgent('Mozilla/5.0 (compatible; NuovaLingua-ContentExtractor/1.0)');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Timeout pour éviter les pages qui ne se chargent pas
    page.setDefaultTimeout(30000);

    try {
      // Charger la page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Attendre un peu pour que le contenu se charge
      await page.waitForTimeout(2000);

      // Extraire le contenu HTML
      const html = await page.content();

      // Fermer le navigateur
      await browser.close();

      // Utiliser Cheerio pour parser le HTML
      const $ = cheerio.load(html);

      // Supprimer les éléments indésirables
      $('script, style, nav, header, footer, aside, .ads, .advertisement, .social-share, .comments, .related-articles').remove();

      // Extraire le contenu principal
      let content = '';

      // Essayer différentes sélecteurs pour trouver le contenu principal
      const selectors = [
        'article',
        'main',
        '.content',
        '.article-content',
        '.post-content',
        '.entry-content',
        '[role="main"]',
        '.main-content'
      ];

      let mainContent = null;
      for (const selector of selectors) {
        mainContent = $(selector).first();
        if (mainContent.length > 0) {
          break;
        }
      }

      // Si aucun sélecteur spécifique ne fonctionne, utiliser le body
      if (!mainContent || mainContent.length === 0) {
        mainContent = $('body');
      }

      // Extraire le texte
      content = mainContent.text();

      // Nettoyer le texte
      content = content
        .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
        .replace(/\n\s*\n/g, '\n\n') // Nettoyer les sauts de ligne
        .trim();

      // Limiter la longueur (éviter les contenus trop longs)
      if (content.length > 50000) {
        content = content.substring(0, 50000) + '...';
      }

      // Vérifier que le contenu n'est pas vide
      if (!content || content.length < 50) {
        throw new functions.https.HttpsError('failed-precondition', 'Impossible d\'extraire du contenu valide de cette URL');
      }

      // Extraire le titre de la page
      const title = $('title').text().trim() || $('h1').first().text().trim() || 'Sans titre';


      return {
        success: true,
        content: content,
        title: title,
        url: url,
        extractedAt: new Date().toISOString()
      };

    } catch (pageError) {
      await browser.close();
      console.error('Erreur lors du chargement de la page:', pageError);
      throw new functions.https.HttpsError('unavailable', 'Impossible de charger cette URL');
    }

  } catch (error) {
    console.error('Erreur dans extractWebContent:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Erreur interne lors de l\'extraction du contenu');
  }
});

/**
 * Fonction de test pour vérifier que les Firebase Functions fonctionnent
 */
exports.testFunction = functions.https.onCall(async (data, context) => {
  return {
    message: 'Firebase Functions sont opérationnelles',
    timestamp: new Date().toISOString()
  };
});
