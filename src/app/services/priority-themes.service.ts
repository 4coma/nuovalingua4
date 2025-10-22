import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PersonalDictionaryService } from './personal-dictionary.service';

export interface PriorityTheme {
  name: string;
  count: number;
  isSelected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PriorityThemesService {
  private storageKey = 'priorityThemes';
  private selectedThemesSubject = new BehaviorSubject<string[]>([]);
  
  public selectedThemes$ = this.selectedThemesSubject.asObservable();

  constructor(private personalDictionaryService: PersonalDictionaryService) {
    this.loadSelectedThemes();
  }

  /**
   * Récupère tous les thèmes disponibles avec leur nombre de mots
   */
  getAllThemes(): PriorityTheme[] {
    const words = this.personalDictionaryService.getAllWords();
    const themeCounts: { [key: string]: number } = {};
    
    // Compter les mots par thème
    words.forEach(word => {
      if (word.themes && word.themes.length > 0) {
        word.themes.forEach(theme => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });

    // Convertir en tableau d'objets PriorityTheme
    const themes: PriorityTheme[] = Object.entries(themeCounts)
      .map(([name, count]) => ({
        name,
        count,
        isSelected: this.isThemeSelected(name)
      }))
      .sort((a, b) => b.count - a.count); // Trier par nombre de mots décroissant

    return themes;
  }

  /**
   * Vérifie si un thème est sélectionné comme prioritaire
   */
  isThemeSelected(themeName: string): boolean {
    const selected = this.selectedThemesSubject.value;
    return selected.includes(themeName);
  }

  /**
   * Ajoute ou retire un thème des thèmes prioritaires
   */
  toggleTheme(themeName: string): void {
    const current = this.selectedThemesSubject.value;
    const isSelected = current.includes(themeName);
    
    if (isSelected) {
      // Retirer le thème
      const updated = current.filter(t => t !== themeName);
      this.selectedThemesSubject.next(updated);
    } else {
      // Ajouter le thème (limiter à 5 thèmes max)
      if (current.length < 5) {
        const updated = [...current, themeName];
        this.selectedThemesSubject.next(updated);
      }
    }
    
    this.saveSelectedThemes();
  }

  /**
   * Obtient la liste des thèmes prioritaires sélectionnés
   */
  getSelectedThemes(): string[] {
    return this.selectedThemesSubject.value;
  }

  /**
   * Obtient les statistiques des thèmes prioritaires
   */
  getPriorityThemesStats(): { name: string; count: number }[] {
    const selected = this.getSelectedThemes();
    const words = this.personalDictionaryService.getAllWords();
    const stats: { name: string; count: number }[] = [];
    
    selected.forEach(themeName => {
      const count = words.filter(word => 
        word.themes && word.themes.includes(themeName)
      ).length;
      
      if (count > 0) {
        stats.push({ name: themeName, count });
      }
    });
    
    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Charge les thèmes sélectionnés depuis le localStorage
   */
  private loadSelectedThemes(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const themes = JSON.parse(stored);
        this.selectedThemesSubject.next(Array.isArray(themes) ? themes : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes prioritaires:', error);
      this.selectedThemesSubject.next([]);
    }
  }

  /**
   * Sauvegarde les thèmes sélectionnés dans le localStorage
   */
  private saveSelectedThemes(): void {
    try {
      const themes = this.selectedThemesSubject.value;
      localStorage.setItem(this.storageKey, JSON.stringify(themes));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des thèmes prioritaires:', error);
    }
  }
}
