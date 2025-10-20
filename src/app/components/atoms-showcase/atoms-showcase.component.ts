import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { 
  ButtonComponent,
  CardComponent,
  BadgeComponent,
  SkeletonLoaderComponent,
  ProgressBarComponent,
  IconWrapperComponent,
  EmptyStateComponent
} from '../atoms';

@Component({
  selector: 'app-atoms-showcase',
  templateUrl: './atoms-showcase.component.html',
  styleUrls: ['./atoms-showcase.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ButtonComponent,
    CardComponent,
    BadgeComponent,
    SkeletonLoaderComponent,
    ProgressBarComponent,
    IconWrapperComponent,
    EmptyStateComponent
  ]
})
export class AtomsShowcaseComponent {
  isLoading = false;
  progressValue = 65;
  selectedCard = '';

  toggleLoading = (): void => {
    this.isLoading = !this.isLoading;
    if (this.isLoading) {
      setTimeout(() => this.isLoading = false, 3000);
    }
  };

  selectCard = (id: string): void => {
    this.selectedCard = this.selectedCard === id ? '' : id;
  };

  onActionClick = (): void => {
  };
}

