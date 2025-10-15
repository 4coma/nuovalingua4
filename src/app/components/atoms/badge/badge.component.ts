import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'medium';
export type BadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class BadgeComponent {
  @Input() color: BadgeColor = 'primary';
  @Input() size: BadgeSize = 'medium';
  @Input() icon?: string;
  @Input() iconOnly = false;
  @Input() outlined = false;

  get badgeClasses(): string {
    const classes = [
      'modern-badge',
      `modern-badge--${this.color}`,
      `modern-badge--${this.size}`
    ];
    
    if (this.iconOnly) {
      classes.push('modern-badge--icon-only');
    }
    
    if (this.outlined) {
      classes.push('modern-badge--outlined');
    }
    
    return classes.join(' ');
  }
}

