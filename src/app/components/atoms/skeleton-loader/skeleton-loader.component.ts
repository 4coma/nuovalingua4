import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'title' | 'subtitle' | 'description' | 'circle' | 'rectangle' | 'custom';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() circle = false;

  @HostBinding('class') get hostClasses(): string {
    const classes = ['skeleton-loader', `skeleton-loader--${this.type}`];
    
    if (this.circle) {
      classes.push('skeleton-loader--circle');
    }
    
    return classes.join(' ');
  }

  @HostBinding('style.width') get customWidth(): string | undefined {
    return this.width;
  }

  @HostBinding('style.height') get customHeight(): string | undefined {
    return this.height;
  }
}

