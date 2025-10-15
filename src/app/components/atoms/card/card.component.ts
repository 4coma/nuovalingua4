import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export type CardVariant = 'default' | 'glass' | 'elevated' | 'outlined';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() interactive = false;
  @Input() selected = false;
  @Input() loading = false;
  @Input() padding: 'none' | 'small' | 'medium' | 'large' = 'medium';
  
  @Output() cardClick = new EventEmitter<void>();

  @HostBinding('class') get hostClasses(): string {
    const classes = [
      'modern-card',
      `modern-card--${this.variant}`,
      `modern-card--padding-${this.padding}`
    ];
    
    if (this.interactive) {
      classes.push('modern-card--interactive');
    }
    
    if (this.selected) {
      classes.push('modern-card--selected');
    }
    
    if (this.loading) {
      classes.push('modern-card--loading');
    }
    
    return classes.join(' ');
  }

  onClick = (): void => {
    if (this.interactive && !this.loading) {
      this.cardClick.emit();
    }
  };
}

