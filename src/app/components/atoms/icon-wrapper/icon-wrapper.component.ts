import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export type IconWrapperColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'medium';
export type IconWrapperSize = 'small' | 'medium' | 'large' | 'xlarge';
export type IconWrapperVariant = 'solid' | 'soft' | 'outlined';

@Component({
  selector: 'app-icon-wrapper',
  templateUrl: './icon-wrapper.component.html',
  styleUrls: ['./icon-wrapper.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class IconWrapperComponent {
  @Input() icon!: string;
  @Input() color: IconWrapperColor = 'primary';
  @Input() size: IconWrapperSize = 'medium';
  @Input() variant: IconWrapperVariant = 'solid';
  @Input() interactive = false;

  get wrapperClasses(): string {
    const classes = [
      'icon-wrapper',
      `icon-wrapper--${this.color}`,
      `icon-wrapper--${this.size}`,
      `icon-wrapper--${this.variant}`
    ];
    
    if (this.interactive) {
      classes.push('icon-wrapper--interactive');
    }
    
    return classes.join(' ');
  }
}

