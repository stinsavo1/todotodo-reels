import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
    selector: 'app-edit-comment-modal',
    template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{title}}</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">Отмена</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [strong]="true">Сохранить</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-item>
        <ion-label position="stacked">Пометка</ion-label>
        <ion-textarea [(ngModel)]="comment"></ion-textarea>
      </ion-item>
    </ion-content>
  `,
    standalone: false
})
export class EditCommentModalComponent {
  public comment: string = '';
  public title!: string;

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  save() {
    this.modalCtrl.dismiss(this.comment);
  }
}
