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
    });
  }

  ngOnDestroy() {
    // Nettoyer la subscription
    if (this.dictionarySubscription) {
      this.dictionarySubscription.unsubscribe();
    }
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
