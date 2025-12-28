import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ActionSheetController, AlertController, NavController } from "@ionic/angular";
import { EMPTY, forkJoin, switchMap, tap } from 'rxjs'
import {first} from "rxjs/operators";
import { AuthService } from 'src/app/services/auth.service'
import { CoreService } from 'src/app/services/core.service'
import { OrdersService } from 'src/app/services/orders.service'
import {MessagesService} from "../../services/messages.service";
import { PaymentService } from '../../services/payment.service';
import { PhoneMaskPipe } from '../../pipes/phone-mask.pipe';
import moment from "moment";
import { UsersModeEnum } from '../../enums/users-mode.enum';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FeedbackService } from '../../services/my-service/feedback.service';
import { OrderStoreService } from '../../services/store-service/order-store.service';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { FirebaseStorageService } from '../../services/my-service/firebase-storage.service';
import {OrderTypeEnum} from "../../enums/order-type.enum";
import { ChatService } from "../../services/chat.service";
import { UserService } from "../../services/my-service/user.service";
import { getMoscowTime } from "../../components/utils/functions";

@Component({
    selector: 'app-order-detail',
    templateUrl: './order-detail.page.html',
    styleUrls: ['./order-detail.page.scss'],
    standalone: false
})
@UntilDestroy()
export class OrderDetailPage implements OnInit {
  id: string
  chatId: string = ''
  order!: any;
  executorId!: string;
  isShowBtn = false;
  public isActiveSubscribe: boolean | undefined = false;
  public orderUser: any;
  public user: any;
  public usersMode = UsersModeEnum;
  public feedback: any[] = [];
  public orderStatusEnum = OrderStatusEnum;
  public orderType = OrderTypeEnum;
  public removeTitle: string;
  public ratingValue: number = 0;
  public stars: {full: boolean, half: boolean}[] = [];

  constructor (
    private route: ActivatedRoute,
    private messagesService: MessagesService,
    private router: Router,
    public core: CoreService,
    public orderService: OrdersService,
    private userService: UserService,
    public authService: AuthService,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private paymentService: PaymentService,
    private phoneMaskPipe: PhoneMaskPipe,
    private actionSheetController: ActionSheetController,
    private feedbackService: FeedbackService,
    private orderStoreService: OrderStoreService,
    private firebaseStorageService: FirebaseStorageService,
    private chatService: ChatService,
    private navCtrl: NavController,
  ) {
    this.id = this.route.snapshot.paramMap.get('id') || ''
    this.getOrder();
  }

  ngOnInit() {
    if (!this.id) {
      this.id = this.route.snapshot.paramMap.get('id') || ''
      this.getOrder();
    }
    this.paymentService.getStatusPayment().subscribe((res) => {
      this.isActiveSubscribe = res?.isActive;
    })
    this.authService.get(this.authService.uid).pipe(untilDestroyed(this)).subscribe((res) => {
      this.user = res;
    });
    this.updateLastInactiveTime(this.authService.uid);
  }

  public get getLikes(): number {
    return this.feedback.filter((x) => x.checks === 'like').length ?? 0;
  }

  public get getDislikes(): number {
    return this.feedback.filter((x) => x.checks === 'dislike').length ?? 0;
  }

  public get getRole(): string {
    if (this.order.mode === this.usersMode.FACTORY) {
      return 'Производство'
    } else if (this.order.mode === this.usersMode.SERVICES) {
      return 'Услуга'
    } else {
      return this.order.role;
    }
  }

  public async onNavigateButtonClick(event: MouseEvent, order: any): Promise<void> {
    event.stopPropagation(); // Останавливаем распространение события

    if (!order.subscription) {
      // Если подписки нет, показываем алерт
      this.core
        .presentAlert(
          'Подписка',
          'Функция проложить маршрут или посмотреть адрес доступна только пользователям с подпиской.',
          ['Закрыть', 'Подробнее']
        )
        .then(btn => {
          if (btn == 'Подробнее') {
            this.router.navigate(['/tabs/map/subscription']); // Переходим на страницу подписки
          } else {
            this.router.navigate([`/tabs/map/order-detail/${this.id}`]); // Возвращаемся к деталям заказа
          }
        });
    } else {
        const actionSheet = await this.actionSheetController.create({
            header: 'Выберите приложение для навигации',
            buttons: [
                {
                    text: 'Google Maps',
                    icon: 'navigate-outline',
                    handler: () => {
                        this.openMap('google', order.centerNumArray[0], order.centerNumArray[1], order.geometry[0], order.geometry[1]);
                    }
                },
                {
                    text: 'Apple Maps',
                    icon: 'navigate-outline',
                    handler: () => {
                        this.openMap('apple', order.centerNumArray[0], order.centerNumArray[1], order.geometry[0], order.geometry[1]);
                    }
                },
                {
                    text: 'Яндекс Навигатор',
                    icon: 'navigate-outline',
                    handler: () => {
                        this.openMap('yandexNavigator', order.centerNumArray[0], order.centerNumArray[1], order.geometry[0], order.geometry[1]);
                    }
                },
                {
                    text: 'Яндекс Карты',
                    icon: 'navigate-outline',
                    handler: () => {
                        this.openMap('yandexMaps', order.centerNumArray[0], order.centerNumArray[1], order.geometry[0], order.geometry[1]);
                    }
                },
                {
                    text: '2ГИС',
                    icon: 'navigate-outline',
                    handler: () => {
                        this.openMap('twoGis', order.centerNumArray[0], order.centerNumArray[1], order.geometry[0], order.geometry[1]);
                    }
                },
                {
                    text: 'Отмена',
                    icon: 'close',
                    role: 'destructive',  // Делаем кнопку "Отмена" красной
                }
            ]
        });

        await actionSheet.present();
    }
  }

    openMap(app: string, latA: number, lonA: number, latB: number, lonB: number) {
        let url: string;

        switch (app) {
            case 'google':
                url = `https://www.google.com/maps/dir/?api=1&origin=${latA},${lonA}&destination=${latB},${lonB}`;
                break;
            case 'apple':
                url = `http://maps.apple.com/?saddr=${latA},${lonA}&daddr=${latB},${lonB}`;
                break;
            case 'yandexNavigator':
                url = `yandexnavi://build_route_on_map?lat_from=${latA}&lon_from=${lonA}&lat_to=${latB}&lon_to=${lonB}`;
                break;
            case 'yandexMaps':
                url = `https://yandex.ru/maps/?rtext=${latA},${lonA}~${latB},${lonB}&rtt=auto`;
                break;
            case 'twoGis':
                url = `dgis://2gis.ru/routeSearch/rsType/car/from/${lonA},${latA}/to/${lonB},${latB}`;
                break;
            default:
                return;
        }

        window.open(url, '_system'); // Открываем URL в системном браузере или приложении
    }

  public callCustomer(): void {
    if (!this.user) {
      this.redirectAuth();
    } else {
      if (!this.isActiveSubscribe) {
        this.core
          .presentAlert(
              `Подписка`,
              `Функция звонить доступна только пользователям с подпиской.\n
          Если Вы еще не оформили подписку,то Вы можете только писать,эта функция бесплатная.\n`,
            ['Закрыть', 'Подробнее']
          )
          .then(btn => {
            if (btn == 'Подробнее')
              this.navCtrl.navigateRoot('/tabs/map/subscription')
            else  this.navCtrl.navigateRoot(`/tabs/map/order-detail/${this.id}`)
          })
      } else {
        this.sendCallMessage();
        window.location.href = `tel:${this.orderUser['phone']}`;
      }
    }
  }

  public sendCallMessage() {
    const secondPersonId = this.executorId || this.order['author'];
    const id: string = `${secondPersonId}_${this.authService.uid}_${this.id}`
    const text = `Пользователь ${this.user?.fio ?? ''} звонил Вам с номера ${this.phoneMaskPipe.transform(this.user.phone)} в ${moment().format('HH:mm')}`;
    this.chatService.dialogExists(id).then(exists => {
      this.chatService.add(id, text, [], this.order, !exists)
        .then(() => {});
    });
  }

  public getUser(id: string) {
    this.authService.get(id || null).pipe(untilDestroyed(this)).subscribe((res) => {
      this.orderUser = res;
      this.removeTitle = this.getRemoveTitle();
    });
  }

  public removeOrder(): void {
    if (this.order?.responses) {
      this.order.responses.forEach((id: string) => {
        const dialogId: string = `${id}_${this.order.author}_${this.order.id}`;
        this.messagesService.updateStatusDialog(dialogId, OrderStatusEnum.REJECTION);
      });
    }
    if (this.order?.photo) {
      this.order.photo.forEach((photo: string) => {
        this.firebaseStorageService.deleteFileByUrl(photo).then();
      });
    }
    this.orderService.removeOrder(this.id)
      .then(() => {
        this.router.navigate(['/tabs/map']);
      })
  }

  public shareContent() {
    navigator.share({
      url: window.location.href
    }).then();
  }

    public profileNavigate(id: string): void {
    if (this.orderUser['mode'] === this.usersMode.FACTORY) {
      this.router.navigate([`/profile-factory/${this.orderUser.id}`], { queryParams: { watch: true } });
    } else {
      if (!this.isActiveSubscribe) {
        this.core
          .presentAlert(
            `Подписка`,
            `Просмотр профиля доступен только пользователям с подпиской.`,
            ['Закрыть', 'Подробнее']
          )
          .then(btn => {
            if (btn == 'Подробнее')
              this.router.navigate(['/tabs/map/subscription'])
            else this.router.navigate([`/tabs/map/order-detail/${this.id}`])
          })
      } else {
        if (this.orderUser.mode === this.usersMode.USERS) {
          this.router.navigate([`/profile/${id}/Дилер`]);
        } else if (this.orderUser.mode === this.usersMode.SERVICES) {
          this.router.navigate([`/profile/${id}/Поставщик услуг`])
        }
      }
    }
    }


  public setHideOrder(): void {
    const body = {
      ...this.order,
      hideOrdersIdsUser: [
        this.authService.uid
      ]
    }
    forkJoin([
      this.orderService.updateOrderDetails(this.id, body, 'hideOrdersIdsUser'),
      this.orderService.updateOrder(this.id, body, 'hideOrdersIdsUser')
    ]).subscribe().add(() => {
      this.router.navigate(['/tabs/map']);
    });
  }

  private setOrderSeen(): void {
    const body = {
      ...this.order,
      seenOrder: [
        this.authService.uid
      ]
    }
    forkJoin([
      this.orderService.updateOrderDetails(this.id, body, 'seenOrder'),
      this.orderService.updateOrder(this.id, body, 'seenOrder')
    ]).subscribe();
  }

  private redirectAuth(): void {
    this.core
      .presentAlert(
        'Авторизация',
        `Функция доступна только для зарегистрированных пользователей. Пожалуйста, зарегистрируйтесь или войдите в систему, чтобы продолжить.`,
        ['Подробнее']
      )
      .then(btn => {
        this.router.navigate(['/tabs/menu/registration/auth'])
      })
  }


  public getOrder() {
    this.orderService.order(this.id)
      .pipe(
        first(),
        tap((order) => {
          this.orderStoreService.updateOrder(order);
          this.getUser(order?.author);
          this.getFeedbacks(order?.author);
        }),
        switchMap((order) => {
          const grantAccess: boolean = order?.author === this.authService.uid || order?.executor === this.authService.uid || this.router.url.includes('orders-in-progress') || this.router.url.includes('orders-in-progress');
          if (!grantAccess && (!order || !order?.author || order?.status === OrderStatusEnum.CONFIRM || order?.status === OrderStatusEnum.COMPLETED)) {
            this.orderNotFound(order);
            return EMPTY;
          }

          this.chatId = this.orderService.generateChatId(order);

          if (order?.phone) {
            order.phone = this.maskPhoneNumber(order.phone);
          }
          this.order = order;
          if (this.order && (this.order['author'] !== this.authService.uid)) {
            if (this.order['seenOrder']) {
              const userId = this.order['seenOrder'].find((x: string) => x === this.authService.uid);
              if (!userId) {
                this.setOrderSeen();
              }
            } else {
              this.setOrderSeen();
            }
          }
          if (order['author'] === this.authService.uid) {
            return this.orderService.responses(this.id);
          }
          this.isShowBtn = this.router.url.includes('tabs/map');
          this.cdr.detectChanges();
          return EMPTY;
        })
      )
      .subscribe((res) => {
        if (res?.length) {
          const executor = res[0];
          this.executorId = executor.id;
        }
        this.cdr.detectChanges();
      })
  }

  private maskPhoneNumber(phone: string): string {
    let visibleDigits = 6; // Количество оставляемых видимыми цифр (7,9,2,5,9,3)
    let digitCount = 0;
    let result = '';

    for (let char of phone) {
      if (char.match(/\d/)) { // Если символ - цифра
        digitCount++;
        result += (digitCount > visibleDigits) ? '*' : char; // Заменяем цифры после 6-ой на *
      } else {
        result += char; // Не цифры оставляем как есть
      }
    }
    return result;
  }

  private getFeedbacks(id: string): void {
    if (this.authService.uid === id) {
      return;
    }
    this.feedbackService.getFeedbacks(id).pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res) {
        this.feedback = res.data.filter((x: any) => x.checks === 'like'
          || x.checks === 'dislike');
      }
      this.calculateRating();
    })
  }

  private async orderNotFound(order: any) {
    const isDeletedOrder: boolean = !order || !order?.author;
    const alert = await this.alertController.create({
      header: isDeletedOrder ? 'Заказ не найден' : 'Заказ занят',
      message: isDeletedOrder ? 'Данный заказ не существует или был удален.' : 'Данный заказ передан другому исполнителю',
      backdropDismiss: false,
      buttons: [{
        text: 'Перейти на главную',
        handler: () => {
          this.router.navigate(['/tabs/map']);
        }
      }],
    });

    await alert.present();
  }

  private getRemoveTitle(): string {
    if (this.orderUser.mode === this.usersMode.USERS || this.orderUser.mode === this.usersMode.FACTORY) {
      return 'Удалить заказ'
    } else if (this.orderUser.mode === this.usersMode.SERVICES) {
      return 'Удалить услугу';
    } else {
      return 'Удалить заказ'
    }
  }

  private calculateRating(): void {
    const likes = this.getLikes;
    const dislikes = this.getDislikes;
    const total = likes + dislikes;
    if (total === 0) {
      this.ratingValue = 0;
      this.stars = Array(5).fill(null).map(() => ({ full: false, half: false }));
      return;
    }

    // Рассчитываем рейтинг от 0 до 5
    this.ratingValue = (likes * 5 + dislikes * 1) / total;

    // Подготавливаем данные для звезд
    this.stars = [];
    for (let i = 1; i <= 5; i++) {
      if (this.ratingValue >= i) {
        this.stars.push({ full: true, half: false }); // Полная звезда
      } else if (this.ratingValue > i - 1) {
        this.stars.push({ full: false, half: true }); // Половина звезды
      } else {
        this.stars.push({ full: false, half: false }); // Пустая звезда
      }
    }
  }

  private updateLastInactiveTime(id: string): void {
    if (id) {
      this.userService.updateLastInactiveTime(id, getMoscowTime());
    }
  }
}
