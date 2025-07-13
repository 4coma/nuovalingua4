import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StorageService } from './storage.service';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // Format "HH:MM"
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly NOTIFICATION_ID = 1001; // ID unique pour la notification quotidienne
  private readonly SETTINGS_KEY = 'notificationSettings';

  constructor(private storageService: StorageService) {}

  /**
   * Initialise le service de notification
   */
  async initialize(): Promise<void> {
    try {
      // Demander les permissions si nécessaire
      await this.requestPermissions();
      
      // Programmer la notification quotidienne si activée
      const settings = this.getSettings();
      if (settings.enabled) {
        await this.scheduleDailyNotification(settings.time, settings.message);
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
      const result = await LocalNotifications.requestPermissions();
      console.log('Permissions notifications:', result);
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
    }
  }

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
   * Active/désactive les notifications quotidiennes
   */
  async toggleNotifications(enabled: boolean, time?: string, message?: string): Promise<void> {
    const settings = this.getSettings();
    settings.enabled = enabled;
    
    if (time) settings.time = time;
    if (message) settings.message = message;
    
    this.saveSettings(settings);

    if (enabled) {
      await this.scheduleDailyNotification(settings.time, settings.message);
    } else {
      await this.cancelDailyNotification();
    }
  }

  /**
   * Programme une notification quotidienne
   */
  async scheduleDailyNotification(time: string, message: string): Promise<void> {
    try {
      // Annuler d'abord la notification existante
      await this.cancelDailyNotification();

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

      // Créer la notification
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
            actionTypeId: 'OPEN_APP',
            extra: {
              type: 'daily_reminder'
            }
          }
        ]
      });

      console.log('Notification quotidienne programmée pour:', nextNotification.toLocaleString());
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
      console.log('Notification quotidienne annulée');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification:', error);
    }
  }

  /**
   * Envoie une notification de test immédiate
   */
  async sendTestNotification(): Promise<void> {
    try {
      const settings = this.getSettings();
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999, // ID temporaire pour le test
            title: 'NuovaLingua - Test',
            body: settings.message || 'Test de notification quotidienne',
            schedule: { at: new Date(Date.now() + 1000) }, // Dans 1 seconde
            sound: 'default',
            actionTypeId: 'OPEN_APP',
            extra: {
              type: 'test_notification'
            }
          }
        ]
      });

      console.log('Notification de test envoyée');
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
   * Met à jour l'heure de la notification quotidienne
   */
  async updateNotificationTime(newTime: string): Promise<void> {
    const settings = this.getSettings();
    if (settings.enabled) {
      await this.scheduleDailyNotification(newTime, settings.message);
    }
    settings.time = newTime;
    this.saveSettings(settings);
  }

  /**
   * Met à jour le message de la notification quotidienne
   */
  async updateNotificationMessage(newMessage: string): Promise<void> {
    const settings = this.getSettings();
    if (settings.enabled) {
      await this.scheduleDailyNotification(settings.time, newMessage);
    }
    settings.message = newMessage;
    this.saveSettings(settings);
  }
} 