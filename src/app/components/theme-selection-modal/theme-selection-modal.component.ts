import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Theme {
  id: string;
  name: string;
  selected: boolean;
}

@Component({
  selector: 'app-theme-selection-modal',
  templateUrl: './theme-selection-modal.component.html',
  styleUrls: ['./theme-selection-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class ThemeSelectionModalComponent implements OnInit {
  themes: Theme[] = [
    { id: 'science-fiction', name: 'Science-fiction', selected: false },
    { id: 'romance', name: 'Romance', selected: false },
    { id: 'aventure', name: 'Aventure', selected: false },
    { id: 'mystere', name: 'Mystère', selected: false },
    { id: 'comedie', name: 'Comédie', selected: false },
    { id: 'drame', name: 'Drame', selected: false },
    { id: 'fantasy', name: 'Fantasy', selected: false },
    { id: 'historique', name: 'Historique', selected: false },
    { id: 'policier', name: 'Policier', selected: false },
    { id: 'quotidien', name: 'Quotidien', selected: false },
    { id: 'voyage', name: 'Voyage', selected: false },
    { id: 'cuisine', name: 'Cuisine', selected: false },
    { id: 'sport', name: 'Sport', selected: false },
    { id: 'musique', name: 'Musique', selected: false },
    { id: 'art', name: 'Art', selected: false },
    { id: 'technologie', name: 'Technologie', selected: false },
    { id: 'nature', name: 'Nature', selected: false },
    { id: 'ville', name: 'Ville', selected: false },
    { id: 'famille', name: 'Famille', selected: false },
    { id: 'travail', name: 'Travail', selected: false }
  ];

  customTheme: string = '';
  selectedThemes: string[] = [];

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // Charger les thèmes sauvegardés
    this.loadSavedThemes();
  }

  toggleTheme(theme: Theme) {
    theme.selected = !theme.selected;
    this.updateSelectedThemes();
  }

  addCustomTheme() {
    const trimmedTheme = this.customTheme.trim();
    if (trimmedTheme && !this.selectedThemes.includes(trimmedTheme)) {
      this.selectedThemes.push(trimmedTheme);
      this.saveCustomTheme(trimmedTheme);
      this.customTheme = '';
    }
  }

  removeTheme(themeName: string) {
    this.selectedThemes = this.selectedThemes.filter(t => t !== themeName);
    // Désélectionner aussi dans la liste des thèmes prédéfinis
    const theme = this.themes.find(t => t.name === themeName);
    if (theme) {
      theme.selected = false;
    }
  }

  confirm() {
    this.modalController.dismiss({
      themes: this.selectedThemes
    });
  }

  cancel() {
    this.modalController.dismiss();
  }

  private updateSelectedThemes() {
    this.selectedThemes = this.themes
      .filter(t => t.selected)
      .map(t => t.name);
  }

  private loadSavedThemes() {
    const savedThemes = localStorage.getItem('customThemes');
    if (savedThemes) {
      try {
        const customThemes = JSON.parse(savedThemes);
        // Ajouter les thèmes personnalisés à la liste
        customThemes.forEach((themeName: string) => {
          if (!this.themes.find(t => t.name === themeName)) {
            this.themes.push({ id: themeName.toLowerCase().replace(/\s+/g, '-'), name: themeName, selected: false });
          }
        });
      } catch (e) {
        console.error('Erreur lors du chargement des thèmes sauvegardés:', e);
      }
    }
  }

  private saveCustomTheme(themeName: string) {
    const savedThemes = localStorage.getItem('customThemes');
    let customThemes: string[] = [];
    
    if (savedThemes) {
      try {
        customThemes = JSON.parse(savedThemes);
      } catch (e) {
        console.error('Erreur lors du parsing des thèmes sauvegardés:', e);
      }
    }
    
    if (!customThemes.includes(themeName)) {
      customThemes.push(themeName);
      localStorage.setItem('customThemes', JSON.stringify(customThemes));
    }
  }
} 