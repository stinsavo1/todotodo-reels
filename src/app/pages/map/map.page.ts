import { Component, NgZone, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { AlertController, IonModal, NavController, ViewWillEnter } from "@ionic/angular";
import { AuthService } from '../../services/auth.service'
import { distinctUntilChanged, forkJoin, Observable, switchMap, map } from 'rxjs'
import { YaReadyEvent } from 'angular8-yandex-maps'
import { DocumentData } from '@angular/fire/firestore'
import { MapService } from 'src/app/services/map.service'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {UserNewRoleEnum, UsersModeEnum} from '../../enums/users-mode.enum';
import { OrderTypeEnum } from '../../enums/order-type.enum';
import { AdService } from '../../services/my-service/ad.service';
import { UserService } from '../../services/my-service/user.service';
import { where } from 'firebase/firestore';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { MyOrdersService } from '../../services/my-service/my-orders.service';
import { PaymentService } from '../../services/payment.service';
import { EventService } from '../../services/my-service/event.service';
import { getMoscowTime } from "../../components/utils/functions";

interface PlacemarkConstructor {
  geometry: number[]
  properties: ymaps.IPlacemarkProperties
  options: ymaps.IPlacemarkOptions
}

@Component({
    selector: 'app-map',
    templateUrl: './map.page.html',
    styleUrls: ['./map.page.scss'],
    standalone: false
})
@UntilDestroy()
export class MapPage implements ViewWillEnter {
  @ViewChild(IonModal) modal!: IonModal;

  // Производство
  public users: any[] = [];
  public orders: any[] = [];
  public filters: any;
  public tempFilters: any;

  public isAlertOpen: boolean
  public map: ymaps.Map;
  public usersMode = UsersModeEnum;
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
        this.router.navigate(['/tabs/map/registration/auth'])
      }
    }
  ]
  public readyMap: Observable<any>
  public center: PlacemarkConstructor
  public placemarkOptionsType: { [ley: string]: ymaps.IPlacemarkOptions }
  public userDetails: any;
  public title: string = 'Создать заказ';
  public isZoomInDisabled = false;
  public isZoomOutDisabled = false;
  public paymentStatus: boolean;

  public readonly userRoleEnum = UserNewRoleEnum;
  private readonly orderTypeEnum = OrderTypeEnum;
  private readonly minZoomLevel = 5;
  private readonly maxZoomLevel = 19;

  constructor(
    private router: Router,
    public authService: AuthService,
    public mapService: MapService,
    private ngZone: NgZone,
    private userService: UserService,
    private alertController: AlertController,
    private adService: AdService,
    private myOrdersService: MyOrdersService,
    private paymentService: PaymentService,
    private navCtrl: NavController,
    private eventService: EventService
  ) {
    this.center = {
      geometry: [55.763517, 37.605763],
      properties: {},
      options: {
        preset: 'islands#blueCircleDotIconWithCaption',
        iconCaptionMaxWidth: '50'
      }
    }
    this.placemarkOptionsType = {
      [this.orderTypeEnum.MOUNTING]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point1.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.MEASURE]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point2.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.REPAIR]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point4.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.WINDOW_CALC]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point15.svg',
        iconImageSize: [50, 50]
      },
      // Услуги
      [this.orderTypeEnum.DELIVERY]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point5.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.MOVERS]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point6.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.PAINTING]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point7.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.USED_FRAMES]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point8.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.CLIMBING]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point9.svg',
        iconImageSize: [50, 50]
      },

      // Производство
      [this.orderTypeEnum.PVC]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point10.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.ALUM]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point11.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.TREE]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point12.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.EQUIPMENT]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point13.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.AGENCY_LEAD]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/lead.svg',
        iconImageSize: [50, 50]
      },
      [this.orderTypeEnum.MOSQUITO]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point14.svg',
        iconImageSize: [50, 50]
      },
      ['defaultFactory']: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/defaultFactory.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.WHOLESALE_STORE]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/store.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.CLEANING]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point20.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.WELDING_WORKS]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point16.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.GARBAGE_REMOVAL]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point17.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.ADV]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point18.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.WINDOW_FITTINGS]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point19.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.ROLLER_SHUTTERS]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point21.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.BLINDS]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point22.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.GLASS_FIBER]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point23.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.FRAMELESS_GLAZING]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point24.svg',
        iconImageSize: [50, 50]
      },
      [this.userRoleEnum.DOUBLE_GLAZED_WINDOW]: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point25.svg',
        iconImageSize: [50, 50]
      },
      ['defaultServices']: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/defaultServices.svg',
        iconImageSize: [50, 50]
      },
      user: {
        iconLayout: 'default#image',
        iconImageHref: '/assets/map/point3.svg',
        iconImageSize: [50, 50]
      }
    }

    this.isAlertOpen = false
    this.readyMap = this.mapService.readyMap$.asObservable()
  }

  ionViewWillEnter() {
    this.updateLastInactiveTime(this.authService.uid)
    this.filters = this.loadFiltersFromLocalStorage();
    this.tempFilters = { ...this.filters };
    this.orders = [];
    this.getUser();
    this.eventService.onServiceRegistered().pipe(untilDestroyed(this)).subscribe((mode) => {
      this.presentAlertUser();
    });
    this.getStatusPayment();
  }

  cancel() {
    // this.userDetails = JSON.parse(JSON.stringify(this.originalUser));
    this.tempFilters = { ...this.filters };
    this.modal.dismiss(null, 'cancel');
  }

  public getRole(user: any): string {
    if (user.mode === this.usersMode.USERS) {
      return 'user';
    }

    return user.role;
  }

  private getUser(): void {
    this.authService.authState$.pipe(
      // Фильтруем изменения только при смене UID
      distinctUntilChanged((prev, curr) => prev.user?.uid === curr.user?.uid),
      // Отслеживаем UID пользователя
      map(authState => authState.user?.uid || ''),
      // Переключаемся на актуальные данные пользователя
      switchMap(uid => this.authService.getUser(uid)),
      // Фильтруем повторяющиеся данные
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      untilDestroyed(this)
    ).subscribe({
      next: (res) => {
        this.userDetails = res;
        if (this.userDetails?.email && this.userDetails?.phone) {
          this.getByFilters();
        }
      },
      error: (err) => {
        this.getByFilters();
        this.userDetails = null;
      }
    });
  }

  private async presentAlertUser() {
    const alert = await this.alertController.create({
      header: 'Пожалуйста, заполните профиль',
      message: 'Для продолжения работы с сервисом, пожалуйста, заполните профиль.',
      backdropDismiss: false,
      buttons: [
        {
          text: 'ОК',
          handler: () => {
            this.navCtrl.navigateRoot('/tabs/menu/my-profile');
          }
        }
      ]
    });

    await alert.present();
  }

  public openSupport(): void {
    window.location.href = 'https://wa.me/79889770777?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82!%20%D0%9C%D0%BD%D0%B5%20%D0%BD%D1%83%D0%B6%D0%BD%D0%B0%20%D0%BF%D0%BE%D0%BC%D0%BE%D1%89%D1%8C%20%D0%B2%20%D0%B2%D0%B0%D1%88%D0%B5%D0%BC%20%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D0%B5';
  }

  public zoomIn(): void {
    const currentZoom = this.map.getZoom();
    if (currentZoom < this.maxZoomLevel) {
      this.map.setZoom(currentZoom + 1, { checkZoomRange: true });
      this.updateZoomButtonsState(currentZoom + 1);
    }
  }

// Метод для уменьшения зума
  public zoomOut(): void {
    const currentZoom = this.map.getZoom();
    if (currentZoom > this.minZoomLevel) {
      this.map.setZoom(currentZoom - 1, { checkZoomRange: true });
      this.updateZoomButtonsState(currentZoom - 1);
    }
  }

  public setOpen(isOpen: boolean, url: string, queryParams?: any): void {
    this.isAlertOpen = isOpen && !this.userDetails
    if (isOpen)
      if (this.isAlertOpen) {
        this.authService.setupRedirectSuccessAuth(url)
      } else {
        this.router.navigate([url], queryParams);
      }
  }

  public openOrder(id: string) {
    this.router.navigate([`/tabs/map/order-detail/${id}`]);
  }

  public getClassBorder(order: DocumentData): string {
    const userIdWritten = order['written']?.find((x: string) => x === this.authService.uid);
    if (userIdWritten) {
      return 'blockOrdersTop10ItemWritten';
    }

    const userIdSeen = order['seenOrder']?.find((x: string) => x === this.authService.uid);
    if (userIdSeen) {
      return 'blockOrdersTop10ItemSeen';
    }

    return 'blockOrdersTop10Item';
  }

  public async goToCurrentLocation() {
    try {
      const result = await ymaps.geolocation.get({});
      const coordinates = (result.geoObjects.get(0).geometry as ymaps.geometry.Point).getCoordinates();

      if (coordinates) {
        this.ngZone.run(() => {
          this.center.geometry = coordinates;
          this.orders.forEach((x) => {
            x.geometry = x['geometry'] || [0, 0];
            x.distance = this.mapService.getDistance(coordinates, x['geometry']);
          })
          this.readyMap.subscribe((map: ymaps.Map) => {
            this.map.setZoom(19);
            this.updateZoomButtonsState(this.map.getZoom());
          });
        });
      }
    } catch (error) {
      console.error('Не удалось получить геопозицию:', error);
    }
  }

  public openAd(): void {
    this.adService.setAd();
    window.location.href = 'https://wa.me/79262963920?text=%D0%94%D0%BE%D0%B1%D1%80%D1%8B%D0%B9%20%D0%B4%D0%B5%D0%BD%D1%8C!%20%D0%9F%D1%80%D0%BE%D1%88%D1%83%20%D0%B2%D1%8B%D1%81%D0%BB%D0%B0%D1%82%D1%8C%20%D0%B1%D0%BB%D0%B0%D0%BD%D0%BA%20%D0%B0%D0%BD%D0%BA%D0%B5%D1%82%D1%8B%2C%20%D0%B4%D0%BB%D1%8F%20%D0%BF%D0%BE%D0%BB%D1%83%D1%87%D0%B5%D0%BD%D0%B8%D1%8F%20%D1%81%D0%B0%D0%B9%D1%82%D0%B0%20%D0%A0%D0%95%D0%A5%D0%90%D0%A3';
  }

  public updateUser(): void {
    // Сохраняем новые значения
    this.filters = { ...this.tempFilters };
    this.saveFiltersToLocalStorage(this.filters);

    // Перезапрашиваем данные
    this.getByFilters();
    this.cancel();
  }

  public async onMapReady(event: YaReadyEvent<ymaps.Map>): Promise<void> {
    this.map = event.target
    this.map.controls.remove('trafficControl');     // Удаляем кнопку пробок
    this.map.controls.remove('typeSelector');       // Удаляем выбор слоев
    this.map.controls.remove('fullscreenControl');   // Удаляем кнопку расширения на полный экран
    this.map.controls.remove('rulerControl');        // Удаляем линейку
    this.map.controls.remove('geolocationControl');
    this.map.controls.remove('searchControl');
    this.map.controls.remove('zoomControl');
    const result = await ymaps.geolocation.get({})
    result.geoObjects.options.set({
      iconLayout: 'default#image',
      iconImageHref: '/assets/map/location.svg',
      iconImageSize: [50, 50],
      iconImageOffset: [-15, -42]
    });
    result.geoObjects.get(0).properties.set({
      balloonContentBody: ''
    })
    this.map.geoObjects.add(result.geoObjects)
    this.ngZone.run(() => {
      this.center.geometry = (
        result.geoObjects.get(0).geometry as any
      )?.getCoordinates()
    })
  }

  // Метод для обновления состояния кнопок
  private updateZoomButtonsState(currentZoom: number): void {
    this.isZoomInDisabled = currentZoom >= this.maxZoomLevel;
    this.isZoomOutDisabled = currentZoom <= this.minZoomLevel;
  }

  private getByFilters(): void {
    const requests$: Observable<any>[] = [];
    const userRequestsIndexes: number[] = []; // индексы, где были getUsers()

    if (this.filters.factoryServiceUsers) {
      // 1. Factory users
      requests$.push(
        this.userService.getUsers([
          where('mode', '==', this.usersMode.FACTORY),
          where('geometry', '!=', null)
        ])
      );
      requests$.push(
        this.userService.getUsers([
          where('mode', '==', this.usersMode.SERVICES),
          where('geometry', '!=', null)
        ])
      );
      userRequestsIndexes.push(requests$.length - 1, requests$.length - 2);
    }

    if (this.filters.installersDilersUsers) {
      // 2. Installers / Dealers users
      requests$.push(
        this.userService.getUsers([
          where('role', '==', this.userRoleEnum.INSTALLER),
          where('geometry', '!=', null)
        ])
      );
      userRequestsIndexes.push(requests$.length - 1);
    }

    if (this.filters.store) {
      requests$.push(
        this.userService.getUsers([
          where('mode', '==', this.usersMode.STORE),
          where('geometry', '!=', null)
        ])
      );
      userRequestsIndexes.push(requests$.length - 1);
    }

    let ordersIndex: number | null = null;
    if (this.filters.mountOrders || this.filters.windowCalc || this.filters.agencyLead) {
      requests$.push(
        this.myOrdersService.getOrders([
          where('author', '!=', this.authService.uid),
          where('status', '==', OrderStatusEnum.NEW_ORDER),
          where('orderDate', '>=', new Date().toISOString().slice(0, 10))])
      );
      ordersIndex = requests$.length - 1;
    }
    let myOrdersIndex: number | null = null;
    requests$.push(
      this.myOrdersService.getOrders([
        where('author', '==', this.authService.uid),
        where('status', '==', OrderStatusEnum.NEW_ORDER),
        where('orderDate', '>=', new Date().toISOString().slice(0, 10))])
    );
    myOrdersIndex = requests$.length - 1;

    if (requests$.length === 0) {
      this.users = [];
      this.orders = null;
      return;
    }

    forkJoin(requests$)
      .pipe(untilDestroyed(this))
      .subscribe((results: any[]) => {
        // Сборка всех юзеров
        this.users = results
          .filter((_, index) => userRequestsIndexes.includes(index))
          .reduce((acc, usersArray) => acc.concat(usersArray), []);

        // Сборка всех ордеров
        let allOrders = [];

        if (ordersIndex !== null) {
          const arr = [];
          allOrders.push(...results[ordersIndex]);

          if (this.filters.mountOrders) {
            const filter = allOrders.filter((x) => x.type !== this.orderTypeEnum.WINDOW_CALC && x.type !== this.orderTypeEnum.AGENCY_LEAD);
            arr.push(...filter);
          }
          if (this.filters.windowCalc) {
            const filter = allOrders.filter((x) => x.type === this.orderTypeEnum.WINDOW_CALC);
            arr.push(...filter);
          }
          if (this.filters.agencyLead) {
            const filter = allOrders.filter((x) => x.type === this.orderTypeEnum.AGENCY_LEAD);
            arr.push(...filter);
          }

          allOrders = arr;
        }

        if (myOrdersIndex !== null) {
          allOrders.unshift(...results[myOrdersIndex]);
        }

        this.orders = allOrders.length ? this.processOrders(allOrders) : [];
        if (this.userDetails?.region) {
          this.orders = this.orders.filter((x) => x.region === this.userDetails.region);
        }

        // Расчёт геометрии и дистанции
        if (this.orders.length) {
          this.orders.forEach((x) => {
            x.geometry = x['geometry'] || [0, 0];
            x.distance = this.mapService.getDistance(this.center.geometry, x['geometry']);
          });

          this.orders.sort((a, b) => a.distance - b.distance);
        }
      });
  }

  public openProfile(user: any) {
    if (this.userDetails) {
      if (user.mode === this.usersMode.USERS) {
        this.setOpen(true, '/profile-users/' + user['id'], { queryParams: { watch: true } })
      }
      if (user.mode === this.usersMode.FACTORY) {
        if (this.userDetails.mode === this.usersMode.FACTORY) {
          this.setOpen(true, '/profile-factory/' + user['id'], { queryParams: { watch: true } })
        } else {
          this.setOpen(true, '/profile-factory/' + user['id'])
        }
      }
      if (user.mode === this.usersMode.SERVICES) {
        if (this.userDetails.mode === this.usersMode.SERVICES) {
          this.setOpen(true, '/profile-services/' + user['id'], { queryParams: { watch: true } })
        } else {
          this.setOpen(true, '/profile-services/' + user['id'])
        }
      }
      if (user.mode === this.usersMode.AGENCY) {
        if (this.userDetails.mode === this.usersMode.AGENCY) {
          this.setOpen(true, '/profile-agency/' + user['id'], { queryParams: { watch: true } })
        } else {
          this.setOpen(true, '/profile-agency/' + user['id'])
        }
      }
      if (user.mode === this.usersMode.STORE) {
        if (this.userDetails.mode === this.usersMode.STORE) {
          this.setOpen(true, '/profile-store/' + user['id'], { queryParams: { watch: true } })
        } else {
          this.setOpen(true, '/profile-store/' + user['id'])
        }
      }
    } else {
      this.setOpen(true, '/profile-users/' + user['id'], { queryParams: { watch: true } })
    }
  }

  onOpenReels(): void {
    this.router.navigate(['/reels']).then(() => {})
  }

  private getDefaultFilters(): any {
    return {
      factoryServiceUsers: true,
      installersDilersUsers: true,
      agencyLead: true,
      mountOrders: true,
      windowCalc: true,
      store: true
    };
  }

  private loadFiltersFromLocalStorage(): any {
    const saved = localStorage.getItem('userFilters');
    if (saved) {
      return JSON.parse(saved);
    } else {
      const defaultFilters = this.getDefaultFilters();
      this.saveFiltersToLocalStorage(defaultFilters);
      return defaultFilters;
    }
  }

  private saveFiltersToLocalStorage(filters: any): void {
    localStorage.setItem('userFilters', JSON.stringify(filters));
  }

  private getStatusPayment(): void {
    this.paymentService.getStatusPayment().pipe(untilDestroyed(this)).subscribe((res) => {
      this.paymentStatus = res.isActive as boolean;
    });
  }

  private moveSeenOrdersToEnd(orders: any, currentUserId: string) {
    return [
      ...orders.filter((order: any) => !(order.written && order.written.includes(currentUserId))),
      ...orders.filter((order: any) => order.written && order.written.includes(currentUserId)),
    ];
  }


// Вынесенная функция для фильтрации и сортировки заказов
  private processOrders(orders: any[]): any[] {
    orders = this.moveSeenOrdersToEnd(orders, this.authService.uid);
    return orders.filter(item => {
      if (item['hideOrdersIdsUser']) {
        return !item['hideOrdersIdsUser'].includes(this.authService.uid);
      }
      return item;
    });
  }

  private updateLastInactiveTime(id: string): void {
    if (id) {
      this.userService.updateLastInactiveTime(id, getMoscowTime());
    }
  }
}
