import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController, ToastController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { PersonalDictionaryService } from '../services/personal-dictionary.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class HomePage {
  pageTitle: string = 'Accueil';

  constructor(
    private router: Router,
    private menuController: MenuController,
    private personalDictionaryService: PersonalDictionaryService,
    private storageService: StorageService,
    private toastController: ToastController
  ) {}

  onDiscussionClick() {
    console.log('🔍 HomePage - Bouton Discussion cliqué');
  }

  startSpacedRepetition() {
    this.router.navigate(['/spaced-repetition']);
  }

  async startPersonalWordsRevision() {
    try {
      // Récupérer les mots disponibles pour la révision (filtrés par minRevisionDate)
      const availableWords = this.personalDictionaryService.getAvailableWordsForRevision();
      
      if (availableWords.length === 0) {
        const toast = await this.toastController.create({
          message: 'Aucun mot disponible pour la révision à ce moment. Vérifiez les dates de révision de vos mots !',
          duration: 3000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
        return;
      }

      // Récupérer le nombre de mots configuré dans les préférences
      const savedCount = this.storageService.get('personalDictionaryWordsCount');
      const maxWords = savedCount ? parseInt(savedCount) : 8; // Valeur par défaut si pas configurée
      
      // Sélectionner aléatoirement des mots (entre 3 et 20, ou tous si moins de 3)
      const actualMaxWords = Math.min(20, Math.max(3, Math.min(maxWords, availableWords.length)));
      const selectedWords = this.shuffleArray(availableWords).slice(0, actualMaxWords);

      // Créer les paires de mots pour l'exercice d'association
      const wordPairs = selectedWords.map(word => ({
        it: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
        fr: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
        context: word.contextualMeaning
      }));

      // Créer la liste des mots révisés pour l'affichage
      const revisedWords = selectedWords.map(word => ({
        id: word.id,
        sourceWord: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
        targetWord: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
        context: word.contextualMeaning,
        revisionDelay: undefined, // Sera défini par l'utilisateur
        isKnown: word.isKnown || false // Récupérer le statut existant ou false par défaut
      }));

      console.log('🔍 [HomePage] Mots révisés créés:', revisedWords.length);
      console.log('🔍 [HomePage] Détail des mots révisés:', revisedWords);

      // Sauvegarder les données de session
      const sessionInfo = {
        category: 'Dictionnaire personnel',
        topic: 'Révision personnalisée',
        date: new Date().toISOString(),
        translationDirection: 'fr2it' as const
      };

      // Sauvegarder dans le localStorage
      this.storageService.set('sessionInfo', sessionInfo);
      this.storageService.set('wordPairs', wordPairs);
      this.storageService.set('isPersonalDictionaryRevision', true);
      this.storageService.set('revisedWords', revisedWords);

      console.log('🔍 [HomePage] Données sauvegardées dans le localStorage:');
      console.log('🔍 [HomePage] sessionInfo:', sessionInfo);
      console.log('🔍 [HomePage] wordPairs.length:', wordPairs.length);
      console.log('🔍 [HomePage] isPersonalDictionaryRevision: true');
      console.log('🔍 [HomePage] revisedWords.length:', revisedWords.length);

      // Naviguer vers l'exercice d'association
      this.router.navigate(['/word-pairs-game']);

    } catch (error) {
      console.error('Erreur lors du démarrage de la révision personnalisée:', error);
      const toast = await this.toastController.create({
        message: 'Erreur lors du démarrage de la révision',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * Mélange un tableau d'éléments
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async forceOpenMenu() {
    try {
      console.log('Forcing menu to open from home page...');
      await this.menuController.enable(true);
      await this.menuController.open();
      console.log('Menu forced open successfully');
    } catch (error) {
      console.error('Error forcing menu open:', error);
    }
  }
}
