import { test, expect } from '@playwright/test';

test.describe('Test Simple - Vocabulaire Ciblé', () => {
  test('Devrait afficher le vocabulaire ciblé dans la conversation', async ({ page }) => {
    console.log('🔍 [Test Simple] Début du test...');

    // 1. Aller directement à la conversation (simulation)
    await page.goto('/discussion/full-revision?fullRevision=true');
    console.log('🔍 [Test Simple] Navigation vers conversation');

    // 2. Attendre que la page se charge
    await page.waitForLoadState('networkidle');
    console.log('🔍 [Test Simple] Page chargée');

    // 3. Vérifier si le vocabulaire ciblé est présent
    const vocabularyCard = page.locator('.target-vocabulary-card');
    const isVisible = await vocabularyCard.isVisible();
    
    if (isVisible) {
      console.log('✅ [Test Simple] Carte vocabulaire visible!');
      
      // Vérifier le contenu
      const title = await vocabularyCard.locator('ion-card-title').textContent();
      const wordCount = await vocabularyCard.locator('.word-chip').count();
      
      console.log('🔍 [Test Simple] Titre:', title);
      console.log('🔍 [Test Simple] Nombre de mots:', wordCount);
      
      // Prendre un screenshot
      await page.screenshot({ path: 'test-results/vocabulary-card-visible.png' });
      console.log('📸 [Test Simple] Screenshot sauvegardé');
      
    } else {
      console.log('❌ [Test Simple] Carte vocabulaire non visible!');
      
      // Debug: vérifier les éléments présents
      const allCards = await page.locator('ion-card').count();
      console.log('🔍 [Test Simple] Nombre total de cartes:', allCards);
      
      // Prendre un screenshot de debug
      await page.screenshot({ path: 'test-results/vocabulary-card-missing.png' });
      console.log('📸 [Test Simple] Screenshot de debug sauvegardé');
    }

    // 4. Vérifier le localStorage
    const storedVocabulary = await page.evaluate(() => {
      return localStorage.getItem('conversationTargetVocabulary');
    });
    
    if (storedVocabulary) {
      console.log('✅ [Test Simple] Vocabulaire trouvé dans localStorage');
      const parsed = JSON.parse(storedVocabulary);
      console.log('🔍 [Test Simple] Nombre d\'items:', parsed.items?.length || 0);
    } else {
      console.log('❌ [Test Simple] Aucun vocabulaire dans localStorage');
    }
  });

  test('Devrait tester la page d\'accueil', async ({ page }) => {
    console.log('🔍 [Test Accueil] Test de la page d\'accueil...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Vérifier le titre
    const title = await page.title();
    console.log('🔍 [Test Accueil] Titre de la page:', title);
    
    // Vérifier les éléments présents
    const menuItems = await page.locator('ion-label').count();
    console.log('🔍 [Test Accueil] Nombre d\'éléments de menu:', menuItems);
    
    // Prendre un screenshot
    await page.screenshot({ path: 'test-results/homepage.png' });
    console.log('📸 [Test Accueil] Screenshot sauvegardé');
  });
});
