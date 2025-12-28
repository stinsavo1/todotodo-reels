import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { Observable, of, take, tap } from 'rxjs'
import { AuthService } from 'src/app/services/auth.service'
import { OrdersService } from 'src/app/services/orders.service'
import { Router } from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { UserStoreService } from '../../services/store-service/user-store.service';
import { UserInterface } from '../../interfaces/user.interface';
import { UsersModeEnum } from '../../enums/users-mode.enum';
import moment from 'moment/moment';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { toMoscowDate } from '../utils/functions';
import { MessagesService } from '../../services/messages.service';
import { CoreService } from '../../services/core.service';

@Component({
    selector: 'app-order-role-executor',
    templateUrl: './order-role-executor.component.html',
    styleUrls: ['./order-role-executor.component.scss'],
    standalone: false
})
export class OrderRoleExecutorComponent implements OnInit {
  @Input() order: any = {};
  @Input() id: string = '';
  @Input() chatId: string = '';
  @Input() orderUser: any;
  @Output() updateOrder: EventEmitter<void> = new EventEmitter<void>();
  myResponse$: Observable<any | undefined>;
  public price: string;
  public user: UserInterface | null;
  public userMode = UsersModeEnum;
  public orderStatusEnum = OrderStatusEnum;
  public isOrderDate: boolean;

  constructor (
    public authService: AuthService,
    public orderService: OrdersService,
    private router: Router,
    private messagesService: MessagesService,
    private core: CoreService,
    private alertController: AlertController,
    private userStoreService: UserStoreService,
  ) {
    this.myResponse$ = new Observable()
  }

  ngOnInit () {
    this.isOrderDate = toMoscowDate(new Date(this.order?.orderDate)).toISOString().slice(0, 10) >= toMoscowDate(new Date()).toISOString().slice(0, 10);
    this.myResponse$ = this.orderService.myResponse(this.id);
    this.userStoreService.getUser().pipe((take(1))).subscribe((res) => {
      if (Object.keys(res).length === 0) {
        this.user = null;
      } else {
        this.user = res;
      }
    });
  }

  public sendOffer(id: string, price: string): void {
    const user = this.userStoreService.getUserValue();
    if (!user?.address || user?.region === undefined || !user?.phone || !user?.fio) {
      this.presentAlertUser();
      return;
    }
    const orderResponses = [this.authService.uid, ...this.order.responses ?? []];
    this.orderService.updateOrderResponses(this.id, orderResponses);
    this.orderService.saveResponseWithPrice(id, price);
  }

  public doneOrderExecutor(doneCustomer = false, doneExecutor = false): void {
    const id = `${this.order.executor}_${this.order.author}_${this.order.id}`;
    let text = null;
    if (this.user.mode === this.userMode.FACTORY || this.user.mode === this.userMode.AGENCY) {
      text = this.user?.nameFactory ?? 'Имя не задано';
    } else {
      text = this.user?.fio ?? 'Имя не задано';
    }
    if (doneCustomer && doneExecutor) {
      this.messagesService.add(id, `${text} отметил заказ как выполненный`, [], OrderStatusEnum.COMPLETED);
    } else {
      this.messagesService.add(id, `${text} отметил заказ как выполненный`, [], OrderStatusEnum.CONFIRM);
    }
    this.orderService.doneOrderExecutor(this.id, doneCustomer, doneExecutor).then(() => {
      this.updateOrder.emit();
    });
  }

  public navigateFeedback(orderId: string, userId: string, userType: string): void {
    this.router.navigate([`/feedback/${userId}/${orderId}/${userType}`]);
  }
  public refuseOrder(id: string): void {
    const dialogId: string = `${this.order.executor}_${this.order.author}_${this.order.id}`;
    this.messagesService.add(dialogId, 'Заказ отменен. Исполнитель отказался от заказа.', [], OrderStatusEnum.REJECTION);
    this.messagesService.updateStatusDialog(dialogId, OrderStatusEnum.REJECTION);
    this.orderService.orderCancel(id, {
      status: OrderStatusEnum.REJECTION,
      refuseExecutor: true
    }).then(() => {
      this.updateOrder.emit();
    });
  }

  public navigate() {
    if (!this.orderUser.message) {
      this.core
        .presentAlert(
          `Уведомление`,
          'Пользователь отключил функцию сообщений.',
          ['Закрыть']
        ).then()
      return;
    }
    this.router.navigate([`/chat/${this.order.executor}_${this.order.author}_${this.order.id}/${this.order.id}/true`]);
  }

  public get isOverExecutorDate(): boolean {
    const feedbackDate = moment(this.order['executorFeedbackDate']);
    const currentDate = moment();
    const hoursDifference = currentDate.diff(feedbackDate, 'hours');
    return hoursDifference <= 24;
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
    alert.onDidDismiss().then((result: any) => {
      if (result.role === 'backdrop') {
        this.router.navigate(['/tabs/menu/my-profile']);
      }
    });

    await alert.present();
  }

  protected readonly UsersModeEnum = UsersModeEnum;
}
