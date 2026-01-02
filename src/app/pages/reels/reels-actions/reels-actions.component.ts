import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Share } from '@capacitor/share';
import { ModalController } from '@ionic/angular';
import { HideDetailModalComponent } from '../hide-detail-modal/hide-detail-modal.component';
import { Reel } from '../interfaces/reels.interface';
import { ReelsAdditionalActionsComponent } from '../reels-additional-actions/reels-additional-actions.component';
import { ReelsReportModalComponent } from '../reels-report-modal/reels-report-modal.component';
import { LikesService } from '../services/likes.service';
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
  @Input() userId: string;
  @Output() openComments = new EventEmitter<string>()
  public isDescriptionExpanded = false;
  isTruncated = false;
  isMuted = true;
  private selectedVideoId: string;
  private isCommentsOpen = false;

  constructor(private videoService: VideoService,
              private likesService: LikesService,
              private modalCtrl: ModalController,
              private usersPreferencesService:UsersPreferencesService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
        if (changes['reel']) {
          this.reel=changes['reel'].currentValue;
          console.log('change',this.reel);
        }
    }

  ngOnInit() {
  }




  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.muted = this.isMuted;
      video.volume = this.isMuted ? 0 : 1;
    });
  }

  toggleLike(video: Reel) {
    console.log(video.url);
    this.likesService.toggleLike(video);
  }

  protected readonly Array = Array;

  async shareVideo(video: Reel) {
    try {
      console.log(222, video);
      await Share.share({
        url: video.url, //todo mn update to full path in application
      });
    } catch (error) {
      console.error('Ошибка при попытке поделиться:', error);
    }
  }

  public openModalComments(video: Reel): void {
    this.openComments.emit(video.id);

  }

  async openModalAdditionalActions(video: Reel) {
    const modal = await this.modalCtrl.create({
      component: ReelsAdditionalActionsComponent,
      cssClass: 'custom-fixed-modal small',
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data?.action === 'open_hide_details') {
      this.openHideDetailModal(video).then();
    }
    if (data?.action === 'open_report_details') {
      this.openReportModal(video).then();
    }
  }

  async openReportModal(video: Reel) {
    const modal = await this.modalCtrl.create({
      component: ReelsReportModalComponent,
      componentProps: { video },
      cssClass: '',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      console.log(data);
    }
  }

  async openHideDetailModal(video: Reel) {
    const modal = await this.modalCtrl.create({
      component: HideDetailModalComponent,
      componentProps: { video },
      cssClass: 'custom-fixed-modal small',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.isReady) {
      const filteredReels = this.videoService.videoListSubject.value.filter((reel)=>{
        if (data.type === 'video') {
              return reel.id !== video.id;

            }
            if (data.type === 'author') {
              return reel.userId !== video.userId;
            }
            return true;
      });
      this.videoService.videoListSubject.next(filteredReels)
      this.usersPreferencesService.addToLocalCache(data.type,data.id);
    }
  }
}
