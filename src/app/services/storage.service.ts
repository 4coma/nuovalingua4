import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() { }

  /**
   * Enregistre une valeur dans le stockage local
   */
  set(key: string, value: any): void {
    try {
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(key, jsonValue);
      if (key === 'poms') {
        const count = Array.isArray(value) ? value.length : 'n/a';
        console.log(`[POM DEBUG] StorageService.set key=poms count=${count} rawLength=${jsonValue.length}`);
        console.trace('[POM DEBUG] StorageService.set stack');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement dans le stockage', error);
    }
  }

  /**
   * Récupère une valeur du stockage local
   */
  get(key: string): any {
    try {
      const item = localStorage.getItem(key);
      if (key === 'poms') {
        console.log(`[POM DEBUG] StorageService.get key=poms rawLength=${item ? item.length : 0}`);
        if (!item) {
          console.trace('[POM DEBUG] StorageService.get missing key stack');
        }
      }
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération depuis le stockage', error);
      if (key === 'poms') {
        console.trace('[POM DEBUG] StorageService.get parse error stack');
      }
      return null;
    }
  }

  /**
   * Supprime une valeur du stockage local
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
      if (key === 'poms') {
        console.log('[POM DEBUG] StorageService.remove key=poms');
        console.trace('[POM DEBUG] StorageService.remove stack');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression depuis le stockage', error);
    }
  }

  /**
   * Vérifie si une clé existe dans le stockage local
   */
  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
} 
