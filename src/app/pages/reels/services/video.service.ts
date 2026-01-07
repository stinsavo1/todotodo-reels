import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  addDoc,
  collection, deleteDoc,
  doc,
  docData,
  Firestore,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { deleteObject, ref, Storage as FireStorage, uploadBytesResumable } from '@angular/fire/storage';
import { BehaviorSubject, finalize, from, Observable, of, Subject, take, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Swiper } from 'swiper';
import { UserStoreService } from '../../../services/store-service/user-store.service';
import { MAX_SIZE_FILE, Reel, SWIPER_LIMIT } from '../interfaces/reels.interface';
import { UploadService } from './upload.service';
import { UsersPreferencesService } from './users-preferences.service';

@Injectable()
export class VideoService {
  readonly reels: Reel[] = [];
  videoListSubject = new BehaviorSubject<Reel[]>([]);
  videoListUpdated$ = new Subject<boolean>();
  uploadedVideoReady$ = new Subject<Reel>();
  currentReel$ = new BehaviorSubject<Reel>(null);
  isLoading$ = new BehaviorSubject<boolean>(false);
  lastVisible: any = null;
  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);
  swiper: Swiper = undefined;
  private reelIds = new Set<string>();
 lastId = null;

  constructor(private storage: FireStorage, private auth: Auth,
              private functions: Functions,
              private uploadService:UploadService,
              private user:UserStoreService,
              private usersPreferencesService: UsersPreferencesService) {

  }


  async onPublish(description: string) {
    if (!this.uploadService.uploadedVideo$.value.videoUrl) {
      console.error('Видео еще не загружено в облако');
      return;
    }
    try {
      this.isLoading$.next(true);
      const reelsCollection = collection(this.firestore, 'reels');
      const savedFile = this.uploadService.uploadedVideo$.value;
      const newReel: Omit<Reel, 'id'> = {
        url: savedFile.videoUrl,
        posterUrl:savedFile.thumbUrl,
        filePath:savedFile.videoPath,
        userId: this.auth.currentUser.uid,
        userName: this.user.getUserValue().fio || 'user',
        description: description,
        createdAt: serverTimestamp(),
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        viewsCount: 0,
      };
      const docRef = await addDoc(reelsCollection, newReel);
      if (savedFile.fileId) {
        const tmpDocRef = doc(this.firestore, `tmpReels/${savedFile.fileId}`);
        await deleteDoc(tmpDocRef);
        console.log('Временная запись tmpReels успешно удалена');
      }
      localStorage.removeItem('pending_video_url');
      const savedReel: Reel = { ...newReel, id: docRef.id }
      const currentReelIndex = this.swiper.activeIndex ?? 0;
      let newIndex = this.reels.length === 0 ? 0 : (currentReelIndex + 1);
      this.reels.splice(newIndex, 0, savedReel);
      this.videoListUpdated$.next(true);
      this.uploadedVideoReady$.next(savedReel);
      this.uploadService.uploadedVideo$.next(null);
      this.isLoading$.next(false);
      console.log('Данные успешно сохранены в БД! ID документа:', docRef.id);
    } catch (error) {
      this.isLoading$.next(false);
      console.error('Ошибка при сохранении в Firestore:', error);
    }
  }

  async trackView(videoId: string) {
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


  getFilteredReels(lastVisibleId: string | null = null, pageSize= 10): Observable<any> {
    const callable = httpsCallable(this.functions, 'getFilteredReels');
    return from(callable({ lastVisibleId, pageSize }));
  }

  loadInitialData() {
    this.isLoading$.next(true);
    this.lastId = null;
    return this.getFilteredReels(null,SWIPER_LIMIT)
      .pipe(finalize(() => this.isLoading$.next(false)))

  }

  loadMore() {
    if (!this.lastId) {
      return ;
    }

   this.getFilteredReels(this.lastId,SWIPER_LIMIT).pipe(take(1)).subscribe({
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



  updateSwiper(swiper: Swiper, force: boolean,newIndex?:number) {
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

  updateReels(updatedReel:Reel,index:number){
    if (!updatedReel && !index) {
      return
    }
    this.reels[index]=updatedReel;
  }

  deleteReels(index:number) {
    this.reels.splice(index, 1);
    this.loadMore();
  }

  hideAuthor(authorId:string, activeIndex:number) {
    for (let i = this.reels.length - 1; i >= 0; i--) {
      if (this.reels[i].userId === authorId) {
        this.reels.splice(i, 1);
        if (i <= activeIndex) {
          activeIndex = Math.max(0, activeIndex - 1);
        }
      }
    }
    this.swiper.slideTo(activeIndex)
    this.loadMore();

  }



}
