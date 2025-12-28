import { Component, OnInit } from '@angular/core'
import { DocumentData } from '@angular/fire/firestore'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable } from 'rxjs'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { FormatDatePipe } from '../../pipes/format-date.pipe';
import moment from 'moment/moment';
import { UsersModeEnum } from '../../enums/users-mode.enum';
import { removeEmpty } from '../../components/utils/functions';
import { FeedbackService } from '../../services/my-service/feedback.service';
import { OrdersService } from "../../services/orders.service";
import { AuthService } from "../../services/auth.service";
import { RegionEnum } from "../../enums/regions.enum";
@Component({
    selector: 'app-user',
    templateUrl: './user.page.html',
    styleUrls: ['./user.page.scss'],
    standalone: false
})
@UntilDestroy()
export class UserPage implements OnInit {
  public presentingElement: any = null
  public uid: string
  public item$: Observable<DocumentData | undefined>
  public regions$: Observable<any | undefined>;
  private usersMode = UsersModeEnum;
  private feedbacks: any[] = [];
  public like!: number;
  public dislike!: number;
  public isRegionModerators: boolean;
  public isModerators: boolean;

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private formatDatePipe: FormatDatePipe,
    private feedbackService: FeedbackService
  ) {
  }

  public ngOnInit(): void {
    this.isRegionModerators = this.authService.isRegionModerator;
    this.isModerators = this.authService.isModerators;
    this.presentingElement = document.querySelector('.ion-page');
    this.uid = this.route.snapshot.paramMap.get('uid') || ''
    this.item$ = this.authService.user(this.uid).pipe(untilDestroyed((this)), map((user: any) => {
      this.like = this.feedbacks.filter((x) => x.checks === 'like').length;
      this.dislike = this.feedbacks.filter((x) => x.checks === 'dislike').length;
      user.createDate = this.formatDatePipe.transform(user.createDate || user?.createdAt, 'DD.MM.YYYY HH:mm');
      user.lastInactiveTime = user.lastInactiveTime ? this.formatDatePipe.transform(user.lastInactiveTime, 'DD.MM.YYYY HH:mm'): '-';
      user.finishPeriod = new Date(user.finishPeriod);
      user.finishPeriod = this.removeTime(user.finishPeriod);
      return user;
    }));
    this.regions$ = this.ordersService.regions().pipe(untilDestroyed(this));
    this.getFeedbacks();

  }

  public onRegionChange(event: any, item: any): void {
    item['region'] = event.detail.value;
  }

  public saveUser(uid: string, email: string, item: any): void {
    delete item.createDate;
    if (item.finishPeriod) {
      item.finishPeriod = moment(item.finishPeriod, 'DD.MM.YYYY HH:mm:ss').toISOString();
    }
    if (item.role === 'М/C'
      || item.role === 'ПВХ'
      || item.role === 'Стеклокомпозит'
      || item.role === 'Безрамное остекление'
      || item.role === 'Жалюзи'
      || item.role === 'Рольставни'
      || item.role === 'Стеклопакеты'
      || item.role === 'ALUM'
      || item.role === 'Дерево') {
      item.mode = this.usersMode.FACTORY;
    } else if (item.role === 'Доставка'
      || item.role === 'Покраска'
      || item.role === 'Клининг'
      || item.role === 'Сварочные работы'
      || item.role === 'Вывоз мусора'
      || item.role === 'Реклама и маркетинг'
      || item.role === 'Оконная комплектация'
      || item.role === 'Альпинизм'
      || item.role === 'Грузчики'
      || item.role === 'Покупка Б/У рам') {
      item.mode = this.usersMode.SERVICES;
    } else if (item.role === 'Агенство') {
      item.mode = this.usersMode.AGENCY;
    } else {
      item.mode = this.usersMode.USERS;
    }
    this.authService.save(uid, email, removeEmpty(item), false, '/admin/tabs/users');
  }

  private getFeedbacks(): void {
    this.feedbackService.getFeedbacks(this.uid).pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.feedbacks = res.data;
    });
  }

  private removeTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  focus(e: any, el: any) {
    el.click()
  }
}
