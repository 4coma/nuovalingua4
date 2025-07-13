import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
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

  constructor(private router: Router) {}

  onDiscussionClick() {
    console.log('🔍 HomePage - Bouton Discussion cliqué');
  }

  startSpacedRepetition() {
    this.router.navigate(['/spaced-repetition']);
  }
}
