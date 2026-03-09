import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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

  constructor(
    private firebaseSync: FirebaseSyncService
  ) {
    // Écouter l'état d'authentification Firebase réel
    this.firebaseSync.authUser$.subscribe(user => {
      if (!user) {
        this.userSubject.next(null);
        return;
      }

      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || undefined,
        email: user.email || undefined,
        isAnonymous: user.isAnonymous,
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        lastLogin: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date()
      };

      this.userSubject.next(userProfile);
    });
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
