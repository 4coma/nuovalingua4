import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DiscussionService, DiscussionContext } from '../../services/discussion.service';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { CreateCustomContextModalComponent } from './create-custom-context-modal.component';
import { SavedConversationsListComponent } from '../saved-conversations-list/saved-conversations-list.component';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-discussion-context-selection',
  templateUrl: './discussion-context-selection.component.html',
  styleUrls: ['./discussion-context-selection.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class DiscussionContextSelectionComponent implements OnInit {
  contextsByCategory: { [key: string]: DiscussionContext[] } = {};
  selectedDifficulty: string = 'all';
  selectedCategory: string = 'all';
  difficulties = [
    { value: 'all', label: 'Tous les niveaux' },
    { value: 'beginner', label: 'Débutant' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'advanced', label: 'Avancé' }
  ];

  constructor(
    private discussionService: DiscussionService,
    private router: Router,
    private modalCtrl: ModalController,
    private personalDictionary: PersonalDictionaryService
  ) {
  }

  ngOnInit() {
    this.loadContexts();
    // Démarrage depuis le menu: aucun vocabulaire ciblé par défaut
    localStorage.removeItem('conversationTargetVocabulary');
  }

  loadContexts() {
    this.contextsByCategory = this.discussionService.getContextsByCategory();
  }

  getFilteredContexts(): { [key: string]: DiscussionContext[] } {
    let filtered = this.discussionService.getDiscussionContexts();

    filtered = filtered.filter(context => !context.hidden);

    // Filtrer par difficulté
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(context => context.difficulty === this.selectedDifficulty);
    }

    // Filtrer par catégorie
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(context => context.category === this.selectedCategory);
    }

    // Regrouper par catégorie
    return filtered.reduce((acc, context) => {
      if (!acc[context.category]) {
        acc[context.category] = [];
      }
      acc[context.category].push(context);
      return acc;
    }, {} as { [key: string]: DiscussionContext[] });
  }

  getCategories(): string[] {
    const contexts = this.discussionService.getDiscussionContexts();
    const categories = [...new Set(contexts.filter(context => !context.hidden).map(context => context.category))];
    return categories;
  }

  selectContext(context: DiscussionContext, idx?: number) {
    // Conversation démarrée depuis le menu: pas de vocabulaire ciblé
    localStorage.removeItem('conversationTargetVocabulary');
    this.router.navigate(['/discussion', context.id]);
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'Débutant';
      case 'intermediate':
        return 'Intermédiaire';
      case 'advanced':
        return 'Avancé';
      default:
        return difficulty;
    }
  }

  getContextIcon(contextId: string): string {
    switch (contextId) {
      case 'restaurant':
        return 'restaurant-outline';
      case 'argument':
        return 'heart-outline';
      case 'shopping':
        return 'bag-outline';
      case 'travel':
        return 'map-outline';
      case 'work':
        return 'briefcase-outline';
      default:
        return 'chatbubble-outline';
    }
  }

  isEmptyContexts(): boolean {
    const filteredContexts = this.getFilteredContexts();
    return Object.keys(filteredContexts).length === 0;
  }

  async openCreateContextModal() {
    const modal = await this.modalCtrl.create({
      component: CreateCustomContextModalComponent,
      cssClass: 'custom-context-modal'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      // Ajoute le contexte custom à la liste (en mémoire)
      this.discussionService.getDiscussionContexts().push(data);
      // Navigue directement vers la discussion
      localStorage.removeItem('conversationTargetVocabulary');
      this.router.navigate(['/discussion', data.id]);
    }
  }

  async openSavedConversations() {
    const modal = await this.modalCtrl.create({
      component: SavedConversationsListComponent,
      cssClass: 'saved-conversations-modal'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.id) {
      // Naviguer vers la discussion avec l'id de la session sauvegardée
      this.router.navigate(['/discussion', data.context.id], { queryParams: { sessionId: data.id } });
    }
  }

  // ================= Conversation aléatoire =================
  private randomInstructionTemplates: Array<{
    title: string;
    situation: string;
    userRole: string;
    aiRole: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    description: string;
  }> = [
    {
      title: 'Au marché de quartier',
      situation: 'Tu es à un marché italien et tu souhaites acheter des produits locaux.',
      userRole: 'Client curieux',
      aiRole: 'Commerçant italien sympathique',
      difficulty: 'beginner',
      category: 'Vie quotidienne',
      description: 'Poser des questions sur les produits, les prix et la fraîcheur.'
    },
    {
      title: 'Réservation au téléphone',
      situation: 'Tu appelles un restaurant à Florence pour réserver une table.',
      userRole: 'Client qui réserve',
      aiRole: 'Employé du restaurant',
      difficulty: 'intermediate',
      category: 'Vie quotidienne',
      description: 'Donner une heure, préciser le nombre de personnes, gérer les contraintes.'
    },
    {
      title: 'Demande de renseignements touristiques',
      situation: 'Tu viens d’arriver à Naples et tu cherches des informations touristiques.',
      userRole: 'Touriste',
      aiRole: 'Agent d’accueil',
      difficulty: 'beginner',
      category: 'Voyage',
      description: 'Demander des lieux à visiter, horaires, transports et recommandations.'
    },
    {
      title: 'Problème d’hébergement',
      situation: 'Tu rencontres un souci dans ton logement de location.',
      userRole: 'Locataire',
      aiRole: 'Propriétaire/concierge',
      difficulty: 'intermediate',
      category: 'Voyage',
      description: 'Expliquer un problème et négocier une solution.'
    },
    {
      title: 'Entretien d’embauche',
      situation: 'Tu passes un entretien en italien pour un poste junior.',
      userRole: 'Candidat',
      aiRole: 'Recruteur',
      difficulty: 'advanced',
      category: 'Professionnel',
      description: 'Présenter ton parcours, tes qualités, et poser des questions sur le poste.'
    },
    {
      title: 'Chez le médecin',
      situation: 'Tu expliques tes symptômes à un médecin en Italie.',
      userRole: 'Patient',
      aiRole: 'Médecin',
      difficulty: 'intermediate',
      category: 'Vie quotidienne',
      description: 'Décrire les symptômes, demander un traitement et des conseils.'
    },
    {
      title: 'Retour d’un article',
      situation: 'Tu souhaites retourner un vêtement acheté la veille.',
      userRole: 'Client',
      aiRole: 'Vendeur',
      difficulty: 'beginner',
      category: 'Vie quotidienne',
      description: 'Expliquer la raison du retour, discuter des conditions et obtenir un échange.'
    },
    {
      title: 'Organisation d’un week-end',
      situation: 'Tu planifies un week-end avec un ami italien.',
      userRole: 'Ami organisateur',
      aiRole: 'Ami italien',
      difficulty: 'intermediate',
      category: 'Relations',
      description: 'Proposer des activités, gérer les préférences et le budget.'
    },
    {
      title: 'Discussion d’actualité',
      situation: 'Tu échanges ton point de vue sur une actualité récente.',
      userRole: 'Interlocuteur curieux',
      aiRole: 'Interlocuteur italien',
      difficulty: 'advanced',
      category: 'Culture',
      description: 'Exprimer une opinion, nuancer, demander des explications.'
    },
    {
      title: 'Cours d’italien',
      situation: 'Tu fais un cours particulier avec un professeur.',
      userRole: 'Étudiant',
      aiRole: 'Professeur d’italien',
      difficulty: 'beginner',
      category: 'Études',
      description: 'Poser des questions de grammaire et demander des exercices.'
    },
    {
      title: 'À la gare',
      situation: 'Tu veux acheter un billet de train et demander des horaires.',
      userRole: 'Voyageur',
      aiRole: 'Agent de gare',
      difficulty: 'beginner',
      category: 'Voyage',
      description: 'Demander un billet, une correspondance et les horaires de départ.'
    },
    {
      title: 'Chez le coiffeur',
      situation: 'Tu veux te faire couper les cheveux à Rome.',
      userRole: 'Client',
      aiRole: 'Coiffeur',
      difficulty: 'beginner',
      category: 'Vie quotidienne',
      description: 'Décrire la coupe souhaitée et discuter du résultat.'
    },
    {
      title: 'Location de voiture',
      situation: 'Tu veux louer une voiture pour quelques jours en Sicile.',
      userRole: 'Client',
      aiRole: 'Employé d’agence',
      difficulty: 'intermediate',
      category: 'Voyage',
      description: 'Demander les tarifs, assurances et conditions de location.'
    },
    {
      title: 'Invité à dîner',
      situation: 'Tu es invité chez une famille italienne.',
      userRole: 'Invité',
      aiRole: 'Hôte italien',
      difficulty: 'intermediate',
      category: 'Relations',
      description: 'Remercier, faire la conversation, complimenter le repas.'
    },
    {
      title: 'À la pharmacie',
      situation: 'Tu cherches un médicament sans ordonnance.',
      userRole: 'Client',
      aiRole: 'Pharmacien',
      difficulty: 'beginner',
      category: 'Vie quotidienne',
      description: 'Expliquer les symptômes et demander une recommandation.'
    },
    {
      title: 'Problème de transport',
      situation: 'Ton train est annulé et tu dois trouver une solution.',
      userRole: 'Voyageur contrarié',
      aiRole: 'Employé du service clientèle',
      difficulty: 'intermediate',
      category: 'Voyage',
      description: 'Expliquer la situation et demander un remboursement ou un changement.'
    },
    {
      title: 'Premier jour de travail',
      situation: 'Tu arrives dans une entreprise italienne pour ton premier jour.',
      userRole: 'Nouvel employé',
      aiRole: 'Collègue italien',
      difficulty: 'advanced',
      category: 'Professionnel',
      description: 'Se présenter, poser des questions sur les tâches et les habitudes de bureau.'
    },
    {
      title: 'Discussion sur la météo',
      situation: 'Tu rencontres un voisin italien et parles de la météo.',
      userRole: 'Voisin',
      aiRole: 'Voisin italien',
      difficulty: 'beginner',
      category: 'Vie quotidienne',
      description: 'Faire une petite conversation sur le temps et les saisons.'
    },
    {
      title: 'À la poste',
      situation: 'Tu veux envoyer un colis en France depuis l’Italie.',
      userRole: 'Client',
      aiRole: 'Employé de la poste',
      difficulty: 'intermediate',
      category: 'Vie quotidienne',
      description: 'Remplir les informations, choisir un service et poser des questions sur les délais.'
    },
    {
      title: 'Rencontre amicale',
      situation: 'Tu fais connaissance avec quelqu’un dans un café.',
      userRole: 'Nouveau venu',
      aiRole: 'Italien sympathique',
      difficulty: 'beginner',
      category: 'Relations',
      description: 'Se présenter, parler de ses goûts et poser des questions sur la vie locale.'
    },
    {
      title: 'Visite d’un musée',
      situation: 'Tu veux acheter un billet et en savoir plus sur une exposition.',
      userRole: 'Visiteur',
      aiRole: 'Employé du musée',
      difficulty: 'beginner',
      category: 'Culture',
      description: 'Demander les horaires, les tarifs et des informations sur les œuvres exposées.'
    },
    {
      title: 'Problème avec une commande en ligne',
      situation: 'Tu appelles le service client pour signaler une erreur de livraison.',
      userRole: 'Client mécontent',
      aiRole: 'Employé du service client',
      difficulty: 'intermediate',
      category: 'Vie quotidienne',
      description: 'Expliquer le problème et demander un remboursement ou un échange.'
    },
    {
      title: 'Dispute entre amis',
      situation: 'Tu veux t’expliquer après un malentendu avec un ami italien.',
      userRole: 'Ami désolé',
      aiRole: 'Ami contrarié',
      difficulty: 'advanced',
      category: 'Relations',
      description: 'Exprimer des émotions, s’excuser et trouver un terrain d’entente.'
    },
    {
      title: 'À la banque',
      situation: 'Tu veux ouvrir un compte bancaire en Italie.',
      userRole: 'Client',
      aiRole: 'Employé de banque',
      difficulty: 'intermediate',
      category: 'Vie quotidienne',
      description: 'Poser des questions sur les types de comptes et les conditions.'
    },
    {
      title: 'Conversation sur la cuisine italienne',
      situation: 'Tu parles avec un Italien passionné de cuisine.',
      userRole: 'Curieux de gastronomie',
      aiRole: 'Gastronome italien',
      difficulty: 'intermediate',
      category: 'Culture',
      description: 'Échanger des recettes, parler des spécialités régionales et des goûts.'
    },
    {
      title: 'Réunion d’équipe',
      situation: 'Tu participes à une réunion avec des collègues italiens.',
      userRole: 'Collaborateur',
      aiRole: 'Chef d’équipe italien',
      difficulty: 'advanced',
      category: 'Professionnel',
      description: 'Donner ton avis, poser des questions et comprendre les décisions.'
    },
    {
      title: 'Demande de renseignement administratif',
      situation: 'Tu veux obtenir un document officiel à la mairie.',
      userRole: 'Citoyen',
      aiRole: 'Employé municipal',
      difficulty: 'intermediate',
      category: 'Vie quotidienne',
      description: 'Demander les procédures et les délais pour un document.'
    },
    {
      title: 'Cours de sport',
      situation: 'Tu t’inscris à un cours de yoga à Milan.',
      userRole: 'Nouveau participant',
      aiRole: 'Coach sportif',
      difficulty: 'beginner',
      category: 'Vie quotidienne',
      description: 'Poser des questions sur les horaires, le matériel et le niveau requis.'
    },
    {
      title: 'À la bibliothèque',
      situation: 'Tu veux emprunter des livres en italien.',
      userRole: 'Lecteur',
      aiRole: 'Bibliothécaire',
      difficulty: 'beginner',
      category: 'Études',
      description: 'Demander une carte, chercher un livre et parler de lecture.'
    },
    {
      title: 'Planification d’un projet commun',
      situation: 'Tu prépares un projet avec un collègue italien.',
      userRole: 'Collaborateur',
      aiRole: 'Partenaire italien',
      difficulty: 'advanced',
      category: 'Professionnel',
      description: 'Proposer des idées, répartir les tâches et fixer des objectifs.'
    },
    {
      title: 'Rencontre dans un train',
      situation: 'Tu engages la conversation avec un passager italien.',
      userRole: 'Voyageur',
      aiRole: 'Passager italien',
      difficulty: 'intermediate',
      category: 'Relations',
      description: 'Faire connaissance, parler de voyages et d’expériences personnelles.'
    }
  ]
  

  startRandomConversation() {
    // 1) Choisir un template au hasard
    const tpl = this.randomInstructionTemplates[Math.floor(Math.random() * this.randomInstructionTemplates.length)];

    // 2) Construire un contexte ad hoc
    const context: DiscussionContext = {
      id: 'random-' + Date.now(),
      title: tpl.title,
      situation: tpl.situation,
      userRole: tpl.userRole,
      aiRole: tpl.aiRole,
      difficulty: tpl.difficulty,
      category: tpl.category,
      description: tpl.description
    };

    // 3) Pousser ce contexte dans la liste pour qu'il soit trouvable par la vue de discussion
    this.discussionService.getDiscussionContexts().push(context);

    // 4) Menu principal: pas de vocabulaire ciblé
    localStorage.removeItem('conversationTargetVocabulary');

    // 5) Naviguer vers la discussion
    this.router.navigate(['/discussion', context.id]);
  }

  private prepareRandomTargetVocabulary(category: string, topic: string) {
    try {
      const all = this.personalDictionary.getAllWords();
      if (!all || all.length === 0) {
        // Aucun mot: vider/neutraliser la cible de conversation
        localStorage.removeItem('conversationTargetVocabulary');
        return;
      }

      const sorted = [...all].sort((a, b) => a.dateAdded - b.dateAdded); // ancien -> récent
      const targetCount = 8;
      const half = Math.floor(targetCount / 2); // 4

      // Prendre 4 parmi les moins récents et 4 parmi les plus récents, en échantillonnant si plus d'éléments
      const least = this.sample(sorted.slice(0, Math.min(sorted.length, Math.max(half, 1))), Math.min(half, sorted.length));
      const most = this.sample(sorted.slice(Math.max(0, sorted.length - Math.max(half, 1))), Math.min(half, sorted.length));

      let combined: DictionaryWord[] = [...least, ...most];

      // Si moins de 8 au total, compléter avec le milieu si possible
      if (combined.length < targetCount && sorted.length > combined.length) {
        const remaining = targetCount - combined.length;
        // Sélectionner au hasard parmi les mots non encore sélectionnés
        const excluded = new Set(combined.map(w => w.id));
        const rest = sorted.filter(w => !excluded.has(w.id));
        combined = combined.concat(this.sample(rest, Math.min(remaining, rest.length)));
      }

      // Mapper vers le format attendu par DiscussionActive
      const items = combined.map(w => {
        // On force l'orientation fr->it pour afficher le mot cible en italien
        const it = w.sourceLang === 'it' ? w.sourceWord : w.targetWord;
        const fr = w.sourceLang === 'fr' ? w.sourceWord : w.targetWord;
        return {
          word: it,
          translation: fr,
          context: w.contextualMeaning || ''
        };
      });

      const payload = {
        items,
        session: {
          category,
          topic,
          translationDirection: 'fr2it'
        },
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('conversationTargetVocabulary', JSON.stringify(payload));
    } catch (e) {
      console.error('Erreur préparation vocabulaire cible aléatoire:', e);
    }
  }

  private sample<T>(arr: T[], n: number): T[] {
    if (n <= 0) return [];
    if (arr.length <= n) return [...arr];
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }
}
