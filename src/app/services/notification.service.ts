import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StorageService } from './storage.service';
import { Capacitor } from '@capacitor/core';
import { ToastController } from '@ionic/angular';
import { Subject, Observable } from 'rxjs';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // Format "HH:MM"
  message: string;
}

export interface ComprehensionNotificationSettings {
  enabled: boolean;
  time: string; // Format "HH:MM"
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly NOTIFICATION_ID = 1001; // ID unique pour la notification quotidienne
  private readonly SETTINGS_KEY = 'notificationSettings';
  private readonly COMPREHENSION_NOTIFICATION_ID = 2001; // Notification quotidienne pour la compréhension orale
  private readonly COMPREHENSION_SETTINGS_KEY = 'comprehensionNotificationSettings';
  private readonly DAILY_NOTIFICATION_STATE_KEY = 'dailyNotificationState';

  private dailyNotificationState: DailyNotificationState;
  private actionSubject = new Subject<{ action: string, pomId?: string, extra?: any }>();
  public onAction$: Observable<{ action: string, pomId?: string, extra?: any }> = this.actionSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private toastController: ToastController
  ) {
    this.dailyNotificationState = this.loadDailyNotificationState();
  }

  private get defaultDailyNotificationState(): DailyNotificationState {
    return {
      messageOverride: null,
      wordCount: 0,
      newWordIds: [],
      newWordsPreview: []
    };
  }

  private loadDailyNotificationState(): DailyNotificationState {
    const saved = this.storageService.get(this.DAILY_NOTIFICATION_STATE_KEY);
    if (saved) {
      return {
        ...this.defaultDailyNotificationState,
        ...saved
      };
    }
    return this.defaultDailyNotificationState;
  }

  private saveDailyNotificationState(): void {
    this.storageService.set(this.DAILY_NOTIFICATION_STATE_KEY, this.dailyNotificationState);
  }

  private getDailyNotificationExtra(): DailyNotificationExtra {
    return {
      wordCount: this.dailyNotificationState.wordCount || 0,
      newWordIds: [...(this.dailyNotificationState.newWordIds || [])],
      newWordsPreview: [...(this.dailyNotificationState.newWordsPreview || [])]
    };
  }

  /**
   * Initialise le service de notification
   */
  async initialize(): Promise<void> {
    try {
      // Demander les permissions si nécessaire
      await this.requestPermissions();

      // Configurer les actions de notification
      await this.setupNotificationActions();

      // Programmer la notification quotidienne si activée
      const settings = this.getSettings();
      if (settings.enabled) {
        const messageToUse = this.dailyNotificationState.messageOverride || settings.message;
        await this.scheduleDailyNotification(settings.time, messageToUse, this.getDailyNotificationExtra());
      }

      const compSettings = this.getComprehensionSettings();
      if (compSettings.enabled) {
        await this.scheduleDailyComprehensionNotification(compSettings.time);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  /**
   * Demande les permissions pour les notifications
   */
  async requestPermissions(): Promise<void> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        if ('Notification' in window) {
          await Notification.requestPermission();
        }
        return;
      }

      const result = await LocalNotifications.requestPermissions();

      // Vérifier si les permissions sont accordées
      const checkResult = await LocalNotifications.checkPermissions();

      if (checkResult.display !== 'granted') {
        console.warn('Permissions de notifications non accordées');
      }
    } catch (error) {
      if (Capacitor.getPlatform() !== 'web') {
        console.error('Erreur lors de la demande de permissions:', error);
      }
    }
  }

  /**
   * Configure les actions de notification
   */
  private async setupNotificationActions(): Promise<void> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return; // Non supporté sur le web
      }

      // Configurer l'action pour la révision quotidienne
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'DAILY_REVISION',
            actions: [
              {
                id: 'start_revision',
                title: 'Commencer la révision'
              }
            ]
          },
          {
            id: 'DAILY_COMPREHENSION',
            actions: [
              {
                id: 'start_comprehension',
                title: 'Ouvrir la compréhension'
              }
            ]
          },
          {
            id: 'POM_REVIEW',
            actions: [
              {
                id: 'start_pom_review',
                title: 'Réviser maintenant'
              }
            ]
          }
        ]
      });

    } catch (error) {
      if (Capacitor.getPlatform() !== 'web') {
        console.error('Erreur lors de la configuration des actions de notification:', error);
      }
    }
  }

  // ... (existing methods)

  /**
   * Programme une notification pour un POM
   */
  async schedulePomNotification(pomId: string, date: Date, message: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();
      console.log(
        `[NOTIF DEBUG] schedulePomNotification platform=${platform} pomId=${pomId} ` +
        `date=${date.toISOString()} message="${message}"`
      );
      if (platform === 'web') {
        // Fallback pour le navigateur sur PC
        const now = Date.now();
        const delay = date.getTime() - now;
        console.log(`[NOTIF DEBUG] web schedule delayMs=${delay}`);

        if (delay <= 0) {
          console.log('[NOTIF DEBUG] web schedule immediate notify');
          if (this.shouldShowPomNotification(pomId, date.getTime())) {
            this.showBrowserNotification('Révision Espacée (POM)', message, pomId);
          } else {
            console.log('[NOTIF DEBUG] web schedule skipped (state changed)');
          }
        } else {
          // Utiliser setTimeout pour les notifications programmées dans la session actuelle
          // Note : Cela ne survivra pas à un rechargement de page,
          // mais c'est suffisant pour le test de quelques minutes demandé.
          const timeoutId = setTimeout(() => {
            if (this.shouldShowPomNotification(pomId, date.getTime())) {
              this.showBrowserNotification('Révision Espacée (POM)', message, pomId);
            } else {
              console.log('[NOTIF DEBUG] web schedule skipped (state changed)');
            }
          }, delay);
          console.log(`[NOTIF DEBUG] web setTimeout id=${String(timeoutId)} in ${Math.round(delay / 1000)}s`);
        }
        return;
      }

      // Générer un ID numérique unique à partir de l'ID du POM
      const notificationId = this.hashCode(pomId);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: 'Révision Espacée (POM)',
            body: message,
            schedule: { at: date },
            sound: 'default',
            actionTypeId: 'POM_REVIEW',
            extra: {
              type: 'pom_review',
              action: 'start_pom_review',
              pomId: pomId
            }
          }
        ]
      });
      console.log(`[NOTIF DEBUG] native schedule done id=${notificationId} pomId=${pomId}`);
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification POM:', error);
    }
  }

  /**
   * Affiche une notification dans le navigateur ou via un Toast Ionic
   */
  private async showBrowserNotification(title: string, message: string, pomId?: string) {
    // 1. Essayer l'API Notification du navigateur
    if ('Notification' in window) {
      console.log(`[NOTIF DEBUG] browser permission=${Notification.permission}`);
      if (Notification.permission === 'granted') {
        const n = new Notification(title, { body: message });
        n.onclick = () => {
          this.actionSubject.next({ action: 'start_pom_review', pomId });
          window.focus();
        };
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        console.log(`[NOTIF DEBUG] browser permission requested result=${permission}`);
        if (permission === 'granted') {
          const n = new Notification(title, { body: message });
          n.onclick = () => {
            this.actionSubject.next({ action: 'start_pom_review', pomId });
            window.focus();
          };
        }
      }
    } else {
      console.log('[NOTIF DEBUG] browser Notification API not available');
    }

    if (pomId) {
      await this.playPomNotificationSound();
    }

    // 2. Toujours afficher un Toast Ionic (plus fiable sur Web)
    const toast = await this.toastController.create({
      message: `${title}: ${message}`,
      duration: 8000,
      position: 'top',
      color: 'primary',
      buttons: [
        {
          text: 'Ouvrir',
          handler: () => {
            this.actionSubject.next({ action: 'start_pom_review', pomId });
          }
        },
        {
          text: 'Fermer',
          role: 'cancel'
        }
      ]
    });
    await toast.present();

    // 3. Toujours afficher un log console pour le debug
    console.log(`%c[CORE DEBUG] Notification affichée`, 'color: #00ff00; font-weight: bold', { title, message, pomId });
    console.log(`[NOTIFICATION] ${title}: ${message}`, pomId ? `(POM ID: ${pomId})` : '');
  }

  private async playPomNotificationSound(): Promise<void> {
    try {
      const AudioContextRef = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextRef) {
        console.log('[NOTIF DEBUG] AudioContext not supported');
        return;
      }

      const context = new AudioContextRef();
      if (context.state === 'suspended') {
        await context.resume();
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);

      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.4);

      oscillator.onended = () => {
        context.close().catch(() => {});
      };
    } catch (error) {
      console.warn('[NOTIF DEBUG] Unable to play POM sound:', error);
    }
  }

  private shouldShowPomNotification(pomId: string, scheduledAt: number): boolean {
    const poms = this.storageService.get('poms');
    if (!Array.isArray(poms)) return false;
    const pom = poms.find(p => p.id === pomId);
    if (!pom || pom.status !== 'active') return false;

    const now = Date.now();
    const due = pom.nextReviewDate <= now + 1000;
    const diffMs = Math.abs(scheduledAt - pom.nextReviewDate);
    const scheduleMatches = diffMs <= 2 * 60 * 1000;

    return due && scheduleMatches;
  }

  /**
   * Utilitaire pour générer un hash code numérique à partir d'une chaîne
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash); // Ensure positive ID
  }

  // ... (rest of the file)
  /**
   * Récupère les paramètres de notification
   */
  getSettings(): NotificationSettings {
    const defaultSettings: NotificationSettings = {
      enabled: false,
      time: '18:30',
      message: 'Il est temps de pratiquer votre italien ! 🇮🇹'
    };

    const saved = this.storageService.get(this.SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...saved } : defaultSettings;
  }

  /**
   * Sauvegarde les paramètres de notification
   */
  saveSettings(settings: NotificationSettings): void {
    this.storageService.set(this.SETTINGS_KEY, settings);
  }

  /**
   * Récupère les paramètres de notification de compréhension orale
   */
  getComprehensionSettings(): ComprehensionNotificationSettings {
    const defaultSettings: ComprehensionNotificationSettings = {
      enabled: false,
      time: '19:00'
    };
    const saved = this.storageService.get(this.COMPREHENSION_SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...saved } : defaultSettings;
  }

  /**
   * Sauvegarde les paramètres de notification de compréhension orale
   */
  saveComprehensionSettings(settings: ComprehensionNotificationSettings): void {
    this.storageService.set(this.COMPREHENSION_SETTINGS_KEY, settings);
  }

  /**
   * Active/désactive les notifications quotidiennes
   */
  async toggleNotifications(enabled: boolean, time?: string, message?: string): Promise<void> {
    const settings = this.getSettings();
    settings.enabled = enabled;

    if (time) settings.time = time;
    if (message) settings.message = message;

    this.saveSettings(settings);

    if (enabled) {
      const messageToUse = this.dailyNotificationState.messageOverride || settings.message;
      await this.scheduleDailyNotification(settings.time, messageToUse, this.getDailyNotificationExtra());
    } else {
      await this.cancelDailyNotification();
    }
  }

  /**
   * Active ou désactive les notifications quotidiennes de compréhension orale
   */
  async toggleComprehensionNotifications(enabled: boolean, time?: string): Promise<void> {
    const settings = this.getComprehensionSettings();
    settings.enabled = enabled;
    if (time) settings.time = time;
    this.saveComprehensionSettings(settings);
    if (enabled) {
      await this.scheduleDailyComprehensionNotification(settings.time);
    } else {
      await this.cancelDailyComprehensionNotification();
    }
  }

  /**
   * Programme une notification quotidienne
   */
  async scheduleDailyNotification(time: string, message: string, extraData?: DailyNotificationExtra): Promise<void> {
    try {
      // Annuler d'abord la notification existante
      await this.cancelDailyNotification();

      // Vérifier qu'elle a bien été supprimée
      const pendingAfterCancel = await LocalNotifications.getPending();
      if (pendingAfterCancel.notifications.some(n => n.id === this.NOTIFICATION_ID)) {
        console.warn('Ancienne notification toujours présente, nouvelle tentative d\'annulation');
        await LocalNotifications.cancel({ notifications: [{ id: this.NOTIFICATION_ID }] });
      }

      // Parser l'heure (format "HH:MM")
      const [hours, minutes] = time.split(':').map(Number);

      // Calculer la prochaine occurrence
      const now = new Date();
      const nextNotification = new Date();
      nextNotification.setHours(hours, minutes, 0, 0);

      // Si l'heure est déjà passée aujourd'hui, programmer pour demain
      if (nextNotification <= now) {
        nextNotification.setDate(nextNotification.getDate() + 1);
      }

      const extra = extraData || this.getDailyNotificationExtra();

      // Créer la notification avec action personnalisée
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.NOTIFICATION_ID,
            title: 'NuovaLingua',
            body: message,
            schedule: {
              at: nextNotification,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            actionTypeId: 'DAILY_REVISION',
            extra: {
              type: 'daily_reminder',
              action: 'start_revision',
              wordCount: extra.wordCount,
              newWordIds: extra.newWordIds,
              newWordsPreview: extra.newWordsPreview
            }
          }
        ]
      });

      this.dailyNotificationState = {
        ...this.dailyNotificationState,
        wordCount: extra.wordCount,
        newWordIds: [...extra.newWordIds],
        newWordsPreview: [...extra.newWordsPreview]
      };
      this.saveDailyNotificationState();

    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
      throw error;
    }
  }

  /**
   * Annule la notification quotidienne
   */
  async cancelDailyNotification(): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: this.NOTIFICATION_ID }] });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification:', error);
    }
  }

  /**
   * Programme la notification quotidienne de compréhension orale
   */
  async scheduleDailyComprehensionNotification(time: string): Promise<void> {
    try {
      await this.cancelDailyComprehensionNotification();

      const [hours, minutes] = time.split(':').map(Number);

      const now = new Date();
      const next = new Date();
      next.setHours(hours, minutes, 0, 0);

      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.COMPREHENSION_NOTIFICATION_ID,
            title: 'NuovaLingua',
            body: 'Votre exercice d\'écoute du jour est prêt !',
            schedule: {
              at: next,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            actionTypeId: 'DAILY_COMPREHENSION',
            extra: { type: 'daily_comprehension', action: 'start_comprehension' }
          }
        ]
      });

    } catch (error) {
      console.error('Erreur lors de la programmation de la notification de compréhension:', error);
      throw error;
    }
  }

  /**
   * Annule la notification quotidienne de compréhension orale
   */
  async cancelDailyComprehensionNotification(): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: this.COMPREHENSION_NOTIFICATION_ID }] });
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification de compréhension:', error);
    }
  }

  /**
   * Envoie une notification de test immédiate
   */
  async sendTestNotification(): Promise<void> {
    try {
      const settings = this.getSettings();
      const message = settings.message || 'Test de notification quotidienne';

      if (Capacitor.getPlatform() === 'web') {
        await this.showBrowserNotification('NuovaLingua - Test', message);
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999, // ID temporaire pour le test
            title: 'NuovaLingua - Test',
            body: message,
            schedule: { at: new Date(Date.now() + 1000) }, // Dans 1 seconde
            sound: 'default',
            actionTypeId: 'DAILY_REVISION',
            extra: {
              type: 'test_notification',
              action: 'start_revision'
            }
          }
        ]
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error);
      throw error;
    }
  }

  /**
   * Vérifie si les notifications sont supportées
   */
  async isSupported(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Vérifie les permissions et retourne un message d'information
   */
  async checkPermissionsStatus(): Promise<{ granted: boolean; message: string }> {
    try {
      const result = await LocalNotifications.checkPermissions();

      if (result.display === 'granted') {
        return {
          granted: true,
          message: 'Permissions accordées'
        };
      } else {
        return {
          granted: false,
          message: 'Permissions non accordées. Allez dans Paramètres > Applications > NuovaLingua > Notifications'
        };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return {
        granted: false,
        message: 'Erreur lors de la vérification des permissions'
      };
    }
  }

  /**
   * Met à jour l'heure de la notification quotidienne
   */
  async updateNotificationTime(newTime: string): Promise<void> {
    const settings = this.getSettings();
    if (settings.enabled) {
      const messageToUse = this.dailyNotificationState.messageOverride || settings.message;
      await this.scheduleDailyNotification(newTime, messageToUse, this.getDailyNotificationExtra());
    }
    settings.time = newTime;
    this.saveSettings(settings);
  }

  /**
   * Met à jour l'heure de la notification quotidienne de compréhension orale
   */
  async updateComprehensionNotificationTime(newTime: string): Promise<void> {
    const settings = this.getComprehensionSettings();
    if (settings.enabled) {
      await this.scheduleDailyComprehensionNotification(newTime);
    }
    settings.time = newTime;
    this.saveComprehensionSettings(settings);
  }

  /**
   * Met à jour le message de la notification quotidienne
   */
  async updateNotificationMessage(newMessage: string): Promise<void> {
    const settings = this.getSettings();
    this.dailyNotificationState = this.defaultDailyNotificationState;
    this.saveDailyNotificationState();
    if (settings.enabled) {
      await this.scheduleDailyNotification(settings.time, newMessage, this.getDailyNotificationExtra());
    }
    settings.message = newMessage;
    this.saveSettings(settings);
  }

  /**
   * Met à jour dynamiquement le message de notification en fonction des mots ajoutés aujourd'hui
   */
  async updateNotificationMessageWithTodayWords(
    wordsAddedToday: number,
    newWordIds: string[],
    newWordsPreview: NotificationWordPreview[]
  ): Promise<void> {
    const settings = this.getSettings();
    let message = settings.message; // Message par défaut

    if (wordsAddedToday > 0) {
      // Message personnalisé avec le nombre de mots ajoutés aujourd'hui
      if (wordsAddedToday === 1) {
        message = `Vous avez ajouté 1 nouveau mot aujourd'hui ! Il serait bon de le réviser. 🇮🇹`;
      } else {
        message = `Vous avez ajouté ${wordsAddedToday} nouveaux mots aujourd'hui ! Il serait bon de les réviser. 🇮🇹`;
      }
    }
    // Si aucun mot ajouté, garder le message par défaut

    this.dailyNotificationState = {
      messageOverride: wordsAddedToday > 0 ? message : null,
      wordCount: wordsAddedToday,
      newWordIds,
      newWordsPreview
    };
    this.saveDailyNotificationState();

    if (settings.enabled) {
      const messageToUse = this.dailyNotificationState.messageOverride || settings.message;

      // Vérifier si une notification est déjà programmée pour aujourd'hui
      const shouldReschedule = await this.shouldRescheduleNotification(settings.time);

      if (shouldReschedule) {
        // Reprogrammer seulement si nécessaire
        await this.scheduleDailyNotification(settings.time, messageToUse, this.getDailyNotificationExtra());
      } else {
        // Mettre à jour seulement les données extra de la notification existante
        await this.updateExistingNotificationData(messageToUse, this.getDailyNotificationExtra());
      }
    }

  }

  /**
   * Vérifie si la notification doit être reprogrammée
   * Retourne true si :
   * - Aucune notification n'est programmée
   * - L'heure de la notification est passée aujourd'hui
   */
  private async shouldRescheduleNotification(time: string): Promise<boolean> {
    try {
      const pending = await LocalNotifications.getPending();
      const existingNotification = pending.notifications.find(n => n.id === this.NOTIFICATION_ID);

      if (!existingNotification) {
        // Aucune notification programmée, il faut programmer
        return true;
      }

      // Vérifier si l'heure est passée aujourd'hui
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes, 0, 0);

      // Si l'heure est passée, il faut reprogrammer pour demain
      if (notificationTime <= now) {
        return true;
      }

      // La notification est déjà programmée pour aujourd'hui, pas besoin de reprogrammer
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification des notifications en attente:', error);
      // En cas d'erreur, on reprogramme pour être sûr
      return true;
    }
  }

  /**
   * Met à jour les données extra d'une notification existante sans la reprogrammer
   * Note: Capacitor Local Notifications ne permet pas de mettre à jour une notification existante
   * On doit donc la reprogrammer, mais on essaie de garder la même date/heure
   */
  private async updateExistingNotificationData(message: string, extraData: DailyNotificationExtra): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      const existingNotification = pending.notifications.find(n => n.id === this.NOTIFICATION_ID);

      if (!existingNotification || !existingNotification.schedule?.at) {
        // Si pas de notification existante, on programme normalement
        const settings = this.getSettings();
        await this.scheduleDailyNotification(settings.time, message, extraData);
        return;
      }

      // Récupérer la date/heure de la notification existante
      const existingDate = new Date(existingNotification.schedule.at);
      const now = new Date();

      // Si la notification est pour aujourd'hui et l'heure n'est pas passée, on garde la même date
      // Sinon, on recalcule normalement
      const settings = this.getSettings();
      const [hours, minutes] = settings.time.split(':').map(Number);
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes, 0, 0);

      let targetDate: Date;

      if (notificationTime <= now) {
        // L'heure est passée, programmer pour demain
        targetDate = new Date(notificationTime);
        targetDate.setDate(targetDate.getDate() + 1);
      } else {
        // L'heure n'est pas passée, utiliser la date de la notification existante
        // pour éviter de créer plusieurs notifications
        const existingTime = new Date(existingDate);
        existingTime.setHours(hours, minutes, 0, 0);

        // Si la notification existante est pour aujourd'hui, on la garde
        if (existingDate.getDate() === now.getDate() &&
          existingDate.getMonth() === now.getMonth() &&
          existingDate.getFullYear() === now.getFullYear()) {
          targetDate = existingDate;
        } else {
          // Sinon, programmer pour aujourd'hui
          targetDate = notificationTime;
        }
      }

      // Annuler l'ancienne et reprogrammer avec les nouvelles données
      await this.cancelDailyNotification();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.NOTIFICATION_ID,
            title: 'NuovaLingua',
            body: message,
            schedule: {
              at: targetDate,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            actionTypeId: 'DAILY_REVISION',
            extra: {
              type: 'daily_reminder',
              action: 'start_revision',
              wordCount: extraData.wordCount,
              newWordIds: extraData.newWordIds,
              newWordsPreview: extraData.newWordsPreview
            }
          }
        ]
      });

      this.dailyNotificationState = {
        ...this.dailyNotificationState,
        wordCount: extraData.wordCount,
        newWordIds: [...extraData.newWordIds],
        newWordsPreview: [...extraData.newWordsPreview]
      };
      this.saveDailyNotificationState();

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification existante:', error);
      // En cas d'erreur, on reprogramme normalement
      const settings = this.getSettings();
      await this.scheduleDailyNotification(settings.time, message, extraData);
    }
  }

  /**
   * Réinitialise le message de notification au message par défaut
   */
  async resetNotificationMessage(): Promise<void> {
    const settings = this.getSettings();
    this.dailyNotificationState = this.defaultDailyNotificationState;
    this.saveDailyNotificationState();
    if (settings.enabled) {
      await this.scheduleDailyNotification(settings.time, settings.message, this.getDailyNotificationExtra());
    }
  }
}


interface DailyNotificationExtra {
  wordCount: number;
  newWordIds: string[];
  newWordsPreview: NotificationWordPreview[];
}

interface DailyNotificationState extends DailyNotificationExtra {
  messageOverride: string | null;
}

export interface NotificationWordPreview {
  id: string;
  sourceWord: string;
  sourceLang: string;
  targetWord: string;
  targetLang: string;
}
