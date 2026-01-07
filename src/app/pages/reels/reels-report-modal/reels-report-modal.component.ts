import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import { connectFunctionsEmulator, Functions, httpsCallable } from '@angular/fire/functions';
import { ModalController, ToastController } from '@ionic/angular';
import { catchError, switchMap } from 'rxjs';
import { Reel, TELEGRAM_CHAT_ID, TELEGRAM_TOKEN } from '../interfaces/reels.interface';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-reels-report-modal',
  templateUrl: './reels-report-modal.component.html',
  styleUrls: ['./reels-report-modal.component.scss'],
  standalone: false
})
export class ReelsReportModalComponent implements OnInit {
  @Input() video!: Reel;
  public selectedReason: string;
  resonsForReporting = {
    '0': 'Содержимое сексуального характера',
    '1': 'Членовредительство',
    '2': 'Ложная информация',
    '3': 'Агрессивные действия',
    '4': 'Опасные товары',
    '5': 'Преследование или нарушение конфиденциальности',
    '6': 'Сцены насилия',
    '7': 'Нарушение авторского права'
  };
  isSending = false;
  protected readonly Object = Object;
  private readonly destroyRef = inject(DestroyRef);

  constructor(private modalCtrl: ModalController,
              private http: HttpClient,
              private auth: Auth,
              private toastService: ToastService,
              private functions: Functions, private toastCtrl: ToastController,) {
  }

  ngOnInit() {
  }

  public close(): void {
    this.modalCtrl.dismiss().then();
  }

  async sendReport() {
    if (!this.selectedReason) return;
    this.isSending = true;
    const sendToTelegramFn = httpsCallable(this.functions, 'sendToTelegram');
    try {
      const result = await sendToTelegramFn({
        reason: this.resonsForReporting[this.selectedReason],
        videoId: this.video.id,
        phone: this.auth.currentUser.phoneNumber
      });


      this.toastService.showIonicToast('Жалоба отправлена. Спасибо!').subscribe();
      this.modalCtrl.dismiss({ confirmed: true }).then();

    } catch (error) {
      console.error('Ошибка при отправке:', error);
      this.toastService.showIonicToast('Не удалось отправить жалобу. Попробуйте позже.').subscribe();
    } finally {
      this.isSending = false;
    }
    //   const token = TELEGRAM_TOKEN;
    //   const chatId = TELEGRAM_CHAT_ID;
    //   const message = `Жалоба от пользователя ${this.auth.currentUser.phoneNumber} на видео ${this.video.id} ${this.resonsForReporting[this.selectedReason]}`;
    //
    //   const url = `https://api.telegram.org/bot${token}/sendMessage`;
    //
    //   this.http.post(url, {
    //     chat_id: chatId,
    //     text: message,
    //     parse_mode: 'HTML'
    //   }).pipe(
    //     switchMap(() => this.toastService.showIonicToast('Ваша жалоба отправлена')),
    //     catchError(() =>
    //       this.toastService.showIonicToast('При отправке произошла ошибка')
    //     ),
    //     takeUntilDestroyed(this.destroyRef)
    //   ).subscribe();
    //
    // }

  }
}
