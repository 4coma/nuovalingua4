import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'category',
    loadComponent: () => import('./components/category-selection/category-selection.component').then(m => m.CategorySelectionComponent)
  },
  {
    path: 'vocabulary',
    loadComponent: () => import('./pages/vocabulary-exercise/vocabulary-exercise.component').then(m => m.VocabularyExerciseComponent)
  },
  {
    path: 'comprehension',
    loadComponent: () => import('./pages/comprehension-exercise/comprehension-exercise.component').then(m => m.ComprehensionExerciseComponent)
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
    path: '**',
    redirectTo: '/home'
  }
]; 