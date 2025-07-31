import { Component } from '@angular/core';
import { IonicModule, ModalController, Platform, MenuController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { LlmService } from './services/llm.service';
import { VocabularyExercise, ComprehensionText, VocabularyItem } from './models/vocabulary';
import { AddWordComponent } from './components/add-word/add-word.component';
import { filter } from 'rxjs/operators';
import { StatusBar } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { NotificationService } from './services/notification.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PersonalDictionaryService } from './services/personal-dictionary.service';
import { StorageService } from './services/storage.service';
import { ToastController } from '@ionic/angular';

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
    RouterOutlet,
    RouterLink,
    CommonModule,
    AddWordComponent
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
    '/home': 'Accueil',
    '/category': 'Catégories',
    '/vocabulary': 'Vocabulaire',
    '/comprehension': 'Compréhension',
    '/questions': 'Questions',
    '/personal-dictionary': 'Mon dictionnaire personnel',
    '/saved-texts': 'Textes sauvegardés',
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
    private toastController: ToastController
  ) {
    this.setupRouteListener();
    this.initializeApp();
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
        console.log('Menu re-enabled after timeout');
        
        // Ajouter un écouteur pour les gestes de balayage
        this.setupSwipeGesture();
      }, 1000);
      
      console.log('Menu initialized successfully');
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
      console.log('Menu opened successfully');
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
      console.log('Menu closed successfully');
    } catch (error) {
      console.error('Error closing menu:', error);
    }
  }

  /**
   * Méthode pour forcer l'ouverture du menu
   */
  async forceOpenMenu() {
    try {
      console.log('Forcing menu to open...');
      await this.menuController.enable(true);
      await this.menuController.open();
      console.log('Menu forced open successfully');
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

  onCategorySelected(event: {category: string, topic: string}) {
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
   * Configure la gestion des notifications
   */
  private setupNotificationHandling() {
    // Écouter les clics sur les notifications
    LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
      console.log('🔔 [Notification] Action effectuée:', notificationAction);
      
      // Vérifier si c'est notre notification quotidienne
      if (notificationAction.notification.id === 1001 || notificationAction.notification.id === 9999) {
        const extra = notificationAction.notification.extra;
        
        if (extra && extra.action === 'start_revision') {
          console.log('🔔 [Notification] Lancement de la révision du dictionnaire personnel');
          
          // Lancer directement la révision du dictionnaire personnel
          this.startPersonalDictionaryRevision();
        }
      }
    });

    // Écouter les notifications reçues (quand l'app est fermée)
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('🔔 [Notification] Notification reçue:', notification);
      
      // Vérifier si c'est notre notification quotidienne
      if (notification.id === 1001 || notification.id === 9999) {
        const extra = notification.extra;
        
        if (extra && extra.action === 'start_revision') {
          console.log('🔔 [Notification] Lancement de la révision du dictionnaire personnel');
          
          // Lancer directement la révision du dictionnaire personnel
          this.startPersonalDictionaryRevision();
        }
      }
    });
  }

  /**
   * Lance directement une session de révision du dictionnaire personnel
   */
  private async startPersonalDictionaryRevision() {
    try {
      // Récupérer les mots disponibles pour la révision (filtrés par minRevisionDate)
      const availableWords = this.personalDictionaryService.getAvailableWordsForRevision();
      
      if (availableWords.length === 0) {
        const toast = await this.toastController.create({
          message: 'Aucun mot disponible pour la révision à ce moment. Vérifiez les dates de révision de vos mots !',
          duration: 3000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
        return;
      }

      // Récupérer le nombre de mots configuré dans les préférences
      const savedCount = this.storageService.get('personalDictionaryWordsCount');
      const maxWords = savedCount ? parseInt(savedCount) : 8; // Valeur par défaut si pas configurée
      
      // Sélectionner aléatoirement des mots (entre 3 et 20, ou tous si moins de 3)
      const actualMaxWords = Math.min(20, Math.max(3, Math.min(maxWords, availableWords.length)));
      const selectedWords = this.shuffleArray(availableWords).slice(0, actualMaxWords);

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

      console.log('🔔 [Notification] Mots révisés créés:', revisedWords.length);

      // Sauvegarder les données de session
      const sessionInfo = {
        category: 'Dictionnaire personnel',
        topic: 'Révision personnalisée',
        date: new Date().toISOString(),
        translationDirection: 'fr2it' as const
      };

      // Sauvegarder dans le localStorage
      this.storageService.set('sessionInfo', sessionInfo);
      this.storageService.set('wordPairs', wordPairs);
      this.storageService.set('isPersonalDictionaryRevision', true);
      this.storageService.set('revisedWords', revisedWords);

      console.log('🔔 [Notification] Données sauvegardées, navigation vers l\'exercice');

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
}
