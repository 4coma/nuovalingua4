import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { AddWordComponent } from '../add-word/add-word.component';
import { EditWordModalComponent } from './edit-word-modal.component';

@Component({
  selector: 'app-personal-dictionary-list',
  templateUrl: './personal-dictionary-list.component.html',
  styleUrls: ['./personal-dictionary-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule
  ]
})
export class PersonalDictionaryListComponent implements OnInit {
  // Titre de la page pour le header global
  pageTitle: string = 'Mon dictionnaire personnel';
  
  dictionaryWords: DictionaryWord[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';
  filteredWords: DictionaryWord[] = [];
  
  // Options de langues pour l'affichage
  languages: { [key: string]: string } = {
    'fr': 'Français',
    'it': 'Italien',
    'en': 'Anglais',
    'es': 'Espagnol',
    'de': 'Allemand'
  };

  constructor(
    private dictionaryService: PersonalDictionaryService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.loadDictionary();
  }

  /**
   * Charge les mots du dictionnaire personnel
   */
  loadDictionary() {
    this.isLoading = true;
    this.dictionaryWords = this.dictionaryService.getAllWords();
    
    // Calculer les délais de révision pour l'affichage
    this.dictionaryWords.forEach(word => {
      if (word.minRevisionDate) {
        word.revisionDelay = this.calculateDelayFromTimestamp(word.minRevisionDate);
      }
    });
    
    this.sortWords();
    this.filterWords();
    this.isLoading = false;
  }

  /**
   * Trie les mots par date d'ajout (plus récent d'abord)
   */
  sortWords() {
    this.dictionaryWords.sort((a, b) => {
      return b.dateAdded - a.dateAdded;
    });
  }

  /**
   * Filtre les mots en fonction du terme de recherche
   */
  filterWords() {
    if (!this.searchTerm) {
      this.filteredWords = [...this.dictionaryWords];
      return;
    }
    
    const term = this.searchTerm.toLowerCase();
    this.filteredWords = this.dictionaryWords.filter(word => 
      word.sourceWord.toLowerCase().includes(term) ||
      word.targetWord.toLowerCase().includes(term)
    );
  }

  /**
   * Gère la recherche
   */
  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.filterWords();
  }

  /**
   * Ouvre le modal pour éditer un mot
   */
  async editWord(word: DictionaryWord) {
    const modal = await this.modalController.create({
      component: EditWordModalComponent,
      componentProps: {
        word: word
      },
      cssClass: 'edit-word-modal'
    });
    
    await modal.present();
    
    // Traiter le résultat du modal
    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('Données reçues du modal:', data);
      // Mettre à jour le mot dans le service
      const success = this.dictionaryService.updateWord(data);
      if (success) {
        this.showToast('Mot modifié avec succès');
        this.loadDictionary(); // Recharger la liste
      } else {
        this.showToast('Erreur lors de la modification du mot', 'danger');
      }
    }
  }

  /**
   * Supprime un mot du dictionnaire après confirmation
   */
  async confirmDelete(wordId: string, wordText: string) {
    const alert = await this.alertController.create({
      header: 'Supprimer du dictionnaire',
      message: `Voulez-vous vraiment supprimer "${wordText}" de votre dictionnaire personnel ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: () => {
            this.deleteWord(wordId);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Supprime un mot du dictionnaire
   */
  deleteWord(wordId: string) {
    const deleted = this.dictionaryService.removeWord(wordId);
    
    if (deleted) {
      this.showToast('Mot supprimé du dictionnaire');
      this.loadDictionary(); // Recharger la liste
    } else {
      this.showToast('Erreur lors de la suppression du mot', 'danger');
    }
  }

  /**
   * Affiche un toast
   */
  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    
    await toast.present();
  }
  
  /**
   * Obtient la date formatée pour l'affichage
   */
  getFormattedDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
  
  /**
   * Obtient le nom de la langue
   */
  getLanguageName(code: string): string {
    return this.languages[code] || code;
  }

  /**
   * Ouvre le modal pour ajouter un nouveau mot
   */
  async openAddWordModal() {
    const modal = await this.modalController.create({
      component: AddWordComponent,
      componentProps: {
        isModal: true
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.wordAdded) {
      this.loadDictionary();
      this.showToast('Mot ajouté avec succès !');
    }
  }

  /**
   * Gère le changement de délai de révision pour un mot
   */
  onRevisionDelayChange(word: DictionaryWord) {
    console.log('Délai de révision changé pour:', word.sourceWord, '→', word.revisionDelay);
    
    if (word.revisionDelay) {
      const delayInMs = this.calculateDelayInMs(word.revisionDelay);
      if (delayInMs !== null) {
        word.minRevisionDate = Date.now() + delayInMs;
      } else {
        word.minRevisionDate = undefined;
      }
    } else {
      word.minRevisionDate = undefined;
    }
    
    // Sauvegarder le mot entier pour persister revisionDelay et minRevisionDate
    const success = this.dictionaryService.updateWord(word);
    if (success) {
      console.log(`Délai de révision mis à jour pour ${word.sourceWord}: ${word.revisionDelay}`);
    }
  }

  /**
   * Gère le changement de statut "connu" pour un mot
   */
  onKnownStatusChange(word: DictionaryWord) {
    console.log('Statut "connu" changé pour:', word.sourceWord, '→', word.isKnown);
    
    // Sauvegarder le mot entier pour persister isKnown
    const success = this.dictionaryService.updateWord(word);
    if (success) {
      console.log(`Statut 'connu' mis à jour pour ${word.sourceWord}: ${word.isKnown}`);
    }
  }

  /**
   * Calcule le délai en millisecondes à partir d'une chaîne de délai
   */
  private calculateDelayInMs(delay: string): number | null {
    const oneDay = 24 * 60 * 60 * 1000;
    const oneMonth = 30 * oneDay; // Approximation
    
    switch (delay) {
      case '1j':
        return oneDay;
      case '3j':
        return 3 * oneDay;
      case '7j':
        return 7 * oneDay;
      case '15j':
        return 15 * oneDay;
      case '1m':
        return oneMonth;
      case '3m':
        return 3 * oneMonth;
      case '6m':
        return 6 * oneMonth;
      default:
        console.warn('Délai de révision non reconnu:', delay);
        return null;
    }
  }

  /**
   * Calcule le délai de révision à partir d'une date minimale de révision
   */
  private calculateDelayFromTimestamp(minRevisionDate: number): string | undefined {
    const now = Date.now();
    const diffInMs = minRevisionDate - now;

    if (diffInMs <= 0) {
      return undefined; // Pas de délai ou délai déjà passé
    }

    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays < 1) {
      return '1j'; // Moins d'un jour
    }
    if (diffInDays < 3) {
      return '3j'; // Moins de 3 jours
    }
    if (diffInDays < 7) {
      return '7j'; // Moins de 7 jours
    }
    if (diffInDays < 15) {
      return '15j'; // Moins de 15 jours
    }
    if (diffInDays < 30) {
      return '1m'; // Moins d'un mois
    }
    if (diffInDays < 90) {
      return '3m'; // Moins de 3 mois
    }
    if (diffInDays < 180) {
      return '6m'; // Moins de 6 mois
    }
    return undefined; // Plus de 6 mois
  }
} 