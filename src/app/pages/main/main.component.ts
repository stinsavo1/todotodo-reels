import {Component, OnInit} from "@angular/core";
import {StoryAvatarComponent} from "../stories/avatars/story-avatar.component";
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonMenu, IonMenuButton,
  IonToolbar
} from "@ionic/angular/standalone";
import {AddressChatsListComponent} from "../new/address-chats-list/address-chats-list.component";
import {AlertController, MenuController, NavController, Platform} from "@ionic/angular";
import {onAuthStateChanged} from "@angular/fire/auth";
import {AuthService} from "../../services/auth.service";
import {ImgEmptyModule} from "../../directives/img-empty/img-empty.module";
import {UntilDestroy, untilDestroyed} from "@ngneat/until-destroy";
import {UserStoreService} from "../../services/store-service/user-store.service";
import {filter, map} from "rxjs/operators";
import {SwUpdate, VersionReadyEvent} from "@angular/service-worker";
import {SharedModule} from "../../components/shared.module";
import {VersionCheckService} from "../../services/version-check-service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [
    StoryAvatarComponent,
    IonButton,
    AddressChatsListComponent,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButtons,
    IonMenuButton,
    ImgEmptyModule,
    SharedModule,
    IonAlert,
  ]
})

@UntilDestroy()
export class MainComponent implements OnInit {
  public isAuth: boolean = false;
  public user: any;
  public uid: string;
  public isAlertOpen: boolean;

  public alertButtons = [
    {
      text: 'Отмена',
      role: 'cancel',
      handler: () => {
        this.router.navigate([''])
      }
    },
    {
      text: 'Авторизация',
      role: 'confirm',
      handler: () => {
        this.router.navigate(['/auth'])
      }
    }
  ]

  constructor(private navCtrl: NavController,
              private authService: AuthService,
              private userStoreService: UserStoreService,
              private alertController: AlertController,
              private swUpdate: SwUpdate,
              private router: Router,
              private platform: Platform,
              private versionCheck: VersionCheckService,
              private menuCtrl: MenuController) {
  }

  ngOnInit(): void {
    this.initializeApp();
    onAuthStateChanged(this.authService.auth, (user) => {
      this.isAuth = !!user;

      if (user) {
        // Пользователь вошёл — загружаем данные
        this.authService.get(user.uid)
          .pipe(untilDestroyed(this))
          .subscribe((res: any) => {
            this.user = res;
            this.userStoreService.updateUser({ id: user.uid, ...res });
          });
      } else {
        // Пользователь вышел — очищаем данные
        this.user = null;
        this.userStoreService.updateUser(null); // или вызовите метод logout/clear, если реализован
        // (если updateUser не принимает null — передайте пустой объект или вызовите отдельный метод)
      }
    });
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

  public didDismiss(): void {
    this.isAlertOpen = false;
  }

  public openBonuses(): void {
    this.isAlertOpen = !this.isAuth;
    if (this.isAuth) {
      this.navCtrl.navigateForward('/partnership/bonus-partnership')
    }
  }

  public navigatePartner(): void {
    this.isAlertOpen = !this.isAuth;
    if (this.isAuth) {
      this.navCtrl.navigateForward('/partnership/send-partnership')
    }
  }

  public openSupport(): void {
    window.location.href = 'https://wa.me/79889770777?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82!%20%D0%9C%D0%BD%D0%B5%20%D0%BD%D1%83%D0%B6%D0%BD%D0%B0%20%D0%BF%D0%BE%D0%BC%D0%BE%D1%89%D1%8C%20%D0%B2%20%D0%B2%D0%B0%D1%88%D0%B5%D0%BC%20%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D0%B5';
  }

  public openEducation(): void {
    window.location.href = 'https://academy.todotodo.ru/';
  }

  public navigateLeads(): void {
    this.navCtrl.navigateForward('/leads');
  }

  public openReels(): void {
    this.navCtrl.navigateForward('/reels');
  }

  public navigateWork(): void {
    this.navCtrl.navigateForward('/map');
  }

  public navigateSubscribe(): void {
    this.navCtrl.navigateForward('/subscription');
  }

  public closeMenu(): void {
    this.menuCtrl.close();
  }

  public navigateAuth(): void {
    this.navCtrl.navigateForward('/auth');
  }

  public navigateFaq(): void {
    this.navCtrl.navigateForward('/faq');
  }

  public navigateDocuments(): void {
    this.navCtrl.navigateForward('/documents');
  }

  public navigateContacts(): void {
    this.navCtrl.navigateForward('/contacts');
  }

  public navigateProfile(): void {
    this.navCtrl.navigateForward('/my-profile');
  }
}
