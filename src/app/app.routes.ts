import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'category',
    canActivate: [authGuard],
    loadComponent: () => import('./components/category-selection/category-selection.component').then(m => m.CategorySelectionComponent)
  },
  {
    path: 'full-revision-setup',
    canActivate: [authGuard],
    loadComponent: () => import('./components/full-revision-setup/full-revision-setup.component').then(m => m.FullRevisionSetupComponent)
  },
  {
    path: 'personal-revision-setup',
    canActivate: [authGuard],
    loadComponent: () => import('./components/personal-revision-setup/personal-revision-setup.component').then(m => m.PersonalRevisionSetupComponent)
  },
  {
    path: 'comprehension-setup',
    canActivate: [authGuard],
    loadComponent: () => import('./components/comprehension-setup/comprehension-setup.component').then(m => m.ComprehensionSetupComponent)
  },
  {
    path: 'vocabulary',
    canActivate: [authGuard],
    loadComponent: () => import('./components/vocabulary-exercise/vocabulary-exercise.component').then(m => m.VocabularyExerciseComponent)
  },
  {
    path: 'comprehension',
    canActivate: [authGuard],
    loadComponent: () => import('./components/comprehension-exercise/comprehension-exercise.component').then(m => m.ComprehensionExerciseComponent)
  },
  {
    path: 'questions',
    canActivate: [authGuard],
    loadComponent: () => import('./components/comprehension-questions/comprehension-questions.component').then(m => m.ComprehensionQuestionsComponent)
  },
  {
    path: 'personal-dictionary',
    canActivate: [authGuard],
    loadComponent: () => import('./components/personal-dictionary-list/personal-dictionary-list.component').then(m => m.PersonalDictionaryListComponent)
  },
  {
    path: 'saved-conversations',
    canActivate: [authGuard],
    loadComponent: () => import('./components/saved-conversations-list/saved-conversations-list.component').then(m => m.SavedConversationsListComponent)
  },
  {
    path: 'recent-words',
    canActivate: [authGuard],
    loadComponent: () => import('./components/recent-words-list/recent-words-list.component').then(m => m.RecentWordsListComponent)
  },
  {
    path: 'word-pairs-game',
    canActivate: [authGuard],
    loadComponent: () => import('./components/word-pairs-game/word-pairs-game.component').then(m => m.WordPairsGameComponent)
  },
  {
    path: 'saved-texts',
    canActivate: [authGuard],
    loadComponent: () => import('./components/saved-texts-list/saved-texts-list.component').then(m => m.SavedTextsListComponent)
  },
  {
    path: 'test',
    canActivate: [authGuard],
    loadComponent: () => import('./components/saved-texts-list/saved-texts-list.component').then(m => m.SavedTextsListComponent)
  },
  {
    path: 'test2',
    canActivate: [authGuard],
    loadComponent: () => import('./components/test-component').then(m => m.TestComponent)
  },
  {
    path: 'preferences',
    canActivate: [authGuard],
    loadComponent: () => import('./components/preferences/preferences.component').then(m => m.PreferencesComponent)
  },
  {
    path: 'auth',
    canActivate: [guestOnlyGuard],
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'discussion-context-selection',
    canActivate: [authGuard],
    loadComponent: () => import('./components/discussion-context-selection/discussion-context-selection.component').then(m => m.DiscussionContextSelectionComponent)
  },
  {
    path: 'discussion/:contextId',
    canActivate: [authGuard],
    loadComponent: () => import('./components/discussion-active/discussion-active.component').then(m => m.DiscussionActiveComponent)
  },
  {
    path: 'design-showcase',
    canActivate: [authGuard],
    loadComponent: () => import('./components/design-showcase/design-showcase.component').then(m => m.DesignShowcaseComponent)
  },
  {
    path: 'atoms-showcase',
    canActivate: [authGuard],
    loadComponent: () => import('./components/atoms-showcase/atoms-showcase.component').then(m => m.AtomsShowcaseComponent)
  },
  {
    path: 'poms',
    canActivate: [authGuard],
    loadComponent: () => import('./components/pom-list/pom-list.component').then(m => m.PomListComponent)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
]; 
