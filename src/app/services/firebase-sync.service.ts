import { Injectable } from '@angular/core';
import { 
  initializeApp, 
  FirebaseApp, 
  getApps 
} from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  Auth, 
  signInAnonymously, 
  User,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { DictionaryWord } from './personal-dictionary.service';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseSyncService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private currentUser: User | null = null;
  private unsubscribeAuth: Unsubscribe | null = null;
  private unsubscribeSync: Unsubscribe | null = null;
  
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isConnected: false,
    isSyncing: false
  });
  
  public syncStatus$ = this.syncStatusSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.initializeFirebase();
  }

  /**
   * Initialise Firebase avec la configuration utilisateur
   */
  private async initializeFirebase(): Promise<void> {
    try {
      const config = this.getFirebaseConfig();
      if (!config) {
        console.log('🔍 [FirebaseSync] Aucune configuration Firebase trouvée');
        return;
      }

      // Vérifier si une app Firebase existe déjà
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.app = existingApps[0];
      } else {
        this.app = initializeApp(config, 'nuovalingua-sync');
      }

      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);

      // Écouter les changements d'authentification
      this.unsubscribeAuth = onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.updateSyncStatus({ isConnected: !!user });
        
        if (user) {
          console.log('🔍 [FirebaseSync] Utilisateur connecté:', user.uid);
          this.setupRealtimeSync();
        } else {
          console.log('🔍 [FirebaseSync] Utilisateur déconnecté');
          this.stopRealtimeSync();
        }
      });

      // Se connecter anonymement
      await this.connectAnonymously();

    } catch (error) {
      console.error('🔍 [FirebaseSync] Erreur d\'initialisation:', error);
      this.updateSyncStatus({ 
        isConnected: false, 
        error: 'Erreur d\'initialisation Firebase' 
      });
    }
  }

  /**
   * Récupère la configuration Firebase depuis le localStorage
   */
  private getFirebaseConfig(): FirebaseConfig | null {
    const isEnabled = this.storageService.get('firebaseEnabled') === 'true';
    if (!isEnabled) {
      return null;
    }

    const apiKey = this.storageService.get('firebaseApiKey');
    const authDomain = this.storageService.get('firebaseAuthDomain');
    const projectId = this.storageService.get('firebaseProjectId');
    const storageBucket = this.storageService.get('firebaseStorageBucket');
    const messagingSenderId = this.storageService.get('firebaseMessagingSenderId');
    const appId = this.storageService.get('firebaseAppId');

    if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
      console.warn('🔍 [FirebaseSync] Configuration Firebase incomplète');
      return null;
    }

    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    };
  }

  /**
   * Se connecte anonymement à Firebase
   */
  private async connectAnonymously(): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase Auth non initialisé');
    }

    try {
      const userCredential = await signInAnonymously(this.auth);
      this.currentUser = userCredential.user;
      console.log('🔍 [FirebaseSync] Connexion anonyme réussie:', this.currentUser.uid);
    } catch (error) {
      console.error('🔍 [FirebaseSync] Erreur de connexion anonyme:', error);
      throw error;
    }
  }

  /**
   * Teste la connexion Firebase
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.db || !this.currentUser) {
        throw new Error('Firebase non initialisé ou utilisateur non connecté');
      }

      // Test simple : essayer de lire un document
      const testDocRef = doc(this.db, 'test', 'connection');
      await setDoc(testDocRef, { 
        test: true, 
        timestamp: serverTimestamp() 
      }, { merge: true });

      console.log('🔍 [FirebaseSync] Test de connexion réussi');
      return true;
    } catch (error) {
      console.error('🔍 [FirebaseSync] Test de connexion échoué:', error);
      this.updateSyncStatus({ 
        isConnected: false, 
        error: 'Test de connexion échoué' 
      });
      return false;
    }
  }

  /**
   * Synchronise le dictionnaire personnel vers Firebase
   */
  async syncPersonalDictionary(words: DictionaryWord[]): Promise<void> {
    if (!this.db || !this.currentUser) {
      throw new Error('Firebase non initialisé ou utilisateur non connecté');
    }

    this.updateSyncStatus({ isSyncing: true });

    try {
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      await setDoc(userDocRef, {
        personalDictionary: words,
        lastSync: serverTimestamp(),
        syncVersion: 1
      }, { merge: true });

      console.log('🔍 [FirebaseSync] Dictionnaire personnel synchronisé:', words.length, 'mots');
      this.updateSyncStatus({ 
        isSyncing: false, 
        lastSync: new Date() 
      });
    } catch (error) {
      console.error('🔍 [FirebaseSync] Erreur de synchronisation:', error);
      this.updateSyncStatus({ 
        isSyncing: false, 
        error: 'Erreur de synchronisation' 
      });
      throw error;
    }
  }

  /**
   * Récupère le dictionnaire personnel depuis Firebase
   */
  async getPersonalDictionary(): Promise<DictionaryWord[]> {
    if (!this.db || !this.currentUser) {
      throw new Error('Firebase non initialisé ou utilisateur non connecté');
    }

    try {
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const words = data['personalDictionary'] || [];
        console.log('🔍 [FirebaseSync] Dictionnaire personnel récupéré:', words.length, 'mots');
        return words;
      } else {
        console.log('🔍 [FirebaseSync] Aucun dictionnaire personnel trouvé sur Firebase');
        return [];
      }
    } catch (error) {
      console.error('🔍 [FirebaseSync] Erreur de récupération:', error);
      throw error;
    }
  }

  /**
   * Configure la synchronisation en temps réel
   */
  private setupRealtimeSync(): void {
    if (!this.db || !this.currentUser) {
      return;
    }

    try {
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      this.unsubscribeSync = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log('🔍 [FirebaseSync] Données mises à jour depuis Firebase');
          // Ici, on pourrait émettre un événement pour mettre à jour l'UI
          // ou déclencher une synchronisation locale
        }
      });
    } catch (error) {
      console.error('🔍 [FirebaseSync] Erreur de synchronisation temps réel:', error);
    }
  }

  /**
   * Arrête la synchronisation en temps réel
   */
  private stopRealtimeSync(): void {
    if (this.unsubscribeSync) {
      this.unsubscribeSync();
      this.unsubscribeSync = null;
    }
  }

  /**
   * Met à jour le statut de synchronisation
   */
  private updateSyncStatus(status: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatusSubject.value;
    this.syncStatusSubject.next({ ...currentStatus, ...status });
  }

  /**
   * Force une nouvelle initialisation Firebase
   */
  async reinitialize(): Promise<void> {
    this.cleanup();
    await this.initializeFirebase();
  }

  /**
   * Nettoie les ressources Firebase
   */
  private cleanup(): void {
    this.stopRealtimeSync();
    
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }

    this.app = null;
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    
    this.updateSyncStatus({
      isConnected: false,
      isSyncing: false
    });
  }

  /**
   * Se déconnecte de Firebase
   */
  async disconnect(): Promise<void> {
    if (this.auth) {
      try {
        await signOut(this.auth);
        console.log('🔍 [FirebaseSync] Déconnexion réussie');
      } catch (error) {
        console.error('🔍 [FirebaseSync] Erreur de déconnexion:', error);
      }
    }
    this.cleanup();
  }

  /**
   * Vérifie si Firebase est configuré et activé
   */
  isFirebaseEnabled(): boolean {
    return this.storageService.get('firebaseEnabled') === 'true';
  }

  /**
   * Obtient le statut de synchronisation actuel
   */
  getCurrentSyncStatus(): SyncStatus {
    return this.syncStatusSubject.value;
  }
}
