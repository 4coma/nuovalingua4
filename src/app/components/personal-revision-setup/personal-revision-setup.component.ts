import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { StorageService } from '../../services/storage.service';

interface RevisedWord {
  id: string;
  sourceWord: string;
  targetWord: string;
  context?: string;
  revisionDelay?: number;
  isKnown: boolean;
}

@Component({
  selector: 'app-personal-revision-setup',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule],
  templateUrl: './personal-revision-setup.component.html',
  styleUrls: ['./personal-revision-setup.component.scss']
})
export class PersonalRevisionSetupComponent implements OnInit {
  wordCount = 8;
  minWordCount = 3;
  maxWordCount = 20;
  availableThemes: string[] = [];
  selectedThemes: string[] = [];
  totalAvailableWords = 0;
  wordsMatchingSelection = 0;
  isStarting = false;
  
  // Propriétés pour la recherche avec autocomplétion
  themeInput = '';
  filteredThemes: string[] = [];
  showAutocomplete = false;

  constructor(
    private personalDictionary: PersonalDictionaryService,
    private router: Router,
    private toastController: ToastController,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loadThemes();
    this.countWords();
    this.loadPreselectedTheme();
  }

  private loadThemes(): void {
    const words = this.personalDictionary.getAllWords();
    const uniqueThemes = new Set<string>();

    words.forEach(word => {
      if (word.themes) {
        word.themes.forEach(theme => uniqueThemes.add(theme));
      }
    });

    this.availableThemes = Array.from(uniqueThemes).sort((a, b) => a.localeCompare(b));
  }

  private countWords(): void {
    const allWords = this.personalDictionary.getAllWords();
    this.totalAvailableWords = allWords.length;
    const filtered = this.filterWords(allWords);
    this.wordsMatchingSelection = filtered.length;
  }

  private loadPreselectedTheme(): void {
    const preselectedTheme = localStorage.getItem('preselectedTheme');
    if (preselectedTheme && this.availableThemes.includes(preselectedTheme)) {
      // Ajouter le thème présélectionné aux thèmes sélectionnés
      if (!this.selectedThemes.includes(preselectedTheme)) {
        this.selectedThemes.push(preselectedTheme);
        this.countWords(); // Recalculer les mots disponibles
      }
      
      // Nettoyer le localStorage après utilisation
      localStorage.removeItem('preselectedTheme');
    }
  }

  toggleTheme(theme: string): void {
    if (this.selectedThemes.includes(theme)) {
      this.selectedThemes = this.selectedThemes.filter(t => t !== theme);
    } else {
      this.selectedThemes = [...this.selectedThemes, theme];
    }
    this.countWords();
  }

  isThemeSelected(theme: string): boolean {
    return this.selectedThemes.includes(theme);
  }

  private filterWords(words: DictionaryWord[]): DictionaryWord[] {
    if (this.selectedThemes.length === 0) {
      return words;
    }

    return words.filter(word => {
      if (!word.themes || word.themes.length === 0) {
        return false;
      }
      return this.selectedThemes.some(selected =>
        word.themes!.some(wordTheme => wordTheme.toLowerCase() === selected.toLowerCase())
      );
    });
  }

  async startPersonalRevision(): Promise<void> {
    if (this.isStarting) {
      return;
    }

    const allWords = this.personalDictionary.getAllWords();
    if (allWords.length === 0) {
      await this.presentToast('Votre dictionnaire est vide. Ajoutez des mots pour commencer.', 'warning');
      return;
    }

    const filteredWords = this.filterWords(allWords);
    if (filteredWords.length === 0) {
      await this.presentToast('Aucun mot ne correspond aux thèmes sélectionnés.', 'warning');
      return;
    }

    const requestedCount = Number(this.wordCount);
    const sanitizedCount = Math.max(
      this.minWordCount,
      Math.min(isNaN(requestedCount) ? this.minWordCount : requestedCount, this.maxWordCount)
    );
    this.wordCount = sanitizedCount;

    if (filteredWords.length < sanitizedCount) {
      await this.presentToast(`Seulement ${filteredWords.length} mots disponibles pour cette sélection.`, 'warning');
      return;
    }

    this.isStarting = true;

    try {
      // Mélanger aléatoirement les mots filtrés
      const shuffledWords = [...filteredWords].sort(() => Math.random() - 0.5);
      
      // Sélectionner les N premiers mots après mélange
      const selectedWords = shuffledWords.slice(0, sanitizedCount);

      // Créer les paires de mots pour l'exercice d'association
      const wordPairs = selectedWords.map(word => ({
        it: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
        fr: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
        context: word.contextualMeaning
      }));

      // Créer la liste des mots révisés pour l'affichage
      const revisedWords: RevisedWord[] = selectedWords.map(word => ({
        id: word.id,
        sourceWord: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
        targetWord: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
        context: word.contextualMeaning,
        revisionDelay: undefined,
        isKnown: word.isKnown || false
      }));

      // Sauvegarder les données de session
      const sessionInfo = {
        category: 'Dictionnaire personnel',
        topic: this.selectedThemes.length > 0 ? this.selectedThemes.join(', ') : 'Révision personnalisée',
        date: new Date().toISOString(),
        translationDirection: 'fr2it' as const
      };

      // Sauvegarder dans le localStorage
      this.storageService.set('sessionInfo', sessionInfo);
      this.storageService.set('wordPairs', wordPairs);
      this.storageService.set('isPersonalDictionaryRevision', true);
      this.storageService.set('revisedWords', revisedWords);

      // Sauvegarder le nombre de mots configuré
      this.storageService.set('personalDictionaryWordsCount', sanitizedCount.toString());


      // Naviguer vers l'exercice d'association
      this.router.navigate(['/word-pairs-game']);
    } catch (error) {
      console.error('Erreur lors du démarrage de la révision personnalisée:', error);
      await this.presentToast('Impossible de démarrer la révision.', 'danger');
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Gère la saisie dans le champ de thèmes
   */
  onThemeInputChange(event: any) {
    const value = event.detail.value;
    this.themeInput = value;
    
    if (value.length > 0) {
      // Filtrer les thèmes disponibles
      this.filteredThemes = this.availableThemes.filter(theme => 
        theme.toLowerCase().includes(value.toLowerCase()) &&
        !this.selectedThemes.includes(theme)
      );
      this.showAutocomplete = true;
    } else {
      this.filteredThemes = [];
      this.showAutocomplete = false;
    }
  }

  /**
   * Sélectionne un thème depuis l'autocomplete
   */
  selectTheme(theme: string) {
    if (!this.selectedThemes.includes(theme)) {
      this.selectedThemes.push(theme);
      this.themeInput = '';
      this.showAutocomplete = false;
      this.countWords();
    }
  }

  /**
   * Supprime un thème sélectionné
   */
  removeTheme(theme: string) {
    this.selectedThemes = this.selectedThemes.filter(t => t !== theme);
    this.countWords();
  }

  /**
   * Masque l'autocomplete
   */
  hideAutocomplete() {
    setTimeout(() => {
      this.showAutocomplete = false;
    }, 200);
  }

  private async presentToast(message: string, color: 'primary' | 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}

