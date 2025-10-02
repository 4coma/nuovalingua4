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
    console.log('🔍 [Preferences] Chargement personalDictionaryWordsCount:', savedPersonalDictionaryCount);
    if (savedPersonalDictionaryCount !== null && savedPersonalDictionaryCount !== undefined) {
      this.personalDictionaryWordsCount = parseInt(savedPersonalDictionaryCount);
      console.log('🔍 [Preferences] Valeur convertie:', this.personalDictionaryWordsCount);
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
  }

  /**
   * Sauvegarde les préférences dans le localStorage
   */
  savePreferences() {
    console.log('🔍 [Preferences] savePreferences() appelée');
    
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
    console.log('🔍 [Preferences] Sauvegarde personalDictionaryWordsCount:', this.personalDictionaryWordsCount);

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
   * Retour à l'accueil
   */
  goHome() {
    window.location.href = '/home';
  }

  /**
   * Génère des mots de test pour tester l'algorithme SM-2
   */
  generateTestWords() {
    const testWords: WordMastery[] = [
      // Mots avec différents niveaux de maîtrise et dates
      {
        id: 'ciao_bonjour',
        word: 'ciao',
        translation: 'bonjour',
        category: 'vocabulary',
        topic: 'Salutations',
        lastReviewed: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 jours
        masteryLevel: 80,
        timesReviewed: 5,
        timesCorrect: 4,
        context: 'Salutation informelle',
        eFactor: 2.3,
        interval: 3,
        repetitions: 2,
        nextReview: Date.now() - (1 * 24 * 60 * 60 * 1000) // Dû hier
      },
      {
        id: 'grazie_merci',
        word: 'grazie',
        translation: 'merci',
        category: 'vocabulary',
        topic: 'Politesse',
        lastReviewed: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 jours
        masteryLevel: 60,
        timesReviewed: 3,
        timesCorrect: 2,
        context: 'Expression de gratitude',
        eFactor: 2.1,
        interval: 1,
        repetitions: 1,
        nextReview: Date.now() - (6 * 24 * 60 * 60 * 1000) // Dû il y a 6 jours
      },
      {
        id: 'prego_silvousplait',
        word: 'prego',
        translation: 's\'il vous plaît',
        category: 'vocabulary',
        topic: 'Politesse',
        lastReviewed: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 jour
        masteryLevel: 40,
        timesReviewed: 2,
        timesCorrect: 1,
        context: 'Formule de politesse',
        eFactor: 1.8,
        interval: 1,
        repetitions: 0,
        nextReview: Date.now() // Dû aujourd'hui
      },
      {
        id: 'buongiorno_bonjour',
        word: 'buongiorno',
        translation: 'bonjour',
        category: 'vocabulary',
        topic: 'Salutations',
        lastReviewed: Date.now() - (14 * 24 * 60 * 60 * 1000), // 14 jours
        masteryLevel: 90,
        timesReviewed: 8,
        timesCorrect: 7,
        context: 'Salutation formelle',
        eFactor: 2.7,
        interval: 10,
        repetitions: 4,
        nextReview: Date.now() + (4 * 24 * 60 * 60 * 1000) // Dû dans 4 jours
      },
      {
        id: 'arrivederci_aurevoir',
        word: 'arrivederci',
        translation: 'au revoir',
        category: 'vocabulary',
        topic: 'Salutations',
        lastReviewed: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 jours
        masteryLevel: 70,
        timesReviewed: 4,
        timesCorrect: 3,
        context: 'Salutation de départ',
        eFactor: 2.4,
        interval: 2,
        repetitions: 2,
        nextReview: Date.now() - (1 * 24 * 60 * 60 * 1000) // Dû hier
      },
      {
        id: 'perfetto_parfait',
        word: 'perfetto',
        translation: 'parfait',
        category: 'vocabulary',
        topic: 'Adjectifs',
        lastReviewed: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 jours
        masteryLevel: 50,
        timesReviewed: 2,
        timesCorrect: 1,
        context: 'Adjectif qualificatif',
        eFactor: 2.0,
        interval: 1,
        repetitions: 0,
        nextReview: Date.now() - (4 * 24 * 60 * 60 * 1000) // Dû il y a 4 jours
      },
      {
        id: 'bellissimo_tresbeau',
        word: 'bellissimo',
        translation: 'très beau',
        category: 'vocabulary',
        topic: 'Adjectifs',
        lastReviewed: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 jours
        masteryLevel: 30,
        timesReviewed: 1,
        timesCorrect: 0,
        context: 'Superlatif de beau',
        eFactor: 1.5,
        interval: 1,
        repetitions: 0,
        nextReview: Date.now() - (9 * 24 * 60 * 60 * 1000) // Dû il y a 9 jours
      },
      {
        id: 'mangiare_manger',
        word: 'mangiare',
        translation: 'manger',
        category: 'vocabulary',
        topic: 'Actions',
        lastReviewed: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 jour
        masteryLevel: 100,
        timesReviewed: 10,
        timesCorrect: 10,
        context: 'Verbe d\'action',
        eFactor: 3.0,
        interval: 15,
        repetitions: 6,
        nextReview: Date.now() + (14 * 24 * 60 * 60 * 1000) // Dû dans 14 jours
      },
      {
        id: 'bere_boire',
        word: 'bere',
        translation: 'boire',
        category: 'vocabulary',
        topic: 'Actions',
        lastReviewed: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 jours
        masteryLevel: 85,
        timesReviewed: 6,
        timesCorrect: 5,
        context: 'Verbe d\'action',
        eFactor: 2.6,
        interval: 5,
        repetitions: 3,
        nextReview: Date.now() + (3 * 24 * 60 * 60 * 1000) // Dû dans 3 jours
      },
      {
        id: 'dormire_dormir',
        word: 'dormire',
        translation: 'dormir',
        category: 'vocabulary',
        topic: 'Actions',
        lastReviewed: Date.now() - (6 * 24 * 60 * 60 * 1000), // 6 jours
        masteryLevel: 45,
        timesReviewed: 3,
        timesCorrect: 1,
        context: 'Verbe d\'action',
        eFactor: 1.9,
        interval: 1,
        repetitions: 1,
        nextReview: Date.now() - (5 * 24 * 60 * 60 * 1000) // Dû il y a 5 jours
      },
      {
        id: 'casa_maison',
        word: 'casa',
        translation: 'maison',
        category: 'vocabulary',
        topic: 'Habitat',
        lastReviewed: Date.now() - (4 * 24 * 60 * 60 * 1000), // 4 jours
        masteryLevel: 75,
        timesReviewed: 5,
        timesCorrect: 4,
        context: 'Nom commun',
        eFactor: 2.5,
        interval: 4,
        repetitions: 2,
        nextReview: Date.now() // Dû aujourd'hui
      },
      {
        id: 'macchina_voiture',
        word: 'macchina',
        translation: 'voiture',
        category: 'vocabulary',
        topic: 'Transport',
        lastReviewed: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 jours
        masteryLevel: 65,
        timesReviewed: 4,
        timesCorrect: 3,
        context: 'Moyen de transport',
        eFactor: 2.2,
        interval: 3,
        repetitions: 2,
        nextReview: Date.now() - (5 * 24 * 60 * 60 * 1000) // Dû il y a 5 jours
      },
      {
        id: 'libro_livre',
        word: 'libro',
        translation: 'livre',
        category: 'vocabulary',
        topic: 'Objets',
        lastReviewed: Date.now() - (12 * 24 * 60 * 60 * 1000), // 12 jours
        masteryLevel: 55,
        timesReviewed: 3,
        timesCorrect: 2,
        context: 'Objet de lecture',
        eFactor: 2.1,
        interval: 2,
        repetitions: 1,
        nextReview: Date.now() - (10 * 24 * 60 * 60 * 1000) // Dû il y a 10 jours
      },
      {
        id: 'acqua_eau',
        word: 'acqua',
        translation: 'eau',
        category: 'vocabulary',
        topic: 'Boissons',
        lastReviewed: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 jour
        masteryLevel: 95,
        timesReviewed: 12,
        timesCorrect: 11,
        context: 'Élément liquide',
        eFactor: 3.2,
        interval: 20,
        repetitions: 8,
        nextReview: Date.now() + (19 * 24 * 60 * 60 * 1000) // Dû dans 19 jours
      },
      {
        id: 'pane_pain',
        word: 'pane',
        translation: 'pain',
        category: 'vocabulary',
        topic: 'Nourriture',
        lastReviewed: Date.now() - (9 * 24 * 60 * 60 * 1000), // 9 jours
        masteryLevel: 35,
        timesReviewed: 2,
        timesCorrect: 1,
        context: 'Aliment de base',
        eFactor: 1.7,
        interval: 1,
        repetitions: 0,
        nextReview: Date.now() - (8 * 24 * 60 * 60 * 1000) // Dû il y a 8 jours
      },
      {
        id: 'vino_vin',
        word: 'vino',
        translation: 'vin',
        category: 'vocabulary',
        topic: 'Boissons',
        lastReviewed: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 jours
        masteryLevel: 25,
        timesReviewed: 1,
        timesCorrect: 0,
        context: 'Boisson alcoolisée',
        eFactor: 1.3,
        interval: 1,
        repetitions: 0,
        nextReview: Date.now() - (14 * 24 * 60 * 60 * 1000) // Dû il y a 14 jours
      },
      {
        id: 'pizza_pizza',
        word: 'pizza',
        translation: 'pizza',
        category: 'vocabulary',
        topic: 'Nourriture',
        lastReviewed: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 jours
        masteryLevel: 80,
        timesReviewed: 7,
        timesCorrect: 6,
        context: 'Plat italien',
        eFactor: 2.8,
        interval: 8,
        repetitions: 4,
        nextReview: Date.now() + (1 * 24 * 60 * 60 * 1000) // Dû dans 1 jour
      },
      {
        id: 'pasta_pates',
        word: 'pasta',
        translation: 'pâtes',
        category: 'vocabulary',
        topic: 'Nourriture',
        lastReviewed: Date.now() - (11 * 24 * 60 * 60 * 1000), // 11 jours
        masteryLevel: 70,
        timesReviewed: 5,
        timesCorrect: 4,
        context: 'Plat de base',
        eFactor: 2.4,
        interval: 6,
        repetitions: 3,
        nextReview: Date.now() - (5 * 24 * 60 * 60 * 1000) // Dû il y a 5 jours
      },
      {
        id: 'caffe_cafe',
        word: 'caffè',
        translation: 'café',
        category: 'vocabulary',
        topic: 'Boissons',
        lastReviewed: Date.now() - (13 * 24 * 60 * 60 * 1000), // 13 jours
        masteryLevel: 60,
        timesReviewed: 4,
        timesCorrect: 3,
        context: 'Boisson chaude',
        eFactor: 2.3,
        interval: 4,
        repetitions: 2,
        nextReview: Date.now() - (9 * 24 * 60 * 60 * 1000) // Dû il y a 9 jours
      },
      {
        id: 'amore_amour',
        word: 'amore',
        translation: 'amour',
        category: 'vocabulary',
        topic: 'Sentiments',
        lastReviewed: Date.now() - (16 * 24 * 60 * 60 * 1000), // 16 jours
        masteryLevel: 20,
        timesReviewed: 1,
        timesCorrect: 0,
        context: 'Sentiment fort',
        eFactor: 1.3,
        interval: 1,
        repetitions: 0,
        nextReview: Date.now() - (15 * 24 * 60 * 60 * 1000) // Dû il y a 15 jours
      }
    ];

    // Sauvegarder les mots de test
    this.vocabularyTrackingService.saveAllWords(testWords);
    
    this.showToast('20 mots de test générés avec succès !');
  }

  /**
   * Teste l'algorithme SM-2 et affiche les résultats
   */
  testSM2Algorithm() {
    const allWords = this.vocabularyTrackingService.getAllTrackedWords();
    
    if (allWords.length === 0) {
      this.showToast('Aucun mot trouvé. Générez d\'abord des mots de test.');
      return;
    }

    // Trier les mots par priorité SM-2
    const sortedWords = this.sm2Service.sortWordsByPriority(allWords);
    
    // Récupérer les mots dûs pour révision
    const dueWords = this.sm2Service.getWordsDueForReview(allWords);
    
    // Afficher les résultats
    this.showSM2Results(sortedWords, dueWords);
  }

  /**
   * Affiche les résultats du test SM-2
   */
  private async showSM2Results(sortedWords: WordMastery[], dueWords: WordMastery[]) {
    // Formater le message en texte simple
    let message = `📊 STATISTIQUES\n\n`;
    message += `Total de mots : ${sortedWords.length}\n`;
    message += `Mots dûs pour révision : ${dueWords.length}\n\n`;
    
    message += `🏆 TOP 10 DES MOTS PRIORITAIRES (SM-2)\n\n`;
    
    sortedWords.slice(0, 10).forEach((word, index) => {
      message += `${index + 1}. ${word.word} → ${word.translation}\n`;
      message += `   EF: ${word.eFactor?.toFixed(1) || '2.5'}\n`;
      message += `   Intervalle: ${word.interval || 0} jours\n`;
      message += `   Répétitions: ${word.repetitions || 0}\n`;
      message += `   Maîtrise: ${word.masteryLevel}%\n`;
      message += `   Dû: ${this.sm2Service.isDueForReview(word) ? 'OUI' : 'NON'}\n\n`;
    });
    
    if (dueWords.length > 0) {
      message += `📅 MOTS DÛS POUR RÉVISION\n\n`;
      dueWords.forEach(word => {
        message += `• ${word.word} → ${word.translation} (EF: ${word.eFactor?.toFixed(1) || '2.5'})\n`;
      });
    }
    
    const alert = await this.alertController.create({
      header: 'Résultats du test SM-2',
      message: message,
      buttons: ['Compris']
    });
    await alert.present();
  }

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
    console.log('Ouverture des paramètres de l\'application...');
    // Pour l'instant, on affiche juste un message
    this.showToast('Allez dans Paramètres > Applications > NuovaLingua > Notifications');
  }
} 