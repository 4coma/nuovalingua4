import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { COURSE_DATA, StaticLesson } from '../data/course-data';
import { LlmService } from '../services/llm.service';
import { PomService } from '../services/pom.service';
import { Pom } from '../models/pom';

type HomeMenuItem = {
  label: string;
  route: string;
  icon: string;
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class HomePage {
  pageTitle = 'Accueil';
  isMenuOpen = false;

  readonly menuItems: HomeMenuItem[] = [
    { label: 'Apprendre', route: '/category', icon: 'sparkles-outline' },
    { label: 'Réviser', route: '/personal-revision-setup', icon: 'refresh-outline' },
    { label: 'Compréhension', route: '/comprehension-setup', icon: 'headset-outline' },
    { label: 'Révision complète', route: '/full-revision-setup', icon: 'layers-outline' },
    { label: 'Discussion', route: '/discussion-context-selection', icon: 'chatbubbles-outline' },
    { label: 'Dictionnaire', route: '/personal-dictionary', icon: 'book-outline' },
    { label: 'Conversations', route: '/saved-conversations', icon: 'bookmark-outline' },
    { label: 'Mots récents', route: '/recent-words', icon: 'time-outline' },
    { label: 'Textes sauvegardés', route: '/saved-texts', icon: 'document-text-outline' },
    { label: 'POMs', route: '/poms', icon: 'albums-outline' },
    { label: 'Préférences', route: '/preferences', icon: 'settings-outline' }
  ];

  constructor(
    private router: Router,
    private llmService: LlmService,
    private pomService: PomService,
    private toastController: ToastController
  ) {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  navigateTo(route: string): void {
    this.closeMenu();
    this.router.navigateByUrl(route);
  }

  async startKeepLearning(): Promise<void> {
    const nextLesson = this.getNextLessonInSequence();

    if (!nextLesson) {
      await this.presentToast('Toutes les leçons POM disponibles ont déjà été lancées.');
      return;
    }

    const wordPairs = nextLesson.lesson.pairs;
    localStorage.setItem('wordPairs', JSON.stringify(wordPairs));
    localStorage.setItem('lessonId', nextLesson.lesson.id);
    localStorage.setItem('sessionInfo', JSON.stringify({
      category: 'Leçon',
      topic: nextLesson.lesson.title,
      date: new Date().toISOString(),
      translationDirection: this.llmService.translationDirection
    }));

    this.clearReviewFlags();
    await this.router.navigate(['/word-pairs-game']);
  }

  async startKeepPractice(): Promise<void> {
    const nextPom = this.getNextPlannedPom();

    if (!nextPom) {
      await this.presentToast('Aucun POM actif à pratiquer pour le moment.');
      return;
    }

    const pomWords = this.pomService.getPomWords(nextPom.id);
    if (pomWords.length === 0) {
      const completed = this.pomService.completePomIfNoReviewableWords(nextPom.id);
      await this.presentToast(
        completed
          ? 'Ce POM n’a plus de mots à réviser.'
          : 'Impossible de charger ce POM.'
      );
      return;
    }

    localStorage.setItem('sessionInfo', JSON.stringify({
      category: 'Révision Espacée (POM)',
      topic: this.pomService.getPomDisplayTitle(nextPom),
      date: new Date().toISOString(),
      translationDirection: 'fr2it'
    }));
    localStorage.setItem('wordPairs', JSON.stringify(pomWords));
    localStorage.setItem('isPomReview', 'true');
    localStorage.setItem('pomId', nextPom.id);
    this.pomService.setPomReviewSessionMeta(nextPom.id);
    localStorage.setItem('isPersonalDictionaryRevision', 'false');
    localStorage.setItem('fullRevisionActive', 'false');

    await this.router.navigate(['/word-pairs-game'], { queryParams: { pomStart: Date.now() } });
  }

  private getNextLessonInSequence(): { levelId: number; lesson: StaticLesson } | null {
    const seenLessonIds = new Set(
      this.pomService.getAllPoms()
        .filter(pom => !!pom.lessonId)
        .map(pom => pom.lessonId as string)
    );

    const levelIds = Object.keys(COURSE_DATA)
      .map(id => Number(id))
      .sort((a, b) => a - b);

    for (const levelId of levelIds) {
      const level = COURSE_DATA[levelId];
      const orderedLessons = [
        ...level.domaines,
        ...level.lexical,
        ...level.verbs
      ];

      const nextLesson = orderedLessons.find(lesson => !seenLessonIds.has(lesson.id));
      if (nextLesson) {
        return { levelId, lesson: nextLesson };
      }
    }

    return null;
  }

  private getNextPlannedPom(): Pom | null {
    const activePoms = this.pomService.getAllPoms()
      .filter(pom => pom.status === 'active')
      .sort((a, b) => a.nextReviewDate - b.nextReviewDate);

    return activePoms[0] || null;
  }

  private clearReviewFlags(): void {
    localStorage.removeItem('isPomReview');
    localStorage.removeItem('pomId');
    localStorage.removeItem('pomReviewCounts');
    localStorage.removeItem('pomReviewDueAt');
    localStorage.removeItem('pomReviewWindowEnd');
    localStorage.removeItem('isPersonalDictionaryRevision');
    localStorage.removeItem('fullRevisionActive');
    localStorage.removeItem('fullRevisionSessionId');
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom'
    });

    await toast.present();
  }
}
