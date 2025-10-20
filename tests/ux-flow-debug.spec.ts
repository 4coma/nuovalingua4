import { test, expect } from '@playwright/test';

test.describe('Debug UX Flow - Vocabulaire Ciblé', () => {
  test('Devrait détecter et corriger le problème "0 mots restants"', async ({ page }) => {
    console.log('🔍 [Playwright] Début du test de flux UX...');

    // 1. Aller à l'accueil
    await page.goto('/');
    console.log('🔍 [Playwright] Page d\'accueil chargée');

    // 2. Mode d'entrainement → Révision
    await page.waitForSelector('text=Mode d\'entrainement', { state: 'visible' });
    await page.click('text=Mode d\'entrainement');
    await page.waitForSelector('text=Révision', { state: 'visible' });
    await page.click('text=Révision');
    console.log('🔍 [Playwright] Navigation vers révision');

    // 3. Dictionnaire personnel
    await page.click('text=Dictionnaire personnel');
    console.log('🔍 [Playwright] Sélection dictionnaire personnel');

    // 4. Configurer 3 mots
    await page.fill('ion-input[type="number"]', '3');
    await page.click('text=Lancer la session');
    console.log('🔍 [Playwright] Session lancée avec 3 mots');

    // 5. Aller à l'association
    await page.click('text=Associer les mots');
    await page.waitForSelector('.pairs-grid');
    console.log('🔍 [Playwright] Exercice d\'association chargé');

    // 6. Vérifier que le vocabulaire est sauvegardé
    const localStorage = await page.evaluate(() => {
      return localStorage.getItem('conversationTargetVocabulary');
    });
    
    if (!localStorage) {
      console.error('❌ [Playwright] PROBLÈME DÉTECTÉ: Aucun vocabulaire sauvegardé!');
      // Je pourrais ici modifier le code directement
    } else {
      console.log('✅ [Playwright] Vocabulaire sauvegardé:', JSON.parse(localStorage));
    }

    // 7. Aller à la conversation
    await page.click('text=Mode d\'entrainement');
    await page.click('text=Conversation');
    await page.click('text=Révision complète');
    console.log('🔍 [Playwright] Navigation vers conversation');

    // 8. Vérifier l'affichage du vocabulaire
    await page.waitForSelector('.target-vocabulary-card', { timeout: 10000 });
    
    const vocabularyCard = page.locator('.target-vocabulary-card');
    const isVisible = await vocabularyCard.isVisible();
    
    if (!isVisible) {
      console.error('❌ [Playwright] PROBLÈME DÉTECTÉ: Carte vocabulaire non visible!');
      
      // Debug: vérifier les conditions
      const fullRevisionActive = await page.evaluate(() => {
        return (window as any).fullRevisionActive;
      });
      const targetVocabularyLength = await page.evaluate(() => {
        return (window as any).targetVocabulary?.length || 0;
      });
      
      console.log('🔍 [Playwright] Debug - fullRevisionActive:', fullRevisionActive);
      console.log('🔍 [Playwright] Debug - targetVocabulary.length:', targetVocabularyLength);
      
      // Je pourrais ici modifier le template HTML directement
    } else {
      console.log('✅ [Playwright] Carte vocabulaire visible');
    }

    // 9. Vérifier le contenu
    const wordCount = await vocabularyCard.locator('.word-chip').count();
    const noteText = await vocabularyCard.locator('ion-note').textContent();
    
    console.log('🔍 [Playwright] Nombre de mots affichés:', wordCount);
    console.log('🔍 [Playwright] Texte du compteur:', noteText);
    
    if (wordCount === 0) {
      console.error('❌ [Playwright] PROBLÈME DÉTECTÉ: 0 mots affichés!');
    } else {
      console.log('✅ [Playwright] Mots correctement affichés');
    }

    // 10. Capturer un screenshot pour analyse
    await page.screenshot({ path: 'test-results/vocabulary-sync-debug.png' });
    console.log('📸 [Playwright] Screenshot sauvegardé pour analyse');

    // 11. Vérifications finales
    await expect(vocabularyCard).toBeVisible();
    await expect(vocabularyCard.locator('.word-chip')).toHaveCount(3);
    await expect(vocabularyCard.locator('ion-note')).toContainText('3 mot(s) enregistrés');
  });

  test('Devrait tester différents scénarios de navigation', async ({ page }) => {
    // Test de différents chemins de navigation
    const scenarios = [
      { path: 'Mode d\'entrainement → Révision → Dictionnaire personnel' },
      { path: 'Mode d\'entrainement → Révision → Catégorie existante' },
      { path: 'Mode d\'entrainement → Conversation directe' }
    ];

    for (const scenario of scenarios) {
      console.log(`🔍 [Playwright] Test du scénario: ${scenario.path}`);
      
      await page.goto('/');
      
      // Implémentation du scénario...
      // Je pourrais ici tester chaque chemin et détecter les problèmes
    }
  });
});
