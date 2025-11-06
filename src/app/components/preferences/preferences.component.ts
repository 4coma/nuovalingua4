import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';
import { VocabularyTrackingService, WordMastery } from '../../services/vocabulary-tracking.service';
import { NotificationService } from '../../services/notification.service';
import { FirebaseSyncService } from '../../services/firebase-sync.service';
import { DataMigrationService } from '../../services/data-migration.service';

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
  personalDictionaryWordsCount: number = 8; // Nombre de mots par session de révision du dictionnaire personnel
  showApiKey: boolean = false;
  showGoogleApiKey: boolean = false;
  
  // Configuration Firebase
  firebaseEnabled: boolean = false;
  firebaseApiKey: string = '';
  firebaseAuthDomain: string = '';
  firebaseProjectId: string = '';
  firebaseStorageBucket: string = '';
  firebaseMessagingSenderId: string = '';
  firebaseAppId: string = '';
  firebaseCustomUid: string = '';
  showFirebaseConfig: boolean = false;
  
  // Propriétés pour les notifications
  notificationsEnabled: boolean = false;
  notificationTime: string = '18:30';
  notificationMessage: string = 'Il est temps de pratiquer votre italien ! 🇮🇹';
  comprehensionNotificationsEnabled: boolean = false;
  comprehensionNotificationTime: string = '19:00';
  comprehensionNotificationCustomPrompt: string = '';
  
  // Thèmes personnalisés pour la compréhension quotidienne
  dailyComprehensionThemes: string[] = [''];
  
  // État d'expansion des sections (toutes fermées par défaut pour montrer les chevrons)
  expandedSections: { [key: string]: boolean } = {
    openai: false,
    comprehensionNotification: false,
    googleTts: false,
    firebase: false,
    wordAssociations: false,
    oralComprehension: false,
    dailyThemes: false,
    personalDictionary: false,
    notifications: false
  };
  
  constructor(
    private storageService: StorageService,
    private toastController: ToastController,
    private alertController: AlertController,
    private vocabularyTrackingService: VocabularyTrackingService,
    private notificationService: NotificationService,
    private firebaseSync: FirebaseSyncService,
    private dataMigration: DataMigrationService
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
    if (savedCount !== null && savedCount !== undefined) {
      this.wordAssociationsCount = parseInt(savedCount);
    }

    // Charger la longueur des compréhensions orales
    const savedLength = this.storageService.get('oralComprehensionLength');
    if (savedLength !== null && savedLength !== undefined) {
      this.oralComprehensionLength = parseInt(savedLength);
    }


    // Charger le nombre de mots pour la révision du dictionnaire personnel
    const savedPersonalDictionaryCount = this.storageService.get('personalDictionaryWordsCount');
    if (savedPersonalDictionaryCount !== null && savedPersonalDictionaryCount !== undefined) {
      this.personalDictionaryWordsCount = parseInt(savedPersonalDictionaryCount);
    }

    // Charger la configuration Firebase
    this.firebaseEnabled = this.storageService.get('firebaseEnabled') === 'true';
    this.firebaseApiKey = this.storageService.get('firebaseApiKey') || '';
    this.firebaseAuthDomain = this.storageService.get('firebaseAuthDomain') || '';
    this.firebaseProjectId = this.storageService.get('firebaseProjectId') || '';
    this.firebaseStorageBucket = this.storageService.get('firebaseStorageBucket') || '';
    this.firebaseMessagingSenderId = this.storageService.get('firebaseMessagingSenderId') || '';
    this.firebaseAppId = this.storageService.get('firebaseAppId') || '';
    this.firebaseCustomUid = this.storageService.get('firebaseCustomUid') || '';

    // Charger les paramètres de notification
    const notificationSettings = this.notificationService.getSettings();
    this.notificationsEnabled = notificationSettings.enabled;
    this.notificationTime = notificationSettings.time;
    this.notificationMessage = notificationSettings.message;

    const compSettings = this.notificationService.getComprehensionSettings();
    this.comprehensionNotificationsEnabled = compSettings.enabled;
    this.comprehensionNotificationTime = compSettings.time;
    
    // Charger le prompt personnalisé pour la compréhension orale
    const savedCustomPrompt = this.storageService.get('comprehensionNotificationCustomPrompt');
    this.comprehensionNotificationCustomPrompt = savedCustomPrompt || '';
    
    // Charger les thèmes personnalisés pour la compréhension quotidienne
    const savedThemes = this.storageService.get('dailyComprehensionThemes');
    if (savedThemes) {
      try {
        const themes = JSON.parse(savedThemes);
        this.dailyComprehensionThemes = themes.length > 0 ? themes : [''];
      } catch (e) {
        this.dailyComprehensionThemes = [''];
      }
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


    // Valider le nombre de mots pour la révision du dictionnaire personnel
    if (this.personalDictionaryWordsCount < 1 || this.personalDictionaryWordsCount > 50) {
      this.showToast('Le nombre de mots par session de révision du dictionnaire personnel doit être entre 5 et 50.');
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

    // Sauvegarder la configuration Firebase
    this.storageService.set('firebaseEnabled', this.firebaseEnabled.toString());
    if (this.firebaseEnabled) {
      // Valider que tous les champs Firebase sont remplis
      if (!this.firebaseApiKey.trim() || !this.firebaseAuthDomain.trim() || 
          !this.firebaseProjectId.trim() || !this.firebaseStorageBucket.trim() || 
          !this.firebaseMessagingSenderId.trim() || !this.firebaseAppId.trim()) {
        this.showToast('Tous les champs de configuration Firebase doivent être remplis.');
        return;
      }
      
      this.storageService.set('firebaseApiKey', this.firebaseApiKey.trim());
      this.storageService.set('firebaseAuthDomain', this.firebaseAuthDomain.trim());
      this.storageService.set('firebaseProjectId', this.firebaseProjectId.trim());
      this.storageService.set('firebaseStorageBucket', this.firebaseStorageBucket.trim());
      this.storageService.set('firebaseMessagingSenderId', this.firebaseMessagingSenderId.trim());
      this.storageService.set('firebaseAppId', this.firebaseAppId.trim());
      this.storageService.set('firebaseCustomUid', this.firebaseCustomUid.trim());
    } else {
      // Supprimer la configuration Firebase si désactivée
      this.storageService.remove('firebaseApiKey');
      this.storageService.remove('firebaseAuthDomain');
      this.storageService.remove('firebaseProjectId');
      this.storageService.remove('firebaseStorageBucket');
      this.storageService.remove('firebaseMessagingSenderId');
      this.storageService.remove('firebaseAppId');
      this.storageService.remove('firebaseCustomUid');
    }

    // Sauvegarder le nombre d'associations
    this.storageService.set('wordAssociationsCount', this.wordAssociationsCount);

    // Sauvegarder la longueur des compréhensions orales
    this.storageService.set('oralComprehensionLength', this.oralComprehensionLength);


    // Sauvegarder le nombre de mots pour la révision du dictionnaire personnel
    this.storageService.set('personalDictionaryWordsCount', this.personalDictionaryWordsCount);
    
    // Sauvegarder les thèmes personnalisés pour la compréhension quotidienne (filtrer les vides)
    const validThemes = this.dailyComprehensionThemes.filter(t => t.trim() !== '');
    this.storageService.set('dailyComprehensionThemes', JSON.stringify(validThemes));

    // Sauvegarder le prompt personnalisé pour la compréhension orale
    if (this.comprehensionNotificationCustomPrompt.trim()) {
      this.storageService.set('comprehensionNotificationCustomPrompt', this.comprehensionNotificationCustomPrompt.trim());
    } else {
      this.storageService.remove('comprehensionNotificationCustomPrompt');
    }

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
    this.personalDictionaryWordsCount = 8; // Réinitialiser le nombre de mots pour la révision du dictionnaire personnel
    this.storageService.remove('userOpenaiApiKey');
    this.storageService.remove('userGoogleTtsApiKey');
    this.storageService.remove('wordAssociationsCount');
    this.storageService.remove('oralComprehensionLength');
    this.storageService.remove('personalDictionaryWordsCount');
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
   * Bascule l'état d'expansion d'une section
   */
  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  /**
   * TrackBy function pour éviter le re-rendu des éléments de la liste
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Met à jour un thème personnalisé pour la compréhension quotidienne
   */
  updateDailyTheme(index: number, event: any) {
    this.dailyComprehensionThemes[index] = event.target.value;
  }

  /**
   * Ajoute un nouveau thème personnalisé pour la compréhension quotidienne
   */
  addDailyTheme() {
    this.dailyComprehensionThemes.push('');
  }

  /**
   * Supprime un thème personnalisé pour la compréhension quotidienne
   */
  removeDailyTheme(index: number) {
    if (this.dailyComprehensionThemes.length > 1) {
      this.dailyComprehensionThemes.splice(index, 1);
    }
  }

  /**
   * Retour à l'accueil
   */
  goHome() {
    window.location.href = '/home';
  }

  /**
   * Méthodes SM-2 supprimées : le mode révision espacée a été supprimé
   */

  /**
   * Efface tous les mots du vocabulaire (localStorage)
   */
  clearVocabulary() {
    this.vocabularyTrackingService.saveAllWords([]);
    this.showToast('Tous les mots du vocabulaire ont été effacés.');
  }

  /**
   * Gère le changement d'état du toggle des notifications
   */
  async onNotificationToggleChange() {
    try {
      await this.notificationService.toggleNotifications(
        this.notificationsEnabled,
        this.notificationTime,
        this.notificationMessage
      );
      
      if (this.notificationsEnabled) {
        this.showToast('Notifications quotidiennes activées !');
      } else {
        this.showToast('Notifications quotidiennes désactivées.');
      }
    } catch (error) {
      console.error('Erreur lors du changement d\'état des notifications:', error);
      this.showToast('Erreur lors de la configuration des notifications.');
    }
  }

  /**
   * Gère le changement d'heure de la notification
   */
  async onNotificationTimeChange() {
    if (this.notificationsEnabled) {
      try {
        await this.notificationService.updateNotificationTime(this.notificationTime);
        this.showToast('Heure de notification mise à jour !');
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'heure:', error);
        this.showToast('Erreur lors de la mise à jour de l\'heure.');
      }
    }
  }

  /**
   * Gère le changement d'état du toggle des notifications de compréhension orale
   */
  async onComprehensionNotificationToggleChange() {
    try {
      await this.notificationService.toggleComprehensionNotifications(
        this.comprehensionNotificationsEnabled,
        this.comprehensionNotificationTime
      );
      if (this.comprehensionNotificationsEnabled) {
        this.showToast('Notification quotidienne de compréhension activée !');
      } else {
        this.showToast('Notification quotidienne de compréhension désactivée.');
      }
    } catch (error) {
      console.error('Erreur lors du changement de notification compréhension:', error);
      this.showToast('Erreur lors de la configuration des notifications.');
    }
  }

  /**
   * Gère le changement d'heure de la notification de compréhension
   */
  async onComprehensionNotificationTimeChange() {
    if (this.comprehensionNotificationsEnabled) {
      try {
        await this.notificationService.updateComprehensionNotificationTime(this.comprehensionNotificationTime);
        this.showToast('Heure de notification mise à jour !');
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'heure:', error);
        this.showToast('Erreur lors de la mise à jour de l\'heure.');
      }
    }
  }

  /**
   * Gère le changement de message de la notification
   */
  async onNotificationMessageChange() {
    if (this.notificationsEnabled) {
      try {
        await this.notificationService.updateNotificationMessage(this.notificationMessage);
        this.showToast('Message de notification mis à jour !');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du message:', error);
        this.showToast('Erreur lors de la mise à jour du message.');
      }
    }
  }

  /**
   * Envoie une notification de test
   */
  async sendTestNotification() {
    try {
      await this.notificationService.sendTestNotification();
      this.showToast('Notification de test envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error);
      this.showToast('Erreur lors de l\'envoi de la notification de test.');
    }
  }

  /**
   * Bascule la visibilité de la configuration Firebase
   */
  toggleFirebaseConfigVisibility() {
    this.showFirebaseConfig = !this.showFirebaseConfig;
  }

  /**
   * Affiche les informations sur Firebase
   */
  async showFirebaseInfo() {
    const alert = await this.alertController.create({
      header: 'Configuration Firebase',
      message: `
        <p>Firebase permet de synchroniser vos données (dictionnaire personnel, statistiques) entre vos appareils.</p>
        <p><strong>Avantages :</strong></p>
        <ul>
          <li>• Sauvegarde automatique dans le cloud</li>
          <li>• Synchronisation entre appareils</li>
          <li>• Plus de perte de données</li>
          <li>• Accès depuis n'importe où</li>
        </ul>
        <p><strong>Comment obtenir ces informations :</strong></p>
        <ol>
          <li>1. Allez sur <a href="https://console.firebase.google.com" target="_blank">console.firebase.google.com</a></li>
          <li>2. Créez un nouveau projet ou sélectionnez un projet existant</li>
          <li>3. Allez dans "Paramètres du projet" → "Vos applications"</li>
          <li>4. Ajoutez une application Web</li>
          <li>5. Copiez la configuration Firebase</li>
        </ol>
        <p><strong>Sécurité :</strong> Vos données sont stockées de manière sécurisée et privée.</p>
      `,
      buttons: ['Compris']
    });
    await alert.present();
  }

  /**
   * Teste la connexion Firebase
   */
  async testFirebaseConnection() {
    if (!this.firebaseEnabled) {
      this.showToast('Firebase n\'est pas activé.');
      return;
    }

    if (!this.firebaseApiKey.trim() || !this.firebaseProjectId.trim()) {
      this.showToast('Configuration Firebase incomplète.');
      return;
    }

    try {
      // Sauvegarder temporairement la configuration pour le test
      this.storageService.set('firebaseEnabled', 'true');
      this.storageService.set('firebaseApiKey', this.firebaseApiKey.trim());
      this.storageService.set('firebaseAuthDomain', this.firebaseAuthDomain.trim());
      this.storageService.set('firebaseProjectId', this.firebaseProjectId.trim());
      this.storageService.set('firebaseStorageBucket', this.firebaseStorageBucket.trim());
      this.storageService.set('firebaseMessagingSenderId', this.firebaseMessagingSenderId.trim());
      this.storageService.set('firebaseAppId', this.firebaseAppId.trim());
      this.storageService.set('firebaseCustomUid', this.firebaseCustomUid.trim());

      // Réinitialiser Firebase avec la nouvelle configuration
      await this.firebaseSync.reinitialize();

      // Tester la connexion
      const isConnected = await this.firebaseSync.testConnection();
      
      if (isConnected) {
        this.showToast('✅ Connexion Firebase réussie !');
      } else {
        this.showToast('❌ Échec de la connexion Firebase.');
      }
    } catch (error) {
      console.error('Erreur lors du test Firebase:', error);
      this.showToast('❌ Erreur de connexion Firebase: ' + (error as Error).message);
    }
  }

  /**
   * Migre les données locales vers Firebase
   */
  async migrateDataToFirebase() {
    if (!this.firebaseEnabled) {
      this.showToast('Firebase n\'est pas activé.');
      return;
    }

    if (!this.dataMigration.hasLocalData()) {
      this.showToast('Aucune donnée locale à migrer.');
      return;
    }

    const summary = this.dataMigration.getLocalDataSummary();
    
    const alert = await this.alertController.create({
      header: 'Migration des données',
      message: `Voulez-vous migrer vos données locales vers Firebase ?

Données à migrer :
• ${summary.words} mots du dictionnaire personnel
• ${summary.conversations} conversations
• ${summary.texts} textes sauvegardés
• Paramètres et statistiques

Note : Vos données locales seront conservées.`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Migrer',
          handler: async () => {
            await this.performMigration();
          }
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Effectue la migration des données
   */
  private async performMigration() {
    try {
      this.showToast('🔄 Migration en cours...');
      
      await this.dataMigration.migrateAllDataToFirebase();
      
      this.showToast('✅ Migration terminée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      this.showToast('❌ Erreur lors de la migration: ' + (error as Error).message);
    }
  }

  /**
   * Affiche les informations sur la migration
   */
  async showMigrationInfo() {
    const summary = this.dataMigration.getLocalDataSummary();
    
    const alert = await this.alertController.create({
      header: 'Migration des données',
      message: `
        <p>La migration transfère toutes vos données locales vers Firebase :</p>
        <p><strong>Données disponibles :</strong></p>
        <ul>
          <li>• ${summary.words} mots du dictionnaire personnel</li>
          <li>• ${summary.conversations} conversations</li>
          <li>• ${summary.texts} textes sauvegardés</li>
          <li>• Paramètres et préférences</li>
          <li>• Statistiques d'utilisation</li>
        </ul>
        <p><strong>Avantages :</strong></p>
        <ul>
          <li>• Sauvegarde automatique dans le cloud</li>
          <li>• Synchronisation entre appareils</li>
          <li>• Plus de perte de données</li>
        </ul>
        <p><strong>Sécurité :</strong> Vos données restent privées et sécurisées.</p>
      `,
      buttons: ['Compris']
    });
    
    await alert.present();
  }

  /**
   * Vérifie et affiche le statut des permissions de notifications
   */
  async checkNotificationPermissions() {
    try {
      const status = await this.notificationService.checkPermissionsStatus();
      
      const alert = await this.alertController.create({
        header: 'Statut des permissions',
        message: status.message,
        buttons: [
          {
            text: 'Paramètres',
            handler: () => {
              // Ouvrir les paramètres de l'application
              this.openAppSettings();
            }
          },
          'Fermer'
        ]
      });
      await alert.present();
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      this.showToast('Erreur lors de la vérification des permissions.');
    }
  }

  /**
   * Ouvre les paramètres de l'application
   */
  private openAppSettings() {
    // Cette fonction pourrait être implémentée avec Capacitor App
    // pour ouvrir les paramètres système de l'application
    // Pour l'instant, on affiche juste un message
    this.showToast('Allez dans Paramètres > Applications > NuovaLingua > Notifications');
  }
} 