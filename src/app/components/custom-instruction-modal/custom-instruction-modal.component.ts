import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-instruction-modal',
  templateUrl: './custom-instruction-modal.component.html',
  styleUrls: ['./custom-instruction-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class CustomInstructionModalComponent {
  customInstruction: string = '';

  constructor(private modalController: ModalController) {}

  confirm() {
    this.modalController.dismiss({
      instruction: this.customInstruction.trim()
    });
  }

  cancel() {
    this.modalController.dismiss();
  }
} 