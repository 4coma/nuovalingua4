import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-focus-modal',
  templateUrl: './focus-modal.component.html',
  styleUrls: ['./focus-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class FocusModalComponent {
  focusText: string = '';
  
  // Exemples de focus pour aider l'utilisateur
  focusExamples = [
    'Le subjonctif présent',
    'Les adverbes de manière',
    'Les mots liés à la famille',
    'Les verbes irréguliers',
    'Les prépositions',
    'Le vocabulaire du travail',
    'Les expressions idiomatiques',
    'Les temps du passé'
  ];

  constructor(private modalController: ModalController) {}

  /**
   * Ferme le modal sans sauvegarder
   */
  cancel() {
    this.modalController.dismiss();
  }

  /**
   * Sauvegarde le focus et ferme le modal
   */
  saveFocus() {
    if (this.focusText.trim()) {
      this.modalController.dismiss({
        focus: this.focusText.trim()
      });
    }
  }

  /**
   * Utilise un exemple de focus
   */
  useExample(example: string) {
    this.focusText = example;
  }
} 