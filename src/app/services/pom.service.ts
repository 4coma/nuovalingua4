import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { VocabularyTrackingService } from './vocabulary-tracking.service';
import { Pom } from '../models/pom';
import { WordPair } from './llm.service';
import { PersonalDictionaryService, DictionaryWord } from './personal-dictionary.service';
import { COURSE_DATA } from '../data/course-data';
import { Capacitor } from '@capacitor/core';
import { FirebaseSyncService } from './firebase-sync.service';

@Injectable({
    providedIn: 'root'
})
export class PomService {
    private readonly STORAGE_KEY = 'poms';
    private readonly SCOPED_STORAGE_PREFIX = 'poms__';
    private readonly MAX_REVIEWS_YEAR = 365; // Environ un an
    private readonly MAX_POMS_PER_DAY = 2;
    private readonly NOTIFICATION_GRACE_KEY = 'pomNotificationGraceMinutes';
    private readonly DEFAULT_NOTIFICATION_GRACE_MINUTES = 10; // stocké en minutes
    private readonly POM_REVIEW_COUNTS_KEY = 'pomReviewCounts';
    private readonly POM_REVIEW_DUE_AT_KEY = 'pomReviewDueAt';
    private readonly POM_REVIEW_WINDOW_END_KEY = 'pomReviewWindowEnd';
    private readonly NIGHT_START_HOUR = 21;
    private readonly NIGHT_END_HOUR = 9;
    private readonly NIGHT_END_MINUTE = 30;
    private currentUserId: string | null = null;
    private isHydratingFromFirebase = false;

    constructor(
        private storageService: StorageService,
        private notificationService: NotificationService,
        private vocabularyTrackingService: VocabularyTrackingService,
        private personalDictionaryService: PersonalDictionaryService,
        private firebaseSync: FirebaseSyncService
    ) {
        this.currentUserId = this.firebaseSync.getCurrentUser()?.uid || null;

        this.firebaseSync.authUser$.subscribe(user => {
            const newUserId = user?.uid || null;
            const previousUserId = this.currentUserId;
            const didUserChange = newUserId !== previousUserId;

            this.currentUserId = newUserId;

            if (didUserChange && this.currentUserId) {
                this.migrateGuestDataToUserScope(this.currentUserId, previousUserId);
            }

            this.refreshLegacyStorageMirror();

            if (didUserChange && this.firebaseSync.isFirebaseEnabled() && this.currentUserId) {
                void this.syncFromFirebase();
            }
        });

        this.firebaseSync.syncStatus$.subscribe(status => {
            if (status.isConnected && this.currentUserId) {
                void this.syncFromFirebase();
            }
        });

        this.personalDictionaryService.dictionaryWords$.subscribe(words => {
            this.updateMasteredPoms(words);
        });
    }

    private getActiveStorageKey(): string {
        if (this.currentUserId) {
            return `${this.SCOPED_STORAGE_PREFIX}${this.currentUserId}`;
        }
        return `${this.SCOPED_STORAGE_PREFIX}guest`;
    }

    private getScopedStorageKeyForUser(userId: string | null): string {
        return `${this.SCOPED_STORAGE_PREFIX}${userId || 'guest'}`;
    }

    private ensureLegacyGuestMigration(): void {
        if (this.currentUserId) {
            return;
        }

        const guestKey = this.getActiveStorageKey();
        if (this.storageService.exists(guestKey)) {
            return;
        }

        const legacyPoms = this.storageService.get(this.STORAGE_KEY);
        if (Array.isArray(legacyPoms)) {
            this.storageService.set(guestKey, legacyPoms);
        }
    }

    private refreshLegacyStorageMirror(): void {
        this.ensureLegacyGuestMigration();
        const activePoms = this.storageService.get(this.getActiveStorageKey());
        this.storageService.set(this.STORAGE_KEY, Array.isArray(activePoms) ? activePoms : []);
    }

    private migrateGuestDataToUserScope(userId: string, previousUserId: string | null): void {
        if (previousUserId) {
            return;
        }

        this.ensureLegacyGuestMigration();
        const guestPoms = this.storageService.get(this.getScopedStorageKeyForUser(null));
        if (!Array.isArray(guestPoms) || guestPoms.length === 0) {
            return;
        }

        const existingUserPoms = this.storageService.get(this.getScopedStorageKeyForUser(userId));
        const mergedPoms = this.mergePoms(Array.isArray(existingUserPoms) ? existingUserPoms : [], guestPoms);
        this.storageService.set(this.getScopedStorageKeyForUser(userId), mergedPoms);
    }

    /**
     * Récupère tous les POMs
     */
    getAllPoms(): Pom[] {
        this.ensureLegacyGuestMigration();
        const activePoms = this.storageService.get(this.getActiveStorageKey());
        const normalizedPoms = Array.isArray(activePoms) ? activePoms : [];
        this.storageService.set(this.STORAGE_KEY, normalizedPoms);
        return normalizedPoms;
    }

    /**
     * Sauvegarde tous les POMs
     */
    private saveAllPoms(poms: Pom[]): void {
        this.storageService.set(this.getActiveStorageKey(), poms);
        this.storageService.set(this.STORAGE_KEY, poms);
        const preview = poms
            .slice(0, 10)
            .map(p => `${p.id}:${p.status}:${p.reviewCount}`)
            .join(', ');
        const suffix = poms.length > 10 ? ` ...(+${poms.length - 10})` : '';
        console.log(`[POM DEBUG] saveAllPoms count=${poms.length} ids=${preview}${suffix}`);
        if (!this.isHydratingFromFirebase) {
            void this.syncToFirebase(poms);
        }
    }

    private async syncToFirebase(poms: Pom[] = this.getAllPoms()): Promise<void> {
        if (!this.firebaseSync.isFirebaseEnabled() || this.isHydratingFromFirebase || !this.currentUserId) {
            return;
        }

        try {
            await this.firebaseSync.syncUserDataPatch({ poms });
        } catch (error) {
            console.error('🔍 [PomService] Erreur de synchronisation vers Firebase:', error);
        }
    }

    async syncFromFirebase(): Promise<void> {
        if (!this.firebaseSync.isFirebaseEnabled() || !this.currentUserId) {
            return;
        }

        try {
            const userDocument = await this.firebaseSync.getUserDocumentData();
            const cloudPoms = userDocument?.['poms'];
            if (!Array.isArray(cloudPoms)) {
                return;
            }

            this.isHydratingFromFirebase = true;

            const mergedPoms = this.mergePoms(this.getAllPoms(), cloudPoms as Pom[]);
            await this.persistPomsAndSyncNotifications(mergedPoms, {
                rescheduleAllActive: true
            });
            await this.firebaseSync.syncUserDataPatch({ poms: mergedPoms });
        } catch (error) {
            console.error('🔍 [PomService] Erreur de synchronisation depuis Firebase:', error);
        } finally {
            this.isHydratingFromFirebase = false;
        }
    }

    private mergePoms(localPoms: Pom[], remotePoms: Pom[]): Pom[] {
        const merged = new Map<string, Pom>();

        for (const pom of localPoms) {
            merged.set(pom.id, pom);
        }

        for (const pom of remotePoms) {
            const existing = merged.get(pom.id);
            if (!existing) {
                merged.set(pom.id, pom);
                continue;
            }

            merged.set(pom.id, this.selectPreferredPom(existing, pom));
        }

        return Array.from(merged.values()).sort((a, b) => this.comparePomsForSchedule(a, b));
    }

    private selectPreferredPom(localPom: Pom, remotePom: Pom): Pom {
        if (localPom.status !== remotePom.status) {
            if (remotePom.status === 'completed' && localPom.status !== 'completed') {
                return remotePom;
            }
            if (localPom.status === 'completed' && remotePom.status !== 'completed') {
                return localPom;
            }
        }

        if (remotePom.reviewCount !== localPom.reviewCount) {
            return remotePom.reviewCount > localPom.reviewCount ? remotePom : localPom;
        }

        if (remotePom.nextReviewDate !== localPom.nextReviewDate) {
            return remotePom.nextReviewDate >= localPom.nextReviewDate ? remotePom : localPom;
        }

        return remotePom.createdAt >= localPom.createdAt ? remotePom : localPom;
    }

    private getNotificationGraceMinutes(): number {
        const stored = this.storageService.get(this.NOTIFICATION_GRACE_KEY);
        const parsed = typeof stored === 'number' ? stored : parseFloat(stored);
        // La valeur est désormais sauvegardée en minutes, mais peut provenir d'anciens entiers ; accepter float
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return this.DEFAULT_NOTIFICATION_GRACE_MINUTES;
        }
        return parsed;
    }

    private adjustReviewDateForNight(dateMs: number): number {
        const date = new Date(dateMs);
        const hour = date.getHours();
        const minute = date.getMinutes();
        const isNight = hour >= this.NIGHT_START_HOUR ||
            hour < this.NIGHT_END_HOUR ||
            (hour === this.NIGHT_END_HOUR && minute < this.NIGHT_END_MINUTE);

        if (!isNight) return dateMs;

        const adjusted = new Date(date);
        if (hour >= this.NIGHT_START_HOUR) {
            adjusted.setDate(adjusted.getDate() + 1);
        }
        adjusted.setHours(this.NIGHT_END_HOUR, this.NIGHT_END_MINUTE, 0, 0);
        return adjusted.getTime();
    }

    private applyNightShiftIfNeeded(pom: Pom): boolean {
        const adjusted = this.adjustReviewDateForNight(pom.nextReviewDate);
        if (adjusted === pom.nextReviewDate) return false;
        const before = new Date(pom.nextReviewDate).toISOString();
        const after = new Date(adjusted).toISOString();
        pom.nextReviewDate = adjusted;
        console.log(`[POM DEBUG] Night shift pomId=${pom.id} from=${before} to=${after}`);
        return true;
    }

    private getScheduleDayKey(dateMs: number): string {
        const date = new Date(dateMs);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private addDaysKeepingTime(dateMs: number, days: number): number {
        const date = new Date(dateMs);
        date.setDate(date.getDate() + days);
        return date.getTime();
    }

    private comparePomsForSchedule(a: Pom, b: Pom): number {
        if (a.nextReviewDate !== b.nextReviewDate) {
            return a.nextReviewDate - b.nextReviewDate;
        }
        if (a.createdAt !== b.createdAt) {
            return a.createdAt - b.createdAt;
        }
        return a.id.localeCompare(b.id);
    }

    private findNextAvailableReviewDate(dateMs: number, dailyCounts: Map<string, number>): number {
        let candidate = this.adjustReviewDateForNight(dateMs);

        while ((dailyCounts.get(this.getScheduleDayKey(candidate)) || 0) >= this.MAX_POMS_PER_DAY) {
            candidate = this.adjustReviewDateForNight(this.addDaysKeepingTime(candidate, 1));
        }

        return candidate;
    }

    private rebalanceActivePomDates(poms: Pom[]): Set<string> {
        const changedPomIds = new Set<string>();
        const dailyCounts = new Map<string, number>();
        const activePoms = poms
            .filter(pom => pom.status === 'active')
            .sort((a, b) => this.comparePomsForSchedule(a, b));

        for (const pom of activePoms) {
            const normalizedDate = this.adjustReviewDateForNight(pom.nextReviewDate);
            const balancedDate = this.findNextAvailableReviewDate(normalizedDate, dailyCounts);
            const dayKey = this.getScheduleDayKey(balancedDate);

            if (balancedDate !== pom.nextReviewDate) {
                console.log(
                    `[POM DEBUG] Rebalanced pomId=${pom.id} from=${new Date(pom.nextReviewDate).toISOString()} ` +
                    `to=${new Date(balancedDate).toISOString()}`
                );
                pom.nextReviewDate = balancedDate;
                changedPomIds.add(pom.id);
            }

            dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);
        }

        return changedPomIds;
    }

    private async persistPomsAndSyncNotifications(
        poms: Pom[],
        options: {
            rescheduleAllActive?: boolean;
            extraPomIdsToSchedule?: string[];
            pomIdsToCancel?: string[];
        } = {}
    ): Promise<void> {
        const changedPomIds = this.rebalanceActivePomDates(poms);
        const pomIdsToSchedule = new Set<string>(options.extraPomIdsToSchedule || []);
        const pomIdsToCancel = new Set<string>(options.pomIdsToCancel || []);

        changedPomIds.forEach(pomId => pomIdsToSchedule.add(pomId));

        if (options.rescheduleAllActive) {
            poms
                .filter(pom => pom.status === 'active')
                .forEach(pom => pomIdsToSchedule.add(pom.id));
        }

        this.saveAllPoms(poms);

        for (const pomId of pomIdsToSchedule) {
            const pom = poms.find(candidate => candidate.id === pomId);
            if (!pom || pom.status !== 'active') {
                pomIdsToCancel.add(pomId);
                continue;
            }
            await this.schedulePomNotification(pom);
        }

        for (const pomId of pomIdsToCancel) {
            if (pomIdsToSchedule.has(pomId)) continue;
            await this.notificationService.cancelPomNotification(pomId);
        }
    }

    private buildKnownWordIdSet(dictionaryWords?: DictionaryWord[]): Set<string> {
        const knownIds = new Set<string>();
        const words = dictionaryWords || this.personalDictionaryService.getAllWords();
        for (const dw of words) {
            if (!dw.isKnown) continue;
            const dwId = this.vocabularyTrackingService.generateWordId(
                dw.sourceLang === 'it' ? dw.sourceWord : dw.targetWord,
                dw.sourceLang === 'it' ? dw.targetWord : dw.sourceWord
            );
            knownIds.add(dwId);
        }
        return knownIds;
    }

    private areAllPomWordsKnown(pom: Pom, knownIds: Set<string>): boolean {
        if (!pom.wordIds.length) return false;
        return pom.wordIds.every(wordId => knownIds.has(wordId));
    }

    updateMasteredPoms(dictionaryWords?: DictionaryWord[]): void {
        const poms = this.getAllPoms();
        if (poms.length === 0) return;

        const knownIds = this.buildKnownWordIdSet(dictionaryWords);
        let hasChanges = false;

        for (const pom of poms) {
            if (pom.status !== 'active') continue;
            if (!this.areAllPomWordsKnown(pom, knownIds)) continue;

            pom.status = 'completed';
            hasChanges = true;
            void this.notificationService.cancelPomNotification(pom.id);
        }

        if (hasChanges) {
            this.saveAllPoms(poms);
        }
    }

    getPomDisplayTitle(pom: Pom): string {
        if (pom.title && pom.title.trim()) {
            return pom.title.trim();
        }
        if (pom.lessonId) {
            for (const levelId in COURSE_DATA) {
                const level = COURSE_DATA[levelId];
                const allLessons = [
                    ...(level.domaines || []),
                    ...(level.lexical || []),
                    ...(level.verbs || [])
                ];
                const lesson = allLessons.find(l => l.id === pom.lessonId);
                if (lesson) {
                    return lesson.title;
                }
            }
        }
        const createdAt = new Date(pom.createdAt);
        const dateLabel = `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })}`;
        return `Révision libre (${dateLabel})`;
    }

    setPomReviewSessionMeta(pomId: string, now: number = Date.now()): { counts: boolean; dueAt: number; windowEnd: number } | null {
        const pom = this.getPomById(pomId);
        if (!pom) return null;

        const graceMinutes = this.getNotificationGraceMinutes();
        const graceMs = graceMinutes * 60 * 1000;
        const dueAt = pom.nextReviewDate;
        const windowEnd = dueAt + graceMs;
        const counts = now >= dueAt && now <= windowEnd;

        this.storageService.set(this.POM_REVIEW_COUNTS_KEY, counts);
        this.storageService.set(this.POM_REVIEW_DUE_AT_KEY, dueAt);
        this.storageService.set(this.POM_REVIEW_WINDOW_END_KEY, windowEnd);

        return { counts, dueAt, windowEnd };
    }

    /**
     * Vérifie si un mot est déjà dans un POM actif
     */
    isWordInActivePom(wordId: string): boolean {
        const poms = this.getAllPoms();
        return poms.some(pom =>
            pom.status === 'active' && pom.wordIds.includes(wordId)
        );
    }

    /**
     * Crée un nouveau POM pour une liste de mots
     * @param words Liste des mots (objets avec word et translation)
     * @param lessonId ID optionnel de la leçon associée
     */
    async createPom(words: { word: string, translation: string }[], lessonId?: string): Promise<Pom | null> {
        const poms = this.getAllPoms();

        // Filtrer les mots déjà dans un POM
        const wordIds: string[] = [];

        for (const w of words) {
            const id = this.vocabularyTrackingService.generateWordId(w.word, w.translation);
            if (!this.isWordInActivePom(id)) {
                wordIds.push(id);
            }
        }

        if (wordIds.length === 0) {
            console.log('[POM DEBUG] createPom aborted: no eligible words');
            return null; // Aucun mot éligible
        }

        const now = Date.now();
        // Charger l'intervalle initial depuis le stockage (en secondes)
        // Défaut à 12 heures (43200 secondes) si non défini
        const storedIntervalSeconds = this.storageService.get('pomInitialIntervalSeconds');
        const initialIntervalSeconds = storedIntervalSeconds ? parseInt(storedIntervalSeconds) : 43200;

        // Convertir en jours pour la compatibilité avec intervalDays
        const initialIntervalDays = initialIntervalSeconds / (24 * 60 * 60);
        const nextReview = this.adjustReviewDateForNight(now + (initialIntervalSeconds * 1000));

        // Récupérer le facteur global
        const storedFactor = this.storageService.get('pomReviewFactor');
        const factor = storedFactor ? parseFloat(storedFactor) : 2;

        const newPom: Pom = {
            id: `pom_${now}_${Math.random().toString(36).substr(2, 9)}`,
            lessonId: lessonId,
            wordIds: wordIds,
            createdAt: now,
            nextReviewDate: nextReview,
            intervalDays: initialIntervalDays,
            factor: factor, // Enregistrer le facteur fixe pour ce POM
            status: 'active',
            reviewCount: 0
        };

        const knownIds = this.buildKnownWordIdSet();
        if (this.areAllPomWordsKnown(newPom, knownIds)) {
            newPom.status = 'completed';
        }

        poms.push(newPom);
        console.log(`[POM DEBUG] createPom newPomId=${newPom.id} wordCount=${newPom.wordIds.length}`);
        await this.persistPomsAndSyncNotifications(poms, {
            extraPomIdsToSchedule: newPom.status === 'active' ? [newPom.id] : []
        });

        return poms.find(pom => pom.id === newPom.id) || newPom;
    }

    /**
     * Récupère les POMs dus pour révision
     */
    getDuePoms(): Pom[] {
        this.updateMasteredPoms();
        const now = Date.now();
        const poms = this.getAllPoms();

        return poms.filter(pom =>
            pom.status === 'active' && pom.nextReviewDate <= now
        );
    }

    /**
     * Marque un POM comme complété (ex: si tous les mots sont connus)
     */
    private completePom(pomId: string): void {
        const poms = this.getAllPoms();
        const index = poms.findIndex(p => p.id === pomId);
        if (index !== -1) {
            poms[index].status = 'completed';
            this.saveAllPoms(poms);
            void this.notificationService.cancelPomNotification(pomId);
        }
    }

    /**
     * Traite la révision d'un POM (passe à l'étape suivante)
     */
    async processPomReview(pomId: string): Promise<void> {
        console.log(`[CORE DEBUG] processPomReview called for pomId: ${pomId}`);
        const poms = this.getAllPoms();
        const raw = localStorage.getItem(this.STORAGE_KEY);
        console.log(`[POM DEBUG] processPomReview storage rawLength=${raw ? raw.length : 0}`);
        if (poms.length > 0) {
            const ids = poms.map(p => p.id).join(', ');
            console.log(`[POM DEBUG] processPomReview poms count=${poms.length} ids=${ids}`);
        } else {
            console.log('[POM DEBUG] processPomReview poms is empty');
        }
        const index = poms.findIndex(p => p.id === pomId);

        if (index === -1) {
            console.error(`[CORE DEBUG] POM with ID ${pomId} not found in storage!`);
            return;
        }

        const pom = poms[index];
        console.log(`[CORE DEBUG] Found POM: ${pom.id}, current reviewCount: ${pom.reviewCount}, intervalDays: ${pom.intervalDays}`);

        // Utiliser le facteur enregistré dans le POM, sinon défaut à 2 (pour les anciens POMs)
        const factor = pom.factor || 2;

        // Calculer le nouvel intervalle en multipliant l'actuel par le facteur
        let newInterval = pom.intervalDays * factor;

        // Sécurité : l'intervalle doit toujours augmenter
        if (newInterval <= pom.intervalDays) {
            // Augmentation minimum : soit 5% de plus, soit 30 secondes (en jours)
            const minIncrease = Math.max(pom.intervalDays * 0.05, 30 / (24 * 60 * 60));
            newInterval = pom.intervalDays + minIncrease;
        }

        const now = Date.now();
        const nextReview = this.adjustReviewDateForNight(now + (newInterval * 24 * 60 * 60 * 1000));

        console.log(`[CORE DEBUG] Calculated newInterval: ${newInterval} days, nextReview: ${new Date(nextReview).toISOString()}`);

        // Vérifier si on dépasse un an (environ 365 jours)
        if (newInterval > this.MAX_REVIEWS_YEAR) {
            console.log(`[CORE DEBUG] POM completed (interval > 365 days)`);
            pom.status = 'completed';
        } else {
            pom.intervalDays = newInterval;
            pom.nextReviewDate = nextReview;
            pom.reviewCount++;
            console.log(`[CORE DEBUG] Updated POM: reviewCount=${pom.reviewCount}, nextReviewDate=${new Date(pom.nextReviewDate).toISOString()}`);
        }

        poms[index] = pom;
        await this.persistPomsAndSyncNotifications(poms, {
            extraPomIdsToSchedule: pom.status === 'active' ? [pom.id] : [],
            pomIdsToCancel: pom.status === 'completed' ? [pom.id] : []
        });
        console.log(`[CORE DEBUG] POM saved successfully.`);
    }

    /**
     * Planifie une notification pour un POM
     */
    private async schedulePomNotification(pom: Pom): Promise<void> {
        if (pom.status !== 'active') {
            console.log(`[POM DEBUG] schedulePomNotification skipped pomId=${pom.id} status=${pom.status}`);
            return;
        }
        await this.notificationService.cancelPomNotification(pom.id);
        const date = new Date(pom.nextReviewDate);
        const now = Date.now();
        const scheduledDate = date.getTime() < now ? new Date(now + 60000) : date;
        const delayMs = scheduledDate.getTime() - now;
        const graceMinutes = this.getNotificationGraceMinutes();
        console.log(
            `[POM DEBUG] schedulePomNotification pomId=${pom.id} nextReview=${date.toISOString()} ` +
            `scheduled=${scheduledDate.toISOString()} delayMs=${delayMs}`
        );

        const deadline = new Date(pom.nextReviewDate + graceMinutes * 60 * 1000);
        const deadlineLabel = deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const message = `Révision POM disponible ! (${pom.wordIds.length} mots). ` +
            `À faire avant ${deadlineLabel}.`;
        const title = `Révision POM - ${this.getPomDisplayTitle(pom)}`;

        await this.notificationService.schedulePomNotification(
            pom.id,
            scheduledDate,
            message,
            title
        );
        console.log(`[POM DEBUG] schedulePomNotification done pomId=${pom.id}`);

        if (Capacitor.getPlatform() === 'web') {
            this.scheduleMissedPomCheck(pom.id, pom.nextReviewDate, pom.reviewCount, scheduledDate.getTime());
        }
    }

    private scheduleMissedPomCheck(
        pomId: string,
        expectedNextReviewDate: number,
        expectedReviewCount: number,
        notificationAt: number
    ): void {
        const graceMinutes = this.getNotificationGraceMinutes();
        const graceMs = graceMinutes * 60 * 1000;
        const delayMs = notificationAt + graceMs - Date.now();
        const maxDelayMs = 2147483647;

        if (delayMs <= 0) {
            void this.handleMissedPom(pomId, expectedNextReviewDate, expectedReviewCount, 'delay_elapsed');
            return;
        }

        if (delayMs > maxDelayMs) {
            console.log('[POM DEBUG] Missed check not scheduled (delay too long)');
            return;
        }

        setTimeout(() => {
            void this.handleMissedPom(pomId, expectedNextReviewDate, expectedReviewCount, 'timeout');
        }, delayMs);
    }

    private async handleMissedPom(
        pomId: string,
        expectedNextReviewDate: number,
        expectedReviewCount: number,
        reason: string
    ): Promise<void> {
        const poms = this.getAllPoms();
        const index = poms.findIndex(p => p.id === pomId);
        if (index === -1) return;

        const pom = poms[index];
        if (pom.status !== 'active') return;
        if (pom.nextReviewDate !== expectedNextReviewDate || pom.reviewCount !== expectedReviewCount) {
            return;
        }

        const graceMinutes = this.getNotificationGraceMinutes();
        const graceMs = graceMinutes * 60 * 1000;
        const now = Date.now();

        if (now <= pom.nextReviewDate + graceMs) {
            return;
        }

        await this.rescheduleFromMissedDate(pomId, now, reason);
    }

    async rescheduleFromMissedDate(pomId: string, missedDate: number, reason: string = 'manual'): Promise<void> {
        const poms = this.getAllPoms();
        const index = poms.findIndex(p => p.id === pomId);
        if (index === -1) return;

        const pom = poms[index];
        if (pom.status !== 'active') return;

        const now = Date.now();
        const rescheduleAt = missedDate > now ? missedDate : now;
        pom.nextReviewDate = this.adjustReviewDateForNight(rescheduleAt);

        poms[index] = pom;
        console.log(`[POM DEBUG] Rescheduled missed pomId=${pomId} reason=${reason} next=${new Date(pom.nextReviewDate).toISOString()}`);
        await this.persistPomsAndSyncNotifications(poms, {
            extraPomIdsToSchedule: [pom.id]
        });
    }

    /**
     * Récupère un POM par son ID
     */
    getPomById(id: string): Pom | undefined {
        return this.getAllPoms().find(p => p.id === id);
    }

    /**
     * Met à jour le titre d'un POM
     */
    updatePomTitle(pomId: string, title?: string | null): void {
        const poms = this.getAllPoms();
        const index = poms.findIndex(p => p.id === pomId);
        if (index === -1) return;

        const pom = poms[index];
        const trimmed = title?.trim();
        if (trimmed) {
            pom.title = trimmed;
        } else {
            delete pom.title;
        }
        poms[index] = pom;
        this.saveAllPoms(poms);
    }

    /**
     * Reprogramme toutes les notifications pour les POMs actifs
     * Utile au démarrage de l'app sur Web
     */
    async reScheduleAllNotifications(): Promise<void> {
        this.updateMasteredPoms();
        const poms = this.getAllPoms();
        const graceMinutes = this.getNotificationGraceMinutes();
        const graceMs = graceMinutes * 60 * 1000;
        const now = Date.now();
        const pomIdsToCancel: string[] = [];
        let activePomCount = 0;

        for (const pom of poms) {
            if (pom.status !== 'active') continue;
            activePomCount++;

            if (this.getPomWords(pom.id).length === 0) {
                const knownIds = this.buildKnownWordIdSet();
                const reason = this.areAllPomWordsKnown(pom, knownIds) ? 'all_known' : 'missing_words';
                pom.status = 'completed';
                pomIdsToCancel.push(pom.id);
                console.log(`[POM DEBUG] Completed empty POM pomId=${pom.id} reason=${reason}`);
                continue;
            }

            if (now > pom.nextReviewDate + graceMs) {
                pom.nextReviewDate = this.adjustReviewDateForNight(now);
                console.log(`[POM DEBUG] Startup reschedule pomId=${pom.id} next=${new Date(pom.nextReviewDate).toISOString()}`);
            }
        }

        await this.persistPomsAndSyncNotifications(poms, {
            rescheduleAllActive: true,
            pomIdsToCancel
        });

        if (activePomCount > 0) {
            console.log(`[PomService] ${poms.filter(p => p.status === 'active').length} notifications POM reprogrammées.`);
        }
    }

    /**
     * Récupère les mots associés à un POM pour une session de révision
     */
    getPomWords(pomId: string): WordPair[] {
        const pom = this.getPomById(pomId);
        if (!pom) return [];

        const allWords = this.vocabularyTrackingService.getAllTrackedWords();
        const dictionaryWords = this.personalDictionaryService.getAllWords();
        const pomWords: WordPair[] = [];

        for (const wordId of pom.wordIds) {
            // Exclure les mots marqués comme connus dans le dictionnaire
            const isKnown = dictionaryWords.some(dw => {
                const dwId = this.vocabularyTrackingService.generateWordId(
                    dw.sourceLang === 'it' ? dw.sourceWord : dw.targetWord,
                    dw.sourceLang === 'it' ? dw.targetWord : dw.sourceWord
                );
                return dwId === wordId && dw.isKnown;
            });

            if (isKnown) continue;

            const trackedWord = allWords.find(w => w.id === wordId);
            if (trackedWord) {
                pomWords.push({
                    it: trackedWord.word,
                    fr: trackedWord.translation,
                    context: trackedWord.context,
                    category: trackedWord.category,
                    topic: trackedWord.topic
                });
            }
        }
        return pomWords;
    }

    completePomIfNoReviewableWords(pomId: string): boolean {
        const pom = this.getPomById(pomId);
        if (!pom) return false;

        const pomWords = this.getPomWords(pomId);
        if (pomWords.length > 0) return false;

        if (pom.status !== 'completed') {
            const knownIds = this.buildKnownWordIdSet();
            const reason = this.areAllPomWordsKnown(pom, knownIds) ? 'all_known' : 'missing_words';
            const poms = this.getAllPoms();
            const index = poms.findIndex(p => p.id === pomId);
            if (index === -1) return false;

            poms[index] = { ...poms[index], status: 'completed' };
            this.saveAllPoms(poms);
            console.log(`[POM DEBUG] Completed empty POM pomId=${pomId} reason=${reason}`);
        } else {
            console.log(`[POM DEBUG] Empty POM already completed pomId=${pomId}`);
        }

        void this.notificationService.cancelPomNotification(pomId);
        return true;
    }

    /**
     * Calcule la progression d'une leçon basée sur les révisions POM effectués.
     */
    getLessonProgress(lessonId: string): number {
        const poms = this.getAllPoms();
        const lessonPom = poms.find(p => p.lessonId === lessonId);

        if (!lessonPom) return 0;
        if (lessonPom.status === 'completed') return 100;

        // Calculer le ratio de mots maîtrisés (marqués comme connus)
        const dictionaryWords = this.personalDictionaryService.getAllWords();
        const knownCount = lessonPom.wordIds.filter(wordId => {
            return dictionaryWords.some(dw => {
                const dwId = this.vocabularyTrackingService.generateWordId(
                    dw.sourceLang === 'it' ? dw.sourceWord : dw.targetWord,
                    dw.sourceLang === 'it' ? dw.targetWord : dw.sourceWord
                );
                return dwId === wordId && dw.isKnown;
            });
        }).length;

        const masteryRatio = knownCount / lessonPom.wordIds.length;
        const srsRatio = lessonPom.reviewCount / 13;

        const totalProgress = Math.max(masteryRatio, srsRatio);
        return Math.min(100, Math.round(totalProgress * 100));
    }

    /**
     * Réinitialise le calendrier d'un POM à partir de maintenant
     */
    async resetPomSchedule(pomId: string): Promise<void> {
        const poms = this.getAllPoms();
        const index = poms.findIndex(p => p.id === pomId);

        if (index === -1) return;

        const pom = poms[index];
        const now = Date.now();

        // Charger l'intervalle initial
        const storedIntervalSeconds = this.storageService.get('pomInitialIntervalSeconds');
        const initialIntervalSeconds = storedIntervalSeconds ? parseInt(storedIntervalSeconds) : 43200;

        const initialIntervalDays = initialIntervalSeconds / (24 * 60 * 60);

        pom.createdAt = now; // On réinitialise aussi la date de création
        pom.nextReviewDate = this.adjustReviewDateForNight(now + (initialIntervalSeconds * 1000));
        pom.intervalDays = initialIntervalDays;
        pom.reviewCount = 0;
        pom.status = 'active';

        const knownIds = this.buildKnownWordIdSet();
        if (this.areAllPomWordsKnown(pom, knownIds)) {
            pom.status = 'completed';
        }

        poms[index] = pom;
        await this.persistPomsAndSyncNotifications(poms, {
            extraPomIdsToSchedule: pom.status === 'active' ? [pom.id] : [],
            pomIdsToCancel: pom.status === 'completed' ? [pom.id] : []
        });
    }

    /**
     * Supprime un POM
     */
    deletePom(pomId: string): void {
        let poms = this.getAllPoms();
        poms = poms.filter(p => p.id !== pomId);
        this.saveAllPoms(poms);
        void this.notificationService.cancelPomNotification(pomId);
    }
}
