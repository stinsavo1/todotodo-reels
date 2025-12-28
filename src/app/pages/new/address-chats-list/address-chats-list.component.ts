import { Component } from "@angular/core";
import {
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader, IonLabel,
  IonProgressBar, IonSegment, IonSegmentButton, IonSegmentView,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";
import { ChatService } from "../../../services/chat.service";
import { AuthService } from "../../../services/auth.service";
import { catchError, map, Observable, of } from "rxjs";
import { AsyncPipe, CommonModule } from "@angular/common";
import { NavController, ViewWillEnter } from "@ionic/angular";
import { DeclinationPipe } from "../../../pipes/declination.pipe";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@Component({
  selector: 'app-address-chats-list',
  templateUrl: './address-chats-list.component.html',
  styleUrls: ['./address-chats-list.component.scss'],
  imports: [
    IonProgressBar,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonContent,
    IonCard,
    IonCardContent,
    IonChip,
    AsyncPipe,
    DeclinationPipe,
    CommonModule,
    IonSegmentButton,
    IonLabel,
    IonSegment,
    IonSegmentView
  ],
  standalone: true
})
@UntilDestroy()
export class AddressChatsListComponent implements ViewWillEnter {
  public loader = false;
  public dialogAddress$: Observable<any>;
  public activeCount: number;
  public archiveCount: number;
  public user: any;
  public segment = 'active';


  constructor(
    public authService: AuthService,
    private navCtrl: NavController,
    private chatService: ChatService) {
  }

  ionViewWillEnter() {
    this.segment = 'active';
    this.authService.get(this.authService.uid).pipe(untilDestroyed(this)).subscribe((res) => {
      this.user = res;
      this.loadActiveDialogs();
    });
  }

  public changeSegment(event: any): void {
    this.segment = event.detail.value;
    if (this.segment === 'active') {
      this.loadActiveDialogs();
    } else {
      this.loadArchiveDialogs();
    }
  }

  public routerNavigate(order: any) {
    this.navCtrl.navigateForward(`/tabs/addresses/order-chats/${order.id}/${this.segment}/${(!!(this.user.isManager && order.typeLead))}`);
  }

  private groupByOrderId<T extends { orderId: string }>(
    array: T[],
  ): (T & { count: number; countNewMessages: number })[] {
    const isNewKeys: string[] = [];

    if (this.authService.uid) {
      isNewKeys.push(`${this.authService.uid}_isNew`);
    }

    if (this.user?.isManager && this.user.id && this.segment === 'active') {
      // Хак, для получения чатов лидов
      isNewKeys.push(`xfROU1CUVVoJa6qBsZmO_isNew`);
    }

    const map = new Map<string, {
      item: T;
      count: number;
      countNewMessages: number;
    }>();

    for (const item of array) {
      // @ts-ignore — вы используете extractCityAndStreetHouse
      const address = this.extractCityAndStreetHouse(item.orderAddress);
      (item as any).city = address.city ?? 'Город отсутствует';
      (item as any).street = address.streetAndHouse ?? 'Улица отсутствует';

      const key = item.orderId;

      const isMessageNew = isNewKeys.some(key => (item as any)[key] === true);

      if (map.has(key)) {
        const entry = map.get(key)!;
        entry.count++;
        if (isMessageNew) {
          entry.countNewMessages++;
        }
      } else {
        map.set(key, {
          item: { ...item },
          count: 1,
          countNewMessages: isMessageNew ? 1 : 0
        });
      }
    }

    return Array.from(map.values()).map(entry => ({
      ...entry.item,
      count: entry.count,
      countNewMessages: entry.countNewMessages
    }));
  }


  private loadActiveDialogs(): void {
    this.loader = true;
    this.dialogAddress$ = this.chatService.getDialogsAddressChats(this.authService.uid, this.user?.isManager).pipe(
      map(dialogs => {
        this.activeCount = dialogs?.length ?? 0;
        this.loader = false;
        return this.groupByOrderId(dialogs);
      }),
      // Добавьте обработку ошибок — вы предпочитаете безопасность
      catchError(error => {
        console.error('Failed to load dialogs:', error);
        this.loader = false;
        this.activeCount = 0;
        return of([]); // или throw, если нужно
      })
    );
  }

  private loadArchiveDialogs(): void {
    this.loader = true;
    this.dialogAddress$ = this.chatService.getDialogsAddressArchive(this.authService.uid).pipe(
      map(dialogs => {
        this.archiveCount = dialogs?.length ?? 0;
        this.loader = false;
        return this.groupByOrderId(dialogs);
      }),
      // Добавьте обработку ошибок — вы предпочитаете безопасность
      catchError(error => {
        console.error('Failed to load dialogs:', error);
        this.loader = false;
        this.archiveCount = 0;
        return of([]); // или throw, если нужно
      })
    );
  }

  private extractCityAndStreetHouse(formatted: string): { city: string | null; streetAndHouse: string | null } {
    if (!formatted) return {city: null, streetAndHouse: null};

    let addr = formatted.replace(/^Россия,\s*/i, '').trim();

    // --- 1. Извлекаем город (и позицию его конца) ---
    let city: string | null = null;
    let cityEndIndex = 0;

    // Вариант 1: "г Москва", "город Казань"
    const withG = /(?:^|,\s*)(г\.?\s+|город\s+)([^,]+)/i.exec(addr);
    if (withG) {
      city = withG[2].trim();
      cityEndIndex = withG.index + withG[0].length;
    } else {
      // Вариант 2: после региона — город без "г"
      const afterRegion = /(?:(?:обл|область|край|респ|республика|АО|автономный округ)[^,]*,?\s*)([А-ЯЁ][а-яё\s-]+?)(?=,|$)/i.exec(addr);
      if (afterRegion) {
        city = afterRegion[1].trim();
        cityEndIndex = afterRegion.index + afterRegion[0].length;
      } else {
        // Вариант 3: первый значимый компонент с большой буквы (не улица/дом)
        const parts = addr.split(',').map(p => p.trim());
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (
            /^[А-ЯЁ][а-яё]+/.test(part) &&
            !/(ул|пр|ш|пер|дом|строение|район|мкрн|снт|днт)/i.test(part) &&
            !/^\d/.test(part)
          ) {
            city = part;
            // Находим индекс в исходной строке
            const idx = addr.indexOf(part);
            if (idx !== -1) {
              cityEndIndex = idx + part.length;
              // Учитываем запятую после
              const after = addr.slice(cityEndIndex).match(/^,?\s*/);
              if (after) cityEndIndex += after[0].length;
            }
            break;
          }
        }
      }
    }

    // --- 2. Остаток — улица + дом ---
    let streetAndHouse = cityEndIndex > 0
      ? addr.slice(cityEndIndex).replace(/^,\s*/, '')
      : addr;

    // Очищаем от возможного "г ..." в начале остатка (на случай дублирования)
    streetAndHouse = streetAndHouse.replace(/^(г\.?\s+|город\s+)/i, '').trim();

    return {
      city,
      streetAndHouse: streetAndHouse || null
    };
  }
}
