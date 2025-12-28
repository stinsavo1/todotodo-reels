import { Component, OnInit, ViewChild } from '@angular/core'
import { IonTabs, NavController, Platform } from '@ionic/angular'
import { catchError, Observable, of, shareReplay, switchMap } from 'rxjs'
import { NotificationService } from 'src/app/services/notification.service'
import { AuthService } from '../../services/auth.service';
import { NavigationEnd, Router } from '@angular/router';
import * as types from '@firebase/auth-types';
import { UserStoreService } from '../../services/store-service/user-store.service';
import { UsersModeEnum } from '../../enums/users-mode.enum';
import { ChatService } from "../../services/chat.service";
@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    standalone: false
})
export class TabsPage implements OnInit {
  @ViewChild(IonTabs, { static: false }) tabs: IonTabs;
  public isMobile: boolean;
  public isAlertOpen: boolean;
  public countNotRead$: Observable<{ count: number }>;
  public countNotReadDialogsLead$: Observable<any[]>;
  public countNotReadDialogs$: Observable<{ count: number }>;

  public countNewMessageDialogs$: Observable<number>;
  public currentTab: string;
  public currentTabActive: string;
  public isRegistrationWithId: boolean;
  public user: any;
  public readonly userModeEnum = UsersModeEnum;

  public alertButtons = [
    {
      text: 'Отмена',
      role: 'cancel',
      handler: () => {
        this.router.navigate(['/tabs/map'])
      }
    },
    {
      text: 'Авторизация',
      role: 'confirm',
      handler: () => {
        this.router.navigate(['/tabs/menu/registration/auth'])
      }
    }
  ]

  constructor(
    private platform: Platform,
    private notificationsService: NotificationService,
    private router: Router,
    private navCtrl: NavController,
    private authService: AuthService,
    private userStoreService: UserStoreService,
    private chatService: ChatService,
  ) {
  }

  public ngOnInit(): void {
    this.countNewMessageDialogs$ = this.chatService.getCountNew(this.authService.uid);
    this.getCountNewMessageDialog()
    this.user = this.userStoreService.getUserValue().mode;
    this.isMobile = this.platform.is('mobile');
    const url = window.location.href;
    const segments = url.split('/');
    if ((segments.includes('registration') && segments.length > 5 && !url.includes('email=')) || segments.includes('verification-email')) {
      this.isRegistrationWithId = true;
    }
    if (segments.some(segment => segment.includes('verification-email'))) {
      this.isRegistrationWithId = true;
    }
    this.notificationCountNotRead();
    this.dialogCountNotReadLead();
    this.dialogCountNotRead();
    setTimeout(() => {
      this.changeTab(this.tabs.getSelected() as string);
    }, 0);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Получаем текущий активный маршрут
        this.updateCurrentTab(event.urlAfterRedirects);
      }
      this.authService.authState$.subscribe((item: { user: types.User | null }) => {
        if (!item.user && this.currentTabActive && this.currentTabActive !== 'map' && this.currentTabActive !== 'menu'  && this.currentTabActive !== 'documents') {
          this.isAlertOpen = !this.authService.isAuth;
        }
      });
    });
  }

  updateCurrentTab(url: string) {
    if (url.includes('map')) {
      this.currentTabActive = 'map';
    } else if (url.includes('addresses')) {
      this.currentTabActive = 'addresses';
    } else if (url.includes('notifications')) {
      this.currentTabActive = 'notifications';
    } else if (url.includes('menu')) {
      this.currentTabActive = 'menu';
    } else if (url.includes('chats')) {
      this.currentTabActive = 'chats';
    } else if (url.includes('leads')) {
      this.currentTabActive = 'leads';
    }
  }

  public  changeTab(tab: string): void {
    this.currentTab = tab;
    const user = this.userStoreService.getUserValue().mode;
    if (user === this.userModeEnum.SERVICES) {
      this.currentTab = 'chats';
    }
    if (tab === 'menu') {
      const url = window.location.href;
      const segments = url.split('/');
      if (!segments.includes('partnership')) {
        if (!this.isRegistrationWithId) {
          this.navCtrl.navigateRoot('/tabs/menu');
        }
      }

    }
  }

  public didDismiss(): void {
    this.isAlertOpen = false;
  }

  private notificationCountNotRead(): void {
    this.countNotRead$ = this.notificationsService.countNotRead();
  }

  private dialogCountNotRead(): void {
    this.countNotReadDialogs$ = this.notificationsService.dialogCountNotRead();
  }
  private dialogCountNotReadLead(): void {
    this.countNotReadDialogsLead$ = this.notificationsService.dialogCountNotReadLead();
  }

  private getCountNewMessageDialog() {
    this.countNewMessageDialogs$ = this.authService.uid$.pipe(
      switchMap(uid => {
        if (!uid) return of(0); // или of(null), как удобнее
        return this.chatService.getCountNew(uid);
      }),
      catchError(err => {
        console.error('Ошибка получения количества новых сообщений:', err);
        return of(0);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
