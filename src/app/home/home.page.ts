import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController, ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonalDictionaryService } from '../services/personal-dictionary.service';
import { PriorityThemesService, PriorityTheme } from '../services/priority-themes.service';
import { ButtonComponent, CardComponent } from '../components/atoms';
import { PriorityThemesSelectionComponent } from '../components/priority-themes-selection/priority-themes-selection.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    ButtonComponent,
    CardComponent
  ]
})
export class HomePage implements OnInit, OnDestroy {
  pageTitle: string = 'Accueil';
  
  // Thèmes prioritaires affichés
  priorityThemes: { name: string; count: number }[] = [];
  
  // Subscriptions
  private dictionarySubscription?: Subscription;
  private themesSubscription?: Subscription;

  constructor(
    private menuController: MenuController,
    private personalDictionaryService: PersonalDictionaryService,
    private priorityThemesService: PriorityThemesService,
    private modalController: ModalController
  ) {
  }

  ngOnInit() {
    // S'abonner aux changements du dictionnaire pour mettre à jour les statistiques
    this.dictionarySubscription = this.personalDictionaryService.dictionaryWords$.subscribe(() => {
      this.updatePriorityThemes();
    });

    // S'abonner aux changements des thèmes prioritaires
    this.themesSubscription = this.priorityThemesService.selectedThemes$.subscribe(() => {
      this.updatePriorityThemes();
    });

    // Charger les thèmes prioritaires au démarrage
    this.updatePriorityThemes();
  }

  ngOnDestroy() {
    // Nettoyer les subscriptions
    if (this.dictionarySubscription) {
      this.dictionarySubscription.unsubscribe();
    }
    if (this.themesSubscription) {
      this.themesSubscription.unsubscribe();
    }
  }

  /**
   * Met à jour la liste des thèmes prioritaires affichés
   */
  private updatePriorityThemes(): void {
    this.priorityThemes = this.priorityThemesService.getPriorityThemesStats();
  }

  /**
   * Ouvre la modal de sélection des thèmes prioritaires
   */
  async openThemeSelection(): Promise<void> {
    const modal = await this.modalController.create({
      component: PriorityThemesSelectionComponent,
      cssClass: 'priority-themes-modal'
    });

    await modal.present();
  }

  /**
   * Filtre les exercices par thème sélectionné
   */
  filterByTheme(themeName: string): void {
    // TODO: Implémenter le filtrage par thème
    console.log('Filtrage par thème:', themeName);
  }


  onDiscussionClick() {
  }

  async forceOpenMenu() {
    try {
      await this.menuController.enable(true);
      await this.menuController.open();
    } catch (error) {
      console.error('Error forcing menu open:', error);
    }
  }
}
