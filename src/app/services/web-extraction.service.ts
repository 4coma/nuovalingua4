import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface WebExtractionRequest {
  url: string;
}

export interface WebExtractionResponse {
  success: boolean;
  content: string;
  title: string;
  url: string;
  extractedAt: string;
}

export interface TestResponse {
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebExtractionService {
  constructor() {
    console.log('🔍 [WebExtractionService] Service initialisé');
  }

  /**
   * Extrait le contenu textuel d'une URL
   * Version simulée en attendant la configuration Firebase Functions
   */
  extractContent(url: string): Observable<WebExtractionResponse> {
    console.log('🔍 [WebExtractionService] Extraction du contenu pour:', url);
    
    // Simulation d'extraction avec délai
    return of({
      success: true,
      content: `Contenu extrait de l'URL : ${url}\n\nCeci est un exemple de contenu qui serait extrait par la Firebase Function.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`,
      title: 'Article extrait',
      url: url,
      extractedAt: new Date().toISOString()
    }).pipe(delay(2000));
  }

  /**
   * Teste la connectivité avec les Firebase Functions
   * Version simulée en attendant la configuration Firebase Functions
   */
  testConnection(): Observable<TestResponse> {
    console.log('🔍 [WebExtractionService] Test de connexion Firebase Functions');
    
    return of({
      message: 'Service d\'extraction web opérationnel (version simulée)',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Valide une URL
   */
  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Gère les erreurs Firebase Functions
   */
  private handleError(error: any): string {
    console.error('🔍 [WebExtractionService] Erreur détaillée:', error);
    
    if (error.code) {
      switch (error.code) {
        case 'invalid-argument':
          return 'URL invalide ou manquante';
        case 'failed-precondition':
          return 'Impossible d\'extraire du contenu de cette URL';
        case 'unavailable':
          return 'URL inaccessible ou site indisponible';
        case 'internal':
          return 'Erreur interne lors de l\'extraction';
        default:
          return `Erreur: ${error.message || 'Erreur inconnue'}`;
      }
    }
    
    return error.message || 'Erreur inconnue lors de l\'extraction';
  }
}
