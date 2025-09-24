import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MessageFeedback } from '../../services/discussion.service';

@Component({
  selector: 'app-message-feedback',
  templateUrl: './message-feedback.component.html',
  styleUrls: ['./message-feedback.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class MessageFeedbackComponent {
  @Input() feedback?: MessageFeedback;
  @Input() showFeedback = false;

  toggleFeedback() {
    this.showFeedback = !this.showFeedback;
  }

  getFeedbackIcon(feedback: MessageFeedback): string {
    // Détermine l'icône basée sur le nombre d'erreurs
    if (this.hasErrors()) {
      return 'information-circle';
    } else {
      return 'checkmark-circle';
    }
  }

  getFeedbackColor(feedback: MessageFeedback): string {
    // Détermine la couleur basée sur le nombre d'erreurs
    if (this.hasErrors()) {
      return 'warning';
    } else {
      return 'success';
    }
  }

  hasErrors(): boolean {
    if (!this.feedback) return false;
    
    // Nouveau format avec erreurs
    if (this.feedback.erreurs && Array.isArray(this.feedback.erreurs)) {
      return this.feedback.erreurs.length > 0;
    }
    
    // Ancien format - considérer comme "pas d'erreurs" pour éviter les erreurs
    return false;
  }
}
