import { TestBed } from '@angular/core/testing';
import { DataMigrationService } from './data-migration.service';
import { StorageService } from './storage.service';
import { FirebaseSyncService } from './firebase-sync.service';

describe('DataMigrationService', () => {
  let service: DataMigrationService;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;
  let firebaseSyncSpy: jasmine.SpyObj<FirebaseSyncService>;
  let storageState: Record<string, any>;

  beforeEach(() => {
    storageState = {};
    localStorage.clear();

    const storageSpy = jasmine.createSpyObj('StorageService', ['get', 'set', 'remove']);
    const firebaseSpy = jasmine.createSpyObj('FirebaseSyncService', [
      'isFirebaseEnabled',
      'getCurrentUser',
      'syncAllUserData',
      'syncUserDataPatch',
      'getUserDocumentData'
    ]);

    storageSpy.get.and.callFake((key: string) => storageState[key]);
    storageSpy.set.and.callFake((key: string, value: any) => {
      storageState[key] = value;
    });
    storageSpy.remove.and.callFake((key: string) => {
      delete storageState[key];
    });

    firebaseSpy.isFirebaseEnabled.and.returnValue(true);
    firebaseSpy.getCurrentUser.and.returnValue({ uid: 'user-1' } as any);
    firebaseSpy.syncAllUserData.and.returnValue(Promise.resolve());
    firebaseSpy.syncUserDataPatch.and.returnValue(Promise.resolve());
    firebaseSpy.getUserDocumentData.and.returnValue(Promise.resolve(null));

    TestBed.configureTestingModule({
      providers: [
        DataMigrationService,
        { provide: StorageService, useValue: storageSpy },
        { provide: FirebaseSyncService, useValue: firebaseSpy }
      ]
    });

    service = TestBed.inject(DataMigrationService);
    storageServiceSpy = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    firebaseSyncSpy = TestBed.inject(FirebaseSyncService) as jasmine.SpyObj<FirebaseSyncService>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should migrate the current local storage model to Firebase with extended user data', async () => {
    localStorage.setItem('personalDictionary__user-1', JSON.stringify([
      { id: 'word-1', sourceWord: 'ciao', targetWord: 'salut', sourceLang: 'it', targetLang: 'fr', dateAdded: Date.now() }
    ]));
    localStorage.setItem('savedConversations__user-1', JSON.stringify([
      { id: 'conv-1', context: { id: 'travel', title: 'Travel' }, turns: [], startTime: Date.now(), language: 'it' }
    ]));
    localStorage.setItem('savedTexts__user-1', JSON.stringify([
      { id: 'text-1', title: 'Texte', text: 'Contenu', type: 'written', category: 'A', topic: 'B', vocabularyItems: [], dateCreated: 1, accessCount: 1, isFavorite: false }
    ]));
    localStorage.setItem('vocabulary_mastery__user-1', JSON.stringify([
      { id: 'mastery-1', word: 'ciao', translation: 'salut', category: 'A', topic: 'B', lastReviewed: 1, masteryLevel: 80, timesReviewed: 2, timesCorrect: 2 }
    ]));
    localStorage.setItem('poms__user-1', JSON.stringify([
      { id: 'pom-1', wordIds: ['mastery-1'], createdAt: 1, nextReviewDate: 2, intervalDays: 1, factor: 2, status: 'active', reviewCount: 0 }
    ]));

    storageState['notificationSettings'] = { enabled: true, time: '08:00', message: 'Bonjour' };
    storageState['comprehensionNotificationSettings'] = { enabled: true, time: '09:00' };
    storageState['wordAssociationsCount'] = 12;
    storageState['oralComprehensionLength'] = 220;
    storageState['personalDictionaryWordsCount'] = 9;
    storageState['userOpenaiApiKey'] = 'openai-key';
    storageState['userGoogleTtsApiKey'] = 'google-key';
    storageState['dailyComprehensionThemes'] = ['voyage'];
    storageState['pomReviewFactor'] = 2.5;
    storageState['pomInitialIntervalSeconds'] = 3600;
    storageState['pomNotificationGraceMinutes'] = 15;

    await service.migrateAllDataToFirebase();

    expect(firebaseSyncSpy.syncAllUserData).toHaveBeenCalled();
    const payload = firebaseSyncSpy.syncAllUserData.calls.mostRecent().args[0];
    expect(payload.savedTexts).toEqual([]);
    expect(payload.savedTextsV2?.length).toBe(1);
    expect(payload.vocabularyTracking?.length).toBe(1);
    expect(payload.poms?.length).toBe(1);
    expect(payload.preferences?.['notificationSettings'].time).toBe('08:00');
    expect(payload.settings.notificationMessage).toBe('Bonjour');
  });

  it('should hydrate cloud preferences back into local storage and republish the normalized payload', async () => {
    firebaseSyncSpy.getUserDocumentData.and.returnValue(Promise.resolve({
      preferences: {
        notificationSettings: { enabled: true, time: '07:30', message: 'Cloud hello' },
        comprehensionNotificationSettings: { enabled: true, time: '19:30' },
        wordAssociationsCount: 16,
        oralComprehensionLength: 180,
        spacedRepetitionWordsCount: 14,
        personalDictionaryWordsCount: 11,
        openaiApiKey: 'cloud-openai',
        googleTtsApiKey: 'cloud-google',
        dailyComprehensionThemes: ['art', 'cinema'],
        comprehensionNotificationCustomPrompt: 'Prompt cloud',
        pomReviewFactor: 2.2,
        pomInitialIntervalSeconds: 7200,
        pomNotificationGraceMinutes: 20
      },
      statistics: { totalWordsLearned: 1 }
    }));

    await service.hydratePreferencesFromFirebase();

    expect(storageState['notificationSettings']).toEqual({ enabled: true, time: '07:30', message: 'Cloud hello' });
    expect(storageState['comprehensionNotificationSettings']).toEqual({ enabled: true, time: '19:30' });
    expect(storageState['wordAssociationsCount']).toBe(16);
    expect(storageState['userOpenaiApiKey']).toBe('cloud-openai');
    expect(storageState['dailyComprehensionThemes']).toEqual(['art', 'cinema']);
    expect(firebaseSyncSpy.syncUserDataPatch).toHaveBeenCalledWith(jasmine.objectContaining({
      preferences: jasmine.objectContaining({
        wordAssociationsCount: 16,
        pomInitialIntervalSeconds: 7200
      })
    }));
  });
});
