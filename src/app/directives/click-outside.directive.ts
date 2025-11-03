import { Directive, ElementRef, Output, EventEmitter, OnInit, OnDestroy, NgZone } from '@angular/core';

@Directive({
  selector: '[appSafeHtml]',
  standalone: true
})
export class SafeHtmlDirective implements OnInit, OnDestroy {
  @Output() wordClick = new EventEmitter<string>();

  private mouseDownX: number = 0;
  private mouseDownY: number = 0;
  private mouseDownTime: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private isSelecting: boolean = false;

  constructor(
    private el: ElementRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    // Écouter mousedown pour détecter le début d'une sélection (desktop)
    this.el.nativeElement.addEventListener('mousedown', this.onMouseDown);
    // Écouter mouseup pour détecter la fin d'une sélection (desktop)
    this.el.nativeElement.addEventListener('mouseup', this.onMouseUp);
    // Écouter touchstart pour détecter le début d'une sélection (mobile)
    this.el.nativeElement.addEventListener('touchstart', this.onTouchStart);
    // Écouter touchend pour détecter la fin d'une sélection (mobile)
    this.el.nativeElement.addEventListener('touchend', this.onTouchEnd);
    // Écouter les changements de sélection
    document.addEventListener('selectionchange', this.onSelectionChange);
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('mousedown', this.onMouseDown);
    this.el.nativeElement.removeEventListener('mouseup', this.onMouseUp);
    this.el.nativeElement.removeEventListener('touchstart', this.onTouchStart);
    this.el.nativeElement.removeEventListener('touchend', this.onTouchEnd);
    document.removeEventListener('selectionchange', this.onSelectionChange);
  }

  private onMouseDown = (event: MouseEvent) => {
    this.mouseDownX = event.clientX;
    this.mouseDownY = event.clientY;
    this.mouseDownTime = Date.now();
    this.isSelecting = false;
  }

  private onMouseUp = (event: MouseEvent) => {
    // Ignorer les clics sur les boutons (comme "Traduire la sélection")
    const target = event.target as HTMLElement;
    if (target && (
      target.tagName === 'BUTTON' || 
      target.closest('button') || 
      target.classList.contains('translate-fixed-btn') ||
      target.closest('.translate-fixed-btn')
    )) {
      return; // Laisser le bouton gérer son propre événement
    }

    const mouseUpTime = Date.now();
    const deltaX = Math.abs(event.clientX - this.mouseDownX);
    const deltaY = Math.abs(event.clientY - this.mouseDownY);
    const deltaTime = mouseUpTime - this.mouseDownTime;

    // Vérifier s'il y a une sélection de texte active
    const selection = window.getSelection();
    const hasSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;

    // Si l'utilisateur a bougé la souris de plus de 5px ou s'il y a une sélection, c'est une sélection de texte
    if (deltaX > 5 || deltaY > 5 || hasSelection) {
      this.isSelecting = true;
      return; // Ne pas déclencher le clic sur mot
    }

    // Si c'est un clic simple rapide (< 300ms) et sans mouvement, traiter comme un clic sur mot
    if (deltaTime < 300 && deltaX < 5 && deltaY < 5 && !hasSelection) {
      // Attendre un peu pour laisser la sélection native se terminer
      setTimeout(() => {
        this.handleWordClick(event);
      }, 50);
    }
  }

  private onTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      this.touchStartTime = Date.now();
      this.isSelecting = false;
    }
  }

  private onTouchEnd = (event: TouchEvent) => {
    if (!event.changedTouches || event.changedTouches.length === 0) return;
    
    // Ignorer les touches sur les boutons
    const touch = event.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && (
      (target as HTMLElement).tagName === 'BUTTON' || 
      (target as HTMLElement).closest('button') || 
      (target as HTMLElement).classList.contains('translate-fixed-btn') ||
      (target as HTMLElement).closest('.translate-fixed-btn')
    )) {
      return; // Laisser le bouton gérer son propre événement
    }
    
    const touchEndTime = Date.now();
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    const deltaTime = touchEndTime - this.touchStartTime;

    // Vérifier s'il y a une sélection de texte active
    const selection = window.getSelection();
    const hasSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;

    // Si l'utilisateur a bougé le doigt de plus de 10px ou s'il y a une sélection, c'est une sélection de texte
    if (deltaX > 10 || deltaY > 10 || hasSelection) {
      this.isSelecting = true;
      return; // Ne pas déclencher le clic sur mot
    }

    // Si c'est un tap simple rapide (< 300ms) et sans mouvement, traiter comme un clic sur mot
    if (deltaTime < 300 && deltaX < 10 && deltaY < 10 && !hasSelection) {
      // Attendre un peu pour laisser la sélection native se terminer
      setTimeout(() => {
        if (target) {
          // Créer un événement MouseEvent simulé pour réutiliser handleWordClick
          const syntheticEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          Object.defineProperty(syntheticEvent, 'target', { value: target, writable: false });
          this.handleWordClick(syntheticEvent);
        }
      }, 100);
    }
  }

  private onSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      this.isSelecting = true;
    }
  }

  private handleWordClick(event: MouseEvent) {
    // Vérifier à nouveau qu'il n'y a pas de sélection active
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
      return; // Il y a une sélection, ne pas traiter comme un clic sur mot
    }

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
  }
} 