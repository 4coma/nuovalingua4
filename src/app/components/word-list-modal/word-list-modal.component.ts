import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { WordMastery } from '../../services/vocabulary-tracking.service';

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

  constructor(private modalController: ModalController) {}

  close() {
    this.modalController.dismiss();
  }
} 