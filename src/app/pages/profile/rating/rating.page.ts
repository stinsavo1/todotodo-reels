import {Component} from '@angular/core'
import {ActivatedRoute} from '@angular/router'
import {Observable, Subject, takeUntil} from 'rxjs'
import {AuthService} from 'src/app/services/auth.service'
import {ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import moment from 'moment/moment';
import {FeedbackService} from '../../../services/my-service/feedback.service';
import {UserService} from "../../../services/my-service/user.service";

@Component({
    selector: 'app-rating',
    templateUrl: './rating.page.html',
    styleUrls: ['./rating.page.scss'],
    standalone: false
})

export class RatingPage implements ViewWillEnter, ViewWillLeave {
  public item$: Observable<any | undefined>;
  public feedback: any[] = [];
  public ratingValue: number = 0;
  public stars: { full: boolean, half: boolean }[] = [];
  private id: string;
  public watch: string;
  public user: any;
  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private feedbackService: FeedbackService,
    private userService: UserService,
  ) {
  }

  ionViewWillLeave() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.watch = this.route.snapshot.paramMap.get('watch') || '';
    this.item$ = this.authService.user(this.id);
    this.getUser();
    this.getFeedbacks();
  }


  public get getLikes(): number {
    return this.feedback.filter(x => x.checks === 'like').length + (this.user?.like ? 1 : 0);
  }

  public get getDislikes(): number {
    return this.feedback.filter(x => x.checks === 'dislike').length + (this.user?.dislike ? 1 : 0);
  }

  private getFeedbacks(): void {
    this.feedbackService.getFeedbacks(this.id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res) {
        this.feedback = res.data.filter((x: any) => x.checks === 'dislike'
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

  private getUser(): void {
    this.userService.getUserById(this.id).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      this.user = res;
      this.calculateRating();
    })
  }
}
