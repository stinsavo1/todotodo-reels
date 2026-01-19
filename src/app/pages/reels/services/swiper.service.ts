import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { BehaviorSubject, catchError, finalize, from, Observable, Subject, take, throwError } from 'rxjs';
import { Swiper } from 'swiper';
import { Reel, SWIPER_LIMIT } from '../interfaces/reels.interface';

@Injectable()
export class SwiperService {
  reels: Reel[] = [];
  currentReel$ = new BehaviorSubject<Reel>(null);
  videoListUpdated$ = new Subject<boolean>();
  swiper: Swiper = undefined;
  isLoading$ = new BehaviorSubject<boolean>(false);
  lastId = null;

  constructor(private functions: Functions,) {
  }

  updateSwiper(swiper: Swiper, force: boolean, newIndex?: number) {
    if (swiper && swiper.virtual) {
      swiper.virtual.cache = {};
      swiper.virtual.slides = this.reels;
      swiper.virtual.update(force);
      swiper.update();
    }
  }

  getFilteredReels(lastVisibleId: string | null = null, pageSize = 10): Observable<any> {
    const callable = httpsCallable(this.functions, 'getFilteredReels');
    return from(callable({ lastVisibleId, pageSize }));
  }

  loadInitialData() {
    this.isLoading$.next(true);
    this.lastId = null;
    return this.getFilteredReels(null, SWIPER_LIMIT)
      .pipe(finalize(() => this.isLoading$.next(false)));

  }

  loadMore() {
    if (!this.lastId) {
      return;
    }

    this.getFilteredReels(this.lastId, SWIPER_LIMIT).pipe(take(1)).subscribe({
      next: (result) => {
        this.reels.push(...result.data.reels);
        this.videoListUpdated$.next(true);
        this.lastId = result.data.nextCursor;
      },
      error: (err) => {
        console.error(err);
      }
    });

  }

  updateReels(updatedReel: Reel, index: number) {
    if (!updatedReel && !index) {
      return;
    }
    this.reels[index] = updatedReel;
  }

  deleteLocalReels(index: number) {
    this.reels.splice(index, 1);
    this.currentReel$.next(this.reels[index]);

  }

  deleteStorageReel(reelId: string): Observable<any> {
    const deleteFn = httpsCallable(this.functions, 'deleteReel');
    this.isLoading$.next(true);
    return from(deleteFn({ reelId })).pipe(
      catchError(err => {
        return throwError(() => err);
      }),
      finalize(() => this.isLoading$.next(false))
    );
  }

}
