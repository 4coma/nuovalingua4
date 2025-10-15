import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ButtonComponent } from '../button/button.component';
import { IconWrapperComponent } from '../icon-wrapper/icon-wrapper.component';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ButtonComponent, IconWrapperComponent]
})
export class EmptyStateComponent {
  @Input() icon = 'documents-outline';
  @Input() title = 'Aucun élément';
  @Input() description = 'Commencez par ajouter votre premier élément';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Input() showAction = false;
  
  @Output() action = new EventEmitter<void>();

  onAction = (): void => {
    this.action.emit();
  };
}

