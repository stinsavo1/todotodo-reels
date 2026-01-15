import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  increment,
  serverTimestamp,
  updateDoc
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { deleteObject, getStorage, ref } from 'firebase/storage';
import { BehaviorSubject, finalize, from, Observable, Subject, take } from 'rxjs';
import { Swiper } from 'swiper';
import { UserStoreService } from '../../../services/store-service/user-store.service';
import { Reel, SWIPER_LIMIT } from '../interfaces/reels.interface';
import { ToastService } from './toast.service';
import { UploadService } from './upload.service';

@Injectable()
export class VideoService {
  reels: Reel[] = [];
  videoListUpdated$ = new Subject<boolean>();
  uploadedVideoReady$ = new Subject<Reel>();
  currentReel$ = new BehaviorSubject<Reel>(null);
  isLoading$ = new BehaviorSubject<boolean>(false);
  private firestore: Firestore = inject(Firestore);
  swiper: Swiper = undefined;
  lastId = null;

  constructor(private auth: Auth,
              private functions: Functions,
              private uploadService: UploadService,
              private user: UserStoreService,
              private toastService:ToastService
  ) {

  }

  async onPublish(description: string) {
    if (!this.uploadService.uploadedVideo$.value.videoUrl) {
      console.error('Видео еще не загружено в облако');
      return;
    }
    const savedFile = this.uploadService.uploadedVideo$.value;
    try {
      this.isLoading$.next(true);
      const reelsCollection = collection(this.firestore, 'reels');

      console.log('saved f',savedFile);
      const newReel: Omit<Reel, 'id'> = {
        url: savedFile.videoUrl,
        posterUrl: savedFile.thumbUrl,
        filePath: savedFile.filePath,
        userId: this.auth.currentUser.uid,
        userName: this.user.getUserValue().fio || 'user',
        description: description,
        createdAt: serverTimestamp(),
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        viewsCount: 0,
      };
      console.log('newRe',newReel);
      const docRef = await addDoc(reelsCollection, newReel);
      localStorage.removeItem('pending_video_url');
      const savedReel: Reel = { ...newReel, id: docRef.id };
      const currentReelIndex = this.swiper.activeIndex ?? 0;
      let newIndex = this.reels.length === 0 ? 0 : (currentReelIndex + 1);
      this.reels.splice(newIndex, 0, savedReel);
      this.videoListUpdated$.next(true);
      this.uploadedVideoReady$.next(savedReel);
      this.uploadService.uploadedVideo$.next(null);
      this.isLoading$.next(false);
      this.toastService.showIonicToast('Ваше видео опубликовано').pipe(take(1)).subscribe();
      console.log('Данные успешно сохранены в БД! ID документа:', docRef.id);
    }catch (error) {
      this.isLoading$.next(false);
      console.error('Ошибка при сохранении в Firestore, удаляем файл из Storage:', error);

      if (savedFile.filePath) {
        try {
          const storage = getStorage();
          const videoRef = ref(storage, savedFile.filePath);
          const thumbPath = savedFile.filePath.replace('reels/', 'thumbnails/').replace('.mp4', '.jpg');
          const thumbRef = ref(storage, thumbPath);

          await Promise.all([
            deleteObject(videoRef),
            deleteObject(thumbRef)
          ]);

          console.log('Файлы успешно удалены из Storage после ошибки БД');
        } catch (storageError) {
          console.error('Не удалось удалить файлы из Storage:', storageError);
        }
      }

      this.toastService.showIonicToast('Ошибка при публикации. Попробуйте снова.').pipe(take(1)).subscribe();
    }
  }

  async trackView(videoId: string, curentUserId:string, reelsUserId:string) {
    if (reelsUserId===curentUserId) {
      return
    }
    console.log('trackView',curentUserId,reelsUserId);
    const reelRef = doc(this.firestore, 'reels', videoId);

    try {
      await updateDoc(reelRef, {
        viewsCount: increment(1)
      });
      const index = this.reels.findIndex(r => r.id === videoId);
      if (index !== -1) {
        this.reels[index] = { ...this.reels[index], viewsCount: (this.reels[index].viewsCount || 0) + 1 };
      }
    } catch (e) {
      console.error('Ошибка при обновлении просмотров:', e, videoId);
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

  //todo mn add to app.component
  async checkAndCleanupStorage() {
    const pendingUrl = localStorage.getItem('pending_video_url');

    if (pendingUrl) {
      console.log('Найден забытый файл после перезагрузки, удаляю...', pendingUrl);
      try {
        // this.deleteFileFromStorage(pendingUrl).then();
        localStorage.removeItem('pending_video_url');
        console.log('Хранилище очищено от мусора');
      } catch (error) {
        console.error('Не удалось удалить старый файл:', error);
        localStorage.removeItem('pending_video_url');
      }
    }
  }

  updateSwiper(swiper: Swiper, force: boolean, newIndex?: number) {
    if (swiper && swiper.virtual) {
      swiper.virtual.cache = {};
      swiper.virtual.slides = this.reels;
      swiper.virtual.update(force);
      swiper.update();
    }
  }

  attachVideoListener(swiper: any) {
    const activeSlide = swiper.slides[swiper.activeIndex];
    if (!activeSlide) return;
    const video = activeSlide.querySelector('video') as HTMLVideoElement;
    const bar = activeSlide.querySelector('.video-progress-bar') as HTMLElement;
    if (video) {
      video.ontimeupdate = () => {
        if (video.duration && bar) {
          const progress = (video.currentTime / video.duration) * 100;
          requestAnimationFrame(() => {
            bar.style.width = `${progress}%`;
          });
        }
      };
    }
  }

  updateReels(updatedReel: Reel, index: number) {
    if (!updatedReel && !index) {
      return;
    }
    this.reels[index] = updatedReel;
  }

  deleteReels(index: number) {
    this.reels.splice(index, 1);
    this.currentReel$.next(this.reels[index]);
    this.loadMore();

  }

  hideAuthor(authorId: string, activeIndex: number) {
    for (let i = this.reels.length - 1; i >= 0; i--) {
      if (this.reels[i].userId === authorId) {
        this.reels.splice(i, 1);
        if (i <= activeIndex) {
          activeIndex = Math.max(0, activeIndex - 1);
        }
      }
    }
    this.swiper.slideTo(activeIndex);
    this.currentReel$.next(this.reels[activeIndex]);
    this.loadMore();

  }

}
