import { Directive, ElementRef, Output, EventEmitter, OnInit, NgZone } from '@angular/core';

@Directive({
  selector: '[appSafeHtml]',
  standalone: true
})
export class SafeHtmlDirective implements OnInit {
  @Output() wordClick = new EventEmitter<string>();

  constructor(
    private el: ElementRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.el.nativeElement.addEventListener('click', (event: MouseEvent) => {
      let targetElement = event.target as HTMLElement;
      
      // Vérifier si l'élément cliqué ou un de ses parents est un mot cliquable
      while (targetElement && targetElement !== this.el.nativeElement) {
        if (targetElement.classList.contains('highlighted-word') || 
            targetElement.classList.contains('clickable-word')) {
          const word = targetElement.getAttribute('data-word');
          if (word) {
            this.zone.run(() => {
              this.wordClick.emit(word);
            });
          }
          break;
        }
        targetElement = targetElement.parentElement as HTMLElement;
      }
    });
  }
} 