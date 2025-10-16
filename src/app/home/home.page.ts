import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonalDictionaryService } from '../services/personal-dictionary.service';
import { ButtonComponent, CardComponent } from '../components/atoms';

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
  
  // Subscription pour le BehaviorSubject
  private dictionarySubscription?: Subscription;

  constructor(
    private menuController: MenuController,
    private personalDictionaryService: PersonalDictionaryService
  ) {
  }

  ngOnInit() {
    // S'abonner aux changements du dictionnaire pour mettre à jour les statistiques
    this.dictionarySubscription = this.personalDictionaryService.dictionaryWords$.subscribe(() => {
      // Les statistiques peuvent être mises à jour ici si nécessaire
      console.log('Dictionnaire mis à jour - statistiques actualisées');
    });
  }

  ngOnDestroy() {
    // Nettoyer la subscription
    if (this.dictionarySubscription) {
      this.dictionarySubscription.unsubscribe();
    }
  }


  onDiscussionClick() {
    console.log('🔍 HomePage - Bouton Discussion cliqué');
  }

  async forceOpenMenu() {
    try {
      console.log('Forcing menu to open from home page...');
      await this.menuController.enable(true);
      await this.menuController.open();
      console.log('Menu forced open successfully');
    } catch (error) {
      console.error('Error forcing menu open:', error);
    }
  }
}
