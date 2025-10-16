import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface StatCard {
  id: string;
  title: string;
  value: string;
  label: string;
  trend: string;
  color: string;
  icon: string;
}

interface ShowcaseCard {
  id: string;
  title: string;
  description: string;
  subtitle: string;
  status: 'active' | 'pending' | 'completed' | 'error';
  progress?: number;
  tags?: string[];
  icon: string;
}

@Component({
  selector: 'app-design-showcase',
  templateUrl: './design-showcase.component.html',
  styleUrls: ['./design-showcase.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class DesignShowcaseComponent {
  isLoading = false;
  selectedCard: ShowcaseCard | null = null;

  statCards: StatCard[] = [
    {
      id: '1',
      title: 'Utilisateurs Actifs',
      value: '2,847',
      label: '+12% ce mois',
      trend: 'up',
      color: 'success',
      icon: 'people'
    },
    {
      id: '2',
      title: 'Conversions',
      value: '94.2%',
      label: '+3.1% cette semaine',
      trend: 'up',
      color: 'primary',
      icon: 'trending-up'
    },
    {
      id: '3',
      title: 'Temps de Réponse',
      value: '1.2s',
      label: '-0.3s vs hier',
      trend: 'down',
      color: 'warning',
      icon: 'speedometer'
    }
  ];

  showcaseCards: ShowcaseCard[] = [
    {
      id: '1',
      title: 'Interface Moderne',
      description: 'Design system avec glassmorphism et micro-interactions',
      subtitle: 'Système de design unifié',
      status: 'active',
      progress: 85,
      tags: ['UI/UX', 'Design System'],
      icon: 'color-palette'
    },
    {
      id: '2',
      title: 'Performance',
      description: 'Optimisation des performances et temps de chargement',
      subtitle: 'Optimisation avancée',
      status: 'completed',
      progress: 100,
      tags: ['Performance', 'Optimisation'],
      icon: 'rocket'
    },
    {
      id: '3',
      title: 'Accessibilité',
      description: 'Amélioration de l\'accessibilité et navigation',
      subtitle: 'Navigation améliorée',
      status: 'pending',
      progress: 45,
      tags: ['Accessibilité', 'Navigation'],
      icon: 'accessibility'
    }
  ];

  toggleLoading() {
    this.isLoading = !this.isLoading;
  }

  selectCard(card: ShowcaseCard) {
    this.selectedCard = card;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'error': return 'danger';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'play-circle';
      case 'pending': return 'time';
      case 'completed': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      default: return 'help-circle';
    }
  }
}
