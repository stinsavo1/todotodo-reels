import { Injectable, NgZone } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { ModalController, PopoverController, ToastController } from '@ionic/angular';
import { catchError, from, Observable, of, switchMap, take, tap } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Reel } from '../interfaces/reels.interface';
import { ReelsShareModalComponent } from '../reels-share-modal/reels-share-modal.component';
import { ToastService } from './toast.service';

export interface ShareResult {
  shared: boolean;
  platform?: 'copy' | 'telegram' | 'whatsapp';
}
@Injectable()
export class ShareService {
  constructor (private toast: ToastService,
               private zone:NgZone,
               private modalCtrl:ModalController, private popoverCtrl:PopoverController){}

  openSocial$(platform: string, url: string): Observable<boolean> {
    const encodedUrl = encodeURIComponent(url);
    let shareUrl = '';
    switch (platform) {
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodedUrl}`;
        break;
      case 'vk':
        shareUrl = `https://vk.com/share.php?url=${encodedUrl}`;
        break;

    }

    if (!shareUrl) return of(false);

    return from(Browser.open({ url: shareUrl })).pipe(switchMap(()=>of(true)),
      catchError(err => {
        console.error('Could not open social link', err);
        return of(false);
      })
    );
  }

  copyToClipboard$(text: string): Observable<boolean> {
    return from(Clipboard.write({ string: text })).pipe(
      switchMap(() =>
        this.toast.showIonicToast('Ссылка скопирована').pipe(
          map(() => true)
        )
      ),
      catchError(() => of(false))
    );
  }

  openShareSheet$(video: Reel): Observable<any> {
    return from(this.modalCtrl.create({
      component: ReelsShareModalComponent,
      cssClass: 'share-modal',
      componentProps: {
        videoUrl: video.url,
      }
    })).pipe(
      switchMap(modal =>
        from(modal.present()).pipe(
          switchMap(() => from(modal.onDidDismiss<ShareResult>())),
          map(result => result.data ?? null),
          take(1)
        )
      )
    );
  }


  shareLink(url: string) {

    return from(Share.share({
      title: 'Поделиться ссылкой?',
      text: '',
      url: url,
      dialogTitle: 'Поделиться ссылкой',
    }));
  }


}
