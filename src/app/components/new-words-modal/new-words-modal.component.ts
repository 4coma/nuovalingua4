import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { DictionaryWord } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-new-words-modal',
  templateUrl: './new-words-modal.component.html',
  styleUrls: ['./new-words-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class NewWordsModalComponent {
  @Input() words: DictionaryWord[] = [];

  constructor(private modalController: ModalController) {}

  close() {
    this.modalController.dismiss(false);
  }

  startRevision() {
    this.modalController.dismiss(true);
  }
}

