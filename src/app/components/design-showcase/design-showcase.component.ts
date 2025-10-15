import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface ShowcaseCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  status: 'active' | 'pending' | 'completed';
  progress?: number;
  tags?: string[];
}

@Component({
  selector: 'app-design-showcase',
  templateUrl: './design-showcase.component.html',
  styleUrls: ['./design-showcase.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DesignShowcaseComponent {
  isLoading = false;
  selectedCard: ShowcaseCard | null = null;

  showcaseCards: ShowcaseCard[] = [
    {
      id: '1',
      title: 'Apprentissage actif',
      subtitle: 'Session quotidienne',
      description: 'Révision de 12 nouveaux mots avec exercices interactifs',
      icon: 'book-outline',
      status: 'active',
      progress: 65,
      tags: ['Vocabulaire', 'Avancé']
    },
    {
      id: '2',
      title: 'Conversation guidée',
      subtitle: 'Niveau intermédiaire',
      description: 'Dialogue sur les voyages et la culture',
      icon: 'chatbubbles-outline',
      status: 'pending',
      progress: 0,
      tags: ['Discussion', 'Culture']
    },
    {
      id: '3',
      title: 'Grammaire contextuelle',
      subtitle: 'Complété aujourd\'hui',
      description: 'Maîtrise des temps composés en contexte',
      icon: 'checkmark-circle-outline',
      status: 'completed',
      progress: 100,
      tags: ['Grammaire']
    }
  ];

  statCards = [
    { label: 'Mots appris', value: '1,247', icon: 'trending-up-outline', color: 'primary' },
    { label: 'Temps total', value: '42h', icon: 'time-outline', color: 'secondary' },
    { label: 'Série actuelle', value: '12 jours', icon: 'flame-outline', color: 'tertiary' }
  ];

  toggleLoading = () => {
    this.isLoading = !this.isLoading;
    if (this.isLoading) {
      setTimeout(() => this.isLoading = false, 3000);
    }
  };

  selectCard = (card: ShowcaseCard) => {
    this.selectedCard = this.selectedCard?.id === card.id ? null : card;
  };

  getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'primary',
      pending: 'medium',
      completed: 'success'
    };
    return colors[status] || 'medium';
  };

  getStatusIcon = (status: string): string => {
    const icons: Record<string, string> = {
      active: 'play-circle',
      pending: 'time',
      completed: 'checkmark-circle'
    };
    return icons[status] || 'ellipse';
  };
}

