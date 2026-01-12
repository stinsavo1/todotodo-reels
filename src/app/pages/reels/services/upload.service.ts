import { inject, Injectable } from '@angular/core';
import { doc, docData, Firestore,  } from '@angular/fire/firestore';
import { deleteObject, percentage, ref, uploadBytesResumable, Storage as FireStorage, UploadTaskSnapshot } from '@angular/fire/storage';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  finalize,
  from,
  ignoreElements, merge,
  Observable,
  of, Subject,
  switchMap,
  take,
  tap
} from 'rxjs';
import { filter } from 'rxjs/operators';
import { MAX_SIZE_FILE } from '../interfaces/reels.interface';

export interface UploadedFile {
  videoUrl:string;
  thumbUrl:string;
  videoPath:string;
  fileId:string;
}

@Injectable()
export class UploadService {
  constructor(private storage:FireStorage) {
  }

  private firestore = inject(Firestore);
  public processingVideo$ = new Subject<string>()
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public uploadProgress$ = new BehaviorSubject<number | null>(null);
  public errorMessages$ = new BehaviorSubject<string | null>(null);
  public uploadedVideo$ = new BehaviorSubject<UploadedFile | null>(null);


  uploadVideo(event: any, userId: string): Observable<any> {
    const file: File = event.target.files[0];

    if (!file || !userId) return EMPTY;
    if (!this.isValidType(file)) return EMPTY;
    if (!this.isValidSize(file)) return EMPTY;

    this.isLoading$.next(true);
    this.errorMessages$.next(null);

    return this.checkVideoDuration(file).pipe(
      switchMap((isLongEnough) => {
        if (!isLongEnough) {
          this.errorMessages$.next('Видео слишком короткое (минимум 2 сек)');
          return EMPTY;
        }

        const cleanup$ = this.uploadedVideo$.value
          ? from(this.deleteFileFromStorage(this.uploadedVideo$.value))
          : of(null);

        return cleanup$.pipe(switchMap(() => this.startUploadProcess(file)));
      }),
      finalize(() => {
        console.log('finished');
        this.isLoading$.next(false);
        this.uploadProgress$.next(null);
        this.processingVideo$.next(null);
        event.target.value = '';
      })
    );
  }

  private startUploadProcess(file: File): Observable<any> {
    const fileId = `${Date.now()}_${file.name}`.replace(/\W/g, '_');
    const filePath = `tmp/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const progress$ = percentage(uploadTask).pipe(
      tap((p: { progress: number; snapshot: UploadTaskSnapshot }) => this.uploadProgress$.next(p.progress / 100)),
      ignoreElements()
    );

    const processing$ = from(Promise.resolve(uploadTask)).pipe(
      tap(() => {
        this.processingVideo$.next('Обработка видео...');
      }),
      switchMap(() => this.waitForFirestoreProcessing(fileId))
    );
    return merge(progress$, processing$).pipe(
      catchError((err) => {
        console.error('Upload Process Error:', err);
        const msg = err.message || 'Ошибка при загрузке или обработке';
        this.errorMessages$.next(msg);
        return EMPTY;
      })
    );
  }

  private waitForFirestoreProcessing(fileId: string): Observable<any> {
    const videoDocRef = doc(this.firestore, `tmpReels/${fileId}`);
    return docData(videoDocRef).pipe(
      filter((data) => !!data),
      tap((data: any) => {
        if (data.status === 'error') throw new Error(data.errorMessage);
      }),
      filter((data: any) => data.status === 'finished'),
      take(1),
      tap((finalData: any) => {
        this.uploadedVideo$.next({ ...finalData, fileId:fileId});
        localStorage.setItem('pending_video_url', finalData.videoUrl);
        this.errorMessages$.next(null);
      })
    );
  }

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


}
