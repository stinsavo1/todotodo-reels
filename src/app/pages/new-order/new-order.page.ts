import { Component, NgZone, OnInit, ViewChild } from '@angular/core'
import { Observable, of, ReplaySubject, switchMap } from 'rxjs'
import { MapService } from 'src/app/services/map.service'
import { OrdersService } from 'src/app/services/orders.service'
import { AuthService } from '../../services/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OrderTypeEnum } from '../../enums/order-type.enum';
import { FormUpload2Component } from '../../components/form-upload2/form-upload2.component';
import { UsersModeEnum } from '../../enums/users-mode.enum';
import { AddressInterface } from '../../interfaces/address.interface';
import { OrderRequestInterface } from '../../interfaces/order-request.interface';
import { FileInterface } from '../../interfaces/file.interface';
import {
  findAndValidatePhone,
  formatDate
} from '../../components/utils/functions';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UserStoreService } from '../../services/store-service/user-store.service';
import { CoreService } from '../../services/core.service';

@Component({
    selector: 'app-new-order',
    templateUrl: './new-order.page.html',
    styleUrls: ['./new-order.page.scss'],
    standalone: false
})

@UntilDestroy()
export class NewOrderPage implements OnInit {
  @ViewChild('uploadComponent') uploadComponent!: FormUpload2Component;

  public item: OrderRequestInterface;
  public searchAddressList$: Observable<AddressInterface[]>;
  public showToast: boolean = false;
  public orderTypeEnum = OrderTypeEnum;
  public selectedOrderType: OrderTypeEnum;
  public hasError: boolean = false;
  public isLoading = false;
  public isAddressSelected: boolean = false;
  public errorMessage: string = 'Пожалуйста, заполните все обязательные поля'
  public customInterfaceOptions = {
    header: 'Выберите форму оплаты',
  };
  public title = 'Создать заказ';
  public usersMode = UsersModeEnum;

  public dateFilter = (date: Date | null): boolean => {
    const today = new Date();
    // Сравнение только по дате (без учета времени)
    today.setHours(0, 0, 0, 0);
    return date ? date >= today : false;
  };


  private searchAddress$: ReplaySubject<string>;
  constructor (
    public orderService: OrdersService,
    private core: CoreService,
    public mapService: MapService,
    public ngZone: NgZone,
    private authService: AuthService,
    private alertController: AlertController,
    private userStoreService: UserStoreService,
    private router: Router,
  ) {
  }

  ngOnInit() {
    this.selectedOrderType = this.orderTypeEnum.MOUNTING;
    this.item = {
      orderDate: formatDate(new Date().toDateString()),
      type: OrderTypeEnum.MOUNTING,
      payType: '',
      phone: '+7'
    };
    this.subAddress();
    this.getUser();
  }

  public selectOrderType(orderType: OrderTypeEnum): void {
    this.selectedOrderType = orderType;
    this.item.type = this.selectedOrderType;
  }

  public photoFilesChange(value: string[]): void {
    this.item.photo = value;
  }

  public fileListChange(value: FileInterface[]): void {
    this.item.files = value;
  }

  public onChangeAddress(e: CustomEvent): void {
    this.ngZone.run(() => {
      this.searchAddress$.next(e.detail.value)
      this.isAddressSelected = false;
    })
  }

  public onFocus(event: FocusEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).blur();
  }

  public openUploadPhoto(event: Event): void {
    event.stopPropagation();
    // Программный вызов метода для открытия галереи
    const inputElement = this.uploadComponent.fileInput?.nativeElement;
    if (inputElement) {
      this.uploadComponent.addFilesFake(new MouseEvent('click'), inputElement);
    }
  }

  public selectAddress(item: OrderRequestInterface, text: string, uri: string): void {
    this.ngZone.run(() => {
      item.address = text
      this.searchAddress$.next('')
      item.uri = uri
      this.isAddressSelected = true;
    })
  }

  public closeToast(): void {
    this.showToast = false;
  }

  public onSubmit(): void {
    if (this.item?.description) {
      if (findAndValidatePhone(this.item.description)) {
        this.core.presentAlert(
          `Уведомление`,
          `Размещение контактной информации в комментариях запрещено! \n` +
          `Повторная попытка указать данные для связи может привести к блокировке аккаунта.`,
          ['Закрыть']
        );
        return;
      }
    }
    // const user = this.userStoreService.getUserValue();
    // if (!user.address || user.region === undefined) {
    //   this.presentAlertUser();
    //   return;
    // }
    if (this.item.mode === this.usersMode.AGENCY) {
      // Только для рекламного агенства
      if (!this.item.orderDate || !this.item.description || !this.item.phone
        || !this.item.address || this.item.price === undefined || this.item.price === null) {
        this.hasError = true;
        this.showToast = true;
        return;
      }
    } else {
      this.hasError = false;
      this.showToast = false;
      if (!this.item.orderDate || this.item.payType === undefined || this.item.payType === ''
        || !this.item.address || this.item.price === undefined || this.item.price === null) {
        this.hasError = true;
        this.showToast = true;
        return;
      }
    }
    if (!this.isAddressSelected) {
      this.showToast = true;
      this.hasError = true;
      this.errorMessage = 'Пожалуйста, выберите адрес'
      return;
    }
    this.isLoading = true;
    if (this.item.mode !== this.usersMode.AGENCY) {
      delete this.item.phone;
    }
    this.item.orderDate = formatDate(this.item.orderDate);
    this.orderService.sentOrder(this.item).then(() => {
      this.presentAlert();
    });
  }

  private async presentAlertUser() {
    const alert = await this.alertController.create({
      header: 'Пожалуйста, заполните профиль',
      message: 'Для продолжения необходимо заполнить профиль.',
      backdropDismiss: true, // Позволяет закрывать алерт кликом на фон
      buttons: [
        {
          text: 'ОК',
          handler: () => {
            this.router.navigate(['/tabs/menu/my-profile']);
          }
        }
      ]
    });

    // Отслеживаем, как алерт был закрыт
    alert.onDidDismiss().then((result) => {
      if (result.role === 'backdrop') {
        this.router.navigate(['/tabs/menu/my-profile']);
      }
    });

    await alert.present();
  }

  private async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Заказ размещен.',
      message: '',
      backdropDismiss: true, // Позволяет закрывать алерт кликом на фон
      buttons: [
        {
          text: 'ОК',
          handler: () => {
           this.isLoading = false;
           this.router.navigate(['/tabs/map']);
          }
        }
      ]
    });

    // Отслеживаем, как алерт был закрыт
    alert.onDidDismiss().then((result) => {
      if (result.role === 'backdrop') {
        this.isLoading = false;
        this.router.navigate(['/tabs/map']);
      }
    });

    await alert.present();
  }

  private getUser(): void {
    this.authService.authState$.pipe(
      switchMap((authState) => this.authService.getUser(authState.user?.uid || ''))
    ).pipe(untilDestroyed(this)).subscribe((res) => {
      this.item.mode = res.mode;
      this.item.role = res.role;
      this.item.region = res?.region;
      if (res.mode === this.usersMode.AGENCY) {
        this.item.type = this.orderTypeEnum.AGENCY_LEAD;
        this.selectedOrderType = this.orderTypeEnum.AGENCY_LEAD;
      }
    });
  }

  private subAddress(): void {
    this.searchAddress$ = new ReplaySubject(1)
    this.searchAddressList$ = of([])
    this.searchAddressList$ = this.mapService.suggest(this.searchAddress$);
  }
}
