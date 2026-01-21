import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Firestore } from '@angular/fire/firestore';
import { finalize, take } from 'rxjs';
import { UserStoreService } from '../../../services/store-service/user-store.service';
import { Reel } from '../interfaces/reels.interface';
import { SubscriptionsData, UsersPreferencesService } from '../services/users-preferences.service';

@Component({
  selector: 'app-reels-description',
  templateUrl: './reels-description.component.html',
  styleUrls: ['./reels-description.component.scss'],
  standalone: false
})
export class ReelsDescriptionComponent implements OnInit, OnChanges {
  @ViewChild('descText', { static: false }) set content(content: ElementRef) {
    if (content) {
      this.descElement = content;
      setTimeout(() => this.checkTextTruncated(), 50);
    }
  }

  @Input() reel: Reel;
  @Input() userId: string;
  @Output() isExpended = new EventEmitter<boolean>();
  isDescriptionExpanded = false;
  descElement: ElementRef | undefined = undefined;
  isTruncated: boolean = false;
  userSubscriptions: SubscriptionsData | null = null;
  isSubscribe = false;
  hideSubscr = true;
  loading = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor(private usersPreferencesService: UsersPreferencesService,
              private cdr: ChangeDetectorRef,
              ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reel'] && !changes['reel'].firstChange) {
      this.reel = changes['reel'].currentValue;

      this.isSubscribe = this.checkSubscriber(this.reel?.userId);
      if (this.reel?.userId && this.userId) {
        this.hideSubscr = this.reel.userId === this.userId;
      }
      this.checkTextTruncated();
    }
  }

  ngOnInit() {
    this.usersPreferencesService.currentSubscribtions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.userSubscriptions = data;
        this.isSubscribe = this.checkSubscriber(this.reel?.userId);
        this.cdr.markForCheck();
      }
    });

  }

  toggleDescription(event: Event) {
    event.stopPropagation();
    if (this.isTruncated) {
      this.isDescriptionExpanded = !this.isDescriptionExpanded;
      this.isExpended.emit(this.isDescriptionExpanded);
    }
  }

  public updateSubscriber(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.loading=true;

    const action$ = !this.isSubscribe
      ? this.usersPreferencesService.subscribeToUser(this.userId, this.reel)
      : this.usersPreferencesService.unsubscribeFromUser(this.userId, this.reel);

    action$
      .pipe(take(1), finalize(()=>this.loading=false))
      .subscribe({
        next: () => {
          console.log(
            this.isSubscribe ? 'Subscribed successfully' : 'Unsubscribed successfully'
          );
        },
        error: (err) => console.error(err)
      });
  }

  private checkTextTruncated() {
    if (!this.descElement) return;
    requestAnimationFrame(() => {
      const el = this.descElement.nativeElement;
      this.isTruncated = el.scrollHeight > el.clientHeight;
    });
  }

  private checkSubscriber(targetUserId: string): boolean {
    if (!targetUserId) {
      return false;
    }
    const existedSub = this.userSubscriptions?.subscriptions?.filter((sub)=>sub === targetUserId);
    if (existedSub && existedSub?.length > 0) {
      return existedSub.includes(targetUserId);
    }
    return false;
  }
}
