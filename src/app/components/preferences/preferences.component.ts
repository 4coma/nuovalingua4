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
  googleTtsApiKey: string = '';
  wordAssociationsCount: number = 10;
  oralComprehensionLength: number = 150; // Longueur par défaut en mots
  showApiKey: boolean = false;
  showGoogleApiKey: boolean = false;
  
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
    // Charger la clé API OpenAI (si définie par l'utilisateur)
    const savedApiKey = this.storageService.get('userOpenaiApiKey');
    if (savedApiKey) {
      this.openaiApiKey = savedApiKey;
    }

    // Charger la clé API Google TTS (si définie par l'utilisateur)
    const savedGoogleApiKey = this.storageService.get('userGoogleTtsApiKey');
    if (savedGoogleApiKey) {
      this.googleTtsApiKey = savedGoogleApiKey;
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

    // Sauvegarder la clé API OpenAI si fournie
    if (this.openaiApiKey.trim()) {
      this.storageService.set('userOpenaiApiKey', this.openaiApiKey.trim());
    } else {
      this.storageService.remove('userOpenaiApiKey');
    }

    // Sauvegarder la clé API Google TTS si fournie
    if (this.googleTtsApiKey.trim()) {
      this.storageService.set('userGoogleTtsApiKey', this.googleTtsApiKey.trim());
    } else {
      this.storageService.remove('userGoogleTtsApiKey');
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
    this.googleTtsApiKey = '';
    this.wordAssociationsCount = 10;
    this.oralComprehensionLength = 150;
    this.storageService.remove('userOpenaiApiKey');
    this.storageService.remove('userGoogleTtsApiKey');
    this.storageService.remove('wordAssociationsCount');
    this.storageService.remove('oralComprehensionLength');
    this.showToast('Préférences réinitialisées aux valeurs par défaut.');
  }

  /**
   * Affiche/masque la clé API OpenAI
   */
  toggleApiKeyVisibility() {
    this.showApiKey = !this.showApiKey;
  }

  /**
   * Affiche/masque la clé API Google TTS
   */
  toggleGoogleApiKeyVisibility() {
    this.showGoogleApiKey = !this.showGoogleApiKey;
  }

  /**
   * Affiche des informations sur la configuration de la clé API OpenAI
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
   * Affiche des informations sur la configuration de la clé API Google TTS
   */
  async showGoogleApiKeyInfo() {
    const alert = await this.alertController.create({
      header: 'Clé API Google Text-to-Speech requise',
      message: `
        <p>Cette application utilise l'API Google Text-to-Speech pour la prononciation des mots italiens. Pour utiliser cette fonctionnalité, vous devez :</p>
        <ul>
          <li>Aller sur <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
          <li>Activer l'API Text-to-Speech</li>
          <li>Créer une clé API dans les identifiants</li>
          <li>La saisir ici pour activer la prononciation</li>
        </ul>
        <p><strong>Note :</strong> Sans clé API, la prononciation des mots ne fonctionnera pas dans le jeu d'association.</p>
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