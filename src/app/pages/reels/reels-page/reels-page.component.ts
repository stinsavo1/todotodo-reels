import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Share } from '@capacitor/share';
import { take } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Reel } from '../../../interfaces/reels.interface';
import { VideoService } from '../../../services/video.service';

@Component({
  selector: 'app-reels-page',
  templateUrl: './reels-page.component.html',
  styleUrls: ['./reels-page.component.scss'],
  standalone: false,
})
export class ReelsPageComponent implements OnInit {
  videoList:Reel[] = [];
  index = 1;
  showSpinner = false;
  userId: string;
  isCommentsOpen: boolean=false;
  selectedVideoId: string='';
  isMuted = true;
  private firestore: Firestore = inject(Firestore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly Array = Array;
  public isCreateOpen = false;


  constructor(private videoService: VideoService, private auth: Auth) {

  }

  ngOnInit(): void {
    this.userId = this.auth.currentUser.uid;
    authState(this.auth).pipe(
      filter(user => user !== null),
      take(1)
    ).subscribe(user => {
      this.videoService.loadInitialData(this.firestore, 10).then();
    });

    this.videoService.videoList$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.videoList = data;
        console.log(data);
      }
    });
    this.videoService.isDowload$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {

        this.showSpinner = !data;
        setTimeout(() => {
          const swiperEl = document.querySelector('swiper-container');
          if (swiperEl) {
            (swiperEl as any).swiper.slideTo(0);
          }
        }, 100);
      }
    });
  }

  onSlideChange(event: any) {
    const swiper = event.detail[0];
    const currentIndex = swiper.activeIndex;
    this.managePlayers(currentIndex);

    if (currentIndex >= this.videoList.length - 2) {
      this.videoService.loadNextBatch().then();
    }
  }

  managePlayers(activeIndex: number) {
    const slides = document.querySelectorAll('swiper-slide');

    slides.forEach((slide, index) => {
      const video = slide.querySelector('video') as HTMLVideoElement;
      if (!video) return;

      if (index === activeIndex) {
        this.videoService.trackView(video.id).then();
        video.muted = true;
        video.play().catch(e => console.log('Ждем клика пользователя'));
      } else {
        video.pause();
        if (Math.abs(index - activeIndex) > 3) {
          video.preload = 'none';
        } else {
          video.preload = 'auto';
        }
      }
    });
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    console.log('ismutes', this.isMuted);

    const videos = document.querySelectorAll('video');
    console.log('Найдено видео элементов:', videos.length);
    videos.forEach(video => {
      video.muted = this.isMuted;
      video.volume = this.isMuted ? 0 : 1;
    });
  }

  toggleLike(video: Reel) {
    this.videoService.toggleLike(video).then();
  }



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

  public openComments(video:Reel): void {
    const content = document.querySelector('ion-router-outlet');
    content?.classList.add('main-blur-effect');
    this.selectedVideoId=video.id;
    this.isCommentsOpen = true;

  }

  public closeModal(): void {
    this.isCommentsOpen = false;
    const content = document.querySelector('ion-router-outlet');
    content?.classList.remove('main-blur-effect');
  }
}
