import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class PreferencesComponent implements OnInit {
  // Titre de la page pour le header global
  pageTitle: string = 'Préférences';
  
  // Préférences utilisateur
  openaiApiKey: string = '';
  wordAssociationsCount: number = 10;
  oralComprehensionLength: number = 150; // Longueur par défaut en mots
  showApiKey: boolean = false;
  
  constructor(
    private storageService: StorageService,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadPreferences();
  }

  /**
   * Charge les préférences depuis le localStorage
   */
  loadPreferences() {
    // Charger la clé API (si définie par l'utilisateur)
    const savedApiKey = this.storageService.get('userOpenaiApiKey');
    if (savedApiKey) {
      this.openaiApiKey = savedApiKey;
    }

    // Charger le nombre d'associations
    const savedCount = this.storageService.get('wordAssociationsCount');
    if (savedCount) {
      this.wordAssociationsCount = savedCount;
    }

    // Charger la longueur des compréhensions orales
    const savedLength = this.storageService.get('oralComprehensionLength');
    if (savedLength) {
      this.oralComprehensionLength = savedLength;
    }
  }

  /**
   * Sauvegarde les préférences dans le localStorage
   */
  savePreferences() {
    // Valider le nombre d'associations
    if (this.wordAssociationsCount < 1 || this.wordAssociationsCount > 100) {
      this.showToast('Le nombre d\'associations doit être entre 1 et 100.');
      return;
    }

    // Valider la longueur des compréhensions orales
    if (this.oralComprehensionLength < 50 || this.oralComprehensionLength > 500) {
      this.showToast('La longueur des compréhensions orales doit être entre 50 et 500 mots.');
      return;
    }

    // Sauvegarder la clé API si fournie
    if (this.openaiApiKey.trim()) {
      this.storageService.set('userOpenaiApiKey', this.openaiApiKey.trim());
    } else {
      this.storageService.remove('userOpenaiApiKey');
    }

    // Sauvegarder le nombre d'associations
    this.storageService.set('wordAssociationsCount', this.wordAssociationsCount);

    // Sauvegarder la longueur des compréhensions orales
    this.storageService.set('oralComprehensionLength', this.oralComprehensionLength);

    this.showToast('Préférences sauvegardées avec succès !');
  }

  /**
   * Réinitialise les préférences aux valeurs par défaut
   */
  resetPreferences() {
    this.openaiApiKey = '';
    this.wordAssociationsCount = 10;
    this.oralComprehensionLength = 150;
    this.storageService.remove('userOpenaiApiKey');
    this.storageService.remove('wordAssociationsCount');
    this.storageService.remove('oralComprehensionLength');
    this.showToast('Préférences réinitialisées aux valeurs par défaut.');
  }

  /**
   * Affiche/masque la clé API
   */
  toggleApiKeyVisibility() {
    this.showApiKey = !this.showApiKey;
  }

  /**
   * Affiche des informations sur la configuration de la clé API
   */
  async showApiKeyInfo() {
    const alert = await this.alertController.create({
      header: 'Clé API requise',
      message: `
        <p>Cette application utilise l'API OpenAI pour générer du contenu d'apprentissage personnalisé. Pour utiliser toutes les fonctionnalités, vous devez :</p>
        <ul>
          <li>Créer un compte sur <a href="https://platform.openai.com" target="_blank">OpenAI Platform</a></li>
          <li>Générer une clé API dans votre dashboard</li>
          <li>La saisir ici pour utiliser vos propres crédits</li>
        </ul>
        <p><strong>Note :</strong> Sans clé API, les fonctionnalités de génération de contenu ne seront pas disponibles.</p>
      `,
      buttons: ['Compris']
    });
    await alert.present();
  }

  /**
   * Affiche un toast de confirmation
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  /**
   * Retour à l'accueil
   */
  goHome() {
    window.location.href = '/home';
  }
} 