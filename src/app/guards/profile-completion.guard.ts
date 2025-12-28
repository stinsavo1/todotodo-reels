import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UserStoreService } from '../services/store-service/user-store.service';
import { UsersModeEnum } from '../enums/users-mode.enum';
import { AuthService } from "../services/auth.service";
import { filter, switchMap, tap } from "rxjs";
import { delay, first } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionGuard implements CanActivate {

  private readonly userModeEnum = UsersModeEnum;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<any> {
    this.authService.authState$
      .pipe(
        delay(1000),
        // Ждём, пока uid будет не null/undefined
        filter(() => !!this.authService.uid),

        // Делаем один запрос на получение пользователя
        switchMap(() => this.authService.get(this.authService.uid)),

        // Проверяем, что пользователь существует
        filter((user: any) => !!user),

        // Валидируем профиль
        tap((user: any) => {
          const isFactoryAgencyOrStore =
            user.mode === this.userModeEnum.FACTORY ||
            user.mode === this.userModeEnum.AGENCY ||
            user.mode === this.userModeEnum.STORE;

          if (isFactoryAgencyOrStore) {
            if (!user.address || user.region === undefined || !user.phone || !user.fio || !user.nameFactory || !user.role) {
              throw new Error('Incomplete profile: factory/agency/store');
            }
          } else {
            if (!user.address || user.region === undefined || !user.phone || !user.fio || !user.role) {
              throw new Error('Incomplete profile: other mode');
            }
          }
        }),
      )
      .subscribe({
        error: async (err) => {
          if (err.message.includes('Incomplete profile')) {
            await this.presentAlertAndRedirect();
          } else {
            await this.presentAlertAndRedirectAuth();
          }
        },
      });
  }

  private async presentAlertAndRedirectAuth(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Авторизация',
      message: 'Функция доступна только для зарегистрированных пользователей. Пожалуйста, зарегистрируйтесь или войдите в систему, чтобы продолжить.',
      backdropDismiss: false, // Запрещаем закрытие кликом на фон
      buttons: [
        {
          text: 'OK',
          handler: () => {
            // Переходим на страницу профиля
            this.router.navigate(['tabs/menu/registration/auth']).then();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private async presentAlertAndRedirect(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Пожалуйста, заполните профиль',
      message: 'Для продолжения необходимо заполнить профиль.',
      backdropDismiss: false, // Запрещаем закрытие кликом на фон
      buttons: [
        {
          text: 'OK',
          handler: () => {
            // Переходим на страницу профиля
            this.router.navigate(['/tabs/menu/my-profile']).then(() => {
              console.log('Переход на страницу профиля выполнен.');
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }
}
