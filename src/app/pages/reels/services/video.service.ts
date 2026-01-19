import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { doc, Firestore, increment, serverTimestamp, updateDoc, writeBatch } from '@angular/fire/firestore';
import { deleteObject, getStorage, ref } from 'firebase/storage';
import { Subject, take } from 'rxjs';
import { UserStoreService } from '../../../services/store-service/user-store.service';
import { Reel } from '../interfaces/reels.interface';
import { SwiperService } from './swiper.service';
import { ToastService } from './toast.service';
import { UploadService } from './upload.service';

@Injectable()
export class VideoService {

  uploadedVideoReady$ = new Subject<Reel>();
  private viewedInSession = new Set<string>();
  private firestore: Firestore = inject(Firestore);

  constructor(private auth: Auth,
              private uploadService: UploadService,
              private user: UserStoreService,
              private swiperService: SwiperService,
              private toastService: ToastService
  ) {

  }

  async onPublish(description: string) {
    if (!this.uploadService.uploadedVideo$.value.videoUrl) {
      console.error('Видео еще не загружено в облако');
      return;
    }
    const savedFile = this.uploadService.uploadedVideo$.value;
    try {
      this.swiperService.isLoading$.next(true);
      const docRef = doc(this.firestore, 'reels', savedFile.reelId);
      const batch = writeBatch(this.firestore);
      const tmpReelRef = doc(this.firestore, 'tmpReels', savedFile.reelId);
      const newReel: Reel = {
        id: savedFile.reelId,
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
      batch.set(docRef, newReel);
      batch.delete(tmpReelRef);
      await batch.commit();
      localStorage.removeItem('pending_video_url');
      const currentReelIndex = this.swiperService.swiper.activeIndex ?? 0;
      let newIndex = this.swiperService.reels.length === 0 ? 0 : (currentReelIndex + 1);
      this.swiperService.reels.splice(newIndex, 0, newReel);
      this.swiperService.videoListUpdated$.next(true);
      this.uploadedVideoReady$.next(newReel);
      this.uploadService.uploadedVideo$.next(null);
      this.swiperService.isLoading$.next(false);
      this.toastService.showIonicToast('Ваше видео опубликовано').pipe(take(1)).subscribe();
      console.log('Данные успешно сохранены в БД! ID документа:', docRef.id);
    } catch (error) {
      this.swiperService.isLoading$.next(false);
      console.error('Ошибка при сохранении в Firestore, удаляем файл из Storage:', error);
      await this.deleteFilesFromStorage(savedFile.filePath);
      this.toastService.showIonicToast('Ошибка при публикации. Попробуйте снова.').pipe(take(1)).subscribe();
    }
  }

  async deleteFilesFromStorage(filePath: string) {
    if (filePath) {
      try {
        const storage = getStorage();
        const videoRef = ref(storage, filePath);
        const thumbPath = filePath.replace('reels/', 'thumbnails/').replace('.mp4', '.jpg');
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
  }

  async incrementViewCount(videoId: string, curentUserId?: string, reelsUserId?: string) {
    if ((curentUserId && reelsUserId === curentUserId) || !videoId) {
      return;
    }

    if (this.viewedInSession.has(videoId)) {
      return;
    }

    const viewedReels = JSON.parse(localStorage.getItem('viewed_reels') || '[]');
    if (viewedReels.includes(videoId)) {
      console.log('Это видео уже было просмотрено в этом браузере.');
      return;
    }
    const reelRef = doc(this.firestore, 'reels', videoId);

    try {
      await updateDoc(reelRef, {
        viewsCount: increment(1)
      });
      this.viewedInSession.add(videoId);
      viewedReels.push(videoId);
      if (viewedReels.length > 100) viewedReels.shift();
      localStorage.setItem('viewed_reels', JSON.stringify(viewedReels));
      const index = this.swiperService.reels.findIndex(r => r.id === videoId);
      if (index !== -1) {
        this.swiperService.reels[index] = {
          ...this.swiperService.reels[index],
          viewsCount: (this.swiperService.reels[index].viewsCount || 0) + 1
        };
      }
    } catch (e) {
      console.error('Ошибка при обновлении просмотров:', e, videoId);
    }
  }

  attachVideoListener(swiper: any) {
    const activeSlide = swiper.slides[swiper.activeIndex];
    if (!activeSlide) return;

    const video = activeSlide.querySelector('video') as HTMLVideoElement;
    const bar = activeSlide.querySelector('.video-progress-bar') as HTMLElement;
    const reelId = video?.id;

    if (video) {
      let viewCounted = false;

      video.ontimeupdate = () => {
        if (video.duration && bar) {
          const progress = (video.currentTime / video.duration) * 100;
          requestAnimationFrame(() => {
            bar.style.width = `${progress}%`;
          });
        }
        if (!viewCounted && video.currentTime >= 3) {
          viewCounted = true;
          this.incrementViewCount(reelId).then();
        }
      };
    }
  }

  clearPreviousVideoListener(swiper: any) {
    const prevIndex = swiper.previousIndex;
    const prevSlide = swiper.slides[prevIndex];

    if (prevSlide) {
      const video = prevSlide.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.pause();
        video.ontimeupdate = null;
        video.onplay = null;
        video.onended = null;
      }
    }
  }

  hideAuthor(authorId: string, activeIndex: number) {
    for (let i = this.swiperService.reels.length - 1; i >= 0; i--) {
      if (this.swiperService.reels[i].userId === authorId) {
        this.swiperService.reels.splice(i, 1);
        if (i <= activeIndex) {
          activeIndex = Math.max(0, activeIndex - 1);
        }
      }
    }
    this.swiperService.swiper.slideTo(activeIndex);
    this.swiperService.currentReel$.next(this.swiperService.reels[activeIndex]);
    this.swiperService.loadMore();

  }

  isIOS() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
      ].includes(navigator.platform)
      || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
  }

}
