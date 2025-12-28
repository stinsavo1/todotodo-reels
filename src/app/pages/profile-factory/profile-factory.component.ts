import { Component } from '@angular/core'
import { ViewWillEnter } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Observable, take, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { regions } from '../../pagesAdmin/users/users.page';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaymentService } from '../../services/payment.service';
import moment from 'moment/moment';
import {FeedbackService} from "../../services/my-service/feedback.service";
import {UserService} from "../../services/my-service/user.service";
import { UsersModeEnum } from "../../enums/users-mode.enum";

@Component({
    selector: 'app-profile-factory',
    templateUrl: './profile-factory.component.html',
    styleUrls: ['./profile-factory.component.scss'],
    standalone: false
})

@UntilDestroy()
export class ProfileFactoryComponent implements ViewWillEnter {
  public item$: Observable<any>;
  public hideButton = true;
  public statusPay$: Observable<boolean>;
  public id: string;
  private orderStatusEnum = OrderStatusEnum;
  public feedback: any[] = [];
  public ratingValue: number = 0;
  public stars: {full: boolean, half: boolean}[] = [];
  public user: any;
  public profileType: UsersModeEnum;
  public orderStatus: OrderStatusEnum;
  public title: string;
  public userMode = UsersModeEnum;

  constructor(private authService: AuthService,
              private paymentService: PaymentService,
              private router: Router,
              private feedbackService: FeedbackService,
              private userService: UserService,
              private route: ActivatedRoute) {
  }

  ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.profileType = this.route.snapshot.data['profileType'];
    this.item$ = this.authService.user(this.id);
    const urlParams = new URLSearchParams(window.location.search);
    const watch = urlParams.get('watch');
    if (watch) {
      this.hideButton = false;
    }
    this.statusPay$ = this.paymentService.getStatusPaymentById(this.id);
    this.getUser()
    this.getFeedbacks();

    if (this.profileType === this.userMode.AGENCY) {
      this.orderStatus = this.orderStatusEnum.PRIVATE_AGENCY;
      this.title = 'Написать агенству';
    } else if (this.profileType === this.userMode.FACTORY) {
      this.orderStatus = this.orderStatusEnum.PRIVATE_FACTORY;
      this.title = 'Написать на производство';
    } else if (this.profileType === this.userMode.SERVICES) {
      this.orderStatus = this.orderStatusEnum.PRIVATE_SERVICES;
      this.title = 'Написать поставщику услуг';
    }
  }

  public openUrl(url: string): void {
    // Проверяем, начинается ли с http:// или https://
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    window.location.href = url;
  }

  public openItems(): void {
    this.router.navigate([`/store-items/${this.id}`]);
  }

  // public openChat(): void {
  //   const existingIDs = [this.authService.uid, this.id,];
  //   const uniqueID = this.generateUniqueID(existingIDs);
  //   const id: string = `${this.authService.uid}_${this.id}_${uniqueID}`;
  //   const currentDate = new Date();
  //   const formattedDate = currentDate.toISOString().split('T')[0];
  //   const model = {
  //     id: uniqueID,
  //     orderDate: formattedDate,
  //   }
  //   this.dialogService.getDialogId(id)
  //     .pipe(
  //       switchMap((dialog) =>
  //         this.messagesService.addPrivateDialog(this.id, model, this.orderStatus).pipe(untilDestroyed(this))))
  //     .subscribe(() => {
  //       this.router.navigate(['/chat/' + id + '/' + this.id + `/true`])
  //     });
  // }

  public getRegionName(id: number) {
    const region = regions.find(r => r.id === id);
    return region ? region.name : 'Регион не найден';
  }

  private simpleHash(str: string) {
    let hash = 5381; // Начальное значение
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + charCode; // hash * 33 + charCode
    }
    return hash >>> 0; // Преобразуем к беззнаковому 32-битному числу
  }

  private generateUniqueID(ids: string[]) {
    // Конкатенируем и сортируем ID
    const concatenated = ids.sort().join('');
    // Генерируем хэш
    const hash = this.simpleHash(concatenated);
    return hash.toString(16); // Преобразуем в шестнадцатеричную строку
  }

  private getFeedbacks(): void {
    this.feedbackService.getFeedbacks(this.id).pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res) {
        this.feedback = res.data.filter((x: any) => x.checks === 'dislike'
          || x.checks === 'like').sort((a: any, b: any) => moment(b.date).valueOf() - moment(a.date).valueOf());
      }
      this.calculateRating();
    })
  }

  private get getLikes(): number {
    return this.feedback.filter(x => x.checks === 'like').length + (this.user?.like ? 1 : 0);
  }

  private get getDislikes(): number {
    return this.feedback.filter(x => x.checks === 'dislike').length + (this.user?.dislike ? 1 : 0);
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

  private getUser(): void {
    this.userService.getUserById(this.id)
      .pipe(
        take(1), // Получаем данные только один раз
        untilDestroyed(this)
      )
      .subscribe((res: any) => {
        this.user = res;
        if (this.user.id !== this.authService.uid) {
          this.userService.incrementCount(this.user.id).then();
        }
        this.calculateRating();
      });
  }

  public shareContent() {
    navigator.share({
      url: window.location.href
    }).then();
  }

  protected readonly Text = Text;
  protected readonly tap = tap;
}
