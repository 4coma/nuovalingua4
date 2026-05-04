import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Pom } from '../models/pom';
import { NotificationService } from './notification.service';
import { PersonalDictionaryService } from './personal-dictionary.service';
import { PomService } from './pom.service';
import { StorageService } from './storage.service';
import { VocabularyTrackingService } from './vocabulary-tracking.service';
import { FirebaseSyncService } from './firebase-sync.service';

describe('PomService', () => {
    let service: PomService;
    let storageServiceSpy: jasmine.SpyObj<StorageService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let vocabularyTrackingServiceSpy: jasmine.SpyObj<VocabularyTrackingService>;
    let personalDictionaryServiceSpy: jasmine.SpyObj<PersonalDictionaryService>;
    let storageState: Record<string, any>;

    const DAY_MS = 24 * 60 * 60 * 1000;

    const buildPom = (overrides: Partial<Pom> = {}): Pom => ({
        id: overrides.id || `pom_${Math.random().toString(36).slice(2, 8)}`,
        wordIds: overrides.wordIds || ['word_1'],
        createdAt: overrides.createdAt ?? Date.parse('2026-05-01T10:00:00.000Z'),
        nextReviewDate: overrides.nextReviewDate ?? Date.parse('2026-05-02T12:00:00.000Z'),
        intervalDays: overrides.intervalDays ?? 1,
        factor: overrides.factor ?? 2,
        status: overrides.status ?? 'active',
        reviewCount: overrides.reviewCount ?? 0,
        lessonId: overrides.lessonId,
        title: overrides.title
    });

    const clonePoms = (poms: Pom[]): Pom[] => poms.map(pom => ({ ...pom, wordIds: [...pom.wordIds] }));

    const getDayKey = (dateMs: number): string => {
        const date = new Date(dateMs);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDailyCounts = (poms: Pom[]): number[] => {
        const counts = new Map<string, number>();
        for (const pom of poms) {
            const dayKey = getDayKey(pom.nextReviewDate);
            counts.set(dayKey, (counts.get(dayKey) || 0) + 1);
        }
        return Array.from(counts.values());
    };

    const setStoredPoms = (poms: Pom[]): void => {
        storageState['poms__guest'] = clonePoms(poms);
        storageState['poms'] = clonePoms(poms);
    };

    const getStoredPoms = (): Pom[] => clonePoms(storageState['poms__guest'] || storageState['poms'] || []);

    const seedTrackedWords = (poms: Pom[]): void => {
        const wordIds = Array.from(new Set(
            poms.reduce<string[]>((acc, pom) => acc.concat(pom.wordIds), [])
        ));
        vocabularyTrackingServiceSpy.getAllTrackedWords.and.returnValue(
            wordIds.map((id, index) => ({
                id,
                word: `it_${index}`,
                translation: `fr_${index}`,
                lastReviewed: Date.now(),
                masteryLevel: 0,
                timesReviewed: 0,
                timesCorrect: 0,
                context: '',
                category: 'test',
                topic: 'test'
            }))
        );
    };

    beforeEach(() => {
        const storageSpy = jasmine.createSpyObj('StorageService', ['get', 'set', 'exists']);
        const notificationSpy = jasmine.createSpyObj('NotificationService', ['schedulePomNotification', 'cancelPomNotification']);
        const trackingSpy = jasmine.createSpyObj('VocabularyTrackingService', ['generateWordId', 'getAllTrackedWords']);
        const dictionarySpy = jasmine.createSpyObj('PersonalDictionaryService', ['getAllWords'], {
            dictionaryWords$: of([])
        });
        const firebaseSyncServiceMock = jasmine.createSpyObj('FirebaseSyncService', [
            'getCurrentUser',
            'isFirebaseEnabled',
            'getUserDocumentData',
            'syncUserDataPatch'
        ], {
            authUser$: of(null),
            syncStatus$: of({ isConnected: false, isSyncing: false })
        });

        TestBed.configureTestingModule({
            providers: [
                PomService,
                { provide: StorageService, useValue: storageSpy },
                { provide: NotificationService, useValue: notificationSpy },
                { provide: VocabularyTrackingService, useValue: trackingSpy },
                { provide: PersonalDictionaryService, useValue: dictionarySpy },
                { provide: FirebaseSyncService, useValue: firebaseSyncServiceMock }
            ]
        });

        service = TestBed.inject(PomService);
        storageServiceSpy = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
        notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        vocabularyTrackingServiceSpy = TestBed.inject(VocabularyTrackingService) as jasmine.SpyObj<VocabularyTrackingService>;
        personalDictionaryServiceSpy = TestBed.inject(PersonalDictionaryService) as jasmine.SpyObj<PersonalDictionaryService>;

        storageState = {
            poms__guest: [],
            poms: [],
            pomInitialIntervalSeconds: '86400',
            pomReviewFactor: '2'
        };

        storageServiceSpy.get.and.callFake((key: string) => storageState[key]);
        storageServiceSpy.set.and.callFake((key: string, value: any) => {
            storageState[key] = value;
        });
        storageServiceSpy.exists.and.callFake((key: string) => storageState[key] !== undefined);

        vocabularyTrackingServiceSpy.generateWordId.and.callFake((word, translation) => `${word}_${translation}`);
        vocabularyTrackingServiceSpy.getAllTrackedWords.and.returnValue([]);
        personalDictionaryServiceSpy.getAllWords.and.returnValue([]);
        notificationServiceSpy.schedulePomNotification.and.returnValue(Promise.resolve());
        notificationServiceSpy.cancelPomNotification.and.returnValue(Promise.resolve());
        const firebaseSyncSpy = TestBed.inject(FirebaseSyncService) as jasmine.SpyObj<FirebaseSyncService>;
        firebaseSyncSpy.getCurrentUser.and.returnValue(null);
        firebaseSyncSpy.isFirebaseEnabled.and.returnValue(false);
        firebaseSyncSpy.getUserDocumentData.and.returnValue(Promise.resolve(null));
        firebaseSyncSpy.syncUserDataPatch.and.returnValue(Promise.resolve());
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('createPom', () => {
        it('should create a new active POM with the configured initial interval', async () => {
            spyOn(Date, 'now').and.returnValue(Date.parse('2026-05-01T12:00:00.000Z'));

            const newPom = await service.createPom([
                { word: 'gatto', translation: 'chat' },
                { word: 'cane', translation: 'chien' }
            ]);

            expect(newPom).toBeTruthy();
            expect(newPom?.wordIds).toEqual(['gatto_chat', 'cane_chien']);
            expect(newPom?.intervalDays).toBe(1);
            expect(newPom?.status).toBe('active');
            expect(notificationServiceSpy.schedulePomNotification).toHaveBeenCalled();
        });

        it('should not include words already present in another active POM', async () => {
            setStoredPoms([
                buildPom({ id: 'existing', wordIds: ['gatto_chat'] })
            ]);

            const newPom = await service.createPom([
                { word: 'gatto', translation: 'chat' },
                { word: 'sole', translation: 'soleil' }
            ]);

            expect(newPom).toBeTruthy();
            expect(newPom?.wordIds).toEqual(['sole_soleil']);
        });

        it('should return null when every word is already covered by active POMs', async () => {
            setStoredPoms([
                buildPom({ id: 'existing', wordIds: ['gatto_chat'] })
            ]);

            const newPom = await service.createPom([
                { word: 'gatto', translation: 'chat' }
            ]);

            expect(newPom).toBeNull();
            expect(notificationServiceSpy.schedulePomNotification).not.toHaveBeenCalled();
        });

        it('should push a new POM to the next day when the target day already has two sessions', async () => {
            const now = Date.parse('2026-05-01T12:00:00.000Z');
            const saturatedDay = now + DAY_MS;
            spyOn(Date, 'now').and.returnValue(now);

            setStoredPoms([
                buildPom({ id: 'pom_a', createdAt: now - 2000, nextReviewDate: saturatedDay, wordIds: ['a'] }),
                buildPom({ id: 'pom_b', createdAt: now - 1000, nextReviewDate: saturatedDay, wordIds: ['b'] })
            ]);

            const newPom = await service.createPom([
                { word: 'mare', translation: 'mer' }
            ]);

            expect(newPom).toBeTruthy();

            const savedPom = getStoredPoms().find(pom => pom.id === newPom?.id);
            expect(savedPom).toBeTruthy();
            expect(getDayKey(savedPom!.nextReviewDate)).toBe(getDayKey(saturatedDay + DAY_MS));
            expect(Math.max(...getDailyCounts(getStoredPoms().filter(pom => pom.status === 'active')))).toBeLessThanOrEqual(2);
        });
    });

    describe('processPomReview', () => {
        it('should double the interval and schedule the next review', async () => {
            const now = Date.parse('2026-05-01T12:00:00.000Z');
            spyOn(Date, 'now').and.returnValue(now);

            setStoredPoms([
                buildPom({
                    id: 'test_pom',
                    nextReviewDate: now,
                    intervalDays: 1,
                    reviewCount: 0,
                    wordIds: ['w1']
                })
            ]);

            await service.processPomReview('test_pom');

            const updatedPom = getStoredPoms()[0];
            expect(updatedPom.intervalDays).toBe(2);
            expect(updatedPom.reviewCount).toBe(1);
            expect(updatedPom.status).toBe('active');
            expect(notificationServiceSpy.schedulePomNotification).toHaveBeenCalled();
        });

        it('should mark a POM as completed when the next interval exceeds one year', async () => {
            const now = Date.parse('2026-05-01T12:00:00.000Z');
            spyOn(Date, 'now').and.returnValue(now);

            setStoredPoms([
                buildPom({
                    id: 'test_pom',
                    nextReviewDate: now,
                    intervalDays: 200,
                    reviewCount: 5,
                    wordIds: ['w1']
                })
            ]);

            await service.processPomReview('test_pom');

            const updatedPom = getStoredPoms()[0];
            expect(updatedPom.status).toBe('completed');
            expect(notificationServiceSpy.cancelPomNotification).toHaveBeenCalledWith('test_pom');
        });

        it('should rebalance the reviewed POM when its next day is already full', async () => {
            const now = Date.parse('2026-05-01T12:00:00.000Z');
            const saturatedDay = now + (2 * DAY_MS);
            spyOn(Date, 'now').and.returnValue(now);

            setStoredPoms([
                buildPom({
                    id: 'reviewed',
                    createdAt: now - 3000,
                    nextReviewDate: now,
                    intervalDays: 1,
                    reviewCount: 0,
                    wordIds: ['reviewed_word']
                }),
                buildPom({
                    id: 'existing_1',
                    createdAt: now - 2000,
                    nextReviewDate: saturatedDay,
                    wordIds: ['existing_1_word']
                }),
                buildPom({
                    id: 'existing_2',
                    createdAt: now - 1000,
                    nextReviewDate: saturatedDay,
                    wordIds: ['existing_2_word']
                })
            ]);

            await service.processPomReview('reviewed');

            const updatedPom = getStoredPoms().find(pom => pom.id === 'reviewed');
            const shiftedPom = getStoredPoms().find(pom => pom.id === 'existing_2');
            expect(updatedPom).toBeTruthy();
            expect(updatedPom!.intervalDays).toBe(2);
            expect(getDayKey(updatedPom!.nextReviewDate)).toBe(getDayKey(saturatedDay));
            expect(getDayKey(shiftedPom!.nextReviewDate)).toBe(getDayKey(saturatedDay + DAY_MS));
            expect(Math.max(...getDailyCounts(getStoredPoms().filter(pom => pom.status === 'active')))).toBeLessThanOrEqual(2);
        });
    });

    describe('schedule balancing', () => {
        it('should spread five sessions over multiple days at startup with a maximum of two per day', async () => {
            const sameDay = Date.parse('2026-05-10T12:00:00.000Z');
            const poms = Array.from({ length: 5 }, (_, index) => buildPom({
                id: `pom_${index + 1}`,
                createdAt: Date.parse('2026-05-01T08:00:00.000Z') + index,
                nextReviewDate: sameDay,
                wordIds: [`word_${index + 1}`]
            }));

            setStoredPoms(poms);
            seedTrackedWords(poms);

            await service.reScheduleAllNotifications();

            const activePoms = getStoredPoms().filter(pom => pom.status === 'active');
            const dailyCounts = getDailyCounts(activePoms).sort((a, b) => a - b);

            expect(dailyCounts).toEqual([1, 2, 2]);
            expect(Math.max(...dailyCounts)).toBeLessThanOrEqual(2);
            expect(notificationServiceSpy.schedulePomNotification).toHaveBeenCalledTimes(5);
        });

        it('should rebalance a manual reschedule when the requested day is already full', async () => {
            const now = Date.parse('2026-05-01T12:00:00.000Z');
            const requestedDay = now + (3 * DAY_MS);
            spyOn(Date, 'now').and.returnValue(now);

            setStoredPoms([
                buildPom({
                    id: 'target',
                    createdAt: now - 3000,
                    nextReviewDate: now,
                    wordIds: ['target_word']
                }),
                buildPom({
                    id: 'existing_1',
                    createdAt: now - 2000,
                    nextReviewDate: requestedDay,
                    wordIds: ['existing_1_word']
                }),
                buildPom({
                    id: 'existing_2',
                    createdAt: now - 1000,
                    nextReviewDate: requestedDay,
                    wordIds: ['existing_2_word']
                })
            ]);

            await service.rescheduleFromMissedDate('target', requestedDay, 'manual');

            const updatedPom = getStoredPoms().find(pom => pom.id === 'target');
            const shiftedPom = getStoredPoms().find(pom => pom.id === 'existing_2');
            expect(updatedPom).toBeTruthy();
            expect(getDayKey(updatedPom!.nextReviewDate)).toBe(getDayKey(requestedDay));
            expect(getDayKey(shiftedPom!.nextReviewDate)).toBe(getDayKey(requestedDay + DAY_MS));
            expect(Math.max(...getDailyCounts(getStoredPoms().filter(pom => pom.status === 'active')))).toBeLessThanOrEqual(2);
        });
    });
});
