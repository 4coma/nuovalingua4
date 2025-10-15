import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() icon?: string;
  @Input() iconSlot: 'start' | 'end' = 'start';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() expand: 'block' | 'full' | undefined = undefined;
  
  @Output() clicked = new EventEmitter<void>();

  onClick = (): void => {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  };

  get buttonClasses(): string {
    const classes = [
      'modern-button',
      `modern-button--${this.variant}`,
      `modern-button--${this.size}`
    ];
    
    if (this.loading) {
      classes.push('modern-button--loading');
    }
    
    return classes.join(' ');
  }
}

