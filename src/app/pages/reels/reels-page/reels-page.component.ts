import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild, ViewContainerRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { ModalController } from '@ionic/angular';
import { from, switchMap, take, tap } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Swiper } from 'swiper';
import { Mousewheel, Navigation, Pagination, Virtual } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';

import { Reel } from '../interfaces/reels.interface';
import { ReelsDescriptionComponent } from '../reels-description/reels-description.component';
import { UsersPreferencesService } from '../services/users-preferences.service';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-reels-page',
  templateUrl: './reels-page.component.html',
  styleUrls: ['./reels-page.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReelsPageComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperRef', { static: true }) swiperEl!: ElementRef;


  swiperInstance?: Swiper;

  reels: Reel[] = [];
  index = 1;
  showSpinner = false;
  userId: string;
  isCommentsOpen: boolean = false;
  selectedVideoId: string = '';
  isMuted = true;

  private firestore: Firestore = inject(Firestore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly Array = Array;
  public isCreateOpen = false;
  currentReel: Reel;


  constructor(private videoService: VideoService,
              private cdr: ChangeDetectorRef,
              private auth: Auth,
              private modalCtrl: ModalController,
              private vcr:ViewContainerRef,
              private usersPreferencesService: UsersPreferencesService,) {

  }

  ngAfterViewInit(): void {

  }

  ngOnInit(): void {
    this.initVideoList();
    this.videoService.isLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {

        this.showSpinner = !data;
        this.cdr.markForCheck();

      }
    });

    this.videoService.currentReels$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(updatedReels => {
      this.currentReel = updatedReels;

      this.cdr.markForCheck();

    });
    this.videoService.videoListSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        if (data.length > 0) {

          data = this.usersPreferencesService.applyFilter(data);
        }
        if (this.swiperInstance) {
          this.videoService.updateSwiper(this.swiperInstance, data);
        }
        this.cdr.markForCheck();
      }
    });
  }

  private initSwiper(): void {
    const swiperParams:SwiperOptions = {
      modules: [Virtual, Navigation, Pagination, Mousewheel],
      virtual: {
        enabled: true,
        slides: this.reels,

        renderSlide: (slide: Reel, index) => {
          console.log('Rendering:', index);
          return `
<div class="swiper-slide" id="container-${index}">
  <video
    id="${slide.id}"
    class="reels-video"
    loop
    playsinline
    muted
    preload="auto"
    src="${slide.url}">
  </video>
</div>`;
        },
      },

      on: {
        slideChange: (swiper) => {

          this.handleVideoPlayback();
          const totalSlides = swiper.virtual.slides.length;
          const currentIndex = swiper.activeIndex;
          this.currentReel = this.reels[currentIndex];
          this.createComponentDescription(this.swiperInstance);
          this.managePlayers(currentIndex);
          if (currentIndex >= totalSlides - 2) {
            const preferences = this.usersPreferencesService.prefs$.value;
            this.videoService.loadMoreReels(preferences.blockedAuthors,preferences.hiddenVideos);
          }
          this.cdr.markForCheck();
        },
        afterInit: (swiper) => {
          this.handleVideoPlayback();
        }
      },
      slidesPerView: 1,
      navigation: true,
      autoHeight: false,
      direction: 'vertical',
      spaceBetween: 40,
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
    this.createComponentDescription(this.swiperInstance)

  }

  initVideoList() {
    console.log('getVideo');
    from(authState(this.auth)).pipe(
      filter(user => user !== null),
      take(1),
      tap((user) => {
        this.userId = user.uid;
      }),
      switchMap(() => this.usersPreferencesService.loadPreferences(this.userId)),
      switchMap(prefs =>
        this.videoService.loadInitialData(
          this.firestore,
          prefs.blockedAuthors,
          prefs.hiddenVideos,
          5
        )
      ),
      tap((reels) => {

        this.reels = this.usersPreferencesService.applyFilter(reels);
        this.currentReel = this.reels[0];

        setTimeout(() => {
          this.initSwiper();

        }, 0);
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(()=>{

    });



  }

  createComponentDescription(swiper:Swiper){
    console.log('create com');
    const currentIndex = swiper.activeIndex;
    const container = document.getElementById(`container-${currentIndex}`);
console.log('this.createComponentDescription',container,currentIndex);
    if (container ) {
      const componentRef = this.vcr.createComponent(ReelsDescriptionComponent);

      componentRef.instance.reel = this.reels[currentIndex];

      container.appendChild(componentRef.location.nativeElement);

      componentRef.changeDetectorRef.detectChanges();
  }}


  managePlayers(activeIndex: number) {
    const slides = document.querySelectorAll('.swiper-slide');
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


  public openComments(video: string): void {
    const content = document.querySelector('ion-router-outlet');
    content?.classList.add('main-blur-effect');
    this.selectedVideoId = video;
    this.isCommentsOpen = true;

  }

  public closeModal(): void {
    this.isCommentsOpen = false;
    const content = document.querySelector('ion-router-outlet');
    content?.classList.remove('main-blur-effect');
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
    }, 80);

  }
}
