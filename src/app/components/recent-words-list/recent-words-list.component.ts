import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { VocabularyTrackingService, WordMastery } from '../../services/vocabulary-tracking.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recent-words-list',
  templateUrl: './recent-words-list.component.html',
  styleUrls: ['./recent-words-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule
  ]
})
export class RecentWordsListComponent implements OnInit {
  pageTitle: string = 'Mots récemment vus';
  
  recentWords: WordMastery[] = [];
  filteredWords: WordMastery[] = [];
  
  // Filtres
  categoryFilter: string = '';
  topicFilter: string = '';
  masteryFilter: 'all' | 'low' | 'medium' | 'high' = 'all';
  
  // Catégories et sujets uniques
  categories: string[] = [];
  topics: { [category: string]: string[] } = {};

  constructor(private vocabularyTrackingService: VocabularyTrackingService) { }

  ngOnInit() {
    this.loadRecentWords();
  }

  /**
   * Charge les mots récemment vus
   */
  loadRecentWords() {
    this.recentWords = this.vocabularyTrackingService.getAllTrackedWords();
    
    // Extraire les catégories et sujets uniques
    this.extractCategoriesAndTopics();
    
    // Appliquer les filtres
    this.applyFilters();
  }
  
  /**
   * Extrait les catégories et sujets uniques de la liste des mots
   */
  extractCategoriesAndTopics() {
    // Extraire les catégories uniques
    this.categories = [...new Set(this.recentWords.map(word => word.category))];
    
    // Pour chaque catégorie, extraire les sujets uniques
    this.topics = {};
    this.categories.forEach(category => {
      const topicsForCategory = this.recentWords
        .filter(word => word.category === category)
        .map(word => word.topic);
      
      this.topics[category] = [...new Set(topicsForCategory)];
    });
  }
  
  /**
   * Applique les filtres sélectionnés
   */
  applyFilters() {
    this.filteredWords = this.recentWords.filter(word => {
      let matchesCategory = true;
      let matchesTopic = true;
      let matchesMastery = true;
      
      // Filtrer par catégorie
      if (this.categoryFilter) {
        matchesCategory = word.category === this.categoryFilter;
      }
      
      // Filtrer par sujet
      if (this.topicFilter) {
        matchesTopic = word.topic === this.topicFilter;
      }
      
      // Filtrer par niveau de maîtrise
      if (this.masteryFilter !== 'all') {
        const level = word.masteryLevel;
        
        if (this.masteryFilter === 'low') {
          matchesMastery = level < 33;
        } else if (this.masteryFilter === 'medium') {
          matchesMastery = level >= 33 && level < 66;
        } else if (this.masteryFilter === 'high') {
          matchesMastery = level >= 66;
        }
      }
      
      return matchesCategory && matchesTopic && matchesMastery;
    });
  }
  
  /**
   * Réinitialise tous les filtres
   */
  resetFilters() {
    this.categoryFilter = '';
    this.topicFilter = '';
    this.masteryFilter = 'all';
    this.applyFilters();
  }
  
  /**
   * Définit le filtre de catégorie et réinitialise le filtre de sujet
   */
  setCategoryFilter(category: string) {
    this.categoryFilter = category;
    this.topicFilter = '';
    this.applyFilters();
  }
  
  /**
   * Définit le filtre de sujet
   */
  setTopicFilter(topic: string) {
    this.topicFilter = topic;
    this.applyFilters();
  }
  
  /**
   * Définit le filtre de niveau de maîtrise
   */
  setMasteryFilter(level: 'all' | 'low' | 'medium' | 'high') {
    this.masteryFilter = level;
    this.applyFilters();
  }
  
  /**
   * Retourne une classe CSS basée sur le niveau de maîtrise
   */
  getMasteryClass(masteryLevel: number): string {
    if (masteryLevel < 33) {
      return 'mastery-low';
    } else if (masteryLevel < 66) {
      return 'mastery-medium';
    } else {
      return 'mastery-high';
    }
  }
  
  /**
   * Formate la date de dernière révision
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }
} 