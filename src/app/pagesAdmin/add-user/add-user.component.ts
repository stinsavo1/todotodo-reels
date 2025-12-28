import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CoreService } from "../../services/core.service";
import { VerificationService } from "../../services/my-service/verification.service";
import { AlertController, ToastController } from "@ionic/angular";
import { UserNewRoleEnum, UsersModeEnum } from "../../enums/users-mode.enum";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { removeEmpty, removeEmptyAll } from "../../components/utils/functions";
import { UploadFileService } from "../../services/upload-file.service";
import { AuthService } from "../../services/auth.service";
import { UserService } from "../../services/my-service/user.service";
import { catchError, finalize, from, Observable, of, ReplaySubject, switchMap } from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MapService } from "../../services/map.service";

interface RegisterForm {
  fullName: FormControl<string | null>,
  address: FormControl<string | null>,
  phone: FormControl<string | null>,
  email: FormControl<string | null>,
  region: FormControl<number | null>
  role: FormControl<string | null>
  description: FormControl<string | null>,
  website: FormControl<string | null>,
  nameFactory: FormControl<string | null>,
}

@Component({
    selector: 'app-add-user',
    templateUrl: './add-user.component.html',
    styleUrls: ['./add-user.component.scss'],
    standalone: false
})
@UntilDestroy()
export class AddUserComponent implements OnInit {
  @ViewChild('profileImage', { static: false }) profileImage: ElementRef;
  public searchAddressList$: Observable<{ [key: string]: any }[]>;
  public form!: FormGroup<RegisterForm>;
  private userNewRoleEnum = UserNewRoleEnum;
  public usersModeEnum = UsersModeEnum;
  public userMode: UsersModeEnum;
  public searchAddress$: ReplaySubject<string>;
  public blob: Blob | null;
  public photo: string;
  private uri: string;
  private geometry: any;

  constructor(private core: CoreService,
              private toastCtrl: ToastController,
              private cd: ChangeDetectorRef,
              private uploadService: UploadFileService,
              private alertController: AlertController,
              private userService: UserService,
              private ngZone: NgZone,
              private mapService: MapService,
              private verificationService: VerificationService) {
  }

  ngOnInit() {
    this.searchAddress$ = new ReplaySubject(1);
    this.searchAddressList$ = this.mapService.suggest(this.searchAddress$).pipe(untilDestroyed(this));
    this.form = new FormGroup({
      fullName: new FormControl<string>(''),
      address: new FormControl<string>(''),
      email: new FormControl<string>(''),
      phone: new FormControl<string>('+7', [Validators.required]),
      role: new FormControl<string | null>(null),
      region: new FormControl<number | null>(null),
      description: new FormControl<string>(''),
      website: new FormControl<string>(''),
      nameFactory: new FormControl<string>(''),
    })
  }


  public selectAddress(text: string, uri: string): void {
    this.ngZone.run(() => {
      this.uri = uri;
      this.form.get('address')?.setValue(text);
      this.searchAddress$.next('');
    });
  }

  public onChangeAddress (e: CustomEvent): void {
    this.ngZone.run(() => {
      this.searchAddress$.next(e.detail.value)
    })
  }

  public getUserMode(): void {
    const role = this.form.get("role").value;
    if (role === this.userNewRoleEnum.CLIENT || role === this.userNewRoleEnum.INSTALLER) {
      this.userMode = this.usersModeEnum.USERS;
    } else if (role === this.userNewRoleEnum.PVC
      || role === this.userNewRoleEnum.ALUM
      || role === this.userNewRoleEnum.TREE
      || role === this.userNewRoleEnum.MOSQUITO) {
      this.userMode = this.usersModeEnum.FACTORY
    } else if (role === this.userNewRoleEnum.DELIVERY
      || role === this.userNewRoleEnum.PAINTING
      || role === this.userNewRoleEnum.CLIMBING
      || role === this.userNewRoleEnum.MOVERS
      || role === this.userNewRoleEnum.USED_FRAMES) {
      this.userMode = this.usersModeEnum.SERVICES
    } else if (role === this.userNewRoleEnum.WHOLESALE_STORE) {
      this.userMode = this.usersModeEnum.STORE
    }
  }

  public get nameFactoryText(): string {
    if (this.userMode === UsersModeEnum.AGENCY) {
      return 'Название компании';
    } else if (this.userMode === UsersModeEnum.FACTORY) {
      return 'Название производства';
    } else if (this.userMode === UsersModeEnum.STORE) {
      return 'Название магазина';
    }
    return 'Название';
  }

  public get descriptionText(): string {
    if (this.userMode === UsersModeEnum.USERS || this.userMode === UsersModeEnum.SERVICES) {
      return 'О себе';
    } else if (this.userMode === UsersModeEnum.AGENCY) {
      return 'О компании';
    } else if (this.userMode === UsersModeEnum.FACTORY) {
      return 'О производстве';
    } else if (this.userMode === UsersModeEnum.STORE) {
      return 'О магазине';
    }
    return 'О себе';
  }

  async pickFromGallery() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      source: CameraSource.Photos, // Выбор из галереи
      resultType: CameraResultType.Uri,
      saveToGallery: false,
    });
    if (image.webPath) {
      const response = await fetch(image.webPath);

      if (!response.ok) {
        console.error('Ошибка при получении изображения:', response.statusText);
        return;
      }
      this.photo = null;
      this.cd.detectChanges();
      this.blob = await response.blob();
      this.photo = URL.createObjectURL(this.blob);
      this.cd.detectChanges();
    } else {
      console.error('webPath не был получен.');
    }
  }

  public register(): void {
    if (!this.isPhoneValid()) return;

    const modal: any = this.form.getRawValue();
    this.core.presentLoading();

    from(this.getGeometryIfNeeded(modal)).pipe(
      switchMap((geometry) => {
        const params = {
          email: modal.email,
          fio: modal.fullName,
          phone: modal.phone.toString().replace(/[^0-9+]/g, ''),
          region: modal.region,
          description: modal.description,
          callNotification: true,
          emailNotification: true,
          nameFactory: modal.nameFactory,
          website: modal.website,
          role: modal.role,
          mode: this.userMode,
          address: modal.address,
          geometry: geometry
        };

        return this.verificationService.simpleRegistration(removeEmptyAll(params)).pipe(
          switchMap((res) => {
            this.presentCustomAlert(res.data.url);

            if (this.blob) {
              return from(this.uploadService.saveFileToStorage(this.blob)).pipe(
                switchMap((url) => {
                  return from(this.userService.updateUserPhoto(res.data.uid, url)).pipe(
                    switchMap(() => {
                      this.blob = null;
                      this.photo = null;
                      return of(null);
                    })
                  );
                }),
                catchError((uploadError) => {
                  console.error('Ошибка загрузки файла:', uploadError);
                  return of(null);
                })
              );
            }

            return of(null);
          })
        );
      }),
      finalize(() => {
        this.form.reset();
        this.photo = null;
        this.userMode = null;
        this.uri = null;
        this.geometry = null;
        this.core.dismissLoading();
      }),
      untilDestroyed(this)
    ).subscribe({
      error: (error) => {
        this.core.presentAlert('Регистрация', error.details || 'Произошла ошибка');
      }
    });
  }

// Выносим логику получения геометрии в отдельный метод
  private async getGeometryIfNeeded(modal: any): Promise<any> {
    if (modal?.address) {
      if (this.uri) {
        return await this.mapService.geoCoderURI(this.uri);
      } else {
        return await this.mapService.geoCoder(modal.address);
      }
    }
    return null;
  }

  private isPhoneValid(): boolean {
    const phone = this.form.get('phone')?.value?.trim();
    if (!phone || phone.length < 10) {
      this.core.presentAlert('Регистрация', 'Введите корректный номер телефона');
      return false;
    }

    return true;
  }

  async presentCustomAlert(url: string) {
    const alert = await this.alertController.create({
      header: 'Уведомление',
      message: 'Пользователь успешно создан. Что хотите сделать?',
      buttons: [
        {
          text: 'Скопировать ссылку',
          handler: () => {
            navigator.clipboard.writeText(url).then(() => {
              this.presentToast('Ссылка скопирована');
            });
          }
        },
        {
          text: 'Поделиться',
          handler: () => {
            if (navigator.share) {
              navigator.share({
                title: 'Приглашение',
                text: 'Присоединяйся к платформе!',
                url: url,
              }).catch((error) => {
                console.error('Ошибка шаринга:', error);
              });
            } else {
              this.presentToast('Функция шаринга не поддерживается');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async presentToast(text: string) {
    const toast = await this.toastCtrl.create({
      message: text,
      duration: 1500,
      position: 'top',
    });

    await toast.present();
  }
}
