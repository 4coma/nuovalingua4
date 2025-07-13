import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class HomePage {
  pageTitle: string = 'Accueil';

  constructor(
    private router: Router,
    private menuController: MenuController
  ) {}

  onDiscussionClick() {
    console.log('🔍 HomePage - Bouton Discussion cliqué');
  }

  startSpacedRepetition() {
    this.router.navigate(['/spaced-repetition']);
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
