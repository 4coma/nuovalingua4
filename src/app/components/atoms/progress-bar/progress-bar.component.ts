import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProgressColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() max = 100;
  @Input() color: ProgressColor = 'primary';
  @Input() size: ProgressSize = 'medium';
  @Input() showLabel = false;
  @Input() showPercentage = false;
  @Input() label?: string;
  @Input() shimmer = true;

  get percentage(): number {
    return Math.min(Math.max((this.value / this.max) * 100, 0), 100);
  }

  get progressClasses(): string {
    return [
      'modern-progress',
      `modern-progress--${this.color}`,
      `modern-progress--${this.size}`,
      this.shimmer ? 'modern-progress--shimmer' : ''
    ].filter(Boolean).join(' ');
  }
}

