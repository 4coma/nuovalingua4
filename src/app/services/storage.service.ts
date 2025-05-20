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
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération depuis le stockage', error);
      return null;
    }
  }

  /**
   * Supprime une valeur du stockage local
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
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