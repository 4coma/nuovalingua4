import { test, expect } from '@playwright/test';

test.describe('Debug vocabulaire cible dans révision', () => {
  test('Flow complet révision -> conversation', async ({ page }) => {
    // Activer les logs de console
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    // Aller sur la page
    await page.goto('http://localhost:8100');
    await page.waitForLoadState('networkidle');
    
    console.log('\n=== STEP 1: Navigation vers Mode d\'entraînement ===');
    await page.click('text=Mode d\'entraînement');
    await page.waitForTimeout(1000);
    
    console.log('\n=== STEP 2: Clic sur Réviser ===');
    await page.click('text=Réviser');
    await page.waitForTimeout(1000);
    
    // Prendre une capture d'écran
    await page.screenshot({ path: 'test-results/step2-reviser.png' });
    
    console.log('\n=== STEP 3: Vérification des mots disponibles ===');
    const wordsText = await page.textContent('.ion-page:not(.ion-page-hidden)');
    console.log('Contenu de la page:', wordsText?.substring(0, 500));
    
    // Attendre que des mots soient chargés
    await page.waitForTimeout(2000);
    
    console.log('\n=== STEP 4: Clic sur Lancer la révision ===');
    const launchButton = page.locator('ion-button:has-text("Lancer la révision")');
    await launchButton.waitFor({ state: 'visible', timeout: 5000 });
    await launchButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/step4-after-launch.png' });
    
    console.log('\n=== STEP 5: Vérification du vocabulaire cible ===');
    // Injecter du code pour récupérer les données du localStorage et du service
    const debugInfo = await page.evaluate(() => {
      const localStorage = window.localStorage;
      const conversationVocab = localStorage.getItem('conversationTargetVocabulary');
      const personalDict = localStorage.getItem('personalDictionary');
      
      return {
        conversationVocab: conversationVocab ? JSON.parse(conversationVocab) : null,
        personalDictCount: personalDict ? JSON.parse(personalDict).length : 0,
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('\n=== DEBUG INFO après lancement révision ===');
    console.log('Vocabulaire conversation:', JSON.stringify(debugInfo.conversationVocab, null, 2));
    console.log('Nombre mots dictionnaire personnel:', debugInfo.personalDictCount);
    console.log('Clés localStorage:', debugInfo.allKeys);
    
    console.log('\n=== STEP 6: Clic sur Passer à la conversation ===');
    const conversationButton = page.locator('ion-button:has-text("Passer à la conversation")');
    await conversationButton.waitFor({ state: 'visible', timeout: 5000 });
    await conversationButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/step6-conversation.png' });
    
    console.log('\n=== STEP 7: Vérification finale du vocabulaire cible dans conversation ===');
    const finalDebugInfo = await page.evaluate(() => {
      const localStorage = window.localStorage;
      const conversationVocab = localStorage.getItem('conversationTargetVocabulary');
      
      return {
        conversationVocab: conversationVocab ? JSON.parse(conversationVocab) : null,
        pageContent: document.querySelector('.ion-page:not(.ion-page-hidden)')?.textContent || ''
      };
    });
    
    console.log('\n=== DEBUG INFO dans conversation ===');
    console.log('Vocabulaire conversation:', JSON.stringify(finalDebugInfo.conversationVocab, null, 2));
    
    // Chercher le texte "Tes mots"
    const vocabulaireSection = await page.textContent('text=Tes mots');
    console.log('Section Tes mots:', vocabulaireSection);
    
    // Prendre une capture finale
    await page.screenshot({ path: 'test-results/step7-final.png' });
    
    console.log('\n=== TEST TERMINÉ ===');
  });
});

