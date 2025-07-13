import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  restricted: boolean;
  unknown: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  constructor(private toastCtrl: ToastController) {}

  /**
   * Vérifie et demande la permission d'enregistrement audio
   */
  async checkAndRequestAudioPermission(): Promise<boolean> {
    try {
      // Vérifier si l'API Permissions est supportée
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permission.state === 'granted') {
          return true;
        } else if (permission.state === 'denied') {
          this.showPermissionDeniedToast();
          return false;
        } else if (permission.state === 'prompt') {
          // La permission sera demandée automatiquement par getUserMedia
          return true;
        }
      }
      
      // Fallback pour les navigateurs qui ne supportent pas l'API Permissions
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return true; // On laisse getUserMedia gérer la demande
    }
  }

  /**
   * Vérifie si l'appareil est sur Android
   */
  isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  /**
   * Vérifie si l'appareil est sur iOS
   */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Vérifie si l'appareil est mobile
   */
  isMobile(): boolean {
    return this.isAndroid() || this.isIOS();
  }

  /**
   * Affiche des instructions spécifiques pour Android
   */
  showAndroidInstructions(): void {
    if (this.isAndroid()) {
      this.showToast(
        'Sur Android, assurez-vous d\'autoriser l\'accès au microphone quand demandé. ' +
        'Si la permission a été refusée, allez dans Paramètres > Applications > NuovaLingua > Permissions > Microphone'
      );
    }
  }

  /**
   * Affiche des instructions spécifiques pour iOS
   */
  showIOSInstructions(): void {
    if (this.isIOS()) {
      this.showToast(
        'Sur iOS, assurez-vous d\'autoriser l\'accès au microphone quand demandé. ' +
        'Si la permission a été refusée, allez dans Réglages > Confidentialité > Microphone > NuovaLingua'
      );
    }
  }

  /**
   * Affiche un toast d'erreur de permission refusée
   */
  private showPermissionDeniedToast(): void {
    let message = 'Permission microphone refusée. ';
    
    if (this.isAndroid()) {
      message += 'Allez dans Paramètres > Applications > NuovaLingua > Permissions > Microphone';
    } else if (this.isIOS()) {
      message += 'Allez dans Réglages > Confidentialité > Microphone > NuovaLingua';
    } else {
      message += 'Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.';
    }
    
    this.showToast(message);
  }

  /**
   * Affiche un toast
   */
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 5000,
      position: 'bottom',
      color: 'warning',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    toast.present();
  }
} 