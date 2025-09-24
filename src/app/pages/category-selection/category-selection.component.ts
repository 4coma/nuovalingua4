import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { LlmService } from '../../services/llm.service';
import { PersonalDictionaryService } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-category-selection',
  templateUrl: './category-selection.component.html',
  styleUrls: ['./category-selection.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CategorySelectionComponent {
  @Output() categorySelected = new EventEmitter<{ category: string; topic: string }>();

  // Liste des catégories disponibles
  categories = [
    {
      name: 'Tourisme',
      icon: 'airplane-outline',
      topics: ['Hôtel', 'Restaurant', 'Transport', 'Visite']
    },
    {
      name: 'Nourriture',
      icon: 'restaurant-outline',
      topics: ['Fruits et légumes', 'Plats', 'Boissons', 'Au marché']
    },
    {
      name: 'Travail',
      icon: 'briefcase-outline',
      topics: ['Bureau', 'Réunion', 'Entretien', 'Profession']
    },
    {
      name: 'Transport',
      icon: 'car-outline',
      topics: ['Train', 'Avion', 'Bus', 'Voiture']
    },
    {
      name: 'Loisirs',
      icon: 'football-outline',
      topics: ['Sport', 'Musique', 'Cinéma', 'Livre']
    },
    {
      name: 'Personnel',
      icon: 'book-outline',
      topics: ['Mon dictionnaire']
    }
  ];

  selectedCategory: string = '';
  selectedTopic: string = '';

  constructor(
    private llmService: LlmService, 
    private router: Router,
    private personalDictionaryService: PersonalDictionaryService
  ) {}

  /**
   * Gère la sélection d'une catégorie et d'un sujet
   */
  selectCategoryAndTopic(category: string, topic: string) {
    // Si c'est la catégorie "Personnel", traiter différemment
    if (category === 'Personnel' && topic === 'Mon dictionnaire') {
      this.handlePersonalDictionary();
      return;
    }
    
    this.selectedCategory = category;
    this.selectedTopic = topic;
    
    // Émettre l'événement de sélection pour le parent
    this.categorySelected.emit({
      category: this.selectedCategory,
      topic: this.selectedTopic
    });
  }

  /**
   * Gère l'accès au dictionnaire personnel
   */
  private handlePersonalDictionary() {
    // Vérifier si le dictionnaire personnel contient des mots
    const personalWords = this.personalDictionaryService.getAllWords();
    
    if (personalWords.length === 0) {
      this.showMessage('Votre dictionnaire personnel est vide. Ajoutez des mots pour commencer!');
      return;
    }
    
    // Récupérer les mots pour l'exercice
    const words = this.personalDictionaryService.getWordsForExercise();
    
    // Créer un format compatible avec l'exercice de vocabulaire
    const exercise = {
      items: words.map(word => ({
        word: word.sourceWord,
        translation: word.targetWord,
        context: word.contextualMeaning
      })),
      type: 'vocabulary',
      topic: 'Mon dictionnaire'
    };
    
    // Sauvegarder l'exercice et rediriger
    localStorage.setItem('vocabularyExercise', JSON.stringify(exercise));
    this.router.navigate(['/vocabulary']);
  }

  /**
   * Affiche un message (implémentation temporaire, à remplacer par un toast ou une alerte)
   */
  private showMessage(message: string) {
    alert(message);
  }
} 