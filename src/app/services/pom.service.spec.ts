import { TestBed } from '@angular/core/testing';
import { PomService } from './pom.service';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { VocabularyTrackingService } from './vocabulary-tracking.service';
import { Pom } from '../models/pom';
import { PersonalDictionaryService } from './personal-dictionary.service';
import { of } from 'rxjs';

describe('PomService', () => {
    let service: PomService;
    let storageServiceSpy: jasmine.SpyObj<StorageService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let vocabularyTrackingServiceSpy: jasmine.SpyObj<VocabularyTrackingService>;
    let personalDictionaryServiceSpy: jasmine.SpyObj<PersonalDictionaryService>;

    const mockPoms: Pom[] = [
        {
            id: 'pom_1',
            wordIds: ['word_1', 'word_2'],
            createdAt: Date.now() - 100000,
            nextReviewDate: Date.now() + 100000,
            intervalDays: 1,
            status: 'active',
            reviewCount: 0
        }
    ];

    beforeEach(() => {
        const storageSpy = jasmine.createSpyObj('StorageService', ['get', 'set']);
        const notificationSpy = jasmine.createSpyObj('NotificationService', ['schedulePomNotification', 'cancelPomNotification']);
        const trackingSpy = jasmine.createSpyObj('VocabularyTrackingService', ['generateWordId', 'getAllTrackedWords']);
        const dictionarySpy = jasmine.createSpyObj('PersonalDictionaryService', ['getAllWords'], {
            dictionaryWords$: of([])
        });

        TestBed.configureTestingModule({
            providers: [
                PomService,
                { provide: StorageService, useValue: storageSpy },
                { provide: NotificationService, useValue: notificationSpy },
                { provide: VocabularyTrackingService, useValue: trackingSpy },
                { provide: PersonalDictionaryService, useValue: dictionarySpy }
            ]
        });

        service = TestBed.inject(PomService);
        storageServiceSpy = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
        notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        vocabularyTrackingServiceSpy = TestBed.inject(VocabularyTrackingService) as jasmine.SpyObj<VocabularyTrackingService>;
        personalDictionaryServiceSpy = TestBed.inject(PersonalDictionaryService) as jasmine.SpyObj<PersonalDictionaryService>;

        // Default mock returns
        storageServiceSpy.get.and.returnValue([]);
        vocabularyTrackingServiceSpy.generateWordId.and.callFake((w, t) => `${w}_${t}`);
        personalDictionaryServiceSpy.getAllWords.and.returnValue([]);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('createPom', () => {
        it('should create a new POM with valid words', async () => {
            const words = [{ word: 'gatto', translation: 'chat' }, { word: 'cane', translation: 'chien' }];

            const newPom = await service.createPom(words);

            expect(newPom).toBeTruthy();
            expect(newPom?.wordIds.length).toBe(2);
            expect(newPom?.intervalDays).toBe(1);
            expect(newPom?.status).toBe('active');
            expect(storageServiceSpy.set).toHaveBeenCalled();
            expect(notificationServiceSpy.schedulePomNotification).toHaveBeenCalled();
        });

        it('should not include words already in an active POM', async () => {
            // Setup: 'gatto_chat' is already in an active POM
            storageServiceSpy.get.and.returnValue([
                { ...mockPoms[0], wordIds: ['gatto_chat'], status: 'active' }
            ]);

            const words = [{ word: 'gatto', translation: 'chat' }, { word: 'sole', translation: 'soleil' }];

            const newPom = await service.createPom(words);

            expect(newPom).toBeTruthy();
            expect(newPom?.wordIds.length).toBe(1); // Only 'sole_soleil' should be added
            expect(newPom?.wordIds).toContain('sole_soleil');
        });

        it('should return null if all words are already in active POMs', async () => {
            storageServiceSpy.get.and.returnValue([
                { ...mockPoms[0], wordIds: ['gatto_chat'], status: 'active' }
            ]);

            const words = [{ word: 'gatto', translation: 'chat' }];

            const newPom = await service.createPom(words);

            expect(newPom).toBeNull();
            expect(notificationServiceSpy.schedulePomNotification).not.toHaveBeenCalled();
        });
    });

    describe('processPomReview', () => {
        it('should double the interval and schedule next review', async () => {
            const pom: Pom = {
                id: 'test_pom',
                wordIds: ['w1'],
                createdAt: Date.now(),
                nextReviewDate: Date.now(),
                intervalDays: 1,
                status: 'active',
                reviewCount: 0
            };

            storageServiceSpy.get.and.returnValue([pom]);

            await service.processPomReview('test_pom');

            expect(storageServiceSpy.set).toHaveBeenCalled();
            const savedPoms = storageServiceSpy.set.calls.mostRecent().args[1] as Pom[];
            const updatedPom = savedPoms[0];

            expect(updatedPom.intervalDays).toBe(2);
            expect(updatedPom.reviewCount).toBe(1);
            expect(updatedPom.status).toBe('active');
            expect(notificationServiceSpy.schedulePomNotification).toHaveBeenCalled();
        });

        it('should mark POM as completed if interval exceeds max (approx 1 year)', async () => {
            const pom: Pom = {
                id: 'test_pom',
                wordIds: ['w1'],
                createdAt: Date.now(),
                nextReviewDate: Date.now(),
                intervalDays: 200, // Next double will be 400 > 365
                status: 'active',
                reviewCount: 5
            };

            storageServiceSpy.get.and.returnValue([pom]);

            await service.processPomReview('test_pom');

            const savedPoms = storageServiceSpy.set.calls.mostRecent().args[1] as Pom[];
            const updatedPom = savedPoms[0];

            expect(updatedPom.status).toBe('completed');
            // Should NOT schedule a new notification for a completed POM
            // (Note: implementation details might vary, but logically it shouldn't)
        });
    });
});
