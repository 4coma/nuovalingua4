import { Component } from '@angular/core';
import { IonicModule, ModalController, Platform, MenuController, ActionSheetController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { LlmService } from './services/llm.service';
import { VocabularyExercise, ComprehensionText, VocabularyItem } from './models/vocabulary';
import { filter } from 'rxjs/operators';
import { StatusBar } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { NotificationService } from './services/notification.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PersonalDictionaryService, DictionaryWord } from './services/personal-dictionary.service';
import { StorageService } from './services/storage.service';
import { ToastController } from '@ionic/angular';
import { TextGeneratorService } from './services/text-generator.service';
import { AddTextModalComponent } from './components/add-text-modal/add-text-modal.component';
import { TextPreviewModalComponent } from './components/text-preview-modal/text-preview-modal.component';
import { AddWordComponent } from './components/add-word/add-word.component';
import { NewWordsModalComponent } from './components/new-words-modal/new-words-modal.component';
import { PomService } from './services/pom.service';

enum AppState {
  CATEGORY_SELECTION,
  VOCABULARY_EXERCISE,
  COMPREHENSION_EXERCISE
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    RouterLink,
    CommonModule
  ]
})
export class AppComponent {
  currentState = AppState.CATEGORY_SELECTION;

  // Store the current exercises
  vocabularyExercise: VocabularyExercise | null = null;
  comprehensionText: ComprehensionText | null = null;

  // States enum for template
  appStates = AppState;

  // Header management
  currentPageTitle: string = 'NuovaLingua';
  showBackButton: boolean = false;

  // Mapping des routes aux titres
  pageTitles: { [key: string]: string } = {
    '/home': 'Mode d\'entrainement',
    '/category': 'Catégories',
    '/vocabulary': 'Vocabulaire',
    '/comprehension': 'Compréhension',
    '/questions': 'Questions',
    '/personal-dictionary': 'Mon dictionnaire personnel',
    '/personal-revision-setup': 'Révision personnalisée',
    '/saved-conversations': 'Mes conversations',
    '/saved-texts': 'Textes sauvegardés',
    '/poms': 'Mes POMs',
    '/preferences': 'Préférences'
  };

  // Routes où le bouton retour doit être affiché
  routesWithBackButton: string[] = [
    '/vocabulary',
    '/comprehension',
    '/questions',
    '/personal-dictionary'
  ];

  constructor(
    private llmService: LlmService,
    private router: Router,
    private modalController: ModalController,
    private platform: Platform,
    private menuController: MenuController,
    private notificationService: NotificationService,
    private personalDictionaryService: PersonalDictionaryService,
    private storageService: StorageService,
    private toastController: ToastController,
    private textGeneratorService: TextGeneratorService,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private pomService: PomService
  ) {
    this.setupRouteListener();
    this.initializeApp();
  }

  // ... (existing methods)

  /**
   * Configure la gestion des notifications
   */
  private setupNotificationHandling() {
    // Écouter les clics sur les notifications
    LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {

      // Vérifier l'action associée
      const extra = notificationAction.notification.extra;

      if (extra && extra.action === 'start_revision') {
        this.startPersonalDictionaryRevision({
          newWordIds: extra.newWordIds
        });
      }

      if (extra && extra.action === 'start_comprehension') {
        this.startDailyComprehension();
      }

      if (extra && extra.action === 'start_pom_review') {
        this.startPomReviewSession(extra.pomId);
      }
    });

    // Écouter les notifications reçues (quand l'app est fermée)
    LocalNotifications.addListener('localNotificationReceived', (notification) => {

      const extra = notification.extra;

      if (extra && extra.action === 'start_revision') {
        this.startPersonalDictionaryRevision({
          newWordIds: extra.newWordIds
        });
      }

      if (extra && extra.action === 'start_comprehension') {
        this.startDailyComprehension();
      }

      if (extra && extra.action === 'start_pom_review') {
        this.startPomReviewSession(extra.pomId);
      }
    });

    // Écouter les notifications Web (Toasts/Browser)
    this.notificationService.onAction$.subscribe(payload => {
      console.log('[AppComponent] Action notification Web reçue:', payload);
      if (payload.action === 'start_pom_review' && payload.pomId) {
        this.startPomReviewSession(payload.pomId);
      } else if (payload.action === 'start_revision') {
        this.startPersonalDictionaryRevision({ newWordIds: payload.extra?.newWordIds });
      } else if (payload.action === 'start_comprehension') {
        this.startDailyComprehension();
      }
    });
  }

  /**
   * Démarre une session de révision POM
   */
  private async startPomReviewSession(pomId: string) {
    if (!pomId) return;

    try {
      const pomWords = this.pomService.getPomWords(pomId);
      if (pomWords.length === 0) {
        console.warn('Aucun mot trouvé pour le POM:', pomId);
        return;
      }

      const sessionInfo = {
        category: 'Révision Espacée (POM)',
        topic: 'Révision',
        date: new Date().toISOString(),
        translationDirection: 'fr2it' as const
      };

      this.storageService.set('sessionInfo', sessionInfo);
      this.storageService.set('wordPairs', pomWords);
      this.storageService.set('isPomReview', true);
      this.storageService.set('pomId', pomId);
      this.pomService.setPomReviewSessionMeta(pomId);

      // Clear other flags
      this.storageService.set('isPersonalDictionaryRevision', false);
      this.storageService.set('fullRevisionActive', false);

      this.router.navigate(['/word-pairs-game'], { queryParams: { pomStart: Date.now() } });
    } catch (error) {
      console.error('Erreur lors du démarrage de la révision POM:', error);
    }
  }

  /**
   * Initialise l'application et configure les barres de statut et de navigation
   */
  private async initializeApp() {
    await this.platform.ready();

    // Initialiser le service de notification
    await this.notificationService.initialize();

    // Configurer la gestion des notifications
    this.setupNotificationHandling();

    // Reprogrammer les notifications POM (important pour le Web après refresh)
    await this.pomService.reScheduleAllNotifications();

    App.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        await this.pomService.reScheduleAllNotifications();
      }
    });

    if (this.platform.is('android') || this.platform.is('ios')) {
      try {
        // Configuration de la StatusBar pour qu'elle soit opaque
        StatusBar.setBackgroundColor({ color: '#3880ff' });
        StatusBar.setStyle({ style: 'LIGHT' as any });

        // Gestion du bouton retour sur Android
        App.addListener('backButton', () => {
          if (!this.router.navigated) {
            App.exitApp();
          }
        });

        // S'assurer que le menu est bien initialisé sur mobile
        this.initializeMenu();
      } catch (error) {
        console.error('Error initializing status bar', error);
      }
    }
  }

  /**
   * Initialise le menu pour les appareils mobiles
   */
  private async initializeMenu() {
    try {
      // S'assurer que le menu est fermé au démarrage
      await this.menuController.close();

      // Activer le menu pour qu'il soit utilisable
      await this.menuController.enable(true);

      // Forcer la réinitialisation du menu
      setTimeout(async () => {
        await this.menuController.enable(true);

        // Ajouter un écouteur pour les gestes de balayage
        this.setupSwipeGesture();
      }, 1000);

    } catch (error) {
      console.error('Error initializing menu:', error);
    }
  }

  /**
   * Configure le geste de balayage pour ouvrir le menu
   */
  private setupSwipeGesture() {
    if (this.platform.is('android') || this.platform.is('ios')) {
      let startX = 0;
      let startY = 0;

      document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      });

      document.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        // Si le balayage est horizontal et vers la droite depuis le bord gauche
        if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50 && startX < 50) {
          this.testMenuOpen();
        }
      });
    }
  }

  /**
   * Méthode pour tester l'ouverture du menu
   */
  async testMenuOpen() {
    try {
      await this.menuController.open();
    } catch (error) {
      console.error('Error opening menu:', error);
    }
  }

  /**
   * Méthode pour fermer le menu
   */
  async closeMenu() {
    try {
      await this.menuController.close();
    } catch (error) {
      console.error('Error closing menu:', error);
    }
  }

  /**
   * Méthode pour forcer l'ouverture du menu
   */
  async forceOpenMenu() {
    try {
      await this.menuController.enable(true);
      await this.menuController.open();
    } catch (error) {
      console.error('Error forcing menu open:', error);
    }
  }

  /**
   * Configure l'écoute des changements de route pour mettre à jour le titre
   */
  private setupRouteListener() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentRoute = event.urlAfterRedirects;
      this.updateHeaderForRoute(currentRoute);
    });
  }

  /**
   * Met à jour le header quand la route change
   */
  private updateHeaderForRoute(route: string) {
    // Mise à jour du titre
    this.currentPageTitle = this.pageTitles[route] || 'NuovaLingua';

    // Affichage du bouton retour
    this.showBackButton = this.routesWithBackButton.includes(route);
  }

  /**
   * Appelé quand un composant est activé via le router-outlet
   */
  onRouteActivate(component: any) {
    // Si le composant a un titre personnalisé, l'utiliser
    if (component.pageTitle) {
      this.currentPageTitle = component.pageTitle;
    }
  }

  onCategorySelected(event: { category: string, topic: string }) {
    // Generate a vocabulary exercise based on the selected category and topic
    this.llmService.generateVocabularyExercise(event.category, event.topic)
      .subscribe(
        (exercise) => {
          this.vocabularyExercise = exercise;
          this.currentState = AppState.VOCABULARY_EXERCISE;
          this.router.navigate(['/vocabulary']);
        },
        (error) => {
          console.error('Error generating vocabulary exercise:', error);
          // Handle error appropriately
        }
      );
  }

  onComprehensionRequested(event: { type: 'written' | 'oral', vocabularyItems: VocabularyItem[] }) {
    // Generate a comprehension exercise based on the selected type and vocabulary items
    this.llmService.generateComprehensionExercise(event.type, event.vocabularyItems)
      .subscribe(
        (comprehensionText) => {
          this.comprehensionText = comprehensionText;
          this.currentState = AppState.COMPREHENSION_EXERCISE;
          this.router.navigate(['/comprehension']);
        },
        (error) => {
          console.error('Error generating comprehension exercise:', error);
          // Handle error appropriately
        }
      );
  }

  onExerciseComplete() {
    // Go back to category selection
    this.currentState = AppState.CATEGORY_SELECTION;
    this.vocabularyExercise = null;
    this.comprehensionText = null;
    this.router.navigate(['/category']);
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
  }


  /**
   * Lance directement une session de révision du dictionnaire personnel
   * Utilise un algorithme simple basé sur minRevisionDate (pas SM-2)
   */
  private async startPersonalDictionaryRevision(options?: {
    newWordIds?: string[];
  }) {
    try {
      let selectedWords: DictionaryWord[] | null = null;
      let sessionTopic = 'Révision personnalisée';

      if (options?.newWordIds && options.newWordIds.length > 0) {
        const todayWords = this.personalDictionaryService.getWordsByIds(options.newWordIds);
        if (todayWords.length > 0) {
          const shouldStart = await this.showNewWordsPrompt(todayWords);
          if (!shouldStart) {
            return;
          }
          selectedWords = todayWords;
          sessionTopic = 'Nouveaux mots du jour';
        }
      }

      if (!selectedWords) {
        // Récupérer les mots à réviser aujourd'hui (algorithme simple)
        const wordsToReviewToday = this.personalDictionaryService.getWordsToReviewToday();

        if (wordsToReviewToday.length === 0) {
          const toast = await this.toastController.create({
            message: 'Aucun mot à réviser aujourd\'hui. Vérifiez les dates de révision de vos mots !',
            duration: 3000,
            position: 'bottom',
            color: 'warning'
          });
          await toast.present();
          return;
        }

        // Utiliser tous les mots à réviser aujourd'hui (pas de limite arbitraire)
        selectedWords = wordsToReviewToday;
      }

      // Créer les paires de mots pour l'exercice d'association
      const wordPairs = selectedWords.map(word => ({
        it: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
        fr: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
        context: word.contextualMeaning
      }));

      // Créer la liste des mots révisés pour l'affichage
      const revisedWords = selectedWords.map(word => ({
        id: word.id,
        sourceWord: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
        targetWord: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
        context: word.contextualMeaning,
        revisionDelay: undefined, // Sera défini par l'utilisateur
        isKnown: word.isKnown || false // Récupérer le statut existant ou false par défaut
      }));


      // Sauvegarder les données de session
      const sessionInfo = {
        category: 'Dictionnaire personnel',
        topic: sessionTopic,
        date: new Date().toISOString(),
        translationDirection: 'fr2it' as const
      };

      // Sauvegarder dans le localStorage
      this.storageService.set('sessionInfo', sessionInfo);
      this.storageService.set('wordPairs', wordPairs);
      this.storageService.set('isPersonalDictionaryRevision', true);
      this.storageService.set('revisedWords', revisedWords);

      // Nettoyer les flags POM pour éviter les conflits
      localStorage.removeItem('isPomReview');
      localStorage.removeItem('pomId');
      localStorage.removeItem('pomReviewCounts');
      localStorage.removeItem('pomReviewDueAt');
      localStorage.removeItem('pomReviewWindowEnd');


      // Naviguer vers l'exercice d'association
      this.router.navigate(['/word-pairs-game']);

    } catch (error) {
      console.error('Erreur lors du démarrage de la révision depuis la notification:', error);
      const toast = await this.toastController.create({
        message: 'Erreur lors du démarrage de la révision',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  private async showNewWordsPrompt(words: DictionaryWord[]): Promise<boolean> {
    const modal = await this.modalController.create({
      component: NewWordsModalComponent,
      componentProps: {
        words: words
      },
      cssClass: 'new-words-modal'
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    return data === true;
  }

  /**
   * Génère et lance une compréhension orale quotidienne avec les 10 derniers mots ajoutés
   */
  private async startDailyComprehension() {
    try {
      const allWords = this.personalDictionaryService.getAllWords();
      if (allWords.length === 0) {
        const toast = await this.toastController.create({
          message: 'Ajoutez des mots à votre dictionnaire pour générer une compréhension.',
          duration: 3000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
        return;
      }

      // Trier les mots par date d'ajout (du plus récent au plus ancien) et prendre les 10 derniers ajoutés
      const selected = [...allWords]
        .sort((a, b) => b.dateAdded - a.dateAdded)
        .slice(0, 10);
      const wordPairs = selected.map(w => ({
        it: w.sourceLang === 'it' ? w.sourceWord : w.targetWord,
        fr: w.sourceLang === 'fr' ? w.sourceWord : w.targetWord,
        context: w.contextualMeaning
      }));

      // Charger les thèmes personnalisés et en sélectionner un aléatoirement
      const savedThemes = this.storageService.get('dailyComprehensionThemes');
      let selectedContext: string[] | undefined;

      if (savedThemes) {
        try {
          const themes = JSON.parse(savedThemes);
          const validThemes = themes.filter((t: string) => t.trim() !== '');
          if (validThemes.length > 0) {
            const randomIndex = Math.floor(Math.random() * validThemes.length);
            selectedContext = [validThemes[randomIndex]];
          }
        } catch (e) {
          console.error('Erreur lors du chargement des thèmes personnalisés:', e);
        }
      }

      // Charger le prompt personnalisé pour la compréhension orale quotidienne
      const customPrompt = this.storageService.get('comprehensionNotificationCustomPrompt') || undefined;

      const sessionInfo = {
        category: 'Compréhension quotidienne',
        topic: 'Notification',
        date: new Date().toISOString(),
        translationDirection: 'fr2it' as const
      };

      this.storageService.set('sessionInfo', sessionInfo);

      this.textGeneratorService.generateComprehensionText(wordPairs, 'oral', selectedContext, customPrompt).subscribe({
        next: (result) => {
          localStorage.setItem('comprehensionText', JSON.stringify(result));
          this.router.navigate(['/comprehension']);
        },
        error: async () => {
          const toast = await this.toastController.create({
            message: 'Erreur lors de la génération du texte',
            duration: 3000,
            position: 'bottom',
            color: 'danger'
          });
          await toast.present();
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la compréhension:', error);
    }
  }

  /**
   * Mélange un tableau d'éléments
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Ouvre l'action sheet de sélection d'action pour le bouton +
   */
  async openActionSelection() {

    const actionSheet = await this.actionSheetController.create({
      header: 'Que voulez-vous faire ?',
      buttons: [
        {
          text: 'Ajouter un mot',
          icon: 'add-circle-outline',
          handler: () => {
            this.openAddWordModal();
          }
        },
        {
          text: 'Ajouter un texte',
          icon: 'document-text-outline',
          handler: () => {
            this.openAddTextModal();
          }
        },
        {
          text: 'Annuler',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }


  /**
   * Ouvre le modal d'ajout de texte
   */
  async openAddTextModal() {

    try {
      const modal = await this.modalController.create({
        component: AddTextModalComponent,
        cssClass: 'add-text-modal'
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();

      if (data && data.action === 'preview') {
        this.openTextPreviewModal(data.text);
      }
    } catch (error) {
      console.error('🔍 [AppComponent] Erreur lors de l\'ouverture du modal AddTextModal:', error);
    }
  }

  /**
   * Ouvre le modal de prévisualisation du texte
   */
  async openTextPreviewModal(text: string) {

    try {
      const modal = await this.modalController.create({
        component: TextPreviewModalComponent,
        cssClass: 'text-preview-modal',
        componentProps: {
          text: text
        }
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();

      if (data && data.action === 'edit') {
        this.openAddTextModal();
      }
    } catch (error) {
      console.error('🔍 [AppComponent] Erreur lors de l\'ouverture du modal TextPreview:', error);
    }
  }
}
