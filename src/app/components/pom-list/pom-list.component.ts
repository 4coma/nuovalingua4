import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PomService } from '../../services/pom.service';
import { StorageService } from '../../services/storage.service';
import { Pom } from '../../models/pom';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';

interface PomWordDisplay {
    id: string;
    it: string;
    fr: string;
    isKnown: boolean;
}

@Component({
    selector: 'app-pom-list',
    templateUrl: './pom-list.component.html',
    styleUrls: ['./pom-list.component.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, RouterModule]
})
export class PomListComponent implements OnInit, OnDestroy {
    poms: Pom[] = [];
    expandedWordsPomId: string | null = null;
    expandedSchedulePomId: string | null = null;
    pomWordsMap: { [pomId: string]: PomWordDisplay[] } = {}; // Map pomId -> list of words
    currentFactor: number = 2;
    highlightPomId: string | null = null;
    dueNotifications: Pom[] = [];
    showCompletedPoms: boolean = false;
    upcomingStats: { label: string, count: number, icon: string, color: string }[] = [];
    private nowMs: number = Date.now();
    private countdownIntervalId: number | null = null;

    constructor(
        private pomService: PomService,
        private vocabularyTrackingService: VocabularyTrackingService,
        private router: Router,
        private route: ActivatedRoute,
        private alertController: AlertController,
        private toastController: ToastController,
        private storageService: StorageService,
        private personalDictionaryService: PersonalDictionaryService
    ) { }

    ngOnInit() {
        this.loadSettings();
        this.loadPoms();
        this.loadFactor();
        this.applyPomFocusFromQuery();
        this.startCountdownTimer();
    }

    ionViewWillEnter() {
        this.loadPoms();
        this.loadFactor();
        // Ne scroll que si on a un pomId dans les query params (venant d'une notification)
        const pomId = this.route.snapshot.queryParamMap.get('pomId');
        if (pomId) {
            this.applyPomFocusFromQuery();
        }
        this.startCountdownTimer();
    }

    ionViewDidLeave() {
        this.stopCountdownTimer();
    }

    ngOnDestroy() {
        this.stopCountdownTimer();
    }

    private startCountdownTimer() {
        if (this.countdownIntervalId !== null) return;
        this.updateDueNotifications();
        this.countdownIntervalId = window.setInterval(() => {
            this.nowMs = Date.now();
            this.updateDueNotifications();
        }, 1000);
    }

    private stopCountdownTimer() {
        if (this.countdownIntervalId === null) return;
        clearInterval(this.countdownIntervalId);
        this.countdownIntervalId = null;
    }

    private loadSettings() {
        const stored = this.storageService.get('pomShowCompletedPoms');
        this.showCompletedPoms = stored === null ? false : stored;
    }

    toggleShowCompleted() {
        this.showCompletedPoms = !this.showCompletedPoms;
        this.storageService.set('pomShowCompletedPoms', this.showCompletedPoms);
    }

    get filteredPoms(): Pom[] {
        if (this.showCompletedPoms) {
            return this.poms;
        }
        return this.poms.filter(pom => pom.status === 'active');
    }

    private applyPomFocusFromQuery() {
        const pomId = this.route.snapshot.queryParamMap.get('pomId');
        if (!pomId) return;

        this.highlightPomId = pomId;
        this.expandedSchedulePomId = pomId;
        setTimeout(() => {
            const element = document.getElementById(`pom-card-${pomId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Nettoyer les query params après le scroll
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {},
                replaceUrl: true
            });
        }, 100);

        setTimeout(() => {
            if (this.highlightPomId === pomId) {
                this.highlightPomId = null;
            }
        }, 4000);
    }

    loadFactor() {
        const storedFactor = this.storageService.get('pomReviewFactor');
        this.currentFactor = storedFactor ? parseFloat(storedFactor) : 2;
    }

    loadPoms() {
        this.poms = this.pomService.getAllPoms().sort((a, b) => a.nextReviewDate - b.nextReviewDate);
        this.updateDueNotifications();
        this.calculateUpcomingStats();
    }

    private calculateUpcomingStats() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const threeDays = 3 * oneDay;
        const sevenDays = 7 * oneDay;

        const activePoms = this.poms.filter(p => p.status === 'active');

        const dueNow = activePoms.filter(p => p.nextReviewDate <= now).length;
        const dueNext24h = activePoms.filter(p => p.nextReviewDate > now && p.nextReviewDate <= now + oneDay).length;
        const dueNext3Days = activePoms.filter(p => p.nextReviewDate > now + oneDay && p.nextReviewDate <= now + threeDays).length;
        const dueNext7Days = activePoms.filter(p => p.nextReviewDate > now + threeDays && p.nextReviewDate <= now + sevenDays).length;

        this.upcomingStats = [
            { label: 'Dûs', count: dueNow, icon: 'alert-circle', color: 'danger' },
            { label: '24h', count: dueNext24h, icon: 'time', color: 'warning' },
            { label: '3j', count: dueNext3Days, icon: 'calendar', color: 'primary' },
            { label: '7j', count: dueNext7Days, icon: 'calendar-number', color: 'secondary' }
        ];
    }

    toggleWords(pomId: string) {
        if (this.expandedWordsPomId === pomId) {
            this.expandedWordsPomId = null;
        } else {
            this.expandedWordsPomId = pomId;
            if (this.expandedSchedulePomId === pomId) {
                this.expandedSchedulePomId = null;
            }
            if (!this.pomWordsMap[pomId]) {
                this.loadPomWords(pomId);
            }
        }
    }

    toggleSchedule(pomId: string) {
        if (this.expandedSchedulePomId === pomId) {
            this.expandedSchedulePomId = null;
        } else {
            this.expandedSchedulePomId = pomId;
            if (this.expandedWordsPomId === pomId) {
                this.expandedWordsPomId = null;
            }
        }
    }

    loadPomWords(pomId: string) {
        const pom = this.poms.find(p => p.id === pomId);
        if (!pom) return;

        const allWords = this.vocabularyTrackingService.getAllTrackedWords();
        const dictionaryWords = this.personalDictionaryService.getAllWords();
        const knownIds = new Set<string>();

        dictionaryWords.forEach(dw => {
            if (!dw.isKnown) return;
            const dwId = this.vocabularyTrackingService.generateWordId(
                dw.sourceLang === 'it' ? dw.sourceWord : dw.targetWord,
                dw.sourceLang === 'it' ? dw.targetWord : dw.sourceWord
            );
            knownIds.add(dwId);
        });

        const words: PomWordDisplay[] = [];

        for (const wordId of pom.wordIds) {
            const trackedWord = allWords.find(w => w.id === wordId);
            if (trackedWord) {
                words.push({
                    id: wordId,
                    it: trackedWord.word,
                    fr: trackedWord.translation,
                    isKnown: knownIds.has(wordId)
                });
            }
        }
        this.pomWordsMap[pomId] = words;
    }

    togglePomWordKnownStatus(pomId: string, word: PomWordDisplay) {
        const dictionaryWords = this.personalDictionaryService.getAllWords();

        // Trouver le mot en comparant les textes normalisés plutôt que les IDs
        const itNormalized = word.it.toLowerCase().trim();
        const frNormalized = word.fr.toLowerCase().trim();

        const matchingWord = dictionaryWords.find(dw => {
            const dwIt = (dw.sourceLang === 'it' ? dw.sourceWord : dw.targetWord).toLowerCase().trim();
            const dwFr = (dw.sourceLang === 'it' ? dw.targetWord : dw.sourceWord).toLowerCase().trim();
            return (dwIt === itNormalized && dwFr === frNormalized);
        });

        if (matchingWord) {
            console.log('[PomList] Mot trouvé dans le dictionnaire, id:', matchingWord.id, 'actuellement connu:', matchingWord.isKnown);
            const nextKnown = !matchingWord.isKnown;
            this.personalDictionaryService.setWordKnownStatus(matchingWord.id, nextKnown);
            word.isKnown = nextKnown;
            console.log('[PomList] Statut mis à jour:', nextKnown);
        } else {
            console.log('[PomList] Mot non trouvé dans le dictionnaire, ajout comme connu');
            const newWord: DictionaryWord = {
                id: '',
                sourceWord: word.it,
                sourceLang: 'it',
                targetWord: word.fr,
                targetLang: 'fr',
                contextualMeaning: '',
                themes: [],
                dateAdded: Date.now(),
                isKnown: true
            };
            this.personalDictionaryService.addWord(newWord);
            word.isKnown = true;
        }

        // Forcer la mise à jour de l'affichage
        this.pomWordsMap[pomId] = [...(this.pomWordsMap[pomId] || [])];
    }

    getReviewDateLabel(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();

        if (timestamp <= now.getTime()) {
            return 'Maintenant';
        }

        const diff = date.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Aujourd\'hui';
        } else if (days === 1) {
            return 'Demain';
        } else {
            return `Dans ${days} jours`;
        }
    }

    formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    getPomTitle(pom: Pom): string {
        return this.pomService.getPomDisplayTitle(pom);
    }

    async startReview(pom: Pom) {
        if (pom.status !== 'active') {
            const toast = await this.toastController.create({
                message: 'Ce POM est déjà maîtrisé.',
                duration: 2000,
                color: 'success'
            });
            await toast.present();
            return;
        }
        // Logic similar to AppComponent.startPomReviewSession
        // We can probably navigate to a route or call a service method if we refactored it.
        // For now, let's replicate the logic or trigger the notification action manually? 
        // Better: Navigate directly setting the storage.

        // Check if due? Or allow force review?
        // Let's allow force review but maybe warn?

        const pomWords = this.pomService.getPomWords(pom.id);
        if (pomWords.length === 0) {
            const completed = this.pomService.completePomIfNoReviewableWords(pom.id);
            const toast = await this.toastController.create({
                message: completed
                    ? 'Ce POM n\'a plus de mots à réviser.'
                    : 'Erreur: Aucun mot trouvé pour ce POM.',
                duration: 2500,
                color: completed ? 'warning' : 'danger'
            });
            await toast.present();
            this.loadPoms();
            return;
        }

        // Set session info
        localStorage.setItem('sessionInfo', JSON.stringify({
            category: 'Révision Espacée (POM)',
            topic: 'Révision',
            date: new Date().toISOString(),
            translationDirection: 'fr2it'
        }));
        localStorage.setItem('wordPairs', JSON.stringify(pomWords));
        localStorage.setItem('isPomReview', 'true');
        localStorage.setItem('pomId', pom.id);
        this.pomService.setPomReviewSessionMeta(pom.id);

        // Clear other flags
        localStorage.setItem('isPersonalDictionaryRevision', 'false');
        localStorage.setItem('fullRevisionActive', 'false');

        this.router.navigate(['/word-pairs-game'], { queryParams: { pomStart: Date.now() } });
    }

    formatDateTime(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    async resetSchedule(pom: Pom) {
        const alert = await this.alertController.create({
            header: 'Réinitialiser le POM',
            message: 'Voulez-vous recommencer le cycle de mémorisation de ce POM à partir de maintenant ?',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Réinitialiser',
                    handler: async () => {
                        await this.pomService.resetPomSchedule(pom.id);
                        this.loadPoms();
                        this.presentToast('Calendrier réinitialisé avec succès');
                    }
                }
            ]
        });
        await alert.present();
    }

    async editPomTitle(pom: Pom) {
        const alert = await this.alertController.create({
            header: 'Renommer le POM',
            inputs: [
                {
                    name: 'title',
                    type: 'text',
                    value: pom.title || '',
                    placeholder: 'Ex: Révision libre'
                }
            ],
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Enregistrer',
                    handler: (data) => {
                        const title = (data?.title || '').trim();
                        this.pomService.updatePomTitle(pom.id, title || null);
                        this.loadPoms();
                        this.presentToast('Titre du POM mis à jour');
                    }
                }
            ]
        });
        await alert.present();
    }

    getFirstOverdueIndex(pom: Pom): number {
        const schedule = this.getProjectedSchedule(pom);
        return schedule.findIndex(step => step.isOverdue);
    }

    async rescheduleMissedFromStep(pom: Pom, missedDate: number) {
        await this.pomService.rescheduleFromMissedDate(pom.id, missedDate, 'manual');
        this.loadPoms();
        this.presentToast('Session POM replanifiée à partir de cette date');
    }

    async deletePom(pom: Pom) {
        const alert = await this.alertController.create({
            header: 'Confirmer la suppression',
            message: 'Êtes-vous sûr de vouloir supprimer ce parcours de mémorisation ? Les mots ne seront plus suivis dans ce cycle.',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Supprimer',
                    role: 'destructive',
                    handler: () => {
                        this.pomService.deletePom(pom.id);
                        this.loadPoms();
                        this.presentToast('POM supprimé avec succès');
                    }
                }
            ]
        });
        await alert.present();
    }

    async presentToast(message: string) {
        const toast = await this.toastController.create({
            message: message,
            duration: 2000,
            color: 'success'
        });
        await toast.present();
    }

    getProjectedSchedule(pom: Pom): { interval: number, date: number, passed: boolean, isNext: boolean, isOverdue: boolean }[] {
        const schedule: { interval: number, date: number, passed: boolean, isNext: boolean, isOverdue: boolean }[] = [];
        const now = this.nowMs;
        const storedGrace = this.storageService.get('pomNotificationGraceMinutes');
        const graceMinutes = storedGrace ? parseInt(storedGrace) : 10;
        const graceMs = Number.isFinite(graceMinutes) ? graceMinutes * 60 * 1000 : 10 * 60 * 1000;

        // Charger l'intervalle initial
        const storedIntervalSeconds = this.storageService.get('pomInitialIntervalSeconds');
        const initialIntervalSeconds = storedIntervalSeconds ? parseInt(storedIntervalSeconds) : 43200;
        const initialIntervalDays = initialIntervalSeconds / (24 * 60 * 60);

        const factor = pom.factor || 2;

        // On va générer une liste d'intervalles théoriques
        const intervals: number[] = [initialIntervalDays];
        for (let i = 1; i < pom.reviewCount + 10; i++) {
            let next = intervals[i - 1] * factor;
            if (next <= intervals[i - 1]) next = intervals[i - 1] + (30 / (24 * 60 * 60)); // +30s min
            intervals.push(next);
        }

        // Calculer les dates
        // Step i=0 est createdAt + initialInterval
        // Mais on veut que Step pom.reviewCount correspond à pom.nextReviewDate

        for (let i = 0; i < intervals.length; i++) {
            const isNext = i === pom.reviewCount;
            const passed = i < pom.reviewCount;
            let date: number;

            if (isNext) {
                date = pom.nextReviewDate;
            } else if (passed) {
                // Pour le passé, on approxime depuis createdAt
                let pastDate = pom.createdAt + (initialIntervalSeconds * 1000);
                for (let j = 1; j <= i; j++) {
                    pastDate += intervals[j - 1] * 24 * 60 * 60 * 1000;
                }
                date = pastDate;
            } else {
                // Pour le futur, on part de nextReviewDate
                let futureDate = pom.nextReviewDate;
                for (let j = pom.reviewCount + 1; j <= i; j++) {
                    futureDate += intervals[j - 1] * 24 * 60 * 60 * 1000;
                }
                date = futureDate;
            }

            // Déterminer si cette étape est en retard
            // Une étape est en retard si elle est dans le passé (date < now) mais n'a pas été complétée (i >= reviewCount)
            const isOverdue = now > date + graceMs && i >= pom.reviewCount;

            schedule.push({
                interval: parseFloat(intervals[i].toFixed(1)),
                date: date,
                passed: passed,
                isNext: isNext,
                isOverdue: isOverdue
            });

            if (intervals[i] > 365 && i > pom.reviewCount) break;
            if (schedule.length >= 30) break;
        }

        return schedule;
    }

    isPomInGraceWindow(pom: Pom): boolean {
        if (pom.status !== 'active') return false;
        const graceMinutes = this.getGraceMinutes();
        const graceMs = graceMinutes * 60 * 1000;
        return this.nowMs >= pom.nextReviewDate && this.nowMs <= pom.nextReviewDate + graceMs;
    }

    getGraceRemainingLabel(pom: Pom): string {
        const graceMinutes = this.getGraceMinutes();
        const graceMs = graceMinutes * 60 * 1000;
        const remainingMs = pom.nextReviewDate + graceMs - this.nowMs;
        if (remainingMs <= 0) return '0:00';
        const totalSeconds = Math.floor(remainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getGraceWindowEnd(pom: Pom): number {
        const graceMinutes = this.getGraceMinutes();
        return pom.nextReviewDate + graceMinutes * 60 * 1000;
    }

    private getGraceMinutes(): number {
        const storedGrace = this.storageService.get('pomNotificationGraceMinutes');
        const parsed = storedGrace ? parseInt(storedGrace) : 10;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
    }

    private updateDueNotifications() {
        this.dueNotifications = this.poms
            .filter(pom => pom.status === 'active' && this.isPomInGraceWindow(pom))
            .sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    }
}
