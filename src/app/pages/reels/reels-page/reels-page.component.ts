import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  inject,
  OnDestroy,
  OnInit,
  runInInjectionContext,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { outputToObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular';
import { delay } from 'rxjs/operators';
import { Swiper } from 'swiper';
import { Mousewheel, Navigation, Pagination, Virtual } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { ResizeService } from '../../../services/resize.service';
import { UserStoreService } from '../../../services/store-service/user-store.service';
import { ReelsHelper } from '../helper/reels.helper';
import { CommentsWithAvatar } from '../interfaces/comments.interface';

import { Reel } from '../interfaces/reels.interface';
import { ReelsCommentsComponent } from '../reels-comments/reels-comments.component';
import { ReelsCreateComponent } from '../reels-create/reels-create.component';
import { ReelsDescriptionComponent } from '../reels-description/reels-description.component';
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
  private currentComponentRef: ComponentRef<ReelsDescriptionComponent> | null = null;

  swiperInstance?: Swiper;

  reels: Reel[] = [];
  index = 1;
  showSpinner = false;
  userId: string;

  isMuted = true;
  private firestore: Firestore = inject(Firestore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly Array = Array;
  public isCreateOpen = false;
  currentReel: Reel;
  private injector = inject(EnvironmentInjector);
  isExpendedDescription = false;
  comments: CommentsWithAvatar[] = [];
  currentActiveIndex: number;

  constructor(private videoService: VideoService,
              private cdr: ChangeDetectorRef,
              private auth: Auth,
              private vcr: ViewContainerRef,
              public resizeService: ResizeService,
              private commentsService: CommentsService,
              private modalCtrl: ModalController,
              private usersPreferencesService: UsersPreferencesService,) {
    this.reels = this.videoService.reels;

  }

  ngAfterViewInit(): void {

  }

  ngOnInit(): void {
    this.initVideoList();
    this.videoService.isLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.showSpinner = data;
        this.cdr.markForCheck();

      }
    });


    this.videoService.currentReel$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(updatedReels => {
      this.currentReel = updatedReels;

      this.cdr.markForCheck();

    });
    this.videoService.videoListUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (forceUpdate) => {
        console.log('new update', forceUpdate);
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
          console.log('go to new slide');
          // this.videoService.currentReel$.next(reel);
          this.swiperInstance.slideNext();
        }
      }
    });

    this.commentsService.comments$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      console.log('comments', data);
      this.comments = data;
      this.cdr.markForCheck();
    });

  }

  ngOnDestroy(): void {
    const swiper = this.swiperEl.nativeElement.swiper;
    if (swiper) {
      this.clearPreviousVideoListener(swiper);
    }
    this.destroyComponentRef();
  }

  private initSwiper(): void {
    const swiperParams: SwiperOptions = {
      modules: [Virtual, Navigation, Pagination, Mousewheel],
      virtual: {
        enabled: true,
        slides: this.reels,
        renderSlide: (slide: Reel, index) => {
          console.log('Rendering:', index);
          return ReelsHelper.renderSlide(slide, index);
        },
      },

      on: {
        slideChange: (swiper) => {
          this.clearPreviousVideoListener(swiper);
          this.videoService.attachVideoListener(swiper);
          this.handleVideoPlayback();
          const totalSlides = swiper.virtual.slides.length;
          this.currentActiveIndex = swiper.activeIndex;
          this.videoService.currentReel$.next(this.reels[this.currentActiveIndex]);
          this.commentsService.loadComments(this.videoService.reels[this.currentActiveIndex].id).then();
          this.createComponentDescription(this.swiperInstance);
          if (this.currentActiveIndex >= totalSlides - 2) {
            console.log('need looad more');
            this.videoService.loadMore();

          }
          this.cdr.markForCheck();
        },
        afterInit: (swiper) => {
          this.createComponentDescription(swiper);
          this.videoService.attachVideoListener(swiper);
          this.handleVideoPlayback();
        },

      },
      slidesPerView: 1,
      navigation: true,
      watchSlidesProgress: true,
      autoHeight: false,
      direction: 'vertical',
      // spaceBetween: 40,
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
        console.log('reels', data.data.reels);
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

  createComponentDescription(swiper: Swiper) {
    const currentIndex = swiper.activeIndex;
    this.destroyComponentRef();
    setTimeout(() => {
      const container = document.getElementById(`container-${currentIndex}`);
      if (container) {
        const componentRef = this.vcr.createComponent(ReelsDescriptionComponent);
        outputToObservable(componentRef.instance.isExpended)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(status => {
            this.isExpendedDescription = true;
            this.cdr.markForCheck();
          });
        componentRef.instance.reel = { ...this.reels[currentIndex] };
        container.appendChild(componentRef.location.nativeElement);
        componentRef.changeDetectorRef.detectChanges();
        this.currentComponentRef = componentRef;
      }
    }, 0);

  }

  destroyComponentRef() {
    if (this.currentComponentRef) {
      this.currentComponentRef.destroy();
      this.currentComponentRef = null;
      this.isExpendedDescription = false;
    }
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
      cssClass: 'custom-fixed-modal half',
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
          video.currentTime = 0;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            this.videoService.trackView(video.id).then();
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
      cssClass: `custom-fixed-modal half ${window.innerWidth>1280 ? 'desctop' : ''}`,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.isReady) {
    }
  }
}
