import { Component, Input } from '@angular/core';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { VocabularyTrackingService, WordMastery } from '../../services/vocabulary-tracking.service';
import { EditTrackedWordModalComponent } from './edit-tracked-word-modal.component';

@Component({
  selector: 'app-word-list-modal',
  templateUrl: './word-list-modal.component.html',
  styleUrls: ['./word-list-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class WordListModalComponent {
  @Input() title: string = '';
  @Input() words: WordMastery[] = [];
  constructor(
    private modalController: ModalController,
    private vocabService: VocabularyTrackingService,
    private toastController: ToastController
  ) {}

  close() {
    this.modalController.dismiss();
  }

  async editWord(word: WordMastery) {
    const modal = await this.modalController.create({
      component: EditTrackedWordModalComponent,
      componentProps: { word: { ...word } }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      const updated = this.vocabService.updateTrackedWord(word.id, data.word, data.translation);
      if (updated) {
        word.word = data.word;
        word.translation = data.translation;
        this.showToast('Mot mis à jour');
      } else {
        this.showToast('Erreur lors de la mise à jour', 'danger');
      }
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}