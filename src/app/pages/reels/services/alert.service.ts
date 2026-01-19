import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private router:Router, private alertController:AlertController) {
  }


  async authAlert() {
    const alert = await this.alertController.create({
      header: 'Внимание',
      message: 'Эти действия доступны только авторизованным пользователям',
      buttons: [
        { text: 'Отмена', role: 'cancel' },
        { text: 'Авторизоваться', handler: () => this.router.navigateByUrl('/tabs/menu/registration/auth') }
      ],
    });

    await alert.present();
  }

}
