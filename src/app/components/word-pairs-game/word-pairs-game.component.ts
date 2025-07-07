import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { WordPair, TranslationDirection, LlmService } from '../../services/llm.service';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';
import { FilterPipe } from '../../pipes/filter.pipe';
import { FormsModule } from '@angular/forms';
import { TextGeneratorService } from '../../services/text-generator.service';
import { ComprehensionText } from '../../models/vocabulary';
import { ThemeSelectionModalComponent } from '../theme-selection-modal/theme-selection-modal.component';

interface GamePair {
  id: number;
  word: string;
  isSource: boolean;
  isSelected: boolean;
  isMatched: boolean;
}

@Component({
  selector: 'app-word-pairs-game',
  templateUrl: './word-pairs-game.component.html',
  styleUrls: ['./word-pairs-game.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FilterPipe,
    FormsModule
  ]
})
export class WordPairsGameComponent implements OnInit {
  pageTitle: string = 'Associer les mots';
  
  // Pour le jeu
  wordPairs: WordPair[] = [];
  currentPairs: GamePair[] = [];
  currentPairsSet: number = 1; // Première ou deuxième moitié (1 ou 2)
  gameComplete: boolean = false;
  
  selectedPair: GamePair | null = null;
  selectedWordId: number | null = null;
  errorShown: boolean = false;
  isGenerating: boolean = false; // Pour la génération de textes de compréhension
  
  // Info de la session
  sessionInfo: { 
    category: string; 
    topic: string; 
    date: string;
    translationDirection: TranslationDirection; 
  } | null = null;
  
  // Statistiques
  matchedPairs: number = 0;
  totalPairs: number = 0;
  attempts: number = 0;
  
  constructor(
    private router: Router,
    private vocabularyTrackingService: VocabularyTrackingService,
    private toastController: ToastController,
    private llmService: LlmService,
    private textGeneratorService: TextGeneratorService,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.loadSessionData();
  }
  
  /**
   * Charge les données de la session depuis le localStorage
   */
  loadSessionData() {
    const wordPairsJson = localStorage.getItem('wordPairs');
    const sessionInfoJson = localStorage.getItem('sessionInfo');
    
    if (wordPairsJson && sessionInfoJson) {
      try {
        this.wordPairs = JSON.parse(wordPairsJson);
        this.sessionInfo = JSON.parse(sessionInfoJson);
        
        // Préparer le jeu
        this.totalPairs = this.wordPairs.length;
        this.setupCurrentGameRound();
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        this.showToast('Erreur lors du chargement des données de session');
        this.router.navigate(['/category']);
      }
    } else {
      // Rediriger vers la sélection de catégorie si aucune donnée n'est trouvée
      this.showToast('Aucune donnée de session disponible');
      this.router.navigate(['/category']);
    }
  }
  
  /**
   * Prépare un round du jeu avec 6 paires
   */
  setupCurrentGameRound() {
    // Début (0) ou milieu (6) de la liste selon le set
    const startIndex = (this.currentPairsSet - 1) * 6;
    // Récupérer 6 paires ou moins si pas assez
    const endIndex = Math.min(startIndex + 6, this.wordPairs.length);
    const pairsForRound = this.wordPairs.slice(startIndex, endIndex);
    
    // Si pas de paires, le jeu est terminé
    if (pairsForRound.length === 0) {
      this.gameComplete = true;
      return;
    }
    
    this.currentPairs = [];
    
    // Créer les objets de jeu pour les mots source et cible
    pairsForRound.forEach((pair, index) => {
      const wordId = startIndex + index;
      const direction = this.sessionInfo?.translationDirection || 'fr2it';
      
      // Déterminer les mots source et cible selon la direction
      const sourceWord = direction === 'fr2it' ? pair.fr : pair.it;
      const targetWord = direction === 'fr2it' ? pair.it : pair.fr;
      
      // Ajouter le mot source
      this.currentPairs.push({
        id: wordId,
        word: sourceWord,
        isSource: true,
        isSelected: false,
        isMatched: false
      });
      
      // Ajouter le mot cible
      this.currentPairs.push({
        id: wordId,
        word: targetWord,
        isSource: false,
        isSelected: false,
        isMatched: false
      });
    });
    
    // Mélanger uniquement les mots cible
    this.shuffleTargetWords();
  }
  
  /**
   * Mélange les mots cible dans le tableau des paires actuelles
   */
  shuffleTargetWords() {
    // Séparer les mots source et cible
    const sourceWords = this.currentPairs.filter(pair => pair.isSource);
    let targetWords = this.currentPairs.filter(pair => !pair.isSource);
    
    // Mélanger les mots cible
    for (let i = targetWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targetWords[i], targetWords[j]] = [targetWords[j], targetWords[i]];
    }
    
    // Recombiner les mots source et cible
    this.currentPairs = [...sourceWords, ...targetWords];
  }
  
  /**
   * Gère la sélection d'un mot
   */
  selectWord(pair: GamePair) {
    // Si la paire est déjà associée, ne rien faire
    if (pair.isMatched) return;
    
    // Si erreur actuellement affichée, ne rien faire
    if (this.errorShown) return;
    
    // Si c'est le premier mot sélectionné
    if (!this.selectedPair) {
      this.selectedPair = pair;
      pair.isSelected = true;
      return;
    }
    
    // Si on clique sur le même mot, le désélectionner
    if (this.selectedPair === pair) {
      if (this.selectedPair) {
        this.selectedPair.isSelected = false;
      }
      this.selectedPair = null;
      return;
    }
    
    this.attempts++;
    
    // Vérifier si les deux mots forment une paire
    if (this.selectedPair && this.selectedPair.id === pair.id) {
      // Match trouvé
      this.selectedPair.isMatched = true;
      pair.isMatched = true;
      
      // Tracker ce mot comme réussi
      if (this.selectedPair) {
        this.trackWordMatch(this.selectedPair.id, true);
      }
      
      this.matchedPairs++;
      
      // Réinitialiser la sélection
      this.selectedPair.isSelected = false;
      this.selectedPair = null;
      
      // Si toutes les paires sont trouvées, passer au set suivant ou terminer
      if (this.matchedPairs === this.currentPairs.length / 2) {
        if (this.currentPairsSet === 1 && this.wordPairs.length > 6) {
          // Passer au deuxième set si plus de 6 paires
          setTimeout(() => {
            this.currentPairsSet = 2;
            this.matchedPairs = 0;
            this.setupCurrentGameRound();
          }, 1000);
        } else {
          // Terminer le jeu
          this.gameComplete = true;
        }
      }
    } else {
      // Erreur
      pair.isSelected = true;
      this.errorShown = true;
      
      // Tracker ce mot comme raté
      if (this.selectedPair) {
        this.trackWordMatch(this.selectedPair.id, false);
      }
      
      // Réinitialiser après un court délai
      setTimeout(() => {
        if (this.selectedPair) {
          this.selectedPair.isSelected = false;
        }
        pair.isSelected = false;
        this.selectedPair = null;
        this.errorShown = false;
      }, 1000);
    }
  }
  
  /**
   * Suit les performances de l'utilisateur sur un mot
   */
  trackWordMatch(wordId: number, isCorrect: boolean) {
    if (!this.sessionInfo) return;
    
    const pair = this.wordPairs[wordId];
    
    if (pair) {
      this.vocabularyTrackingService.trackWord(
        pair.it,
        pair.fr,
        this.sessionInfo.category,
        this.sessionInfo.topic,
        isCorrect,
        pair.context
      );
    }
  }
  
  /**
   * Navigue vers l'exercice de vocabulaire
   */
  goToVocabularyExercise() {
    // Créer un exercice de vocabulaire à partir des paires de mots
    const direction = this.sessionInfo?.translationDirection || 'fr2it';
    
    // Pour le vocabulaire/encodage, on veut que l'utilisateur traduise dans la direction OPPOSÉE
    // à celle utilisée dans l'association
    const vocabularyExercise = {
      items: this.wordPairs.map(pair => {
        // Inverser la direction pour l'exercice d'encodage
        // Si mode fr2it en association, utiliser it2fr pour l'encodage
        return {
          word: direction === 'fr2it' ? pair.it : pair.fr,
          translation: direction === 'fr2it' ? pair.fr : pair.it,
          context: pair.context
        };
      }),
      type: 'vocabulary',
      topic: this.sessionInfo?.topic || 'Vocabulaire'
    };
    
    // Stocker l'exercice dans le localStorage
    localStorage.setItem('vocabularyExercise', JSON.stringify(vocabularyExercise));
    
    // Naviguer vers l'exercice de vocabulaire
    this.router.navigate(['/vocabulary']);
  }
  
  /**
   * Génère un texte de compréhension écrite
   */
  async generateWrittenComprehension() {
    // Demander à l'utilisateur s'il veut préciser des thèmes
    const modal = await this.modalController.create({
      component: ThemeSelectionModalComponent,
      cssClass: 'theme-selection-modal'
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    const selectedThemes = data?.themes || [];
    
    // Convertir les WordPair en VocabularyItem pour être compatible avec l'interface existante
    const vocabularyItems = this.wordPairs.map(pair => ({
      word: pair.it,
      translation: pair.fr,
      context: pair.context
    }));
    
    this.isGenerating = true;
    
    // Générer le texte de compréhension via le service avec les thèmes sélectionnés
    this.textGeneratorService.generateComprehensionText(this.wordPairs, 'written', selectedThemes).subscribe({
      next: (result: ComprehensionText) => {
        // Stocker le texte dans le localStorage pour y accéder depuis le composant de compréhension
        localStorage.setItem('comprehensionText', JSON.stringify(result));
        
        // Mettre à jour le sessionInfo dans le localStorage pour la sauvegarde
        if (this.sessionInfo) {
          const sessionInfoWithThemes = {
            ...this.sessionInfo,
            themes: selectedThemes
          };
          localStorage.setItem('sessionInfo', JSON.stringify(sessionInfoWithThemes));
        }
        
        this.isGenerating = false;
        
        // Naviguer vers la page de compréhension
        this.router.navigate(['/comprehension']);
      },
      error: (error: any) => {
        console.error('Erreur lors de la génération du texte de compréhension:', error);
        this.isGenerating = false;
        this.showToast('Erreur lors de la génération du texte. Veuillez réessayer.');
      }
    });
  }
  
  /**
   * Génère un texte de compréhension orale
   */
  async generateOralComprehension() {
    // Demander à l'utilisateur s'il veut préciser des thèmes
    const modal = await this.modalController.create({
      component: ThemeSelectionModalComponent,
      cssClass: 'theme-selection-modal'
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    const selectedThemes = data?.themes || [];
    
    // Convertir les WordPair en VocabularyItem pour être compatible avec l'interface existante
    const vocabularyItems = this.wordPairs.map(pair => ({
      word: pair.it,
      translation: pair.fr,
      context: pair.context
    }));
    
    this.isGenerating = true;
    
    // Générer le texte de compréhension via le service avec les thèmes sélectionnés
    this.textGeneratorService.generateComprehensionText(this.wordPairs, 'oral', selectedThemes).subscribe({
      next: (result: ComprehensionText) => {
        // Stocker le texte dans le localStorage pour y accéder depuis le composant de compréhension
        localStorage.setItem('comprehensionText', JSON.stringify(result));
        
        // Mettre à jour le sessionInfo dans le localStorage pour la sauvegarde
        if (this.sessionInfo) {
          const sessionInfoWithThemes = {
            ...this.sessionInfo,
            themes: selectedThemes
          };
          localStorage.setItem('sessionInfo', JSON.stringify(sessionInfoWithThemes));
        }
        
        this.isGenerating = false;
        
        // Naviguer vers la page de compréhension
        this.router.navigate(['/comprehension']);
      },
      error: (error: any) => {
        console.error('Erreur lors de la génération du texte de compréhension:', error);
        this.isGenerating = false;
        this.showToast('Erreur lors de la génération du texte. Veuillez réessayer.');
      }
    });
  }
  
  /**
   * Affiche un toast d'information
   */
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
  
  /**
   * Retourne une classe CSS en fonction de l'état de la paire
   */
  getCardClass(pair: GamePair): string {
    if (pair.isMatched) return 'matched';
    if (pair.isSelected) return 'selected';
    if (this.errorShown && this.selectedPair && pair.id === this.selectedPair.id) return 'error';
    return '';
  }
} 