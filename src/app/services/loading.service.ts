import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loading: HTMLIonLoadingElement | null = null;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  /**
   * Affiche un loader avec un message
   */
  async showLoading(message: string = 'Chargement...'): Promise<void> {
    // Si un loader est déjà affiché, le fermer d'abord
    if (this.loading) {
      await this.hideLoading();
    }

    this.loading = await this.loadingCtrl.create({
      message: message,
      spinner: 'crescent',
      backdropDismiss: false // Empêche la fermeture par clic sur l'arrière-plan
    });
    
    this.isLoadingSubject.next(true);
    await this.loading.present();
  }

  /**
   * Cache le loader actuel
   */
  async hideLoading(): Promise<void> {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
    this.isLoadingSubject.next(false);
  }

  /**
   * Affiche un message d'erreur
   */
  async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  /**
   * Affiche un message de succès
   */
  async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  /**
   * Force la fermeture de tous les loaders (en cas d'urgence)
   */
  async forceHideAll(): Promise<void> {
    // Fermer le loader principal
    if (this.loading) {
      await this.hideLoading();
    }
    
    // Fermer tous les autres loaders potentiels
    const topLoader = await this.loadingCtrl.getTop();
    if (topLoader) {
      await topLoader.dismiss();
    }
    
    this.isLoadingSubject.next(false);
  }

  /**
   * Vérifie si un loader est actuellement affiché
   */
  isCurrentlyLoading(): boolean {
    return this.isLoadingSubject.value;
  }
} 