import { Component } from '@angular/core'
import { ViewWillEnter } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { regions } from '../../pagesAdmin/users/users.page';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { MessagesService } from '../../services/messages.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaymentService } from '../../services/payment.service';
import {FeedbackService} from "../../services/my-service/feedback.service";
import moment from 'moment/moment';
import {UserService} from "../../services/my-service/user.service";

@Component({
  selector: 'app-profile-services',
  templateUrl: './profile-services.component.html',
  styleUrls: ['./profile-services.component.scss']
})

@UntilDestroy()
export class ProfileServicesComponent implements ViewWillEnter {
  public item$: Observable<any>;
  public hideButton = true;
  public statusPay$: Observable<boolean>;
  public id: string;
  public feedback: any[] = [];
  public ratingValue: number = 0;
  public stars: {full: boolean, half: boolean}[] = [];
  public user: any;

  constructor(private authService: AuthService,
              private paymentService: PaymentService,
              private feedbackService: FeedbackService,
              private userService: UserService,
              private route: ActivatedRoute) {
  }

  ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.item$ = this.authService.user(this.id);
    const urlParams = new URLSearchParams(window.location.search);
    const watch = urlParams.get('watch');
    if (watch) {
      this.hideButton = false;
    }
    this.statusPay$ = this.paymentService.getStatusPaymentById(this.id);
    this.getUser()
    this.getFeedbacks();
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
  //         this.messagesService.addPrivateDialog(this.id, model, this.orderStatusEnum.PRIVATE_SERVICES).pipe(untilDestroyed(this))))
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
    return this.feedback.filter((x) => x.checks === 'like').length + this.user?.like ?? 0;
  }

  private get getDislikes(): number {
    return this.feedback.filter((x) => x.checks === 'dislike').length + this.user?.dislike ?? 0;
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
    this.userService.getUserById(this.id).pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.user = res;
    })
  }
}
