import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import { ModalController, Platform, PopoverController } from '@ionic/angular';
import { exhaustMap, from, Subject, switchMap, take } from 'rxjs';
import { UserStoreService } from '../../../services/store-service/user-store.service';
import { HideDetailModalComponent } from '../hide-detail-modal/hide-detail-modal.component';
import { Reel } from '../interfaces/reels.interface';
import { ReelsAdditionalActionsComponent } from '../reels-additional-actions/reels-additional-actions.component';
import { ReelsReportModalComponent } from '../reels-report-modal/reels-report-modal.component';
import { ReelsShareModalComponent } from '../reels-share-modal/reels-share-modal.component';
import { LikesService } from '../services/likes.service';
import { ShareService } from '../services/share.service';
import { UsersPreferencesService } from '../services/users-preferences.service';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-reels-actions',
  templateUrl: './reels-actions.component.html',
  styleUrls: ['./reels-actions.component.scss'],
  standalone: false
})
export class ReelsActionsComponent implements OnInit, OnChanges {
  @Input() reel: Reel;
  @Input() activeIndex: number;
  @Output() openComments = new EventEmitter<void>();
  isMuted = true;
  userId:string;
  private toggleLikeSubject = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(private videoService: VideoService,
              private likesService: LikesService,
              private shareService: ShareService,
              private modalCtrl: ModalController,
              private platform:Platform,
              private userService:UserStoreService,
              private popoverCtrl:PopoverController,
              private usersPreferencesService: UsersPreferencesService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reel']) {
      this.reel = changes['reel'].currentValue;
    }
    if (changes['activeIndex']) {
      this.activeIndex = changes['activeIndex'].currentValue;
    }
  }

  ngOnInit() {
    this.userService.getUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user)=>{
     this.userId = user.id;
    })

    this.toggleLikeSubject.pipe(
      exhaustMap(() => this.likesService.toggleLike(this.reel, this.userId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
       if (data) {
          this.videoService.updateReels(data, this.activeIndex);
          this.videoService.currentReel$.next(data);
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.muted = this.isMuted;
      video.volume = this.isMuted ? 0 : 1;
    });
  }

  toggleLike() {
    this.toggleLikeSubject.next();
  }

  protected readonly Array = Array;

  shareVideo(event: any) {
    const isMobile = this.platform.is('ios') || this.platform.is('android');
    if (!isMobile) {
      from(this.popoverCtrl.create({
        component: ReelsShareModalComponent,
        translucent: true,
        alignment: 'center',
        reference: 'event',
        side:'bottom',
        arrow: false,
        event: event,
        cssClass: 'share-popover',
        componentProps: {
          videoUrl: this.reel.url,
        }
      })).pipe(
        switchMap(popover => from(popover.present())),
        take(1)
      ).subscribe();
    } else {
      this.shareService.openShareSheet$(this.reel).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }


  }

  public openModalComments(): void {
    this.openComments.emit();

  }

  async openModalAdditionalActions(event) {

    const modal = await this.modalCtrl.create({
      component: ReelsAdditionalActionsComponent,
      cssClass: 'custom-fixed-modal small',
      componentProps: {
        video: this.reel,
        activeIndex:this.activeIndex,
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data?.action === 'open_hide_details') {
      this.openHideDetailModal(this.reel).then();
    }
    if (data?.action === 'open_report_details') {
      this.openReportModal(this.reel).then();
    }
  }

  async openReportModal(video: Reel) {
    const modal = await this.modalCtrl.create({
      component: ReelsReportModalComponent,
      componentProps: { video },
      cssClass: 'report-modal',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      console.log(data);
    }
  }

  isLikedByUser(): boolean {
    return Array.isArray(this.reel?.likes) && this.reel?.likes.includes(this.userId);
  }

  getLikeIcon(): string {
    const likesCount = Array.isArray(this.reel?.likes) ? this.reel.likes.length : 0;
    if (this.isLikedByUser()) {
      return 'heart';
    }
    if (likesCount > 0) {
      return 'heart';
    }
    return 'heart-outline';
  }

  async openHideDetailModal(video: Reel) {
    const modal = await this.modalCtrl.create({
      component: HideDetailModalComponent,
      componentProps: { video, activeIndex:this.activeIndex },
      cssClass: 'custom-fixed-modal hide-detail',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.isReady) {
      if (data.type === 'video') {
        this.videoService.deleteReels(this.activeIndex);
      }

        if (data.type === 'author') {
          this.videoService.hideAuthor(data.id,data.activeIndex);
        }
      this.usersPreferencesService.addToLocalCache(data.type, data.id);
    }
  }
}
