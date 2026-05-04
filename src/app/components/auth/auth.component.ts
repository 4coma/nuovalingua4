import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { FirebaseSyncService } from '../../services/firebase-sync.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class AuthComponent implements OnInit, OnDestroy {
  pageTitle: string = 'Connexion / Inscription';

  authMode: AuthMode = 'login';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  firebaseConfigured: boolean = false;
  firebaseProjectId: string = '';
  firebaseConfigSource: 'embedded' | 'legacy' | 'none' = 'none';
  firebaseUserUid: string = '';
  firebaseUserEmail: string = '';
  firebaseUserIsAnonymous: boolean = false;

  private firebaseAuthSubscription: Subscription | null = null;

  constructor(
    private firebaseSync: FirebaseSyncService,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.refreshFirebaseState();
    this.firebaseAuthSubscription = this.firebaseSync.authUser$.subscribe(user => {
      this.firebaseUserUid = user?.uid || '';
      this.firebaseUserEmail = user?.email || '';
      this.firebaseUserIsAnonymous = !!user?.isAnonymous;

      if (user) {
        void this.router.navigate(['/home']);
      }
    });
  }

  ngOnDestroy() {
    if (this.firebaseAuthSubscription) {
      this.firebaseAuthSubscription.unsubscribe();
      this.firebaseAuthSubscription = null;
    }
  }

  onModeChange(event: any) {
    const value = event?.detail?.value;
    this.authMode = value === 'register' ? 'register' : 'login';
  }

  async navigateToPreferences() {
    await this.router.navigate(['/preferences']);
  }

  async submitAuth() {
    if (this.authMode === 'register') {
      await this.register();
      return;
    }
    await this.login();
  }

  async login() {
    if (!await this.ensureFirebaseReadyForAuth()) return;

    const email = this.email.trim().toLowerCase();
    if (!email || !this.password) {
      await this.showToast('Email et mot de passe requis.', 'warning');
      return;
    }

    try {
      await this.firebaseSync.loginWithEmailPassword(email, this.password);
      this.password = '';
      await this.showToast('Connexion réussie.', 'success');
    } catch (error) {
      console.error('Erreur connexion Firebase:', error);
      await this.showToast(this.getFirebaseAuthErrorMessage(error), 'danger');
    }
  }

  async register() {
    if (!await this.ensureFirebaseReadyForAuth()) return;

    const email = this.email.trim().toLowerCase();
    if (!email || !this.password) {
      await this.showToast('Email et mot de passe requis.', 'warning');
      return;
    }

    if (this.password.length < 6) {
      await this.showToast('Le mot de passe doit contenir au moins 6 caractères.', 'warning');
      return;
    }

    if (this.password !== this.confirmPassword) {
      await this.showToast('Les mots de passe ne correspondent pas.', 'warning');
      return;
    }

    try {
      await this.firebaseSync.registerWithEmailPassword(email, this.password);
      this.password = '';
      this.confirmPassword = '';
      await this.showToast('Compte créé et connecté.', 'success');
    } catch (error) {
      console.error('Erreur création compte Firebase:', error);
      await this.showToast(this.getFirebaseAuthErrorMessage(error), 'danger');
    }
  }

  async loginAnonymously() {
    if (!await this.ensureFirebaseReadyForAuth()) return;

    try {
      await this.firebaseSync.loginAnonymously();
      await this.showToast('Session anonyme ouverte.', 'success');
    } catch (error) {
      console.error('Erreur connexion anonyme Firebase:', error);
      await this.showToast(this.getFirebaseAuthErrorMessage(error), 'danger');
    }
  }

  async sendPasswordReset() {
    if (!await this.ensureFirebaseReadyForAuth()) return;

    const email = this.email.trim().toLowerCase();
    if (!email) {
      await this.showToast('Saisissez votre email pour recevoir un lien de réinitialisation.', 'warning');
      return;
    }

    try {
      await this.firebaseSync.sendPasswordReset(email);
      await this.showToast('Email de réinitialisation envoyé.', 'success');
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe Firebase:', error);
      await this.showToast(this.getFirebaseAuthErrorMessage(error), 'danger');
    }
  }

  async logout() {
    try {
      await this.firebaseSync.logout();
      await this.router.navigate(['/auth']);
      await this.showToast('Déconnexion effectuée.', 'success');
    } catch (error) {
      console.error('Erreur déconnexion Firebase:', error);
      await this.showToast('Erreur lors de la déconnexion Firebase.', 'danger');
    }
  }

  private refreshFirebaseState() {
    this.firebaseConfigured = this.firebaseSync.isFirebaseConfigured();
    this.firebaseProjectId = this.firebaseSync.getConfiguredProjectId();
    this.firebaseConfigSource = this.firebaseSync.getConfigSource();
  }

  private async ensureFirebaseReadyForAuth(): Promise<boolean> {
    this.refreshFirebaseState();

    if (!this.firebaseConfigured) {
      await this.showToast('Configuration Firebase manquante côté application.', 'warning');
      return false;
    }

    await this.firebaseSync.reinitialize();
    return true;
  }

  private getFirebaseAuthErrorMessage(error: unknown): string {
    const message = (error as any)?.message || '';
    if (message.includes('auth/invalid-email')) return 'Adresse email invalide.';
    if (message.includes('auth/missing-password')) return 'Mot de passe manquant.';
    if (message.includes('auth/weak-password')) return 'Mot de passe trop faible (6 caractères minimum).';
    if (message.includes('auth/email-already-in-use')) return 'Cet email est déjà utilisé.';
    if (message.includes('auth/invalid-credential')) return 'Identifiants invalides.';
    if (message.includes('auth/user-not-found')) return 'Aucun compte trouvé pour cet email.';
    if (message.includes('auth/wrong-password')) return 'Mot de passe incorrect.';
    if (message.includes('auth/operation-not-allowed')) return 'Méthode de connexion non activée dans Firebase Auth.';
    if (message.includes('auth/too-many-requests')) return 'Trop de tentatives. Réessayez plus tard.';
    return `Erreur d'authentification: ${(error as Error)?.message || 'inconnue'}`;
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}
