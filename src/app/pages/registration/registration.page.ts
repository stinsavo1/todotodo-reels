import { Component, OnInit, ViewChild } from '@angular/core'
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from '../../services/auth.service'
import { CoreService } from 'src/app/services/core.service'
import { NavController } from '@ionic/angular';
import { UsersModeEnum } from '../../enums/users-mode.enum';
import { VerificationService } from '../../services/my-service/verification.service';
import { PartnershipService } from '../../services/my-service/partnership.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PhoneMaskPipe } from '../../pipes/phone-mask.pipe';
import { PromocodesService } from "../../services/my-service/promocodes.service";

interface RegisterForm {
  fullName: FormControl<string | null>,
  phone: FormControl<string | null>,
  email: FormControl<string | null>,
  region: FormControl<number | null>
}

export interface RegisterFormValues {
  fullName: string | null;
  phone: string | null;
  email: string | null;
  mode: string;
  region: number | null;
  idReferral?: string;
}

@Component({
    selector: 'app-pages-registration',
    templateUrl: './registration.page.html',
    styleUrls: ['./registration.page.scss'],
    standalone: false
})
@UntilDestroy()
export class RegistrationPage implements OnInit {
  @ViewChild('modal') modal: any;
  public form!: FormGroup<RegisterForm>;
  public usersMode = UsersModeEnum;
  public email: string | null;
  public idReferral: string;
  public phoneReferral: boolean = false;
  public emailReferral: boolean = false;
  private partner: any;
  public errorPromocode = false;
  public errorTitle: string = '';
  public loader = false;
  public promoCode: string = '';
  public currentPromocode: string;

  constructor(
    public authService: AuthService,
    public core: CoreService,
    private navCtrl: NavController,
    private verificationService: VerificationService,
    private route: ActivatedRoute,
    private partnerShipService: PartnershipService,
    private router: Router,
    private phonePipeService: PhoneMaskPipe,
    private promocodeService: PromocodesService,
  ) {
  }

  ngOnInit() {
    this.email = this.route.snapshot.paramMap.get('email');
    this.idReferral = this.route.snapshot.paramMap.get('referral') || '';
    this.initForm();
  }

  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.core.presentAlert('Регистрация', 'Пожалуйста, заполните все поля')
      return;
    }
    let modalPartnerShip: any = null;
    const modal: any = this.form.getRawValue();
    this.core.presentLoading();
    this.verificationService.registration(modal.email, modal.fullName, modal.phone.toString().replace(/[^0-9+]/g, ''), modal.region, this.idReferral, this.currentPromocode).subscribe({
      next: (result) => {
        this.core.presentAlert('Уведомление', 'Код был отправлен по SMS. Пожалуйста, проверьте ваш телефон.');
        if (this.idReferral) {
          modalPartnerShip = {
            phoneReferral: this.phoneReferral,
            emailReferral: this.emailReferral,
            idReferral: this.idReferral,
            email: this.partner?.email,
            phone: this.partner?.phoneNumber,
            fullName: this.partner?.fio,
            specialization: this.partner?.specialization,
            date: this.partner?.date,
          }
        }
        if (modalPartnerShip) {
          this.authService.savePartnership(result.data, modalPartnerShip);
        }
        this.navCtrl.navigateRoot([
          `/tabs/menu/verification-code/${modal.phone.toString().replace(/[^0-9+]/g, '')}`
        ]);
      },
      error: (error) => {
        this.core.presentAlert('Уведомление', error.details);
      }
    }).add(() => this.core.dismissLoading());
  }

  public back(): void {
    this.navCtrl.navigateRoot('/tabs/menu/registration/auth');
  }

  public agreementPersonalDataPolicy(): void {
    this.navCtrl.navigateForward('/tabs/documents/personal-data-policy');
  }

  public agreementPersonalPolicy(): void {
    this.navCtrl.navigateForward('/tabs/documents/personal-policy');
  }

  private initForm() {
    let email = ''
    let phone = '';
    if (this.email && this.email.indexOf('@') !== -1) {
      email = this.email;
    } else {
      // @ts-ignore
      phone = this.phonePipeService.transform(this.email);
    }
    this.form = new FormGroup({
      fullName: new FormControl<string>('', [Validators.required]),
      email: new FormControl<string>(email, [Validators.required, Validators.email]),
      phone: new FormControl<string>(phone ? phone : '+7', [Validators.required]),
      region: new FormControl<number | null>(null, [Validators.required]),
    })
    if (email) {
      this.form.get('email')?.disable();
      this.partnerShipService.getIdByKeyPartnership(this.idReferral, 'email', email).pipe(untilDestroyed(this)).subscribe((res: any) => {
        if (res) {
          this.partner = res;
          // @ts-ignore
          this.form.get('fullName')?.setValue(res.fio);
          this.emailReferral = true;
        }
      })
    }
    if (phone) {
      this.form.get('phone')?.disable();
      this.partnerShipService.getIdByKeyPartnership(this.idReferral, 'phoneNumber', phone.toString().replace(/[^0-9+]/g, '')).pipe(untilDestroyed(this)).subscribe((res: any) => {
        if (res) {
          this.partner = res;
          // @ts-ignore
          this.form.get('fullName')?.setValue(res.fio);
          this.phoneReferral = true;
        }
      })
    }
  }
  public applyPromocode(): void {
    this.loader = true;
    this.promocodeService.getPromocode(this.promoCode.toUpperCase()).pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (!res) {
        this.errorPromocode = true;
        this.currentPromocode = null;
        this.errorTitle = 'Кажется такого промокода у нас нет. Проверьте написание или попробуйте еще раз.'
      } else {
        if (this.isDateNotInFuture(res.finishDate)) {
          this.errorPromocode = true;
          this.currentPromocode = null;
          this.errorTitle = 'Срок действия промокода истёк.'
        }
        this.currentPromocode = this.promoCode.toUpperCase();
        this.modal.dismiss();
      }
    }).add(() => this.loader = false)
  }

  public removePromocode(): void {
    this.currentPromocode = null;
    this.promoCode = null;
  }

  public openSupport(): void {
    window.location.href = 'https://wa.me/79889770777?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82!%20%D0%9C%D0%BD%D0%B5%20%D0%BD%D1%83%D0%B6%D0%BD%D0%B0%20%D0%BF%D0%BE%D0%BC%D0%BE%D1%89%D1%8C%20%D0%B2%20%D0%B2%D0%B0%D1%88%D0%B5%D0%BC%20%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D0%B5';
  }

  onPromoInput() {
    this.errorTitle = '';
    this.errorPromocode = false;
  }

  isDateNotInFuture(selectedDate: string): boolean {
    const selected = new Date(selectedDate);
    const today = new Date();

    // Убираем время, оставляем только дату (год-месяц-день)
    const selectedDateOnly = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Сравниваем: выбранная дата <= сегодня
    return selectedDateOnly <= todayDateOnly;
  }

}
