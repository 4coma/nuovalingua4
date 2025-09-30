import { Injectable } from '@angular/core';
import { SavedText, ComprehensionText } from '../models/vocabulary';

@Injectable({
  providedIn: 'root'
})
export class SavedTextsService {
  private readonly STORAGE_KEY = 'savedTexts';

  constructor() { }

  /**
   * Sauvegarde un texte de compréhension
   */
  saveText(comprehensionText: ComprehensionText, category: string, topic: string, customTitle?: string): boolean {
    console.log('SavedTextsService.saveText() appelé');
    console.log('comprehensionText:', comprehensionText);
    console.log('category:', category);
    console.log('topic:', topic);
    console.log('customTitle:', customTitle);
    
    try {
      const savedTexts = this.getAllTexts();
      console.log('Textes déjà sauvegardés:', savedTexts.length);
      
      const newSavedText: SavedText = {
        id: this.generateId(),
        title: customTitle || this.generateTitle(category, topic, comprehensionText.type),
        text: comprehensionText.text,
        type: comprehensionText.type,
        category: category,
        topic: topic,
        vocabularyItems: comprehensionText.vocabularyItems,
        questions: comprehensionText.questions,
        dateCreated: Date.now(),
        dateLastAccessed: Date.now(),
        accessCount: 1,
        isFavorite: false
      };
      
      console.log('Nouveau texte à sauvegarder:', newSavedText);
      
      savedTexts.push(newSavedText);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedTexts));
      
      console.log('Sauvegarde réussie, total:', savedTexts.length);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du texte:', error);
      return false;
    }
  }

  /**
   * Récupère tous les textes sauvegardés
   */
  getAllTexts(): SavedText[] {
    try {
      const savedTextsJson = localStorage.getItem(this.STORAGE_KEY);
      return savedTextsJson ? JSON.parse(savedTextsJson) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des textes sauvegardés:', error);
      return [];
    }
  }

  /**
   * Récupère un texte par son ID
   */
  getTextById(id: string): SavedText | null {
    const savedTexts = this.getAllTexts();
    return savedTexts.find(text => text.id === id) || null;
  }

  /**
   * Met à jour les statistiques d'accès d'un texte
   */
  updateAccessStats(id: string): void {
    try {
      const savedTexts = this.getAllTexts();
      const textIndex = savedTexts.findIndex(text => text.id === id);
      
      if (textIndex !== -1) {
        savedTexts[textIndex].dateLastAccessed = Date.now();
        savedTexts[textIndex].accessCount++;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedTexts));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statistiques:', error);
    }
  }

  /**
   * Marque/démarque un texte comme favori
   */
  toggleFavorite(id: string): boolean {
    try {
      const savedTexts = this.getAllTexts();
      const textIndex = savedTexts.findIndex(text => text.id === id);
      
      if (textIndex !== -1) {
        savedTexts[textIndex].isFavorite = !savedTexts[textIndex].isFavorite;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedTexts));
        return savedTexts[textIndex].isFavorite;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors du changement de statut favori:', error);
      return false;
    }
  }

  /**
   * Supprime un texte sauvegardé
   */
  deleteText(id: string): boolean {
    try {
      const savedTexts = this.getAllTexts();
      const filteredTexts = savedTexts.filter(text => text.id !== id);
      
      if (filteredTexts.length !== savedTexts.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTexts));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression du texte:', error);
      return false;
    }
  }

  /**
   * Récupère les textes favoris
   */
  getFavoriteTexts(): SavedText[] {
    return this.getAllTexts().filter(text => text.isFavorite);
  }

  /**
   * Récupère les textes par type
   */
  getTextsByType(type: 'written' | 'oral'): SavedText[] {
    return this.getAllTexts().filter(text => text.type === type);
  }

  /**
   * Récupère les textes par catégorie
   */
  getTextsByCategory(category: string): SavedText[] {
    return this.getAllTexts().filter(text => text.category === category);
  }

  /**
   * Récupère les textes les plus récents
   */
  getRecentTexts(limit: number = 5): SavedText[] {
    return this.getAllTexts()
      .sort((a, b) => (b.dateLastAccessed || 0) - (a.dateLastAccessed || 0))
      .slice(0, limit);
  }

  /**
   * Récupère les textes les plus consultés
   */
  getMostAccessedTexts(limit: number = 5): SavedText[] {
    return this.getAllTexts()
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Génère un titre pour le texte sauvegardé
   */
  private generateTitle(category: string, topic: string, type: 'written' | 'oral'): string {
    const typeText = type === 'written' ? 'Compréhension écrite' : 'Compréhension orale';
    return `${typeText} - ${category} - ${topic}`;
  }

  /**
   * Vérifie si un texte existe déjà (basé sur le contenu et la catégorie)
   */
  textExists(text: string, category: string, topic: string): boolean {
    const savedTexts = this.getAllTexts();
    return savedTexts.some(savedText => 
      savedText.text === text && 
      savedText.category === category && 
      savedText.topic === topic
    );
  }
} 