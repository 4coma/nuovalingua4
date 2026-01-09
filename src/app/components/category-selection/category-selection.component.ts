import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LlmService, WordPair, TranslationDirection } from '../../services/llm.service';
import { PersonalDictionaryService } from '../../services/personal-dictionary.service';
import { FormsModule } from '@angular/forms';
import { CustomPromptModalComponent } from '../custom-prompt-modal/custom-prompt-modal.component';
import { CustomInstructionModalComponent } from '../custom-instruction-modal/custom-instruction-modal.component';
import { StorageService } from '../../services/storage.service';
import { PomService } from '../../services/pom.service';
import { COURSE_DATA } from '../../data/course-data';

export interface ProgressItem {
  id?: string; // ID pour mapper vers le contenu statique
  label: string;
  progress: number;
}

export interface Level {
  id: number;
  title: string;
  subtitle: string;
  progress: number; // Global level progress
  sections: {
    domaines: ProgressItem[];
    lexical: ProgressItem[];
    verbs: ProgressItem[];
    domainesProgress: number; // Section aggregated progress
    lexicalProgress: number;
    verbsProgress: number;
  };
  objective: string;
}

@Component({
  selector: 'app-category-selection',
  templateUrl: './category-selection.component.html',
  styleUrls: ['./category-selection.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule
  ]
})
export class CategorySelectionComponent implements OnInit, OnDestroy {
  @Output() categorySelected = new EventEmitter<{ category: string, topic: string }>();

  // Direction de traduction
  translationDirection: TranslationDirection = 'fr2it';

  levels: Level[] = [
    {
      id: 1,
      title: 'NIVEAU 1 — Exister, montrer, nommer',
      subtitle: '(présence immédiate)',
      progress: 0,
      sections: {
        domaines: [
          { id: 'lvl1-dom-self', label: 'Se désigner soi-même', progress: 0 },
          { id: 'lvl1-dom-others', label: 'Désigner les autres', progress: 0 },
          { id: 'lvl1-dom-objects', label: 'Nommer les objets visibles', progress: 0 },
          { id: 'lvl1-dom-space', label: 'Situer dans l’espace immédiat', progress: 0 },
          { id: 'lvl1-dom-affirmation', label: 'Affirmer / nier', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { id: 'lvl1-lex-pronouns', label: 'Pronoms personnels sujets', progress: 0 },
          { id: 'lvl1-lex-nouns', label: 'Noms concrets très fréquents', progress: 0 },
          { id: 'lvl1-lex-adverbs', label: 'Adverbes de lieu simples', progress: 0 },
          { id: 'lvl1-lex-articles', label: 'Articles définis / indéfinis', progress: 0 },
          { id: 'lvl1-lex-tools', label: 'Mots outils fondamentaux', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { id: 'lvl1-verb-essere', label: 'Verbes d’état au présent (être, avoir)', progress: 0 },
          { id: 'lvl1-verb-existence', label: 'Verbes d’existence et de possession au présent', progress: 0 },
          { id: 'lvl1-verb-negation', label: 'Formes affirmatives et négatives simples', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 'reconnaître, pointer, exister linguistiquement'
    },
    {
      id: 2,
      title: 'NIVEAU 2 — Vie quotidienne concrète',
      subtitle: '(actions routinières)',
      progress: 0,
      sections: {
        domaines: [
          { label: 'La maison', progress: 0 },
          { label: 'Les objets usuels', progress: 0 },
          { label: 'Les besoins primaires', progress: 0 },
          { label: 'Les habitudes journalières', progress: 0 }
        ],
        domainesProgress: 75,
        lexical: [
          { label: 'Objets du quotidien', progress: 0 },
          { label: 'Alimentation et boisson', progress: 0 },
          { label: 'Corps humain (base)', progress: 0 },
          { label: 'Moments de la journée', progress: 0 },
          { label: 'Quantités simples', progress: 0 }
        ],
        lexicalProgress: 69,
        verbs: [
          { label: 'Verbes d’action courants au présent', progress: 0 },
          { label: 'Verbes réguliers au présent', progress: 0 },
          { label: 'Introduction aux verbes pronominaux (présent)', progress: 0 },
          { label: 'Présent de l’habitude', progress: 0 }
        ],
        verbsProgress: 75
      },
      objective: 'décrire ce que je fais habituellement'
    },
    {
      id: 3,
      title: 'NIVEAU 3 — Se déplacer, interagir, demander',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Déplacements', progress: 0 },
          { label: 'Orientation', progress: 0 },
          { label: 'Interaction de base', progress: 0 },
          { label: 'Services et commerces', progress: 0 }
        ],
        domainesProgress: 30,
        lexical: [
          { label: 'Lieux de la vie sociale', progress: 0 },
          { label: 'Transports', progress: 0 },
          { label: 'Directions et positions', progress: 0 },
          { label: 'Politesse et interaction', progress: 0 },
          { label: 'Questions essentielles', progress: 0 }
        ],
        lexicalProgress: 30,
        verbs: [
          { label: 'Verbes de mouvement au présent', progress: 0 },
          { label: 'Pouvoir / vouloir / devoir au présent', progress: 0 },
          { label: 'Construction interrogative', progress: 0 },
          { label: 'Impératif simple (instructions)', progress: 0 }
        ],
        verbsProgress: 25
      },
      objective: 'agir dans l’espace social immédiat'
    },
    {
      id: 4,
      title: 'NIVEAU 4 — Vie sociale et relations',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Famille', progress: 0 },
          { label: 'Relations sociales', progress: 0 },
          { label: 'Travail et rôles sociaux', progress: 0 },
          { label: 'Loisirs et activités', progress: 0 }
        ],
        domainesProgress: 10,
        lexical: [
          { label: 'Personnes et relations', progress: 0 },
          { label: 'Professions', progress: 0 },
          { label: 'Activités sociales', progress: 0 },
          { label: 'Adjectifs qualificatifs', progress: 0 },
          { label: 'Comparaison simple', progress: 0 }
        ],
        lexicalProgress: 10,
        verbs: [
          { label: 'Verbes relationnels au présent', progress: 0 },
          { label: 'Présent descriptif', progress: 0 },
          { label: 'Introduction au passé composé (formes isolées)', progress: 0 },
          { label: 'Passé composé pour faits ponctuels simples', progress: 0 }
        ],
        verbsProgress: 9
      },
      objective: 'raconter des interactions récentes'
    },
    {
      id: 5,
      title: 'NIVEAU 5 — Raconter le passé vécu',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Expériences personnelles', progress: 0 },
          { label: 'Souvenirs', progress: 0 },
          { label: 'Événements passés', progress: 0 },
          { label: 'Histoires simples', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { label: 'Temps du passé', progress: 0 },
          { label: 'Adverbes temporels', progress: 0 },
          { label: 'Expressions chronologiques', progress: 0 },
          { label: 'Lieux du passé', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { label: 'Passé composé (avere / essere)', progress: 0 },
          { label: 'Accord du participe passé', progress: 0 },
          { label: 'Verbes de mouvement au passé composé', progress: 0 },
          { label: 'Introduction à l’imparfait (description, habitudes)', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 'structurer un récit simple'
    },
    {
      id: 6,
      title: 'NIVEAU 6 — Décrire, nuancer, contextualiser',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Description de situations', progress: 0 },
          { label: 'États, émotions, ambiances', progress: 0 },
          { label: 'Habitudes passées', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { label: 'Émotions et états', progress: 0 },
          { label: 'Adjectifs avancés', progress: 0 },
          { label: 'Comparatifs et superlatifs', progress: 0 },
          { label: 'Causes simples', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { label: 'Imparfait (usages principaux)', progress: 0 },
          { label: 'Passé composé vs imparfait', progress: 0 },
          { label: 'Verbes d’état au passé', progress: 0 },
          { label: 'Connecteurs causaux', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 'enrichir et nuancer le récit'
    },
    {
      id: 7,
      title: 'NIVEAU 7 — Se projeter et envisager',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Projets', progress: 0 },
          { label: 'Intentions', progress: 0 },
          { label: 'Prévisions', progress: 0 },
          { label: 'Organisation', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { label: 'Temps futur', progress: 0 },
          { label: 'Marques de probabilité', progress: 0 },
          { label: 'Expressions d’intention', progress: 0 },
          { label: 'Planification', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { label: 'Futur simple', progress: 0 },
          { label: 'Futur proche', progress: 0 },
          { label: 'Conditionnel présent (politesse, hypothèse simple)', progress: 0 },
          { label: 'Verbes de projection', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 'parler de ce qui n’existe pas encore'
    },
    {
      id: 8,
      title: 'NIVEAU 8 — Expliquer, justifier, relier',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Raisonnement', progress: 0 },
          { label: 'Justification', progress: 0 },
          { label: 'Argumentation simple', progress: 0 },
          { label: 'Opinions personnelles', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { label: 'Connecteurs logiques complexes', progress: 0 },
          { label: 'Causes et conséquences', progress: 0 },
          { label: 'Opinion et jugement', progress: 0 },
          { label: 'Restriction et concession', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { label: 'Subordonnées causales et finales', progress: 0 },
          { label: 'Discours indirect (présent et passé)', progress: 0 },
          { label: 'Introduction au subjonctif présent (opinions, volonté)', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 'structurer une pensée'
    },
    {
      id: 9,
      title: 'NIVEAU 9 — Langue sociale avancée',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Vie publique', progress: 0 },
          { label: 'Institutions', progress: 0 },
          { label: 'Travail organisé', progress: 0 },
          { label: 'Société', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { label: 'Lexique administratif', progress: 0 },
          { label: 'Lexique professionnel', progress: 0 },
          { label: 'Registres de langue', progress: 0 },
          { label: 'Politesse avancée', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { label: 'Subjonctif présent (usages étendus)', progress: 0 },
          { label: 'Subjonctif passé', progress: 0 },
          { label: 'Concordance des temps', progress: 0 },
          { label: 'Formes impersonnelles', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 'fonctionner dans un cadre formel'
    },
    {
      id: 10,
      title: 'NIVEAU 10 — Langue vivante, nuances et implicite',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Conversation naturelle', progress: 0 },
          { label: 'Oralité', progress: 0 },
          { label: 'Attitudes sociales', progress: 0 },
          { label: 'Sous-entendus', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { label: 'Expressions idiomatiques', progress: 0 },
          { label: 'Marqueurs discursifs', progress: 0 },
          { label: 'Langage familier', progress: 0 },
          { label: 'Atténuation et insistance', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { label: 'Conditionnel avancé', progress: 0 },
          { label: 'Modalisation', progress: 0 },
          { label: 'Reformulation verbale', progress: 0 },
          { label: 'Voix passive', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 'paraître naturel, pas scolaire'
    },
    {
      id: 11,
      title: 'NIVEAU 11 — Abstraction, culture et pensée complexe',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Culture', progress: 0 },
          { label: 'Politique', progress: 0 },
          { label: 'Idées', progress: 0 },
          { label: 'Valeurs', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { label: 'Lexique abstrait', progress: 0 },
          { label: 'Argumentation complexe', progress: 0 },
          { label: 'Champs sémantiques spécialisés', progress: 0 },
          { label: 'Nuances lexicales fines', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { label: 'Subjonctif avancé', progress: 0 },
          { label: 'Phrases complexes longues', progress: 0 },
          { label: 'Styles narratif et argumentatif', progress: 0 },
          { label: 'Discours rapporté complexe', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 'penser et débattre en italien'
    },
    {
      id: 12,
      title: 'NIVEAU 12 — Maîtrise avancée & quasi-nativité',
      subtitle: '',
      progress: 0,
      sections: {
        domaines: [
          { label: 'Humour', progress: 0 },
          { label: 'Ironie', progress: 0 },
          { label: 'Culture implicite', progress: 0 },
          { label: 'Style', progress: 0 }
        ],
        domainesProgress: 0,
        lexical: [
          { label: 'Proverbes', progress: 0 },
          { label: 'Idiomatismes rares', progress: 0 },
          { label: 'Jeux de mots', progress: 0 },
          { label: 'Références culturelles', progress: 0 }
        ],
        lexicalProgress: 0,
        verbs: [
          { label: 'Maîtrise complète des temps', progress: 0 },
          { label: 'Variations stylistiques', progress: 0 },
          { label: 'Reformulation élégante', progress: 0 },
          { label: 'Liberté syntaxique', progress: 0 }
        ],
        verbsProgress: 0
      },
      objective: 's’approprier la langue comme un espace'
    }
  ];

  selectedLevel: Level | null = null;

  // États pour les composants d'interface
  showConfirmation: boolean = false;
  isLoading: boolean = false;
  alertButtons: any[] = [];

  pageTitle = 'Parcours d\'apprentissage';

  // Contrôle du nombre de mots à générer pour le mode apprentissage
  wordsToGenerate: number = 10; // Nombre de mots à générer (par défaut 10)

  constructor(
    private llmService: LlmService,
    private router: Router,
    private personalDictionaryService: PersonalDictionaryService,
    private toastController: ToastController,
    private modalController: ModalController,
    private storageService: StorageService,
    private pomService: PomService
  ) { }

  ngOnInit() {
    // Charger la direction de traduction depuis le service
    this.translationDirection = this.llmService.translationDirection;

    // Charger le nombre de mots depuis les préférences
    const savedCount = this.storageService.get('wordAssociationsCount');
    if (savedCount) {
      this.wordsToGenerate = parseInt(savedCount);
    }
  }

  ionViewWillEnter() {
    // Calculer la progression réelle basée sur les POMs à chaque fois qu'on revient sur l'écran
    this.refreshProgress();
  }

  ionViewDidLeave() {
    // Sécurité: s'assurer que le loader est fermé quand on quitte la vue
    this.isLoading = false;
  }

  /**
   * Calcule la progression réelle de chaque leçon et niveau via le PomService
   */
  refreshProgress() {
    this.levels.forEach(level => {
      let levelTotalProgress = 0;
      let totalItemsWithId = 0;

      ['domaines', 'lexical', 'verbs'].forEach(sectionType => {
        const items = (level.sections as any)[sectionType] as ProgressItem[];
        let sectionProgressSum = 0;

        items.forEach(item => {
          if (item.id) {
            item.progress = this.pomService.getLessonProgress(item.id);
            sectionProgressSum += item.progress;
            totalItemsWithId++;
          }
        });

        if (items.length > 0) {
          (level.sections as any)[`${sectionType}Progress`] = Math.round(sectionProgressSum / items.length);
        }
      });

      // Calculer la progression globale du niveau
      const totalSectionsProgress = level.sections.domainesProgress + level.sections.lexicalProgress + level.sections.verbsProgress;
      level.progress = Math.round(totalSectionsProgress / 3);
    });
  }

  confirmStartLevel(level: Level, item?: ProgressItem) {
    this.selectedLevel = level;

    // Si une leçon spécifique est sélectionnée et qu'elle a un ID statique
    if (item && item.id) {
      this.startStaticLesson(level, item);
      return;
    }

    this.alertButtons = [
      {
        text: 'Annuler',
        role: 'cancel',
        handler: () => {
          this.cancelConfirmation();
        }
      },
      {
        text: 'Démarrer',
        handler: () => {
          this.askForCustomInstruction();
        }
      }
    ];
    this.showConfirmation = true;
  }

  /**
   * Démarre une leçon à partir de données hard-codées (statiques)
   */
  async startStaticLesson(level: Level, item: ProgressItem) {
    if (!item.id) return;

    // Pas besoin de loader pour du contenu statique instantané

    // 1. Trouver les données statiques
    let lessonData: any = null;
    const levelData = COURSE_DATA[level.id];

    if (levelData) {
      const allLessons = [...levelData.domaines, ...levelData.lexical, ...levelData.verbs];
      lessonData = allLessons.find(l => l.id === item.id);
    }

    if (lessonData) {
      // 2. Préparer les paires
      const wordPairs = lessonData.pairs;

      // 3. Stocker et naviguer
      localStorage.setItem('wordPairs', JSON.stringify(wordPairs));
      localStorage.setItem('lessonId', item.id); // Transmettre l'ID pour le POM en fin de partie
      localStorage.setItem('sessionInfo', JSON.stringify({
        category: 'Leçon',
        topic: item.label,
        date: new Date().toISOString(),
        translationDirection: this.translationDirection
      }));

      localStorage.removeItem('isPomReview');
      localStorage.removeItem('pomId');

      this.router.navigate(['/word-pairs-game']);
    } else {
      this.isLoading = false;
      const toast = await this.toastController.create({
        message: 'Contenu statique non trouvé pour cette leçon.',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
    }
  }

  cancelConfirmation() {
    this.showConfirmation = false;
  }

  startSession() {
    this.showConfirmation = false;
    this.isLoading = true;

    if (this.selectedLevel) {
      // Mettre à jour la direction de traduction dans le service
      this.llmService.translationDirection = this.translationDirection;

      // Sauvegarder le nombre de mots choisi pour cette session
      this.storageService.set('wordAssociationsCount', this.wordsToGenerate.toString());

      // Construire la consigne à partir du niveau
      const levelInstruction = `
        NIVEAU: ${this.selectedLevel.title}
        OBJECTIF COGNITIF: ${this.selectedLevel.objective}
        DOMAINES: ${this.selectedLevel.sections.domaines.map(i => i.label).join(', ')}
        CATÉGORIES LEXICALES: ${this.selectedLevel.sections.lexical.map(i => i.label).join(', ')}
        VERBES & TEMPS: ${this.selectedLevel.sections.verbs.map(i => i.label).join(', ')}
      `;

      // Générer les paires de mots via l'API OpenAI avec la consigne personnalisée implicite
      this.llmService.generateWordPairsWithCustomInstruction(
        this.selectedLevel.title,
        'curriculum', // catégorie générique pour le parcours
        levelInstruction
      ).subscribe({
        next: (wordPairs) => {
          // Stocker les paires de mots dans le localStorage pour la session
          localStorage.setItem('wordPairs', JSON.stringify(wordPairs));
          // Stocker les informations sur la session
          localStorage.setItem('sessionInfo', JSON.stringify({
            category: 'Parcours',
            topic: this.selectedLevel!.title, // Utilisation de ! car vérifié au dessus, mais TS peut râler
            date: new Date().toISOString(),
            translationDirection: this.translationDirection
          }));

          localStorage.removeItem('lessonId');
          // Nettoyer les flags POM pour éviter les conflits
          localStorage.removeItem('isPomReview');
          localStorage.removeItem('pomId');

          this.isLoading = false;

          // Naviguer vers le jeu d'association
          setTimeout(() => {
            this.router.navigate(['/word-pairs-game']);
          }, 100);
        },
        error: (error) => {
          console.error('Erreur lors de la génération des paires de mots:', error);
          this.isLoading = false;
          // Gérer l'erreur
          alert('Erreur lors de la génération du contenu. Veuillez réessayer.');
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  /**
   * Demande à l'utilisateur s'il veut ajouter une consigne spécifique
   */
  async askForCustomInstruction() {
    const modal = await this.modalController.create({
      component: CustomInstructionModalComponent,
      cssClass: 'custom-instruction-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data && data.instruction) {
      // Lancer la session avec la consigne personnalisée
      this.startSessionWithCustomInstruction(data.instruction);
    } else {
      // Lancer la session normale
      this.startSession();
    }
  }

  /**
   * Démarre une session avec une consigne personnalisée
   */
  startSessionWithCustomInstruction(customInstruction: string) {
    this.isLoading = true;

    if (this.selectedLevel) {
      // Mettre à jour la direction de traduction
      this.llmService.translationDirection = this.translationDirection;
      this.storageService.set('wordAssociationsCount', this.wordsToGenerate.toString());

      // Combiner la consigne du niveau avec la consigne utilisateur
      const levelInstruction = `
        CONTEXTE DU NIVEAU:
        ${this.selectedLevel.title}
        OBJECTIF: ${this.selectedLevel.objective}
        CONTENU: ${this.selectedLevel.sections.domaines.join(', ')}, ${this.selectedLevel.sections.lexical.join(', ')}
        
        CONSIGNE UTILISATEUR SUPPLÉMENTAIRE:
        ${customInstruction}
      `;

      this.llmService.generateWordPairsWithCustomInstruction(
        this.selectedLevel.title,
        'curriculum',
        levelInstruction
      ).subscribe({
        next: (wordPairs) => {
          localStorage.setItem('wordPairs', JSON.stringify(wordPairs));
          localStorage.setItem('sessionInfo', JSON.stringify({
            category: 'Parcours',
            topic: this.selectedLevel!.title,
            date: new Date().toISOString(),
            translationDirection: this.translationDirection
          }));

          localStorage.removeItem('lessonId');
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/word-pairs-game']);
          }, 100);
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.isLoading = false;
          alert('Erreur lors de la génération.');
        }
      });
    }
  }

  /**
   * Ouvre le modal pour saisir une consigne personnalisée (Mode "Libre" qui reste accessible via un bouton peut-être ?)
   * Pour l'instant je garde la méthode au cas où je rajoute un bouton "Mode Libre" en bas de page.
   */
  /**
   * Démarre une session basée sur le dictionnaire personnel
   */
  startPersonalSession() {
    // Vérifier si le dictionnaire personnel contient des mots
    const personalWords = this.personalDictionaryService.getAllWords();

    if (personalWords.length === 0) {
      this.showToast('Votre dictionnaire personnel est vide. Ajoutez des mots pour commencer!');
      return;
    }

    // Pas de loader pour une session locale instantanée

    // Récupérer les mots pour l'exercice
    const words = this.personalDictionaryService.getWordsForExercise(this.wordsToGenerate);

    // Créer un format compatible avec l'exercice de vocabulaire
    const exercise = {
      items: words.map(word => ({
        word: word.sourceWord,
        translation: word.targetWord,
        context: word.contextualMeaning
      })),
      type: 'vocabulary',
      topic: 'Personnel'
    };

    // Sauvegarder l'exercice
    localStorage.setItem('vocabularyExercise', JSON.stringify(exercise));

    // Stocker les paires de mots pour le jeu
    localStorage.setItem('wordPairs', JSON.stringify(words.map(word => ({
      fr: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
      it: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
      context: word.contextualMeaning,
      themes: word.themes || []
    }))));

    localStorage.setItem('sessionInfo', JSON.stringify({
      category: 'Vocabulaire',
      topic: 'Personnel',
      date: new Date().toISOString(),
      translationDirection: this.translationDirection
    }));

    localStorage.removeItem('lessonId');
    localStorage.removeItem('isPomReview');
    localStorage.removeItem('pomId');

    this.router.navigate(['/word-pairs-game']);
  }

  async openCustomPromptModal() {
    const modal = await this.modalController.create({
      component: CustomPromptModalComponent,
      cssClass: 'custom-prompt-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data && data.prompt) {
      this.startCustomSession(data.prompt);
    }
  }

  startCustomSession(customPrompt: string) {
    this.isLoading = true;
    const sessionInfo = {
      category: 'Personnalisé',
      topic: customPrompt.length > 30 ? customPrompt.substring(0, 27) + '...' : customPrompt,
      date: new Date().toISOString(),
      translationDirection: this.translationDirection
    };
    localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));
    localStorage.removeItem('lessonId');
    localStorage.removeItem('isPomReview');
    localStorage.removeItem('pomId');

    this.llmService.generateCustomWordPairs(customPrompt, this.translationDirection)
      .subscribe({
        next: (wordPairs: WordPair[]) => {
          localStorage.setItem('wordPairs', JSON.stringify(wordPairs));
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/word-pairs-game']);
          }, 100);
        },
        error: (error: any) => {
          console.error('Erreur:', error);
          this.isLoading = false;
          this.showToast('Erreur lors de la génération.');
        }
      });
  }

  /**
   * Change la direction de traduction
   */
  changeTranslationDirection(direction: string | number | undefined) {
    const directionStr = direction !== undefined ? String(direction) : undefined;
    if (directionStr && (directionStr === 'fr2it' || directionStr === 'it2fr')) {
      this.translationDirection = directionStr as TranslationDirection;
    } else {
      console.warn('Direction de traduction invalide:', direction);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'warning'
    });
    await toast.present();
  }

  ngOnDestroy() {
    this.isLoading = false;
  }
}
