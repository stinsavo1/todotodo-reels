import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { combineLatest, Observable, switchMap, take } from 'rxjs'
import { AuthService } from 'src/app/services/auth.service'
import { OrdersService } from 'src/app/services/orders.service'
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import moment from 'moment/moment';
import { FeedbackService } from '../../services/my-service/feedback.service';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { MessagesService } from '../../services/messages.service';
import { toMoscowDate } from '../utils/functions';
import { CoreService } from '../../services/core.service';
import { UserInterface } from '../../interfaces/user.interface';
import { UserStoreService } from '../../services/store-service/user-store.service';
import { PaymentService } from '../../services/payment.service';
import {UsersModeEnum} from "../../enums/users-mode.enum";

@Component({
    selector: 'app-order-role-client',
    templateUrl: './order-role-client.component.html',
    styleUrls: ['./order-role-client.component.scss'],
    standalone: false
})
@UntilDestroy()
export class OrderRoleClientComponent implements OnInit {
  @Input() order: any = {};
  @Input() id: string = '';
  @Input() chatId: string = '';
  @Output() updateOrder: EventEmitter<void> = new EventEmitter<void>();
  responses$: Observable<DocumentData[]>;
  public isActiveSubscribe: boolean | undefined = false;
  public responses: any[];
  public feedback: any[] = [];
  public ratingValue: number = 0;
  public stars: {full: boolean, half: boolean}[] = [];
  public isOrderDate: boolean;
  public orderStatusEnum = OrderStatusEnum;
  private executorUser: any;
  private userMode = UsersModeEnum;

  constructor (
    public authService: AuthService,
    public orderService: OrdersService,
    private feedbackService: FeedbackService,
    private messagesService: MessagesService,
    private router: Router,
    private core: CoreService,
    private paymentService: PaymentService
  ) {
  }

  public get getLikes(): number {
    return this.feedback.filter((x) => x.checks === 'like').length ?? 0;
  }

  public get getDislikes(): number {
    return this.feedback.filter((x) => x.checks === 'dislike').length ?? 0;
  }

  ngOnInit() {
    this.paymentService.getStatusPayment().subscribe((res) => {
      this.isActiveSubscribe = res?.isActive;
    })
    this.isOrderDate = toMoscowDate(new Date(this.order?.orderDate)).toISOString().slice(0, 10) >= toMoscowDate(new Date()).toISOString().slice(0, 10);
    if (!this.order?.executor) {
      this.responses$ = this.orderService.responses(this.id).pipe(
        untilDestroyed(this),
        switchMap((res) => {
          this.responses = res;
          // Создаем массив запросов для получения user
          const userRequests = res.map((item) =>
            this.authService.get(item.id).pipe(
              map((user) => ({
                ...item, // Сохраняем старые поля
                user     // Добавляем поле user
              })),
              switchMap((itemWithUser) =>
                this.feedbackService.getFeedbacks(item.id).pipe(
                  map((res) => {
                    this.feedback = res.data.filter((x: any) => x.checks === 'dislike'
                      || x.checks === 'like');
                    this.calculateRating();
                    return itemWithUser;
                  })
                )
              )
            )
          );

          // Выполняем все запросы параллельно
          return combineLatest(userRequests);
        })
      );
    }
    this.authService.get(this.order.executor).pipe(untilDestroyed(this)).subscribe((res) => {
      this.executorUser = res;
    })
  }

  public doneOrderCustomer(doneCustomer = false, doneInstaller = false): void {
    const id = `${this.order.executor}_${this.order.author}_${this.order.id}`;
    let text = null;
    if (this.executorUser.mode === this.userMode.FACTORY || this.executorUser.mode === this.userMode.AGENCY) {
      text = this.executorUser?.nameFactory ?? 'Имя не задано';
    } else {
      text = this.executorUser?.fio ?? 'Имя не задано';
    }
    if (doneCustomer && doneInstaller) {
      this.messagesService.add(id, `${text} отметил заказ как выполненный`, [], OrderStatusEnum.COMPLETED);
    } else {
      this.messagesService.add(id, `${text} отметил заказ как выполненный`, [], OrderStatusEnum.CONFIRM);
    }
    this.orderService.doneOrderCustomer(this.order.id, doneCustomer, doneInstaller).then(() => {
      this.updateOrder.emit();
    });
  }

  public refuseExecutor(executorId: string): void {
    const id = `${executorId}_${this.order.author}_${this.order.id}`
    let text = null;
    if (this.executorUser.mode === this.userMode.FACTORY || this.executorUser.mode === this.userMode.AGENCY) {
      text = this.executorUser?.nameFactory ?? 'Имя не задано';
    } else {
      text = this.executorUser?.fio ?? 'Имя не задано';
    }
    this.messagesService.add(id, `${text} отказал Вам в исполнении заказа`, [], OrderStatusEnum.REJECTION).then(() => {
      this.updateOrder.emit();
    });
  }

  public selectExecutor(executorId: string): void {
    const id = `${executorId}_${this.order.author}_${this.order.id}`
    this.messagesService.addDialogExecutor(executorId, {...this.order, id: this.order.id}).pipe(untilDestroyed(this)).subscribe((res) => {
      let text = null;
      if (this.executorUser.mode === this.userMode.FACTORY || this.executorUser.mode === this.userMode.AGENCY) {
        text = this.executorUser?.nameFactory ?? 'Имя не задано';
      } else {
        text = this.executorUser?.fio ?? 'Имя не задано';
      }
      this.messagesService.add(id, `${text} выбрал Вас для исполнения заказа`, [], OrderStatusEnum.CONFIRM);
      const filterResponses = this.responses.filter((x: any) => x !== executorId);
      if (filterResponses.length) {
        const updatePromises = filterResponses.map((x: any) => {
          const dialogId: string = `${x}_${this.authService.uid}_${this.order.id}`;
          return this.messagesService.updateStatusDialog(dialogId, OrderStatusEnum.REJECTION);
        });
        Promise.all(updatePromises).then();
      }
      this.orderService.selectResponse(this.order.id, executorId);
    }).add(() =>this.updateOrder.emit());
  }

  public navigateFeedback(orderId: string, userId: string, userType: string): void {
    this.router.navigate([`/feedback/${userId}/${orderId}/${userType}`]);
  }

  public get isOverCustomerDate(): boolean {
    const customerDate = moment(this.order['customerFeedbackDate']);
    const currentDate = moment();
    const hoursDifference = currentDate.diff(customerDate, 'hours');
    return hoursDifference <= 24;
  }

  public refuseOrder(id: string): void {
    const dialogId: string = `${this.order.executor}_${this.order.author}_${this.order.id}`;
    let text = null;
    if (this.executorUser.mode === this.userMode.FACTORY || this.executorUser.mode === this.userMode.AGENCY) {
      text = this.executorUser?.nameFactory ?? 'Имя не задано';
    } else {
      text = this.executorUser?.fio ?? 'Имя не задано';
    }
    this.messagesService.add(dialogId, `Заказ отменен. ${text} отказался от заказа.`, [], OrderStatusEnum.REJECTION);
    this.messagesService.updateStatusDialog(dialogId, OrderStatusEnum.REJECTION);
    this.orderService.orderCancel(id, {
      status: OrderStatusEnum.REJECTION,
      refuseCustomer: true
    }).then(() => {
      this.updateOrder.emit();
    });
  }
  public profileNavigate(item: any): void {
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
      this.router.navigate([`/profile/${item.id}/Монтажник`]);
    }
  }

  public navigate() {
    if (!this.executorUser.message) {
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
}
