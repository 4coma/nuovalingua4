import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController, ToastController, ModalController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { PersonalDictionaryService, DictionaryWord } from '../services/personal-dictionary.service';
import { StorageService } from '../services/storage.service';
import { SM2AlgorithmService } from '../services/sm2-algorithm.service';
import { WordMastery } from '../services/vocabulary-tracking.service';
import { FocusModeService } from '../services/focus-mode.service';
import { FocusModalComponent } from '../components/focus-modal/focus-modal.component';

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
  currentFocus: string | null = null;

  constructor(
    private router: Router,
    private menuController: MenuController,
    private personalDictionaryService: PersonalDictionaryService,
    private storageService: StorageService,
    private sm2Service: SM2AlgorithmService,
    private toastController: ToastController,
    private focusModeService: FocusModeService,
    private modalController: ModalController
  ) {
    this.loadCurrentFocus();
  }

  /**
   * Charge le focus actuel depuis le stockage
   */
  private loadCurrentFocus() {
    this.currentFocus = this.focusModeService.getCurrentFocus();
  }

  /**
   * Ouvre le modal pour définir un focus
   */
  async openFocusModal() {
    const modal = await this.modalController.create({
      component: FocusModalComponent,
      componentProps: {},
      cssClass: 'focus-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.focus) {
      this.focusModeService.setCurrentFocus(data.focus);
      this.currentFocus = data.focus;
      
      const toast = await this.toastController.create({
        message: `Focus défini : ${data.focus}`,
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    }
  }

  /**
   * Démarre une session de révision avec le focus actuel
   */
  async startFocusRevision() {
    if (!this.currentFocus) {
      return;
    }

    try {
      // Mettre à jour la date de dernière utilisation
      this.focusModeService.updateLastUsed();

      // Créer une session avec le focus comme consigne personnalisée
      const sessionInfo = {
        category: 'Focus Mode',
        topic: this.currentFocus,
        date: new Date().toISOString(),
        translationDirection: 'fr2it' as const,
        customInstruction: this.currentFocus
      };

      // Sauvegarder dans le localStorage avec le flag isFocusMode
      this.storageService.set('sessionInfo', sessionInfo);
      this.storageService.set('isFocusMode', true);
      this.storageService.set('focusInstruction', this.currentFocus);
      this.storageService.set('fromFocusButton', true); // Flag spécifique pour indiquer qu'on vient du bouton focus

      // Naviguer vers la sélection de catégorie (qui sera adaptée pour le focus)
      this.router.navigate(['/category']);

    } catch (error) {
      console.error('Erreur lors du démarrage de la révision focus:', error);
      const toast = await this.toastController.create({
        message: 'Erreur lors du démarrage de la révision focus',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

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
      
      // Convertir les mots du dictionnaire en WordMastery pour utiliser l'algorithme SM-2
      const wordMasteryList = this.convertDictionaryWordsToWordMastery(availableWords);
      
      // Utiliser l'algorithme SM-2 pour trier par priorité de révision
      const sortedWords = this.sm2Service.sortWordsByPriority(wordMasteryList);
      
      // Sélectionner les mots les plus prioritaires (entre 3 et 20, ou tous si moins de 3)
      const actualMaxWords = Math.min(20, Math.max(3, Math.min(maxWords, sortedWords.length)));
      const selectedWordMastery = sortedWords.slice(0, actualMaxWords);
      
      // Convertir back en DictionaryWord pour la suite du processus
      const selectedWords = this.convertWordMasteryToDictionaryWords(selectedWordMastery, availableWords);

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
   * Convertit les mots du dictionnaire personnel en WordMastery pour utiliser l'algorithme SM-2
   */
  private convertDictionaryWordsToWordMastery(dictionaryWords: DictionaryWord[]): WordMastery[] {
    return dictionaryWords.map(word => {
      // Récupérer les données de suivi existantes pour ce mot
      const trackedWords = this.personalDictionaryService.getTrackedWordsForDictionaryWord(word.id);
      
      if (trackedWords.length > 0) {
        // Utiliser les données de suivi existantes
        return trackedWords[0];
      } else {
        // Créer un nouveau WordMastery avec des valeurs par défaut
        return {
          id: word.id,
          word: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
          translation: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
          category: 'Dictionnaire personnel',
          topic: 'Révision personnalisée',
          repetitions: 0,
          eFactor: 2.5,
          interval: 0,
          nextReview: word.minRevisionDate || Date.now(), // Utiliser minRevisionDate si disponible
          lastReviewed: word.dateAdded,
          masteryLevel: 0,
          timesReviewed: 0,
          timesCorrect: 0
        };
      }
    });
  }

  /**
   * Convertit les WordMastery triés back en DictionaryWord pour la suite du processus
   */
  private convertWordMasteryToDictionaryWords(wordMasteryList: WordMastery[], originalWords: DictionaryWord[]): DictionaryWord[] {
    return wordMasteryList.map(wordMastery => {
      // Trouver le mot original correspondant
      return originalWords.find(originalWord => {
        const originalWordText = originalWord.sourceLang === 'it' ? originalWord.sourceWord : originalWord.targetWord;
        const originalTranslation = originalWord.sourceLang === 'fr' ? originalWord.sourceWord : originalWord.targetWord;
        
        return (originalWordText === wordMastery.word && originalTranslation === wordMastery.translation) ||
               (originalWordText === wordMastery.translation && originalTranslation === wordMastery.word);
      })!;
    }).filter(word => word !== undefined);
  }

  /**
   * Mélange un tableau d'éléments (conservé pour compatibilité)
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
