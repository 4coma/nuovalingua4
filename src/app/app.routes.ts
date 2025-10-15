import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'category',
    loadComponent: () => import('./components/category-selection/category-selection.component').then(m => m.CategorySelectionComponent)
  },
  {
    path: 'full-revision-setup',
    loadComponent: () => import('./components/full-revision-setup/full-revision-setup.component').then(m => m.FullRevisionSetupComponent)
  },
  {
    path: 'personal-revision-setup',
    loadComponent: () => import('./components/personal-revision-setup/personal-revision-setup.component').then(m => m.PersonalRevisionSetupComponent)
  },
  {
    path: 'vocabulary',
    loadComponent: () => import('./components/vocabulary-exercise/vocabulary-exercise.component').then(m => m.VocabularyExerciseComponent)
  },
  {
    path: 'comprehension',
    loadComponent: () => import('./components/comprehension-exercise/comprehension-exercise.component').then(m => m.ComprehensionExerciseComponent)
  },
  {
    path: 'questions',
    loadComponent: () => import('./components/comprehension-questions/comprehension-questions.component').then(m => m.ComprehensionQuestionsComponent)
  },
  {
    path: 'personal-dictionary',
    loadComponent: () => import('./components/personal-dictionary-list/personal-dictionary-list.component').then(m => m.PersonalDictionaryListComponent)
  },
  {
    path: 'saved-conversations',
    loadComponent: () => import('./components/saved-conversations-list/saved-conversations-list.component').then(m => m.SavedConversationsListComponent)
  },
  {
    path: 'recent-words',
    loadComponent: () => import('./components/recent-words-list/recent-words-list.component').then(m => m.RecentWordsListComponent)
  },
  {
    path: 'word-pairs-game',
    loadComponent: () => import('./components/word-pairs-game/word-pairs-game.component').then(m => m.WordPairsGameComponent)
  },
  {
    path: 'saved-texts',
    loadComponent: () => import('./components/saved-texts-list/saved-texts-list.component').then(m => m.SavedTextsListComponent)
  },
  {
    path: 'test',
    loadComponent: () => import('./components/saved-texts-list/saved-texts-list.component').then(m => m.SavedTextsListComponent)
  },
  {
    path: 'test2',
    loadComponent: () => import('./components/test-component').then(m => m.TestComponent)
  },
  {
    path: 'preferences',
    loadComponent: () => import('./components/preferences/preferences.component').then(m => m.PreferencesComponent)
  },
  {
    path: 'discussion-context-selection',
    loadComponent: () => import('./components/discussion-context-selection/discussion-context-selection.component').then(m => m.DiscussionContextSelectionComponent)
  },
  {
    path: 'discussion/:contextId',
    loadComponent: () => import('./components/discussion-active/discussion-active.component').then(m => m.DiscussionActiveComponent)
  },
  {
    path: 'design-showcase',
    loadComponent: () => import('./components/design-showcase/design-showcase.component').then(m => m.DesignShowcaseComponent)
  },
  {
    path: 'atoms-showcase',
    loadComponent: () => import('./components/atoms-showcase/atoms-showcase.component').then(m => m.AtomsShowcaseComponent)
  },
  {
    path: '**',
    redirectTo: '/home'
  }
]; 
