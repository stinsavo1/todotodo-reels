import { Component } from "@angular/core";
import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonProgressBar,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";
import { NavController, ViewWillEnter } from "@ionic/angular";
import { map, Observable, of, switchMap, tap } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { ChatService } from "../../../services/chat.service";
import { AuthService } from "../../../services/auth.service";
import { CommonModule } from "@angular/common";
import { UsersModeEnum } from "../../../enums/users-mode.enum";
import { DialogParserService, DialogParts } from "../../../services/dialog-parser.service";
import { OrderStatusEnum } from "../../../enums/order-status.enum";

@Component({
  selector: 'app-order-chat-list',
  templateUrl: './order-chat-list.component.html',
  styleUrls: ['./order-chat-list.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    CommonModule,
    IonButtons,
    IonProgressBar,
  ],
  providers: [DialogParserService],
  standalone: true
})

export class OrderChatListComponent implements ViewWillEnter {
  public orderChats$: Observable<any>;
  public id: string;
  public orderAddress: string;
  public loader = true;
  public userMode = UsersModeEnum;
  public dialogParts: DialogParts;
  private orderStatus = OrderStatusEnum;
  public isManager: boolean;

  constructor(public authService: AuthService,
              private route: ActivatedRoute,
              private navCtrl: NavController,
              private dialogParserService: DialogParserService,
              private chaService: ChatService) {

  }

  ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.isManager = this.route.snapshot.paramMap.get('isManager') === 'true';
    this.dialogParts = this.dialogParserService.parseDialogId(this.id);

    this.orderChats$ = this.chaService.getDialogsOrderChats(this.isManager ? this.dialogParts.authorId : this.authService.uid, this.dialogParts.orderId).pipe(
      map(dialog => this.addHasMissedMessage(dialog)),

      switchMap(dialog => {
        if (dialog.length === 0) {
          this.orderAddress = null;
          return of([]);
        }

        this.orderAddress = dialog[0]?.orderAddress;
        const authorIds = dialog.map((item: any) => {
          const parts = this.dialogParserService.parseDialogId(item.id);
          item.authorLastMessage = this.isManager || parts.authorId === this.authService.uid
            ? parts.userId
            : parts.authorId;
          return item.authorLastMessage;
        }).filter((id): id is string => !!id);

        return this.chaService.getUsersMapByIds(authorIds).pipe(
          map(userMap =>
            dialog.map(item => ({
              ...item,
              authorData: userMap[item.authorLastMessage] || null,
            }))
          )
        );
      }),

      tap(() => this.loader = false)
    );
  }

  public openBitrixDeals() {
    this.navCtrl.navigateForward(`/tabs/leads/detail/${this.dialogParts.orderId}`);
  }

  public back(): void {
    this.navCtrl.navigateBack('/tabs/addresses');
  }

  public routerNavigate(id: string): void {
    this.navCtrl.navigateForward(`/tabs/addresses/new-chat/${id}/${this.isManager}`);
  }

  public getName(chat: any): string {
    if (chat?.authorData) {
      if (chat?.authorData === this.userMode.FACTORY) {
        if (chat?.orderType === 'Лид' && this.dialogParts.authorId === this.authService.uid) {
          return chat?.authorData?.phone ?? 'Номер не задан'
        }
        return chat?.authorData?.nameFactory ?? 'Имя не задано';
      } else {
        if (chat?.orderType === 'Лид' && (this.isManager || this.dialogParts.authorId === this.authService.uid)) {
          return chat?.authorData?.phone ?? 'Номер не задан'
        }
        return chat?.authorData?.fio ?? 'Имя не задано';
      }
    } else {
      return '';
    }
  }

  public getRelativeTime(updatedAt: string | Date | undefined): string {
    return updatedAt ? this.formatRelativeTime(updatedAt) : '—';
  }

  private formatRelativeTime(dateInput: string | Date): string {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return '—';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 60 * 1000) {
      return 'только что';
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // Сегодня
    if (diffDay === 0) {
      if (diffMin < 60) {
        return this.pluralize(diffMin, ['минуту', 'минуты', 'минут']);
      }
      return this.pluralize(diffHour, ['час', 'часа', 'часов']);
    }

    // Вчера — по календарю
    const isYesterday = this.isSameDay(
      date,
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    );
    if (isYesterday) {
      return 'вчера';
    }

    // Формат даты: ДД.ММ или ДД.ММ.ГГГГ
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // месяцы с 0
    const year = date.getFullYear();

    const isCurrentYear = year === now.getFullYear();
    return isCurrentYear ? `${day}.${month}` : `${day}.${month}.${year}`;
  }

// Вспомогательная: совпадают ли две даты по году-месяцу-дню
  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

// Вспомогательная: склонение для русского (минута, минуты, минут)
  private pluralize(n: number, forms: [string, string, string]): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    let formIndex = 2; // по умолчанию — родительный падеж мн.ч.

    if (mod10 === 1 && mod100 !== 11) {
      formIndex = 0; // именительный (1 минута)
    } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      formIndex = 1; // родительный ед.ч. (2–4 минуты)
    }

    return `${n} ${forms[formIndex]}`;
  }

  private addHasMissedMessage(array: any[]): any[] {
    const currentUidKey = `${this.authService.uid}_isNew`;
    const fallbackKey =  `${this.dialogParts.authorId}_isNew`;
    return array.map(item => {
      let isNew = false;

      if (item.hasOwnProperty(currentUidKey)) {
        isNew = item[currentUidKey] === true;
      } else if (this.isManager && item.hasOwnProperty(fallbackKey)) {
        isNew = item[fallbackKey] === true;
      }

      return {
        ...item,
        hasMissedMessage: isNew
      };
    });
  }
}
