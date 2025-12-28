import {Component, OnInit} from '@angular/core'
import {AuthService} from '../../services/auth.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Observable, ReplaySubject, switchMap, tap} from 'rxjs';
import {map} from 'rxjs/operators';
import {OrdersService} from 'src/app/services/orders.service'
import {MapService} from '../../services/map.service';
import {PhoneMaskPipe} from '../../pipes/phone-mask.pipe';
import {UsersModeEnum} from '../../enums/users-mode.enum';
import {FeedbackService} from '../../services/my-service/feedback.service';
import moment from 'moment/moment';
import {UserStoreService} from '../../services/store-service/user-store.service';

@Component({
    selector: 'app-my-profile',
    templateUrl: './my-profile.component.html',
    styleUrls: ['./my-profile.component.scss'],
    standalone: false
})
@UntilDestroy()
export class MyProfileComponent implements OnInit {
  public item$: Observable<any>;
  public searchAddress$: ReplaySubject<string>;
  public searchAddressList$: Observable<{ [key: string]: any }[]>;
  public regions$: Observable<any | undefined>;
  public uid: string;
  public hasError: boolean = true;
  public feedbacks: any[] = [];
  public items: any;
  public usersMode = UsersModeEnum;
  public ratingValue: number = 0;
  public stars: { full: boolean, half: boolean }[] = [];

  constructor(public authService: AuthService,
              private ordersService: OrdersService,
              private mapService: MapService,
              private userStoreService: UserStoreService,
              private feedbackService: FeedbackService,
              private phoneMaskPipe: PhoneMaskPipe) {
  }

  ngOnInit() {
    this.regions$ = this.ordersService.regions().pipe(untilDestroyed(this));

    this.item$ = this.authService.authState$.pipe(
      tap((x: any) => {
        if (x?.user) {
          this.uid = x.user.uid
          return x;
        }
      }),
      switchMap(item => this.authService.get(item.user?.uid || '')),
      map((x) => {
        if (!x['mode']) {
          x['mode'] = this.usersMode.USERS;
        }
        x['phone'] = this.phoneMaskPipe.transform(x['phone']);
        this.items = x;
        this.getFeedbacks();
        return x;
      })
    );

    this.searchAddress$ = new ReplaySubject(1);
    this.searchAddressList$ = this.mapService.suggest(this.searchAddress$).pipe(untilDestroyed(this));
  }

  public get getLikes(): number {
    return this.feedbacks.filter(x => x.checks === 'like').length + (this.items?.like ? 1 : 0);
  }

  public get getDislikes(): number {
    return this.feedbacks.filter(x => x.checks === 'dislike').length + (this.items?.dislike ? 1 : 0);
  }

  public infoName(isInput = false): string {
    if (this.items['mode'] === this.usersMode.FACTORY) {
     return isInput ? 'производства' : 'производстве';
    } else if (this.items['mode'] === this.usersMode.AGENCY) {
      return 'компании';
    } else if (this.items['mode'] === this.usersMode.STORE) {
      return isInput ? 'магазина' : 'магазине';
    } else {
      return '';
    }
  }

  private getFeedbacks(): void {
    this.feedbackService.getFeedbacks(this.uid).pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res) {
        this.feedbacks = res.data.filter((x: any) => x.checks === 'dislike'
          || x.checks === 'like').sort((a: any, b: any) => moment(b.date).valueOf() - moment(a.date).valueOf());

      }
      this.calculateRating();
    })
  }

  private calculateRating(): void {
    const likes = this.getLikes;
    const dislikes = this.getDislikes;
    const total = likes + dislikes;

    if (total === 0) {
      this.ratingValue = 0;
      this.stars = Array(5).fill(null).map(() => ({full: false, half: false}));
      return;
    }

    // Рассчитываем рейтинг от 0 до 5
    this.ratingValue = (likes * 5 + dislikes * 1) / total;

    // Подготавливаем данные для звезд
    this.stars = [];
    for (let i = 1; i <= 5; i++) {
      if (this.ratingValue >= i) {
        this.stars.push({full: true, half: false}); // Полная звезда
      } else if (this.ratingValue > i - 1) {
        this.stars.push({full: false, half: true}); // Половина звезды
      } else {
        this.stars.push({full: false, half: false}); // Пустая звезда
      }
    }
  }
}
