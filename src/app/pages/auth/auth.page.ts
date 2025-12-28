import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { VerificationService } from '../../services/my-service/verification.service';
import { CoreService } from '../../services/core.service';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.page.html',
    styleUrls: ['./auth.page.scss'],
    standalone: false
})
export class AuthPage implements OnInit {
  public phoneNumber: string = '+7';
  constructor(private verificationService: VerificationService,
              private core: CoreService,
              private navCtrl: NavController) {}

  ngOnInit() {
  }

  public login(): void {
    if (this.phoneNumber) {
      const phoneNumber = this.phoneNumber.toString().replace(/[^0-9+]/g, '');
      this.core.presentLoading();
      this.verificationService.sendCodeByEmail(phoneNumber).subscribe({
        next: () => {
          this.core.presentAlert('Уведомление', 'Код авторизации был отправлен на ваш email. Пожалуйста, проверьте почту.');
          this.navCtrl.navigateRoot(`/tabs/menu/verification-code-email/${phoneNumber}`);
        },
        error: (error) => {
          this.core.presentAlert('Уведомление', error.details);
        }
      }).add(() => {
        this.core.dismissLoading();
      })
    } else {
      this.core.presentAlert('Авторизация', 'Пожалуйста, введите номер телефона')
    }

  }

  public register(): void {
    this.navCtrl.navigateRoot('/tabs/menu/registration');
  }

  public back(): void {
    this.navCtrl.navigateRoot('/tabs/menu');
  }
}
