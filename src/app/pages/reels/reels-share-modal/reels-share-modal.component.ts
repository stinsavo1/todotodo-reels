import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { switchMap, take } from 'rxjs';
import { ShareService } from '../services/share.service';

@Component({
  selector: 'app-reels-share-modal',
  templateUrl: './reels-share-modal.component.html',
  styleUrls: ['./reels-share-modal.component.scss'],
  standalone:false,
})
export class ReelsShareModalComponent  implements OnInit {
  @Input() videoUrl!: string;

  constructor(private shareService:ShareService, private modalCtrl:ModalController) { }

  ngOnInit() {}

  onAction(platform: string) {
    const action$ = platform === 'copy'
      ? this.shareService.copyToClipboard$(this.videoUrl)
      : this.shareService.openSocial$(platform, this.videoUrl);

    action$.pipe(
      switchMap(async () => {
        const modal = await this.modalCtrl.getTop();
        if (modal) return this.modalCtrl.dismiss();
        return null;
      }),
      take(1)).subscribe({
      next: (dismissed) => {

      },
      error: (err) => console.error('Flow failed', err)
    });

  }
}
