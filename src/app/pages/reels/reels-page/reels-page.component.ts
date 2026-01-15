import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalController } from '@ionic/angular';
import { delay, filter, switchMap } from 'rxjs/operators';
import { Swiper } from 'swiper';
import { Mousewheel, Navigation, Pagination, Virtual } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { UserInterface } from '../../../interfaces/user.interface';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/my-service/user.service';
import { ResizeService } from '../../../services/resize.service';
import { ReelsHelper } from '../helper/reels.helper';
import { CommentsWithAvatar } from '../interfaces/comments.interface';

import { Reel } from '../interfaces/reels.interface';
import { ReelsCommentsComponent } from '../reels-comments/reels-comments.component';
import { ReelsCreateComponent } from '../reels-create/reels-create.component';
import { CommentsService } from '../services/comments.service';
import { UsersPreferencesService } from '../services/users-preferences.service';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-reels-page',
  templateUrl: './reels-page.component.html',
  styleUrls: ['./reels-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReelsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('swiperRef', { static: true }) swiperEl!: ElementRef;

  swiperInstance?: Swiper;
  reels: Reel[] = [];
  showSpinner = false;
  userId: string;
  isMuted = true;
  private readonly destroyRef = inject(DestroyRef);
  protected readonly Array = Array;
  currentReel: Reel;
  comments: CommentsWithAvatar[] = [];
  currentActiveIndex: number;

  constructor(private videoService: VideoService,
              private cdr: ChangeDetectorRef,
              public resizeService: ResizeService,
              private commentsService: CommentsService,
              private modalCtrl: ModalController,
              private usersService: UserService,
              private auth: AuthService,
              private usersPreferencesService: UsersPreferencesService,) {
    this.reels = this.videoService.reels;

  }

  ngAfterViewInit(): void {

  }

  ngOnInit(): void {

    this.auth.authState$.pipe(
      switchMap((userData) => this.usersService.getUserById(userData.user.uid)),
      takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: UserInterface) => {
        console.log('user pre',data,);
        this.userId=data.id;
        if (data.subscribersIds?.length > 0) {

          this.usersPreferencesService.currentSubscribtions$.next({
            subscribers: data.subscribersIds,
            count: data.subscribersCount
          });
        }
      }
    });
    this.initVideoList();

    this.videoService.isLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.showSpinner = data;
        this.cdr.markForCheck();

      }
    });

    this.videoService.currentReel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(updatedReels => {
      this.currentReel = { ...updatedReels };
      this.commentsService.loadComments(this.currentReel.id).then();
      this.cdr.markForCheck();

    });
    this.videoService.videoListUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (forceUpdate) => {
        if (this.swiperInstance) {
          this.videoService.updateSwiper(this.swiperInstance, forceUpdate);
          this.handleVideoPlayback();
        }
        this.cdr.markForCheck();
      }
    });

    this.videoService.uploadedVideoReady$.pipe(delay(0), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reel) => {
        if (this.swiperInstance) {
          this.videoService.currentReel$.next(reel);
          this.swiperInstance.slideNext();
        }
      }
    });

    this.commentsService.comments$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.comments = data;
      this.cdr.markForCheck();
    });

  }

  ngOnDestroy(): void {
    const swiper = this.swiperEl.nativeElement.swiper;
    if (swiper) {
      this.clearPreviousVideoListener(swiper);
    }
  }

  private initSwiper(): void {
    const swiperParams: SwiperOptions = {
      modules: [Virtual, Navigation, Pagination, Mousewheel],
      virtual: {
        enabled: true,
        addSlidesBefore: 3,
        addSlidesAfter: 3,
        slides: this.reels,
        renderSlide: (slide: Reel, index) => {
          console.log('Rendering:', index);
          return ReelsHelper.renderSlide(slide, index, this.isMuted);
        },
      },

      on: {
        slideChange:(swiper)=>{
          const activeIndex = swiper.activeIndex;
          const videos = document.querySelectorAll('video');

          if (this.videoService.isIOS()) {

            [activeIndex + 1, activeIndex + 2].forEach(index => {
              const nextVid = videos[index] as HTMLVideoElement;
              if (nextVid && nextVid.paused) {
                nextVid.load();
                nextVid.muted = true;
              }
            });
          }
          this.handleVideoPlayback();
        },
        slideChangeTransitionEnd: (swiper) => {
          this.clearPreviousVideoListener(swiper);
          this.videoService.attachVideoListener(swiper);

          const totalSlides = swiper.virtual.slides.length;
          this.currentActiveIndex = swiper.activeIndex;
          this.videoService.currentReel$.next(this.reels[this.currentActiveIndex]);
          this.commentsService.loadComments(this.videoService.reels[this.currentActiveIndex].id).then();
          if (this.currentActiveIndex >= totalSlides - 2) {
            this.videoService.loadMore();

          }
          this.cdr.markForCheck();
        },

        afterInit: (swiper) => {
          this.videoService.attachVideoListener(swiper);
          this.handleVideoPlayback();
          this.currentActiveIndex = 0;
        },

      },
      slidesPerView: 1,
      navigation: true,
      watchSlidesProgress: true,
      autoHeight: false,
      direction: 'vertical',
      breakpoints: {

        480: {
          spaceBetween: 0,
        },
        481: {
          spaceBetween: 40,
        },
      },
      mousewheel: {
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true
      },
    };

    this.swiperInstance = new Swiper(this.swiperEl.nativeElement, swiperParams);
    this.videoService.swiper = this.swiperInstance;

    if (this.reels[0]?.id) {
      this.videoService.currentReel$.next(this.reels[0]);
      this.commentsService.loadComments(this.reels[0].id).then();
    }
  }

  initVideoList() {
    this.videoService.loadInitialData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.videoService.reels.push(...data.data.reels);
        this.videoService.lastId = data.data.nextCursor;
        this.currentReel = this.reels[0];
        setTimeout(() => {
          this.initSwiper();
        }, 0);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error(err);
      }
    });

  }

  clearPreviousVideoListener(swiper: any) {

    swiper.slides.forEach((slide: HTMLElement) => {
      const video = slide.querySelector('video');
      if (video) {
        video.ontimeupdate = null;
      }
    });
  }

  async openComments() {
    if (window.innerWidth > 1280) {
      return;
    }
    const content = document.querySelector('ion-router-outlet');
    content?.classList.add('main-blur-effect');
    const modal = await this.modalCtrl.create({
      component: ReelsCommentsComponent,
      componentProps: { reel: this.currentReel, activeIndex: this.currentActiveIndex },
      cssClass: 'custom-fixed-modal half comments',
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      const content = document.querySelector('ion-router-outlet');
      content?.classList.remove('main-blur-effect');
    }

  }

  private handleVideoPlayback(): void {
    setTimeout(() => {
      const allVideos = document.querySelectorAll<HTMLVideoElement>('.reels-video');
      allVideos.forEach(v => v.pause());

      const activeSlideEl = document.querySelector('.swiper-slide-active');

      if (activeSlideEl) {
        const video = activeSlideEl.querySelector('video') as HTMLVideoElement;

        if (video) {
          console.log('Target video found, attempting play:', video.src);
          video.muted = this.isMuted;
          console.log('isMuted',this.isMuted);
          video.currentTime = 0;
          const playPromise = video.play();
          if (playPromise !== undefined && this.userId) {
            this.videoService.trackView(video.id,this.userId,this.currentReel.userId).then();
            playPromise.catch(error => {
              console.error('Playback failed for:', video.src, error);
            });
          }
        } else {
          console.warn('Slide is active but no video element found inside it.');
        }
      } else {
        console.warn('No slide with .swiper-slide-active found in DOM.');
      }
    }, 0);

  }

  async openCreateReels() {
    const modal = await this.modalCtrl.create({
      component: ReelsCreateComponent,
      id:'createModal',
      cssClass: `custom-fixed-modal half ${window.innerWidth > 1280 ? 'desctop' : 'mobile'}`,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.isReady) {
    }
  }
}
