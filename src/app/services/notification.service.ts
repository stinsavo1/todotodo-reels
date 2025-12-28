import { Injectable, NgZone, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  DocumentData,
  Firestore,
  collection,
  collectionData,
  doc,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc, where,
} from '@angular/fire/firestore';
import { Observable, first, map, share, switchMap, tap, BehaviorSubject, of } from 'rxjs';
import { AuthService } from './auth.service';
import { CoreService } from './core.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { getToken, isSupported, Messaging, onMessage } from '@angular/fire/messaging';
import * as types from '@firebase/auth-types';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private firestore: Firestore = inject(Firestore);

  private notificationsSubject = new BehaviorSubject<DocumentData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private readonly INSTRUCTION_SHOWN_KEY = 'notification_instruction_shown';

  constructor(
    private authService: AuthService,
    public coreService: CoreService,
    private alertController: AlertController,
    private ngZone: NgZone,
    private router: Router,
    private injector: Injector,
  ) {
    this.authService.authState$.subscribe((item: { user: types.User | null }) => {
      if (item.user) {
        this.requestSubscription();
      }
    });
  }

  public dialogCountNotRead(): Observable<{ count: number }> {
    return this.authService.authState$.pipe(
      map(authState => authState.user?.uid || ''),
      switchMap(uid => {
        return uid
          ? collectionData(
            query(
              collection(this.firestore, `dialogs`),
              where(`${uid}_isNew`, '==', true) // Фильтруем по полю uid + _isNew
            )
          ).pipe(
            map(dialogs => {
              dialogs = dialogs.filter(item => !('typeLead' in item));
              return { count: dialogs.length }; // Возвращаем объект с полем count
            })
          )
          : of({ count: 0 }); // Если uid отсутствует, возвращаем объект с count: 0
      })
    );
  }

  public dialogCountNotReadLead(): Observable<any[]> {
    return this.authService.authState$.pipe(
      map(authState => authState.user?.uid || ''),
      switchMap(uid => {
        return uid
          ? collectionData(
            query(
              collection(this.firestore, `dialogs`),
              where(`${uid}_isNew`, '==', true),
              where(`typeLead`, '==', true),
            )
          ).pipe(
            map(dialogs => {
              return dialogs; // Возвращаем объект с полем count
            })
          )
          : of([]); // Если uid отсутствует, возвращаем объект с count: 0
      })
    );
  }

  countNotRead() {
    return this.list().pipe(
      map((items) => ({
        count: items.filter((item) => !item['isRead']).length,
      })),
      share()
    );
  }

  queryList(uid: string) {
    const refDocs = collection(this.firestore, `users/${uid}/notifications`);
    return query(refDocs, orderBy('orderDate', 'desc'), limit(30));
  }

  list(): Observable<DocumentData[]> {
    return this.authService.authState$.pipe(
      map((authState) => authState.user?.uid || ''),
      switchMap((uid) =>
        uid
          ? collectionData(this.queryList(uid), { idField: 'id' }).pipe(
            map((items) =>
              items.map((item) => {
                const orderId = item['link']?.split('/')?.at(-1);
                return {
                  ...item,
                  uid,
                  orderId,
                };
              })
            )
          )
          : []
      ),
      tap((items: { [key: string]: any }[]) => {
        const notificationNotRead = items
          .filter((item) => !item['isRead'])
          .filter(
            (item) =>
              item['orderDate'] > this.coreService.setting['lastNotifcation'] || ''
          );

        if (notificationNotRead.length > 0) {
          const latest = notificationNotRead[0];
          if (latest['orderDate'] > this.coreService.setting['lastNotifcation']) {
            this.coreService.saveStorage({
              lastNotifcation: latest['orderDate'],
            });
          }

          this.ngZone.run(() => {
            this.coreService
              .presentToast(latest['category'], latest['link'])
              .then(() => {
                this.changeRead(latest['uid'], latest['id']);
                this.router.navigate([latest['link']]);
              });
          });
        }
      }),
      share()
    );
  }

  async changeRead(uid: string, id: string) {
    const docRef = doc(this.firestore, `users/${uid}/notifications/${id}`);
    await updateDoc(docRef, { isRead: true });
  }

  async requestSubscription() {
    if (Capacitor.isNativePlatform()) {
      await this.requestNativePush();
    } else {
      await this.requestWebPush();
    }
  }


  async requestWebPush() {
    if (!isSupported() || this.isInTelegram()) {
      return;
    }

    runInInjectionContext(this.injector, async () => {
      try {
        const messaging = inject(Messaging); // ✅ теперь безопасно

        const token = await getToken(messaging, {
          vapidKey: environment.VAPID_PUBLIC_KEY,
        });
        if (!token) return;

        await this.saveToken(token);

        onMessage(messaging, (payload) => {
          this.ngZone.run(() => this.updateNotifications());
        });
      } catch (error: any) {
        console.warn('Ошибка Web push:', error?.message || error);
      }
    });
  }

  async getToken() {
    try {
      const { token } = await FirebaseMessaging.getToken();
      console.log('FCM Token (native):', token);
      await this.saveToken(token);
    } catch (error) {
      console.error('Failed to get token', error);
    }
  }

  async saveToken(token: string) {
    const userId = this.authService.uid;
    if (!userId) return;

    const userDocRef = doc(this.firestore, `usersPush/${userId}`);

    const platform = this.getPlatform();
    const updateData: any = {};
    if (platform === 'web') {
      updateData.webToken = token;
    } else {
      updateData.nativeToken = token;
    }

    try {
      await setDoc(userDocRef, updateData, { merge: true });
    } catch (error) {
      console.error('Failed to save token', error);
    }
  }

  private updateNotifications(): void {
    this.list()
      .pipe(first())
      .subscribe((items) => {
        this.notificationsSubject.next(items);
      });
  }

  private getPlatform(): 'web' | 'native' {
    return Capacitor.isNativePlatform() ? 'native' : 'web';
  }

  private setupListeners() {
    FirebaseMessaging.addListener('notificationReceived', (payload) => {
      console.log('📬 Уведомление в foreground:', payload);
      this.updateNotifications();
    });

    FirebaseMessaging.addListener('notificationActionPerformed', (payload) => {
      this.ngZone.run(() => {
        const link = payload.notification?.clickAction || '/tabs/home';
        this.router.navigate([link]);
      });
    });

    FirebaseMessaging.addListener('tokenReceived', async (payload) => {
      await this.saveToken(payload.token);
    });
  }

  private async showEnableNotificationAlert() {
    const alert = await this.alertController.create({
      header: 'Уведомления отключены',
      message: 'Чтобы получать уведомления, включите их в настройках приложения.',
      buttons: [
        'Отмена',
        {
          text: 'Настройки',
          handler: () => {
            // @ts-ignore
            App.openUrl({ url: 'app-settings:' });
          },
        },
      ],
    });
    await alert.present();
  }

  private async maybeShowInstruction() {
    const { value } = await Preferences.get({ key: this.INSTRUCTION_SHOWN_KEY });
    if (value === 'true') return;

    const info = await Device.getInfo();
    if (info.platform !== 'android') return;

    setTimeout(async () => {
      const alert = await this.alertController.create({
        header: '🔔 Уведомления',
        message: `Пожалуйста, включите уведомления в настройках, иначе вы не будете получать сообщения.
        Более подробная информация в Вопрос-ответ.`,
        cssClass: 'instruction-alert',
        buttons: [
          {
            text: 'Готово',
            handler: async () => {
              await Preferences.set({
                key: this.INSTRUCTION_SHOWN_KEY,
                value: 'true',
              });
            },
          },
        ],
      });
      await alert.present();
    }, 1500);
  }

  private async isProblematicOEM(): Promise<boolean> {
    try {
      const info = await Device.getInfo();
      const manufacturer = info.manufacturer.toLowerCase();

      return (
        manufacturer.includes('xiaomi') ||
        manufacturer.includes('huawei') ||
        manufacturer.includes('oppo') ||
        manufacturer.includes('vivo') ||
        manufacturer.includes('realme') ||
        manufacturer.includes('oneplus') // некоторые версии тоже проблемные
      );
    } catch {
      return false;
    }
  }

  private async requestNativePush() {
    try {
      const info = await Device.getInfo();
      const isAndroid = info.platform === 'android';
      const isAndroid13OrAbove = isAndroid && parseInt(info.osVersion, 10) >= 13;
      const isProblematicOEM = await this.isProblematicOEM();

      let permission = await FirebaseMessaging.checkPermissions();

      // Для Android 13+ — нужно отдельное разрешение
      if (isAndroid13OrAbove) {
        const result = await PushNotifications.requestPermissions();
        permission = { receive: result.receive === 'granted' ? 'granted' : 'denied' };
      }

      if (permission.receive === 'granted') {
        await this.setupNativeNotifications();
        return;
      }

      if (permission.receive === 'denied') {
        await this.showEnableNotificationAlert();
        if (isAndroid) await this.maybeShowInstruction();
        return;
      }

      // === КЛЮЧЕВАЯ ЧАСТЬ: Если OEM проблемный (Xiaomi и др.) — не ждём диалога, сразу инструкция ===
      if (isProblematicOEM) {
        console.log('Проблемный OEM обнаружен — пропускаем requestPermissions');
        await this.maybeShowInstruction();
        return;
      }

      // Только на "нормальных" устройствах пытаемся запросить
      const result = await FirebaseMessaging.requestPermissions();
      const finalPermission = await FirebaseMessaging.checkPermissions();

      if (result.receive === 'granted') {
        await this.setupNativeNotifications();
      } else if (result.receive === 'denied') {
        await this.showEnableNotificationAlert();
        if (isAndroid) await this.maybeShowInstruction();
      } else {
        // 'prompt' остался — значит, диалог не показался (Xiaomi и др.)
        if (isAndroid) await this.maybeShowInstruction();
      }
    } catch (error) {
      console.error('Ошибка при запросе уведомлений:', error);
      const info = await Device.getInfo();
      if (info.platform === 'android') {
        await this.maybeShowInstruction(); // Показываем инструкцию при любой ошибке
      }
    }
  }

  private async setupNativeNotifications() {
    try {
      await this.createHighImportanceChannel();
      await this.getToken();
      this.setupListeners();

      const permission = await FirebaseMessaging.checkPermissions();
      if (permission.receive !== 'granted') {
        await this.showEnableNotificationAlert();
      }
    } catch (error) {
      console.error('Ошибка при настройке уведомлений:', error);
    }
  }

  private async createHighImportanceChannel() {
    try {
      await PushNotifications.createChannel({
        id: 'high_importance',
        name: 'Важные уведомления',
        description: 'Новые сообщения, заказы, уведомления',
        importance: 5, // HIGH
        visibility: 1, // PUBLIC
        sound: 'sound.mp3',
        lights: true,
        vibration: true,
      });
    } catch (error) {
      console.warn('Не удалось создать канал:', error);
    }
  }

  private isInTelegram(): boolean {
    return /Telegram/i.test(navigator.userAgent);
  }
}
