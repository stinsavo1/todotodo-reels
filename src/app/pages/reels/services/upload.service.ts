import { inject, Injectable } from '@angular/core';
import { collection, doc, docData, Firestore, } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { deleteObject, percentage, ref, Storage as FireStorage, uploadBytesResumable } from '@angular/fire/storage';
import { getDownloadURL, uploadBytes } from 'firebase/storage';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  finalize,
  forkJoin,
  from,
  ignoreElements,
  merge,
  Observable, of,
  Subject,
  switchMap,
  take,
  tap, throwError
} from 'rxjs';
import { filter } from 'rxjs/operators';
import { MAX_SIZE_FILE } from '../interfaces/reels.interface';

export interface UploadedFile {
  videoUrl: string;
  thumbUrl: string;
  thumbPath:string;
  filePath: string;
  reelId:string;
}

@Injectable()
export class UploadService {
  constructor(private storage: FireStorage, private functions: Functions) {
  }

  private firestore = inject(Firestore);
  public processingVideo$ = new Subject<string>();
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public uploadProgress$ = new BehaviorSubject<number | null>(null);
  public errorMessages$ = new BehaviorSubject<string | null>(null);
  public uploadedVideo$ = new BehaviorSubject<UploadedFile | null>(null);



  private checkVideoDuration(file: File): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        const duration = video.duration;
        observer.next(duration >= 2);
        observer.complete();
      };

      video.onerror = () => observer.error(new Error('Не удалось прочитать видео'));
      video.src = objectUrl;

      return () => URL.revokeObjectURL(objectUrl);
    });
  }

  private isValidType(file: File): boolean {
    const valid = ['video/mp4', 'video/quicktime'].includes(file.type);
    if (!valid) this.errorMessages$.next('У файла недопустимое расширение');
    return valid;
  }

  private isValidSize(file: File): boolean {
    const maxSize = MAX_SIZE_FILE * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessages$.next(`Файл слишком большой! Макс: ${MAX_SIZE_FILE}МБ`);
      return false;
    }
    return true;
  }

  public async deleteFileFromStorage(url: UploadedFile) {
    if (!url) return;
    try {
      const fileRef = ref(this.storage, url.videoUrl);
      await deleteObject(fileRef);
    } catch (e) {
      console.error('Old file delete failed', e);
    }
  }

  uploadVideo(event: any): Observable<UploadedFile> {
    const file: File = event.target.files[0];
    const fileExtension = file.name.split('.').pop();
    if (!file || !this.isValidSize(file) || !this.isValidType(file)) return EMPTY;

    this.isLoading$.next(true);
    const reelId = doc(collection(this.firestore, 'reels')).id;
    return this.checkVideoDuration(file).pipe(
      switchMap((isValid) => {
        if (!isValid) {

          return throwError(() => new Error('Видео слишком короткое (минимум 2 сек)'));
        }
        return this.generateThumbnail(file)
      }),
      switchMap((thumbBlob: Blob) => {
        const filePath = `tmp/${reelId}_original.${fileExtension}`;
        const thumbPath = `thumbs/${reelId}.jpg`;

        const videoRef = ref(this.storage, filePath);
        const thumbRef = ref(this.storage, thumbPath);

        const videoUploadTask = uploadBytesResumable(videoRef, file);
        const thumbUploadTask = uploadBytes(thumbRef, thumbBlob);

        const progress$ = percentage(videoUploadTask).pipe(
          tap((p: { progress: number }) => this.uploadProgress$.next(p.progress / 100)),
          ignoreElements()
        );

        const upload$ = forkJoin({
          videoUrl: from(videoUploadTask as any).pipe(
            switchMap(() => getDownloadURL(videoRef))
          ),
          thumbUrl: from(thumbUploadTask).pipe(
            switchMap(() => getDownloadURL(thumbRef))
          ),
          thumbPath: of(thumbPath),
          filePath: of(filePath),
          reelId:of(reelId)
        });
        return merge(progress$, upload$);
      }),
      catchError((err) => {
        this.errorMessages$.next(err.message);
        console.error('Ошибка при загрузке:', err.message);
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading$.next(false);
      })
    );

  }

  generateThumbnail(file: File): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const url = URL.createObjectURL(file);

      video.src = url;
      video.load();

      video.onloadedmetadata = () => {
        video.currentTime = 1;
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            observer.next(blob);
            observer.complete();
          } else {
            observer.error('Could not generate thumbnail');
          }
          URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.8);
      };

      video.onerror = (err) => observer.error(err);
    });
  }

  processVideo(filePath: string, thumbPath:string, reelId:string): Observable<any> {
    if (!filePath || !thumbPath || !reelId) return EMPTY;

    const processVideoFn = httpsCallable(this.functions, 'processVideoUpload');

    return from(processVideoFn({ filePath: filePath, thumbPath:thumbPath, reelId:reelId })).pipe(
      tap((result: any) => {
        if (result.data.status === 'success') {
          const data = result.data;
          const value = this.uploadedVideo$.value;
          this.uploadedVideo$.next({ ...value,videoUrl: data.videoUrl, filePath: data.filePath,thumbPath:data.thumbPath });
          localStorage.setItem('pending_video_url', data.videoUrl);
          this.errorMessages$.next(null);
        } else {
          this.errorMessages$.next(result.data.reason || 'Ошибка обработки видео');
        }
      }),
      catchError((err) => {
        console.error('Processing Error:', err);
        this.errorMessages$.next(err.message || 'Ошибка при обработке видео');
        return EMPTY;
      })
    );
  }

}
