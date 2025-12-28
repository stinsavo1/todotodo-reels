import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core'
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker'
import { AlertController, Platform } from '@ionic/angular'
import { Observable, switchMap, zip } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { NotificationService } from './services/notification.service'
import { AuthService } from './services/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LoadingScreenService } from './services/my-service/loading-screen.service';
import { UserStoreService } from './services/store-service/user-store.service';
import { Router } from '@angular/router';
import { MenuInterface } from './interfaces/menu.interface';
import { onAuthStateChanged } from "@angular/fire/auth";
import { VersionCheckService } from "./services/version-check-service";

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    standalone: false
})
@UntilDestroy()
export class AppComponent implements OnInit {
  @ViewChild('sidebar') sidebar!: ElementRef;

  @HostListener('window:resize')
  onResize() {
    const sidebarEl = this.sidebar.nativeElement;

    if (window.innerWidth >= 800) {
      this.isCollapsed = false;
      this.isMenuActive = false;
      sidebarEl.style.height = this.fullSidebarHeight;
    } else {
      sidebarEl.style.height = this.collapsedSidebarHeight;
    }
  }

  public isMobile: boolean;
  public loading$: Observable<boolean>;
  public isCollapsed = false;
  public isAdmin = false;
  public isMenuActive = false;
  public primaryNav: Map<string, MenuInterface> = new Map([
    ['home', { icon: 'home', label: 'Главная', route: '/' }],
    ['chat', { icon: 'chat', label: 'Чаты', route: 'tabs/addresses' }],
    ['notifications', { icon: 'notifications', label: 'Уведомления', route: 'tabs/notifications' }],
    ['paid', { icon: 'paid', label: 'Подписка', route: 'tabs/menu/subscription' }],
    ['handshake', { icon: 'handshake', label: 'Партнерство', route: 'tabs/menu/partnership' }],
    ['help', { icon: 'help', label: 'Вопрос-ответ', route: 'tabs/menu/faq' }],
    ['list', { icon: 'list', label: 'Прочее', route: 'tabs/documents' }],
    ['contact_support', { icon: 'contact_support', label: 'Контакты', route: 'tabs/menu/contacts' }],

  ]);

  public secondaryNav: Map<string, MenuInterface> = new Map([
    ['account_circle', { icon: 'account_circle', label: 'Профиль', route: 'tabs/menu/my-profile' }],
    ['login', { icon: 'login', label: 'Войти', route: 'tabs/menu/registration/auth' }],
    ['logout', { icon: 'logout', label: 'Выйти', route: 'logout' }],
  ]);
  public primaryNavArr: MenuInterface[];
  public secondaryNavArr: MenuInterface[];

  private countNotRead$: Observable<{ count: number }>;
  public countNotReadDialogs$: Observable<{ count: number }>;
  private collapsedSidebarHeight = "56px";
  private fullSidebarHeight = "100%";

  constructor(
    private platform: Platform,
    private router: Router,
    private notificationsService: NotificationService,
    private authService: AuthService,
    private swUpdate: SwUpdate,
    private userStoreService: UserStoreService,
    private loadingScreenService: LoadingScreenService,
    private alertController: AlertController,
    private versionCheck: VersionCheckService
  ) {
  }

  public ngOnInit(): void {
    this.initializeApp();
    // TODO техдолг переделать проверку админа
    const pathname = window.location.pathname;

    if (pathname.includes('admin')) {
      this.isAdmin = true;
    }
    onAuthStateChanged(this.authService.auth, (user) => {
      if (user) {
        this.secondaryNav.get('login').hidden = true;
        this.primaryNav.get('chat').hidden = false;
        this.primaryNav.get('handshake').hidden = false;
        this.primaryNav.get('notifications').hidden = false;
        this.secondaryNav.get('account_circle').hidden = false;
        this.secondaryNav.get('logout').hidden = false;
      } else {
        this.secondaryNav.get('login').hidden = false;
        this.secondaryNav.get('account_circle').hidden = true;
        this.primaryNav.get('handshake').hidden = true;
        this.primaryNav.get('chat').hidden = true;
        this.primaryNav.get('notifications').hidden = true;
        this.secondaryNav.get('logout').hidden = true;
      }
      this.primaryNavArr = Array.from(this.primaryNav.values());
      this.secondaryNavArr = Array.from(this.secondaryNav.values());
    });
    this.getCounts();
    this.authService.authState$
      .pipe(switchMap(() => this.authService.get(this.authService.uid).pipe(untilDestroyed(this))))
      .subscribe((res: any) => {
        this.userStoreService.updateUser({id: this.authService.uid, ...res });
      });
    this.loading$ = this.loadingScreenService.loading$;
    this.isMobile = this.platform.is('mobile');
    this.dialogCountNotRead();
    this.notificationCountNotRead();
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (evt: any): evt is VersionReadyEvent => evt.type === 'VERSION_READY'
          ),
          map((evt: any) => {
            console.info(
              `currentVersion=[${evt.currentVersion} | latestVersion=[${evt.latestVersion}]`
            )
            this.presentAlertWithCountdown();
          })
        )
        .subscribe()
      this.swUpdate.checkForUpdate();
    }
  }
  private initializeApp(): void {
    this.platform.ready().then(() => {
      this.versionCheck.checkOnLaunch().catch(console.warn);
    });
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  public navigateRoute(route: string): void {
    if (route === 'logout') {
      this.authService.signOut();
    } else {
      this.router.navigate([route]);
    }
  }

  public toggleMenu(): void {
    this.isMenuActive = !this.isMenuActive;

    const sidebarEl = this.sidebar.nativeElement;

    if (this.isMenuActive) {
      sidebarEl.style.height = `${sidebarEl.scrollHeight}px`;
    } else {
      sidebarEl.style.height = this.collapsedSidebarHeight;
    }
  }

  async presentAlertWithCountdown() {
    let secondsLeft = 3;

    const alert = await this.alertController.create({
      header: 'Обновление версии',
      message: `До автоматического обновления осталось ${secondsLeft} сек.`,
      backdropDismiss: false,
      buttons: [
        {
          text: 'Обновить',
          handler: () => {
             window.location.reload();
          },
        },
      ],
    });

    await alert.present();

    const interval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        alert.message = `До автоматического обновления осталось ${secondsLeft} сек.`;
      } else {
        clearInterval(interval);
        window.location.reload();
        alert.dismiss();
      }
    }, 1000);
  }

  private notificationCountNotRead(): void {
    this.countNotRead$ = this.notificationsService.countNotRead();
  }

  private dialogCountNotRead(): void {
    this.countNotReadDialogs$ = this.notificationsService.dialogCountNotRead();
  }

  private getCounts(): void {
    zip([
      this.notificationsService.countNotRead(),
      this.notificationsService.dialogCountNotRead(),
      this.notificationsService.dialogCountNotReadLead(),
    ]).pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.primaryNav.get('notifications').count = res[0].count;
      this.primaryNav.get('chat').count = res[1].count;
      this.primaryNav.get('overview').count = res[2].length ?? 0;
    });
  }
}
