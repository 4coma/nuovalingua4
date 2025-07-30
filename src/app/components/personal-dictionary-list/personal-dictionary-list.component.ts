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
   * Ouvre le modal pour ajouter un mot au dictionnaire personnel
   */
  async openAddWordModal() {
    const modal = await this.modalController.create({
      component: AddWordComponent,
      cssClass: 'add-word-modal'
    });
    
    await modal.present();
    
    // Rafraîchir la liste quand le modal est fermé
    const { data } = await modal.onDidDismiss();
    this.loadDictionary();
  }
} 