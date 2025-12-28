import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Observable, tap } from 'rxjs'
import { AuthService } from 'src/app/services/auth.service'
import { ViewWillEnter } from '@ionic/angular';
import { regions } from '../../pagesAdmin/users/users.page';
import { FeedbackService } from '../../services/my-service/feedback.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import moment from 'moment/moment';

enum ProfileTabEnum {
  FEEDBACK = 'FEEDBACK',
  CERTIFICATE = 'CERTIFICATE'
}

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    standalone: false
})

@UntilDestroy()
export class ProfilePage implements ViewWillEnter {
  public item$: Observable<any | undefined>;
  public activeTab: ProfileTabEnum = ProfileTabEnum.CERTIFICATE;
  public tabs = ProfileTabEnum;
  public feedback: any[] = [];
  public role: string | null;
  public isMyRating: string | null;
  public id: string;
  public ratingValue: number = 0;
  public stars: {full: boolean, half: boolean}[] = [];

  constructor (
    public authService: AuthService,
    private route: ActivatedRoute,
    private feedbackService: FeedbackService,
  ) {
  }

  ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.role = this.route.snapshot.paramMap.get('role') || null;
    this.isMyRating = this.route.snapshot.paramMap.get('myRating') || null;
    this.item$ = this.authService.user(this.id);
    this.activeTab = ProfileTabEnum.FEEDBACK;
    this.getFeedbacks();
  }

  public changeTab(tab: ProfileTabEnum): void {
    this.activeTab = tab;
  }

  public get getLikes(): number {
    return this.feedback.filter((x) => x.checks === 'like').length ?? 0;
  }

  public get getDislikes(): number {
    return this.feedback.filter((x) => x.checks === 'dislike').length ?? 0;
  }

  public getRegionName(id: number) {
    const region = regions.find(r => r.id === id);
    return region ? region.name : 'Регион не найден';
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
}
