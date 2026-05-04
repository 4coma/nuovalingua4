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
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { DictionaryWord } from './personal-dictionary.service';
import { DiscussionTurn, DiscussionContext } from './discussion.service';
import { environment } from '../../environments/environment';

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
  savedTextsV2?: any[];
  vocabularyTracking?: any[];
  poms?: any[];
  preferences?: Record<string, any>;
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
  private authUserSubject = new BehaviorSubject<User | null>(null);
  private userDocumentSubject = new BehaviorSubject<Record<string, any> | null>(null);
  
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isConnected: false,
    isSyncing: false
  });
  
  public syncStatus$ = this.syncStatusSubject.asObservable();
  public authUser$ = this.authUserSubject.asObservable();
  public userDocument$ = this.userDocumentSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.initializeFirebase();
  }

  /**
   * Initialise Firebase avec la configuration embarquée (ou legacy en fallback)
   */
  private async initializeFirebase(): Promise<void> {
    try {
      const config = this.getResolvedFirebaseConfig();
      if (!config) {
        this.updateSyncStatus({
          isConnected: false,
          error: 'Firebase non configuré dans l’application'
        });
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
      await new Promise<void>((resolve) => {
        let firstAuthEventReceived = false;
        this.unsubscribeAuth = onAuthStateChanged(this.auth!, (user) => {
          this.currentUser = user;
          this.authUserSubject.next(user);

          if (user) {
            this.updateSyncStatus({
              isConnected: true,
              error: undefined
            });
            this.setupRealtimeSync();
          } else {
            this.stopRealtimeSync();
            this.userDocumentSubject.next(null);
            this.updateSyncStatus({
              isConnected: false,
              error: 'Utilisateur Firebase non authentifié'
            });
          }

          if (!firstAuthEventReceived) {
            firstAuthEventReceived = true;
            resolve();
          }
        });
      });

    } catch (error) {
      console.error('🔍 [FirebaseSync] Erreur d\'initialisation:', error);
      this.updateSyncStatus({ 
        isConnected: false, 
        error: 'Erreur d\'initialisation Firebase' 
      });
    }
  }

  /**
   * Vérifie qu'une config Firebase est complète
   */
  private isConfigComplete(config: Partial<FirebaseConfig> | null | undefined): config is FirebaseConfig {
    if (!config) {
      return false;
    }
    return !!(
      config.apiKey?.trim() &&
      config.authDomain?.trim() &&
      config.projectId?.trim() &&
      config.storageBucket?.trim() &&
      config.messagingSenderId?.trim() &&
      config.appId?.trim()
    );
  }

  /**
   * Récupère la configuration Firebase embarquée dans l'application
   */
  private getEmbeddedFirebaseConfig(): FirebaseConfig | null {
    const embeddedConfig = environment.firebaseConfig as Partial<FirebaseConfig> | undefined;
    if (!this.isConfigComplete(embeddedConfig)) {
      return null;
    }

    return {
      apiKey: embeddedConfig.apiKey.trim(),
      authDomain: embeddedConfig.authDomain.trim(),
      projectId: embeddedConfig.projectId.trim(),
      storageBucket: embeddedConfig.storageBucket.trim(),
      messagingSenderId: embeddedConfig.messagingSenderId.trim(),
      appId: embeddedConfig.appId.trim()
    };
  }

  /**
   * Récupère la configuration Firebase legacy stockée localement
   * (fallback pour conserver la compatibilité des installations existantes)
   */
  private getLegacyStoredFirebaseConfig(): FirebaseConfig | null {
    const legacyConfig: Partial<FirebaseConfig> = {
      apiKey: this.storageService.get('firebaseApiKey'),
      authDomain: this.storageService.get('firebaseAuthDomain'),
      projectId: this.storageService.get('firebaseProjectId'),
      storageBucket: this.storageService.get('firebaseStorageBucket'),
      messagingSenderId: this.storageService.get('firebaseMessagingSenderId'),
      appId: this.storageService.get('firebaseAppId')
    };

    if (!this.isConfigComplete(legacyConfig)) {
      return null;
    }

    return {
      apiKey: legacyConfig.apiKey.trim(),
      authDomain: legacyConfig.authDomain.trim(),
      projectId: legacyConfig.projectId.trim(),
      storageBucket: legacyConfig.storageBucket.trim(),
      messagingSenderId: legacyConfig.messagingSenderId.trim(),
      appId: legacyConfig.appId.trim()
    };
  }

  /**
   * Résout la configuration Firebase à utiliser
   * Priorité: config embarquée -> config legacy locale
   */
  private getResolvedFirebaseConfig(): FirebaseConfig | null {
    const embeddedConfig = this.getEmbeddedFirebaseConfig();
    if (embeddedConfig) {
      return embeddedConfig;
    }

    const legacyConfig = this.getLegacyStoredFirebaseConfig();
    if (legacyConfig) {
      return legacyConfig;
    }

    console.warn('🔍 [FirebaseSync] Aucune configuration Firebase valide trouvée');
    return null;
  }

  /**
   * Indique si Firebase est correctement configuré
   */
  isFirebaseConfigured(): boolean {
    return !!this.getResolvedFirebaseConfig();
  }

  /**
   * Retourne le Project ID Firebase configuré
   */
  getConfiguredProjectId(): string {
    return this.getResolvedFirebaseConfig()?.projectId || '';
  }

  /**
   * Indique l'origine de la configuration Firebase active
   */
  getConfigSource(): 'embedded' | 'legacy' | 'none' {
    if (this.getEmbeddedFirebaseConfig()) {
      return 'embedded';
    }
    if (this.getLegacyStoredFirebaseConfig()) {
      return 'legacy';
    }
    return 'none';
  }

  /**
   * Teste la connexion Firebase
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Firebase non initialisé');
      }

      // Vérifier si on a un utilisateur authentifié Firebase
      if (!this.currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Test simple : écrire un document de métadonnées lié à l'utilisateur
      const testDocRef = doc(this.db, 'users', this.currentUser.uid, 'meta', 'connection');
      await setDoc(testDocRef, { 
        test: true, 
        uid: this.currentUser.uid,
        timestamp: serverTimestamp() 
      }, { merge: true });

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

  private getUserDocRef() {
    if (!this.db || !this.currentUser) {
      throw new Error('Firebase non initialisé ou utilisateur non connecté');
    }
    return doc(this.db, 'users', this.currentUser.uid);
  }

  /**
   * Synchronise toutes les données utilisateur vers Firebase
   */
  async syncAllUserData(userData: UserData): Promise<void> {
    await this.syncUserDataPatch(userData);
  }

  /**
   * Synchronise un patch générique des données utilisateur vers Firebase
   */
  async syncUserDataPatch(payload: Record<string, any>): Promise<void> {
    const userDocRef = this.getUserDocRef();
    this.updateSyncStatus({ isSyncing: true });

    try {
      const cleanedPayload = this.cleanDataForFirebase(payload);

      await setDoc(userDocRef, {
        ...cleanedPayload,
        lastSync: serverTimestamp(),
        syncVersion: 1
      }, { merge: true });

      const currentDoc = this.userDocumentSubject.value || {};
      this.userDocumentSubject.next({
        ...currentDoc,
        ...cleanedPayload,
        lastSync: new Date(),
        syncVersion: 1
      });

      this.updateSyncStatus({
        isSyncing: false,
        lastSync: new Date(),
        error: undefined
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
    await this.syncUserDataPatch({ personalDictionary: words });
  }

  /**
   * Récupère toutes les données utilisateur depuis Firebase
   */
  async getAllUserData(): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(this.getUserDocRef());
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        this.userDocumentSubject.next(data);
        const userData: UserData = {
          personalDictionary: data['personalDictionary'] || [],
          conversations: data['conversations'] || [],
          statistics: data['statistics'] || this.getDefaultStatistics(),
          settings: data['settings'] || this.getDefaultSettings(),
          savedTexts: data['savedTexts'] || [],
          savedTextsV2: data['savedTextsV2'] || [],
          vocabularyTracking: data['vocabularyTracking'] || [],
          poms: data['poms'] || [],
          preferences: data['preferences'] || {},
          metadata: {
            createdAt: data['metadata']?.createdAt || new Date(),
            lastSync: new Date(),
            syncVersion: data['metadata']?.syncVersion || 1,
            appVersion: data['metadata']?.appVersion || '1.0.0'
          }
        };
        
        return userData;
      } else {
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
    try {
      const userDoc = await getDoc(this.getUserDocRef());
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        this.userDocumentSubject.next(data);
        const words = data['personalDictionary'] || [];
        return words;
      } else {
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
          this.userDocumentSubject.next(data);
          this.updateSyncStatus({
            isConnected: true,
            error: undefined,
            lastSync: data['lastSync']?.toDate?.() || this.syncStatusSubject.value.lastSync
          });
        } else {
          this.userDocumentSubject.next(null);
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
    this.authUserSubject.next(null);
    this.userDocumentSubject.next(null);
    
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
      } catch (error) {
        console.error('🔍 [FirebaseSync] Erreur de déconnexion:', error);
      }
    }
    this.cleanup();
  }

  /**
   * Crée un compte Firebase (email + mot de passe)
   * Si l'utilisateur courant est anonyme, son compte est converti pour conserver le même UID.
   */
  async registerWithEmailPassword(email: string, password: string): Promise<User> {
    if (!this.auth) {
      throw new Error('Firebase Auth non initialisé');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('Email et mot de passe requis');
    }

    if (this.currentUser?.isAnonymous) {
      const credential = EmailAuthProvider.credential(normalizedEmail, password);
      const linkedUserCredential = await linkWithCredential(this.currentUser, credential);
      return linkedUserCredential.user;
    }

    const userCredential = await createUserWithEmailAndPassword(this.auth, normalizedEmail, password);
    return userCredential.user;
  }

  /**
   * Connecte un utilisateur Firebase (email + mot de passe)
   */
  async loginWithEmailPassword(email: string, password: string): Promise<User> {
    if (!this.auth) {
      throw new Error('Firebase Auth non initialisé');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('Email et mot de passe requis');
    }

    const userCredential = await signInWithEmailAndPassword(this.auth, normalizedEmail, password);
    return userCredential.user;
  }

  /**
   * Déclenche un email de réinitialisation de mot de passe
   */
  async sendPasswordReset(email: string): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase Auth non initialisé');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email requis');
    }

    await sendPasswordResetEmail(this.auth, normalizedEmail);
  }

  /**
   * Connexion anonyme Firebase (compte authentifié sans email)
   */
  async loginAnonymously(): Promise<User> {
    if (!this.auth) {
      throw new Error('Firebase Auth non initialisé');
    }

    const userCredential = await signInAnonymously(this.auth);
    return userCredential.user;
  }

  /**
   * Déconnecte l'utilisateur courant en conservant l'initialisation Firebase
   */
  async logout(): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase Auth non initialisé');
    }
    await signOut(this.auth);
  }

  /**
   * Retourne l'utilisateur Firebase courant
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Vérifie si un utilisateur Firebase est authentifié
   */
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  /**
   * Vérifie si Firebase est configuré et activé
   */
  isFirebaseEnabled(): boolean {
    // Conservé pour compatibilité rétroactive avec le reste du code.
    return this.isFirebaseConfigured();
  }

  /**
   * Obtient le statut de synchronisation actuel
   */
  getCurrentSyncStatus(): SyncStatus {
    return this.syncStatusSubject.value;
  }

  /**
   * Retourne le document utilisateur courant tel que reçu depuis Firebase
   */
  getCachedUserDocument(): Record<string, any> | null {
    return this.userDocumentSubject.value;
  }

  /**
   * Récupère le document utilisateur brut depuis Firebase
   */
  async getUserDocumentData(): Promise<Record<string, any> | null> {
    try {
      const userDoc = await getDoc(this.getUserDocRef());
      if (!userDoc.exists()) {
        this.userDocumentSubject.next(null);
        return null;
      }

      const data = userDoc.data();
      this.userDocumentSubject.next(data);
      return data;
    } catch (error) {
      console.error('🔍 [FirebaseSync] Erreur de récupération du document brut:', error);
      throw error;
    }
  }
}
