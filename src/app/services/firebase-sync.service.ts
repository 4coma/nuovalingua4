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
import { DiscussionTurn, DiscussionContext } from './discussion.service';

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

export interface Conversation {
  id: string;
  context: DiscussionContext;
  turns: DiscussionTurn[];
  startTime: Date;
  endTime?: Date;
  language: string;
}

export interface UserStatistics {
  totalWordsLearned: number;
  totalConversations: number;
  totalStudyTime: number; // en millisecondes
  streakDays: number;
  lastActivity: Date;
  wordsAddedToday: number;
  conversationsToday: number;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  notificationTime: string;
  notificationMessage: string;
  comprehensionNotificationsEnabled: boolean;
  comprehensionNotificationTime: string;
  wordAssociationsCount: number;
  oralComprehensionLength: number;
  spacedRepetitionWordsCount: number;
  personalDictionaryWordsCount: number;
  openaiApiKey?: string;
  googleTtsApiKey?: string;
}

export interface SavedText {
  id: string;
  title: string;
  content: string;
  language: string;
  difficulty: string;
  dateSaved: Date;
  wordCount: number;
}

export interface UserData {
  personalDictionary: DictionaryWord[];
  conversations: Conversation[];
  statistics: UserStatistics;
  settings: UserSettings;
  savedTexts: SavedText[];
  metadata: {
    createdAt: Date;
    lastSync: Date;
    syncVersion: number;
    appVersion: string;
  };
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

      // Se connecter anonymement ou avec UID personnalisé
      await this.connectAnonymously();
      
      // Écouter les changements d'authentification (seulement pour les vrais utilisateurs Firebase)
      this.unsubscribeAuth = onAuthStateChanged(this.auth, (user) => {
        // Ne traiter que les vrais utilisateurs Firebase (pas nos utilisateurs simulés)
        const customUid = this.storageService.get('firebaseCustomUid');
        if (!customUid || !customUid.trim()) {
          this.currentUser = user;
          this.updateSyncStatus({ isConnected: !!user });
          
          if (user) {
            console.log('🔍 [FirebaseSync] Utilisateur connecté:', user.uid);
            this.setupRealtimeSync();
          } else {
            console.log('🔍 [FirebaseSync] Utilisateur déconnecté');
            this.stopRealtimeSync();
          }
        }
      });
      
      // Si on utilise un UID personnalisé, mettre à jour le statut manuellement
      const customUid = this.storageService.get('firebaseCustomUid');
      if (customUid && customUid.trim() && this.currentUser) {
        console.log('🔍 [FirebaseSync] UID personnalisé détecté, mise à jour du statut');
        this.updateSyncStatus({ isConnected: true });
        this.setupRealtimeSync();
      }

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
      // Vérifier s'il y a un UID personnalisé configuré
      const customUid = this.storageService.get('firebaseCustomUid');
      
      if (customUid && customUid.trim()) {
        // Utiliser l'UID personnalisé (simulation d'un utilisateur connecté)
        this.currentUser = {
          uid: customUid.trim(),
          displayName: null,
          email: null,
          emailVerified: false,
          isAnonymous: false,
          phoneNumber: null,
          photoURL: null,
          providerId: 'custom',
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          },
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => '',
          getIdTokenResult: async () => ({} as any),
          reload: async () => {},
          toJSON: () => ({})
        } as User;
        console.log('🔍 [FirebaseSync] UID personnalisé utilisé:', this.currentUser.uid);
        console.log('🔍 [FirebaseSync] Utilisateur personnalisé créé:', this.currentUser);
      } else {
        // Utiliser l'authentification anonyme normale
        const userCredential = await signInAnonymously(this.auth);
        this.currentUser = userCredential.user;
        console.log('🔍 [FirebaseSync] Connexion anonyme réussie:', this.currentUser.uid);
      }
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
      if (!this.db) {
        throw new Error('Firebase non initialisé');
      }

      // Vérifier si on a un utilisateur (anonyme ou personnalisé)
      if (!this.currentUser) {
        // Essayer de se reconnecter si on a un UID personnalisé
        const customUid = this.storageService.get('firebaseCustomUid');
        if (customUid && customUid.trim()) {
          console.log('🔍 [FirebaseSync] Reconnexion avec UID personnalisé...');
          await this.connectAnonymously();
        }
        
        if (!this.currentUser) {
          throw new Error('Utilisateur non connecté');
        }
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
   * Nettoie les données en supprimant les valeurs undefined
   */
  private cleanDataForFirebase(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.cleanDataForFirebase(item));
    }
    
    if (typeof data === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanDataForFirebase(value);
        }
      }
      return cleaned;
    }
    
    return data;
  }

  /**
   * Synchronise toutes les données utilisateur vers Firebase
   */
  async syncAllUserData(userData: UserData): Promise<void> {
    if (!this.db || !this.currentUser) {
      throw new Error('Firebase non initialisé ou utilisateur non connecté');
    }

    this.updateSyncStatus({ isSyncing: true });

    try {
      // Nettoyer les données avant de les envoyer à Firebase
      const cleanedUserData = this.cleanDataForFirebase(userData);
      
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      await setDoc(userDocRef, {
        ...cleanedUserData,
        lastSync: serverTimestamp(),
        syncVersion: 1
      }, { merge: true });

      console.log('🔍 [FirebaseSync] Toutes les données synchronisées:', {
        words: userData.personalDictionary.length,
        conversations: userData.conversations.length,
        savedTexts: userData.savedTexts.length
      });
      
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
   * Synchronise le dictionnaire personnel vers Firebase (compatibilité)
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
   * Récupère toutes les données utilisateur depuis Firebase
   */
  async getAllUserData(): Promise<UserData | null> {
    if (!this.db || !this.currentUser) {
      throw new Error('Firebase non initialisé ou utilisateur non connecté');
    }

    try {
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userData: UserData = {
          personalDictionary: data['personalDictionary'] || [],
          conversations: data['conversations'] || [],
          statistics: data['statistics'] || this.getDefaultStatistics(),
          settings: data['settings'] || this.getDefaultSettings(),
          savedTexts: data['savedTexts'] || [],
          metadata: {
            createdAt: data['metadata']?.createdAt || new Date(),
            lastSync: new Date(),
            syncVersion: data['metadata']?.syncVersion || 1,
            appVersion: data['metadata']?.appVersion || '1.0.0'
          }
        };
        
        console.log('🔍 [FirebaseSync] Toutes les données récupérées:', {
          words: userData.personalDictionary.length,
          conversations: userData.conversations.length,
          savedTexts: userData.savedTexts.length
        });
        
        return userData;
      } else {
        console.log('🔍 [FirebaseSync] Aucune donnée utilisateur trouvée sur Firebase');
        return null;
      }
    } catch (error) {
      console.error('🔍 [FirebaseSync] Erreur de récupération:', error);
      throw error;
    }
  }

  /**
   * Récupère le dictionnaire personnel depuis Firebase (compatibilité)
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
   * Retourne les statistiques par défaut
   */
  private getDefaultStatistics(): UserStatistics {
    return {
      totalWordsLearned: 0,
      totalConversations: 0,
      totalStudyTime: 0,
      streakDays: 0,
      lastActivity: new Date(),
      wordsAddedToday: 0,
      conversationsToday: 0
    };
  }

  /**
   * Retourne les paramètres par défaut
   */
  private getDefaultSettings(): UserSettings {
    return {
      notificationsEnabled: false,
      notificationTime: '18:30',
      notificationMessage: 'Il est temps de pratiquer votre italien ! 🇮🇹',
      comprehensionNotificationsEnabled: false,
      comprehensionNotificationTime: '19:00',
      wordAssociationsCount: 10,
      oralComprehensionLength: 150,
      spacedRepetitionWordsCount: 10,
      personalDictionaryWordsCount: 8
    };
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
