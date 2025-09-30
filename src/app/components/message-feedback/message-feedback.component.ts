import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { MessageFeedback } from '../../services/discussion.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-message-feedback',
  templateUrl: './message-feedback.component.html',
  styleUrls: ['./message-feedback.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class MessageFeedbackComponent {
  @Input() feedback?: MessageFeedback;
  @Input() showFeedback = false;

  constructor(
    private personalDictionaryService: PersonalDictionaryService,
    private toastController: ToastController
  ) {}

  toggleFeedback() {
    this.showFeedback = !this.showFeedback;
  }

  getFeedbackIcon(feedback: MessageFeedback): string {
    // Détermine l'icône basée sur le nombre d'erreurs
    if (this.hasErrors()) {
      return 'information-circle';
    } else {
      return 'checkmark-circle';
    }
  }

  getFeedbackColor(feedback: MessageFeedback): string {
    // Détermine la couleur basée sur le nombre d'erreurs
    if (this.hasErrors()) {
      return 'warning';
    } else {
      return 'success';
    }
  }

  hasErrors(): boolean {
    if (!this.feedback) return false;
    
    // Nouveau format avec erreurs
    if (this.feedback.erreurs && Array.isArray(this.feedback.erreurs)) {
      return this.feedback.erreurs.length > 0;
    }
    
    // Ancien format - considérer comme "pas d'erreurs" pour éviter les erreurs
    return false;
  }

  /**
   * Vérifie si une correction est déjà dans le dictionnaire
   */
  isCorrectionInDictionary(correction: string): boolean {
    const allWords = this.personalDictionaryService.getAllWords();
    return allWords.some(word => 
      word.sourceWord.toLowerCase() === correction.toLowerCase() ||
      word.targetWord.toLowerCase() === correction.toLowerCase()
    );
  }

  /**
   * Ajoute une correction au dictionnaire personnel
   */
  async addCorrectionToDictionary(correction: string, traduction: string, type: string) {
    try {
      // Créer un mot de dictionnaire à partir de la correction
      const newWord: DictionaryWord = {
        id: '',
        sourceWord: correction,
        sourceLang: 'it',
        targetWord: traduction,
        targetLang: 'fr',
        contextualMeaning: `Correction de ${type.toLowerCase()}`,
        partOfSpeech: this.getPartOfSpeechFromType(type),
        examples: [],
        dateAdded: Date.now()
      };

      const added = this.personalDictionaryService.addWord(newWord);
      
      if (added) {
        await this.showToast(`"${correction}" (${traduction}) ajouté au dictionnaire personnel`);
      } else {
        await this.showToast(`"${correction}" existe déjà dans votre dictionnaire`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout au dictionnaire:', error);
      await this.showToast('Erreur lors de l\'ajout au dictionnaire');
    }
  }

  /**
   * Détermine la partie du discours basée sur le type de correction
   */
  private getPartOfSpeechFromType(type: string): string {
    if (type.toLowerCase().includes('grammaire')) {
      return 'verbe'; // Par défaut pour les corrections de grammaire
    } else if (type.toLowerCase().includes('vocabulaire')) {
      return 'nom'; // Par défaut pour les corrections de vocabulaire
    } else if (type.toLowerCase().includes('conjugaison')) {
      return 'verbe';
    }
    return 'autre';
  }

  /**
   * Affiche un toast avec un message
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}
