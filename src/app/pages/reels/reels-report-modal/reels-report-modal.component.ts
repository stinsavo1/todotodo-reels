import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { ModalController, ToastController } from '@ionic/angular';
import { Reel, TELEGRAM_CHAT_ID, TELEGRAM_TOKEN } from '../interfaces/reels.interface';

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
    '4':'Опасные товары',
    '5':'Преследование или нарушение конфиденциальности',
    '6':'Сцены насилия',
    '7':'Нарушение авторского права'
  };
isSending = false;

  constructor(private modalCtrl: ModalController,
              private http: HttpClient,
              private auth:Auth,
              private functions: Functions,private toastCtrl: ToastController,) {
  }

  ngOnInit() {
  }

  public close(): void {
    this.modalCtrl.dismiss().then();
  }

  async sendReport() {
    if (!this.selectedReason) return;
    this.isSending = true;
    // const sendToTelegramFn = httpsCallable(this.functions, 'sendToTelegram');
    //
    // try {
    //   // 2. Вызываем функцию и передаем данные
    //   const result = await sendToTelegramFn({
    //     reason: this.selectedReason,
    //     videoId: this.video.id,
    //      phone:this.auth.currentUser.phoneNumber
    //   });
    //
    //   console.log('Ответ сервера:', result.data);
    //
    //   this.showToast('Жалоба отправлена. Спасибо!', 'success').then();
    //   this.modalCtrl.dismiss({ confirmed: true }).then();
    //
    // } catch (error) {
    //   console.error('Ошибка при отправке:', error);
    //   this.showToast('Не удалось отправить жалобу. Попробуйте позже.', 'danger').then();
    // } finally {
    //   // this.isSending = false;
    // }
      const token = TELEGRAM_TOKEN;
      const chatId = TELEGRAM_CHAT_ID;
      const message = `Жалоба от пользователя ${this.auth.currentUser.phoneNumber} на видео ${this.video.id} ${this.resonsForReporting[this.selectedReason]}`;

      const url = `https://api.telegram.org/bot${token}/sendMessage`;

      this.http.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }).subscribe({
        next: (res) => this.showToast('Ваша жалоба отправлена'),
        error: (err) => this.showToast('При отправке произошла ошибка ')
      });

  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }



  protected readonly Object = Object;
}
