import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
export class WebExtractionFirebaseService {
  private readonly functionsBaseUrl = 'https://us-central1-nuovalingua4.cloudfunctions.net';

  constructor() {
  }

  /**
   * Extrait le contenu textuel d'une URL via Firebase Functions
   */
  extractContent(url: string): Observable<WebExtractionResponse> {
    
    const requestBody = { url };
    const functionUrl = `${this.functionsBaseUrl}/extractWebContent`;
    
    return from(
      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
    ).pipe(
      map(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      }),
      map(async (dataPromise) => {
        const data = await dataPromise;
        if (data.error) {
          throw new Error(data.error.message || 'Erreur Firebase Function');
        }
        return data;
      }),
      catchError((error) => {
        console.error('🔍 [WebExtractionFirebaseService] Erreur d\'extraction:', error);
        throw this.handleError(error);
      })
    );
  }

  /**
   * Teste la connectivité avec les Firebase Functions
   */
  testConnection(): Observable<TestResponse> {
    
    const functionUrl = `${this.functionsBaseUrl}/testFunction`;
    
    return from(
      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })
    ).pipe(
      map(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      }),
      map(async (dataPromise) => {
        const data = await dataPromise;
        if (data.error) {
          throw new Error(data.error.message || 'Erreur Firebase Function');
        }
        return data;
      }),
      catchError((error) => {
        console.error('🔍 [WebExtractionFirebaseService] Test échoué:', error);
        throw this.handleError(error);
      })
    );
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
    console.error('🔍 [WebExtractionFirebaseService] Erreur détaillée:', error);
    
    if (error.message) {
      if (error.message.includes('invalid-argument')) {
        return 'URL invalide ou manquante';
      } else if (error.message.includes('failed-precondition')) {
        return 'Impossible d\'extraire du contenu de cette URL';
      } else if (error.message.includes('unavailable')) {
        return 'URL inaccessible ou site indisponible';
      } else if (error.message.includes('internal')) {
        return 'Erreur interne lors de l\'extraction';
      }
    }
    
    return error.message || 'Erreur inconnue lors de l\'extraction';
  }
}
