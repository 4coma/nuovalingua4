import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseSyncService } from './firebase-sync.service';
import { StorageService } from './storage.service';

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
    private firebaseSync: FirebaseSyncService,
    private storageService: StorageService
  ) {
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
    // Vérifier s'il y a un UID personnalisé configuré
    const customUid = this.storageService.get('firebaseCustomUid');
    
    let uid: string;
    let displayName: string;
    
    if (customUid && customUid.trim()) {
      // Utiliser l'UID personnalisé
      uid = customUid.trim();
      displayName = `Utilisateur personnalisé (${uid.substring(0, 8)}...)`;
    } else {
      // Utiliser l'UID anonyme par défaut
      uid = 'anonymous-user';
      displayName = 'Utilisateur anonyme';
    }

    const userProfile: UserProfile = {
      uid: uid,
      displayName: displayName,
      isAnonymous: !customUid || !customUid.trim(),
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
