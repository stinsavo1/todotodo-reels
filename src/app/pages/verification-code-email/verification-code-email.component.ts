import { Component, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { NavController, ViewDidLeave, ViewWillEnter } from '@ionic/angular';
import { CoreService } from '../../services/core.service';
import { VerificationService } from '../../services/my-service/verification.service';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-verification-code-email',
    templateUrl: './verification-code-email.component.html',
    styleUrls: ['./verification-code-email.component.scss'],
    standalone: false
})
@UntilDestroy()
export class VerificationCodeEmailComponent implements ViewDidLeave, ViewWillEnter {
  @ViewChildren('input') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  public code: string[] = ['', '', '', ''];
  public remainingSeconds = 120; // 2 минуты
  public isSending = false;
  public timer: any;
  public errorText: string;
  public isError = false;
  private phoneNumber: string;
  public email: string;

  constructor(private navCtrl: NavController,
              private verificationService: VerificationService,
              private route: ActivatedRoute,
              private authService: AuthService,
              private core: CoreService) {}

  ionViewWillEnter() {
    this.isSending = true;
    this.startTimer();
    this.phoneNumber = this.route.snapshot.params['phoneNumber'];
    this.authService.usersWithPhone(this.phoneNumber).subscribe((res) => {
      this.email = res[0]['email'];
    })
  }

  ionViewDidLeave() {
    this.resetTimer();
    this.code = ['', '', '', ''];
    this.isError = false;
  }

  public back(): void {
    this.navCtrl.navigateRoot('/tabs/map/registration/auth');
  }

  public get formattedTime(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  public handleInput(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    // Ограничение на 1 символ
    if (value.length > 1) {
      this.code[index] = value.slice(0, 1);
      target.value = this.code[index];
    }

    // Автоматический переход
    if (value.length === 1) {
      this.isError = false;
      if (index < 3) { // Не последний input
        setTimeout(() => {
          this.inputs.toArray()[index + 1].nativeElement.focus();
        }, 0);
      } else { // Последний input
        setTimeout(() => {
          this.inputs.toArray()[index].nativeElement.blur(); // Сброс фокуса
          this.verifyAndLogin();
        }, 0);
      }
    } else if (value.length === 0 && index > 0) { // Удаление символа
      setTimeout(() => {
        this.inputs.toArray()[index - 1].nativeElement.focus();
      }, 0);
    }
  }

  public resendCode(): void {
    if (!this.isSending) {
      this.isSending = true;
      this.startTimer();
      this.core.presentAlert('Уведомление', 'Новый код подтверждения отправлен на ваш email. Пожалуйста, проверьте почту.');
      this.isError = false;
      this.verificationService.sendCodeByEmail(this.phoneNumber).pipe(untilDestroyed(this)).subscribe();
    }
  }

  public verifyAndLogin(): void {
    if (this.code.join('').length === 4) {
      this.core.presentLoading();
      this.verificationService.verifyCode(this.phoneNumber, this.code.join('')).pipe(untilDestroyed(this)).subscribe({
        next: () => {
        },
        error: err => {
          this.isError = true;
          this.errorText = err.message;
        }
      }).add(() => this.core.dismissLoading());
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        this.resetTimer();
      }
    }, 1000);
  }

  private resetTimer(): void {
    clearInterval(this.timer);
    this.remainingSeconds = 120;
    this.isSending = false;
  }
}
