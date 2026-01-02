import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  addDoc,
  collection,
  doc,
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
import { deleteObject, ref, Storage as FireStorage, uploadBytesResumable } from '@angular/fire/storage';
import { getDownloadURL } from 'firebase/storage';
import { BehaviorSubject, catchError, from, Observable, of, Subject, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Swiper } from 'swiper';
import { DOWLOAD_LIMIT, MAX_SIZE_FILE, Reel } from '../interfaces/reels.interface';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  uploadProgress$ = new BehaviorSubject<number>(0);
  videoListSubject = new BehaviorSubject<Reel[]>([]);
  currentReels$ = new BehaviorSubject<Reel>(null);
  videoList$ = this.videoListSubject.asObservable();
  isLoading = false;
  isLoading$ = new Subject<boolean>();
  lastVisible: any = null;
  previewUrl$ = new Subject<string>();
  private firestore: Firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);
  uploadedVideoUrl$ = new BehaviorSubject<string | null>(null);
  errorMessages$ = new BehaviorSubject<string | null>(null);
  swiper: Swiper = undefined;

  constructor(private storage: FireStorage, private auth: Auth) {
  }

  async uploadVideo(event: any, userId: string) {

    const file = event.target.files[0];
    if (!file || !userId) return;
    if (file.type !== 'video/mp4') {
      this.errorMessages$.next('У файла не допустимое расширение');
      return;
    }
    const maxSizeInBytes = MAX_SIZE_FILE * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      this.errorMessages$.next(`Файл слишком большой! Максимальный размер 100 МБ. Ваш файл: ${(file.size / (1024 * 1024)).toFixed(2)} МБ`);
      event.target.value = '';
      return;
    }
    if (this.uploadedVideoUrl$.value) {
      await this.deleteFileFromStorage(this.uploadedVideoUrl$.value);
      this.uploadedVideoUrl$.next(null);
    }
    this.isLoading$.next(true);
    const filePath = `reels/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        this.uploadProgress$.next((snapshot.bytesTransferred / snapshot.totalBytes));
        console.log(`Загрузка: ${this.uploadProgress$.value  * 100}%`);

      },
      (error) => {
        this.isLoading$.next(false);
        this.errorMessages$.next('Ошибка при загрузке:');
        console.error('Ошибка при загрузке:', error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        this.uploadedVideoUrl$.next(url);
        localStorage.setItem('pending_video_url', url);
        this.isLoading$.next(false);
      }
    );
  }

  async deleteFileFromStorage(fileUrl: string) {
    if (!fileUrl) return;
    const fileRef = ref(this.storage, fileUrl);
    try {
      await deleteObject(fileRef);
      console.log('Файл успешно удален из Storage');
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
    }
  }

  async onPublish(description: string) {
    if (!this.uploadedVideoUrl$.value) {
      console.error('Видео еще не загружено в облако');
      return;
    }
    try {

      // this.isDowload$.next(false);
      const reelsCollection = collection(this.firestore, 'reels');

      const newReel = {
        url: this.uploadedVideoUrl$.value,
        userId: this.auth.currentUser.uid,
        userName: this.auth.currentUser.displayName,
        description: description,
        createdAt: serverTimestamp(),
        likesCount: 0,
        likes: [],
        commentsCount: 0,
        viewsCount: 0,
      };
      const docRef = await addDoc(reelsCollection, newReel);
      this.uploadedVideoUrl$.next(null);
      localStorage.removeItem('pending_video_url');
      const videoForUI = { id: docRef.id, ...newReel, url: this.uploadedVideoUrl$.value };

      this.videoListSubject.next([videoForUI, ...this.videoListSubject.value]);

      this.isLoading$.next(false);
      console.log('Данные успешно сохранены в БД! ID документа:', docRef.id);
    } catch (error) {
      this.isLoading$.next(false);
      console.error('Ошибка при сохранении в Firestore:', error);
    }
  }

  async trackView(videoId: string) {
    const reelRef = doc(this.firestore, 'reels', videoId);
    console.log('trackView',videoId, reelRef);
    try {
      await updateDoc(reelRef, {
        viewsCount: increment(1)
      });
    } catch (e) {
      console.error('Ошибка при обновлении просмотров:', e, videoId);
    }
  }

  loadInitialData(firestore: Firestore, blockedAuthors: Set<string>, hiddenVideos: Set<string>, count: number = 10): Observable<Reel[]> {
    this.isLoading = true;
    const reelsRef = collection(firestore, 'reels');
    const authors = Array.from(blockedAuthors).slice(0, 10);
    let q = query(reelsRef, orderBy('createdAt', 'desc'), limit(count * 3));
    if (authors.length) {
      q = query(q, where('userId', 'not-in', authors));
    }
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (!snapshot.empty) {
          this.lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }

        return snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Reel))
          .filter(r => !hiddenVideos.has(r.id))
          .slice(0, count);
      }),
      tap(reels => {
        this.videoListSubject.next(reels);
        this.isLoading = false;
      })
    );

  }

  //todo mn add to app.component
  async checkAndCleanupStorage() {
    const pendingUrl = localStorage.getItem('pending_video_url');

    if (pendingUrl) {
      console.log('Найден забытый файл после перезагрузки, удаляю...', pendingUrl);
      try {
        this.deleteFileFromStorage(pendingUrl).then();
        localStorage.removeItem('pending_video_url');
        console.log('Хранилище очищено от мусора');
      } catch (error) {
        console.error('Не удалось удалить старый файл:', error);
        localStorage.removeItem('pending_video_url');
      }
    }
  }

  loadMoreReels(blockedAuthors: Set<string>,
                hiddenVideos: Set<string>) {
    if (this.isLoading || (this.videoListSubject.value.length > 0 && !this.lastVisible)) return;
    this.isLoading = true;
    runInInjectionContext(this.injector, () => {
      const reelsRef = collection(this.firestore, 'reels');
      const authors = Array.from(blockedAuthors).slice(0, 10);

      let q = query(
        reelsRef,
        orderBy('createdAt', 'desc'),
        ...(this.lastVisible ? [startAfter(this.lastVisible)] : []),
        limit(DOWLOAD_LIMIT * 3)
      );

      if (authors.length) {
        q = query(q, where('userId', 'not-in', authors));
      }

      from(getDocs(q)).pipe(
        map(snapshot => {
          if (snapshot.empty) return [];

          this.lastVisible = snapshot.docs[snapshot.docs.length - 1];

          return snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Reel))
            .filter(r => !hiddenVideos.has(r.id));
        }),

        tap(filtered => {
          if (filtered.length) {
            const updated = [
              ...this.videoListSubject.value,
              ...filtered
            ];
            this.videoListSubject.next(updated);
          }
          this.isLoading = false;
        }),

        catchError(err => {
          console.error('Firestore RxJS Error:', err);
          this.isLoading = false;
          return of([]);
        })
      ).subscribe();
    });
  }

  updateSwiper(swiper: Swiper, reels: Reel[]) {
    if (swiper && swiper.virtual) {
      swiper.virtual.slides = [...reels];
      swiper.virtual.update(false);
      swiper.update();
    }
  }


  handleVideoPlayback(swiper: any) {
    // Use requestAnimationFrame to wait for the DOM to render the new virtual slide
    requestAnimationFrame(() => {
      // 1. Pause all videos currently in the DOM
      const allVideos = document.querySelectorAll<HTMLVideoElement>('.reels-video');
      allVideos.forEach(v => {
        if (!v.paused) v.pause();
      });

      // 2. Find the active slide
      const activeSlide = swiper.slides[swiper.activeIndex];

      if (activeSlide) {
        const video = activeSlide.querySelector('video') as HTMLVideoElement;
        if (video) {
          // Essential: Modern browsers require muted to play automatically
          video.muted = true;

          // Use a Promise-safe play call
          const playPromise = video.play();

          if (playPromise !== undefined) {
            playPromise.catch(error => {
              // This happens if the user hasn't interacted with the screen yet
              console.log('Auto-play prevented. User interaction needed.');
            });
          }
        }
      }
    });
  }

  generateVideoThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.src = URL.createObjectURL(file);
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        video.currentTime = 1;
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject('Failed to create thumbnail');
        }, 'image/jpeg', 0.8);

        URL.revokeObjectURL(video.src);
      };

      video.onerror = (e) => reject(e);
    });
  }
}
