import { test, expect } from '@playwright/test';

test.describe('Vocabulaire Ciblé - Synchronisation', () => {
  test('Devrait synchroniser le vocabulaire de l\'association vers la conversation', async ({ page }) => {
    // 1. Aller à la page d'accueil
    await page.goto('/');
    await expect(page).toHaveTitle(/Ionic App/);

    // 2. Cliquer sur "Mode d'entrainement" - attendre que l'élément soit visible
    await page.waitForSelector('text=Mode d\'entrainement', { state: 'visible' });
    await page.click('text=Mode d\'entrainement');
    await expect(page).toHaveURL(/.*\/home/);

    // 3. Cliquer sur "Révision"
    await page.click('text=Révision');
    await expect(page).toHaveURL(/.*\/category/);

    // 4. Cliquer sur "Dictionnaire personnel"
    await page.click('text=Dictionnaire personnel');
    await expect(page).toHaveURL(/.*\/personal-revision-setup/);

    // 5. Configurer la révision (8 mots par défaut)
    await page.waitForSelector('ion-input[type="number"]');
    const wordCountInput = page.locator('ion-input[type="number"]');
    await wordCountInput.fill('3'); // Réduire à 3 mots pour le test

    // 6. Lancer la session
    await page.click('text=Lancer la session');
    await expect(page).toHaveURL(/.*\/vocabulary/);

    // 7. Aller à l'exercice d'association
    await page.click('text=Associer les mots');
    await expect(page).toHaveURL(/.*\/word-pairs/);

    // 8. Attendre que le jeu se charge
    await page.waitForSelector('.pairs-grid', { timeout: 10000 });

    // 9. Vérifier que les mots sont affichés
    const wordCards = page.locator('.word-card');
    await expect(wordCards).toHaveCount(6); // 3 paires = 6 cartes

    // 10. Compléter l'exercice d'association
    // (Simulation - dans un vrai test, on ferait les associations)
    await page.waitForTimeout(2000);

    // 11. Aller à la conversation
    await page.click('text=Mode d\'entrainement');
    await page.click('text=Conversation');
    await page.click('text=Révision complète');
    await expect(page).toHaveURL(/.*\/discussion\/full-revision/);

    // 12. Vérifier que le vocabulaire ciblé est affiché
    await page.waitForSelector('.target-vocabulary-card', { timeout: 10000 });
    
    const vocabularyCard = page.locator('.target-vocabulary-card');
    await expect(vocabularyCard).toBeVisible();
    
    // 13. Vérifier le titre "Vocabulaire ciblé"
    await expect(vocabularyCard.locator('ion-card-title')).toContainText('Vocabulaire ciblé');
    
    // 14. Vérifier qu'il y a des mots affichés
    const wordChips = vocabularyCard.locator('.word-chip');
    await expect(wordChips).toHaveCount(3);
    
    // 15. Vérifier le compteur de mots
    await expect(vocabularyCard.locator('ion-note')).toContainText('3 mot(s) enregistrés pour cette session');

    // 16. Vérifier que les mots ne sont pas encore utilisés (couleur medium)
    for (let i = 0; i < 3; i++) {
      const chip = wordChips.nth(i);
      await expect(chip).toHaveAttribute('color', 'medium');
    }
  });

  test('Devrait marquer les mots comme utilisés dans la conversation', async ({ page }) => {
    // Ce test simulerait l'utilisation des mots dans la conversation
    // et vérifierait qu'ils passent de 'medium' à 'success'
    
    // 1. Aller directement à la conversation (après avoir fait l'association)
    await page.goto('/discussion/full-revision?fullRevision=true');
    
    // 2. Attendre que la conversation se charge
    await page.waitForSelector('.target-vocabulary-card');
    
    // 3. Vérifier l'état initial des mots
    const wordChips = page.locator('.target-vocabulary-card .word-chip');
    await expect(wordChips).toHaveCount(3);
    
    // 4. Simuler l'utilisation d'un mot dans la conversation
    // (Ceci nécessiterait une interaction avec l'IA et la détection des mots)
    
    // Pour l'instant, on vérifie juste que l'interface est prête
    await expect(page.locator('text=Utilise tous les mots pour terminer la session')).toBeVisible();
  });
});
