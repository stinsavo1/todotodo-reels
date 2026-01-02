import { Component, Input, OnInit } from '@angular/core';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular';
import { Reel } from '../interfaces/reels.interface';

@Component({
  selector: 'app-reels-additional-actions',
  templateUrl: './reels-additional-actions.component.html',
  styleUrls: ['./reels-additional-actions.component.scss'],
  standalone:false,
})
export class ReelsAdditionalActionsComponent  implements OnInit {

  @Input() video: Reel;

  constructor(
    private modalCtrl: ModalController,
  ) {}

  ngOnInit(): void {
    }



  async onHideClick() {
    await this.modalCtrl.dismiss({ action: 'open_hide_details' });
  }



  async reportVideo() {
    this.modalCtrl.dismiss({ action: 'open_report_details' }).then();
  }

  public close(): void {
    this.modalCtrl.dismiss().then();
  }
}
