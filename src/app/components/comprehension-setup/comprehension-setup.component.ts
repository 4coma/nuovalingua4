import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { TextGeneratorService } from '../../services/text-generator.service';
import { StorageService } from '../../services/storage.service';
import { WordPair } from '../../services/llm.service';
import { ButtonComponent, CardComponent } from '../atoms';

interface SavedPrompt {
  id: string;
  prompt: string;
  date: number;
}

@Component({
  selector: 'app-comprehension-setup',
  templateUrl: './comprehension-setup.component.html',
  styleUrls: ['./comprehension-setup.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterModule,
    CardComponent
  ]
})
export class ComprehensionSetupComponent implements OnInit {
  customPrompt: string = '';
  savedPrompts: SavedPrompt[] = [];
  isLoading: boolean = false;

  private readonly STORAGE_KEY = 'comprehensionPrompts';

  constructor(
    private router: Router,
    private textGeneratorService: TextGeneratorService,
    private storageService: StorageService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.loadSavedPrompts();
  }

  /**
   * Charge les consignes sauvegardées depuis le localStorage
   */
  loadSavedPrompts() {
    const saved = this.storageService.get(this.STORAGE_KEY);
    if (saved && Array.isArray(saved)) {
      this.savedPrompts = saved.sort((a, b) => b.date - a.date); // Plus récent en premier
    }
  }

  /**
   * Sauvegarde une nouvelle consigne
   */
  savePrompt(prompt: string) {
    if (!prompt || !prompt.trim()) {
      return;
    }

    const newPrompt: SavedPrompt = {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      date: Date.now()
    };

    // Vérifier si la consigne existe déjà
    const exists = this.savedPrompts.some(p => p.prompt.toLowerCase() === newPrompt.prompt.toLowerCase());
    if (exists) {
      return;
    }

    this.savedPrompts.unshift(newPrompt);
    
    // Limiter à 20 consignes maximum
    if (this.savedPrompts.length > 20) {
      this.savedPrompts = this.savedPrompts.slice(0, 20);
    }

    this.storageService.set(this.STORAGE_KEY, this.savedPrompts);
  }

  /**
   * Utilise une consigne sauvegardée
   */
  usePrompt(prompt: string) {
    this.customPrompt = prompt;
  }

  /**
   * Supprime une consigne sauvegardée
   */
  deletePrompt(id: string, event: Event) {
    event.stopPropagation();
    this.savedPrompts = this.savedPrompts.filter(p => p.id !== id);
    this.storageService.set(this.STORAGE_KEY, this.savedPrompts);
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  }

  /**
   * Génère une compréhension orale avec la consigne personnalisée
   */
  async generateComprehension() {
    if (!this.customPrompt || !this.customPrompt.trim()) {
      const toast = await this.toastController.create({
        message: 'Veuillez entrer une consigne',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Sauvegarder la consigne
    this.savePrompt(this.customPrompt);

    // Afficher un loader
    const loading = await this.loadingController.create({
      message: 'Génération de la compréhension...',
      spinner: 'crescent'
    });
    await loading.present();

    this.isLoading = true;

    try {
      // Générer des paires de mots vides - le service utilisera la consigne personnalisée
      // pour générer le texte avec des mots appropriés
      // On passe un tableau vide car la consigne personnalisée sera utilisée pour générer le contenu
      const emptyWordPairs: WordPair[] = [];

      // Générer la compréhension orale avec la consigne personnalisée
      this.textGeneratorService.generateComprehensionText(
        emptyWordPairs,
        'oral',
        undefined, // Pas de thèmes spécifiques
        this.customPrompt.trim()
      ).subscribe({
        next: async (result) => {
          // Sauvegarder le texte dans le localStorage pour le composant de compréhension
          localStorage.setItem('comprehensionText', JSON.stringify(result));

          // Créer un sessionInfo pour la sauvegarde
          const sessionInfo = {
            category: 'Compréhension personnalisée',
            topic: 'Consigne personnalisée',
            date: new Date().toISOString(),
            translationDirection: 'fr2it' as const,
            customPrompt: this.customPrompt.trim()
          };
          localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));

          // Nettoyer les flags de session d'association si présents
          localStorage.removeItem('fromWordPairs');
          localStorage.removeItem('comprehensionPromptWords');

          await loading.dismiss();
          this.isLoading = false;

          // Naviguer vers le composant de compréhension
          this.router.navigate(['/comprehension']);
        },
        error: async (error) => {
          console.error('Erreur lors de la génération:', error);
          await loading.dismiss();
          this.isLoading = false;

          const toast = await this.toastController.create({
            message: 'Erreur lors de la génération. Veuillez réessayer.',
            duration: 3000,
            position: 'bottom',
            color: 'danger'
          });
          await toast.present();
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      await loading.dismiss();
      this.isLoading = false;

      const toast = await this.toastController.create({
        message: 'Une erreur est survenue',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }
}

