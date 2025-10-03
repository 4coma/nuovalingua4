import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { FullRevisionService } from '../../services/full-revision.service';
import { StorageService } from '../../services/storage.service';
import { TranslationDirection } from '../../services/llm.service';

interface PreparedWord {
  id: string;
  it: string;
  fr: string;
  context?: string;
  themes?: string[];
}

@Component({
  selector: 'app-full-revision-setup',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule],
  templateUrl: './full-revision-setup.component.html',
  styleUrls: ['./full-revision-setup.component.scss']
})
export class FullRevisionSetupComponent implements OnInit {
  wordCount = 8;
  minWordCount = 4;
  maxWordCount = 20;
  translationDirection: TranslationDirection = 'fr2it';
  availableThemes: string[] = [];
  selectedThemes: string[] = [];
  totalAvailableWords = 0;
  wordsMatchingSelection = 0;
  isStarting = false;

  constructor(
    private personalDictionary: PersonalDictionaryService,
    private fullRevisionService: FullRevisionService,
    private router: Router,
    private toastController: ToastController,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loadThemes();
    this.countWords();
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

  private prepareWords(words: DictionaryWord[]): PreparedWord[] {
    return words.map(word => {
      const itWord = word.sourceLang === 'it' ? word.sourceWord : word.targetWord;
      const frWord = word.sourceLang === 'fr' ? word.sourceWord : word.targetWord;
      return {
        id: word.id,
        it: itWord,
        fr: frWord,
        context: word.contextualMeaning,
        themes: word.themes || []
      };
    });
  }

  async startFullRevision(): Promise<void> {
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
      const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, sanitizedCount);
      const prepared = this.prepareWords(selected);

      const session = this.fullRevisionService.startSession({
        words: prepared,
        translationDirection: this.translationDirection,
        themes: this.selectedThemes
      });

      const wordPairs = prepared.map(word => ({
        it: word.it,
        fr: word.fr,
        context: word.context
      }));

      const sessionInfo = {
        category: 'Révision complète',
        topic: this.selectedThemes.length > 0 ? this.selectedThemes.join(', ') : 'Général',
        date: new Date().toISOString(),
        translationDirection: this.translationDirection
      };

      // Préparer l'environnement du composant d'association
      this.storageService.set('wordPairs', wordPairs);
      this.storageService.set('sessionInfo', sessionInfo);
      localStorage.removeItem('isPersonalDictionaryRevision');
      localStorage.removeItem('revisedWords');
      localStorage.setItem('fullRevisionActive', 'true');
      localStorage.setItem('fullRevisionSessionId', session.id);

      this.router.navigate(['/word-pairs-game']);
    } catch (error) {
      console.error('Erreur lors du démarrage de la révision complète:', error);
      await this.presentToast('Impossible de démarrer la révision complète.', 'danger');
    } finally {
      this.isStarting = false;
    }
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
