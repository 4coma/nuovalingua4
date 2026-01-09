import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { VocabularyTrackingService } from './vocabulary-tracking.service';
import { Pom } from '../models/pom';
import { WordPair } from './llm.service';
import { PersonalDictionaryService, DictionaryWord } from './personal-dictionary.service';
import { Capacitor } from '@capacitor/core';

@Injectable({
    providedIn: 'root'
})
export class PomService {
    private readonly STORAGE_KEY = 'poms';
    private readonly MAX_REVIEWS_YEAR = 365; // Environ un an
    private readonly NOTIFICATION_GRACE_KEY = 'pomNotificationGraceMinutes';
    private readonly DEFAULT_NOTIFICATION_GRACE_MINUTES = 10;

    constructor(
        private storageService: StorageService,
        private notificationService: NotificationService,
        private vocabularyTrackingService: VocabularyTrackingService,
        private personalDictionaryService: PersonalDictionaryService
    ) { }

    /**
     * Récupère tous les POMs
     */
    getAllPoms(): Pom[] {
        return this.storageService.get(this.STORAGE_KEY) || [];
    }

    /**
     * Sauvegarde tous les POMs
     */
    private saveAllPoms(poms: Pom[]): void {
        this.storageService.set(this.STORAGE_KEY, poms);
        const preview = poms
            .slice(0, 10)
            .map(p => `${p.id}:${p.status}:${p.reviewCount}`)
            .join(', ');
        const suffix = poms.length > 10 ? ` ...(+${poms.length - 10})` : '';
        console.log(`[POM DEBUG] saveAllPoms count=${poms.length} ids=${preview}${suffix}`);
    }

    private getNotificationGraceMinutes(): number {
        const stored = this.storageService.get(this.NOTIFICATION_GRACE_KEY);
        const parsed = typeof stored === 'number' ? stored : parseInt(stored, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return this.DEFAULT_NOTIFICATION_GRACE_MINUTES;
        }
        return parsed;
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
        const nextReview = now + (initialIntervalSeconds * 1000);

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

        poms.push(newPom);
        this.saveAllPoms(poms);
        console.log(`[POM DEBUG] createPom newPomId=${newPom.id} wordCount=${newPom.wordIds.length}`);

        // Planifier la notification
        await this.schedulePomNotification(newPom);

        return newPom;
    }

    /**
     * Récupère les POMs dus pour révision
     */
    getDuePoms(): Pom[] {
        const now = Date.now();
        const poms = this.getAllPoms();

        return poms.filter(pom => {
            if (pom.status !== 'active' || pom.nextReviewDate > now) {
                return false;
            }

            // Vérifier si tous les mots du POM sont désormais marqués comme "connus"
            const dictionaryWords = this.personalDictionaryService.getAllWords();
            const activeWordIds = pom.wordIds.filter(wordId => {
                const dictWord = dictionaryWords.find(dw => {
                    const dwId = this.vocabularyTrackingService.generateWordId(
                        dw.sourceLang === 'it' ? dw.sourceWord : dw.targetWord,
                        dw.sourceLang === 'it' ? dw.targetWord : dw.sourceWord
                    );
                    return dwId === wordId;
                });
                return !dictWord?.isKnown;
            });

            if (activeWordIds.length === 0) {
                // Tous les mots sont connus, on complète le POM automatiquement
                this.completePom(pom.id);
                return false;
            }

            return true;
        });
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
        const nextReview = now + (newInterval * 24 * 60 * 60 * 1000);

        console.log(`[CORE DEBUG] Calculated newInterval: ${newInterval} days, nextReview: ${new Date(nextReview).toISOString()}`);

        // Vérifier si on dépasse un an (environ 365 jours)
        if (newInterval > 365) {
            console.log(`[CORE DEBUG] POM completed (interval > 365 days)`);
            pom.status = 'completed';
        } else {
            pom.intervalDays = newInterval;
            pom.nextReviewDate = nextReview;
            pom.reviewCount++;
            console.log(`[CORE DEBUG] Updated POM: reviewCount=${pom.reviewCount}, nextReviewDate=${new Date(pom.nextReviewDate).toISOString()}`);

            // Planifier la prochaine notification
            await this.schedulePomNotification(pom);
        }

        poms[index] = pom;
        this.saveAllPoms(poms);
        console.log(`[CORE DEBUG] POM saved successfully.`);
    }

    /**
     * Planifie une notification pour un POM
     */
    private async schedulePomNotification(pom: Pom): Promise<void> {
        const date = new Date(pom.nextReviewDate);
        const now = Date.now();
        const scheduledDate = date.getTime() < now ? new Date(now + 60000) : date;
        const delayMs = scheduledDate.getTime() - now;
        const graceMinutes = this.getNotificationGraceMinutes();
        const graceLabel = graceMinutes > 1 ? 'minutes' : 'minute';
        console.log(
            `[POM DEBUG] schedulePomNotification pomId=${pom.id} nextReview=${date.toISOString()} ` +
            `scheduled=${scheduledDate.toISOString()} delayMs=${delayMs}`
        );

        const message = `Révision POM disponible ! (${pom.wordIds.length} mots). ` +
            `Vous avez ${graceMinutes} ${graceLabel} pour effectuer la révision.`;

        await this.notificationService.schedulePomNotification(
            pom.id,
            scheduledDate,
            message
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
        pom.nextReviewDate = rescheduleAt;

        poms[index] = pom;
        this.saveAllPoms(poms);
        console.log(`[POM DEBUG] Rescheduled missed pomId=${pomId} reason=${reason} next=${new Date(pom.nextReviewDate).toISOString()}`);

        await this.schedulePomNotification(pom);
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
        const poms = this.getAllPoms();
        const activePoms = poms.filter(p => p.status === 'active');

        for (const pom of activePoms) {
            const graceMinutes = this.getNotificationGraceMinutes();
            const graceMs = graceMinutes * 60 * 1000;
            const now = Date.now();

            if (now > pom.nextReviewDate + graceMs) {
                await this.handleMissedPom(pom.id, pom.nextReviewDate, pom.reviewCount, 'startup');
                continue;
            }

            await this.schedulePomNotification(pom);
        }
        if (activePoms.length > 0) {
            console.log(`[PomService] ${activePoms.length} notifications POM reprogrammées.`);
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
        pom.nextReviewDate = now + (initialIntervalSeconds * 1000);
        pom.intervalDays = initialIntervalDays;
        pom.reviewCount = 0;
        pom.status = 'active';

        poms[index] = pom;
        this.saveAllPoms(poms);

        // Reprogrammer la notification
        await this.schedulePomNotification(pom);
    }

    /**
     * Supprime un POM
     */
    deletePom(pomId: string): void {
        let poms = this.getAllPoms();
        poms = poms.filter(p => p.id !== pomId);
        this.saveAllPoms(poms);
    }
}
