import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { register } from 'swiper/element/bundle';
import { SwiperOptions } from 'swiper/types';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

register();

@Component({
    selector: 'app-onboarding',
    templateUrl: './onboarding.component.html',
    styleUrls: ['./onboarding.component.scss'],
    standalone: false
})
export class OnboardingComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperRef', { static: false }) swiperRef: any;

  public slides = Array(5).fill(0);
  public activeIndex = 0;
  public swiperConfig: SwiperOptions = {
    slidesPerView: 1,
    speed: 500,
    loop: false,
    effect: 'slide',
    cssMode: true,
    on: {
      slideChange: (event) => {
        this.activeIndex = this.swiperRef.nativeElement.swiper.activeIndex;
        this.cdr.detectChanges();
      },
    },
  };

  constructor(private navCtrl: NavController, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const swiperEl: any = document.querySelector('swiper-container');
    this.activeIndex = this.swiperRef.nativeElement.swiper.activeIndex;
    Object.assign(swiperEl, this.swiperConfig);
    swiperEl.initialize();
  }

  public goToNextSlide(): void {
    if (this.activeIndex < this.slides.length - 1) {
      this.activeIndex++;
      this.swiperRef.nativeElement.swiper.slideNext();
    } else {
      sessionStorage.setItem('skipOnBoarding', 'true');
      this.navCtrl.navigateRoot('/tabs/menu/registration/auth');
    }
  }

  public skip(): void {
    sessionStorage.setItem('skipOnBoarding', 'true');
    this.navCtrl.navigateRoot('/tabs/menu/registration/auth');
  }
}
