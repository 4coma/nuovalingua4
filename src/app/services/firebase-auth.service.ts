import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseSyncService } from './firebase-sync.service';

export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastLogin: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private firebaseSync: FirebaseSyncService) {
    // Écouter les changements d'état de synchronisation Firebase
    this.firebaseSync.syncStatus$.subscribe(status => {
      if (status.isConnected) {
        this.updateUserProfile();
      } else {
        this.userSubject.next(null);
      }
    });
  }

  /**
   * Met à jour le profil utilisateur
   */
  private updateUserProfile(): void {
    // Pour l'instant, on utilise un utilisateur anonyme
    // Plus tard, on pourra ajouter l'authentification par email
    const userProfile: UserProfile = {
      uid: 'anonymous-user',
      displayName: 'Utilisateur anonyme',
      isAnonymous: true,
      createdAt: new Date(),
      lastLogin: new Date()
    };

    this.userSubject.next(userProfile);
  }

  /**
   * Obtient le profil utilisateur actuel
   */
  getCurrentUser(): UserProfile | null {
    return this.userSubject.value;
  }

  /**
   * Vérifie si un utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  /**
   * Obtient l'ID de l'utilisateur actuel
   */
  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user ? user.uid : null;
  }
}
