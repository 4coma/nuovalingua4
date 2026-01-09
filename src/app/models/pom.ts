export interface Pom {
  id: string;
  lessonId?: string; // ID de la leçon statique associée (ex: 'lvl1-dom-self')
  title?: string; // Titre personnalisé du POM
  wordIds: string[]; // Identifiants des mots inclus dans ce POM
  createdAt: number; // Date de création (timestamp)
  nextReviewDate: number; // Date de la prochaine révision (timestamp)
  intervalDays: number; // Intervalle actuel en jours (1, 2, 4, 8, ...)
  factor?: number; // Facteur de multiplication pour ce POM (ex: 2, 1.5, 2.5)
  status: 'active' | 'completed' | 'archived';
  reviewCount: number; // Nombre de révisions effectuées
}

export interface PomReviewSession {
  pomId: string;
  wordPairs: {
    it: string;
    fr: string;
    context?: string;
  }[];
}
