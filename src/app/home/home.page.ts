import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController, ToastController, ModalController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonalDictionaryService, DictionaryWord } from '../services/personal-dictionary.service';
import { StorageService } from '../services/storage.service';
import { SM2AlgorithmService } from '../services/sm2-algorithm.service';
import { WordMastery } from '../services/vocabulary-tracking.service';

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
export class HomePage implements OnInit, OnDestroy {
  pageTitle: string = 'Accueil';
  
  // Subscription pour le BehaviorSubject
  private dictionarySubscription?: Subscription;

  constructor(
    private router: Router,
    private menuController: MenuController,
    private personalDictionaryService: PersonalDictionaryService,
    private storageService: StorageService,
    private sm2Service: SM2AlgorithmService,
    private toastController: ToastController
  ) {
  }

  ngOnInit() {
    // S'abonner aux changements du dictionnaire pour mettre à jour les statistiques
    this.dictionarySubscription = this.personalDictionaryService.dictionaryWords$.subscribe(() => {
      // Les statistiques peuvent être mises à jour ici si nécessaire
      console.log('Dictionnaire mis à jour - statistiques actualisées');
    });
  }

  ngOnDestroy() {
    // Nettoyer la subscription
    if (this.dictionarySubscription) {
      this.dictionarySubscription.unsubscribe();
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
      // Récupérer TOUS les mots du dictionnaire personnel
      const allWords = this.personalDictionaryService.getAllWords();
      
      if (allWords.length === 0) {
        const toast = await this.toastController.create({
          message: 'Votre dictionnaire est vide. Ajoutez des mots pour commencer !',
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
      
      // Sélection ALÉATOIRE des mots (entre 3 et 20, ou tous si moins de 3)
      const actualMaxWords = Math.min(20, Math.max(3, Math.min(maxWords, allWords.length)));
      
      // Mélanger aléatoirement tous les mots
      const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);
      
      // Sélectionner les N premiers mots après mélange
      const selectedWords = shuffledWords.slice(0, actualMaxWords);

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
   * Méthodes de conversion SM-2 supprimées : la révision est maintenant purement aléatoire
   */

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
