import { inject, Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  addDoc, arrayRemove, arrayUnion,
  collection, doc,
  Firestore,
  getDocs, increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter, updateDoc
} from '@angular/fire/firestore';
import { deleteObject, ref, Storage as FireStorage, uploadBytesResumable } from '@angular/fire/storage';
import { getDownloadURL } from 'firebase/storage';
import { BehaviorSubject, Subject } from 'rxjs';
import { Reel } from '../interfaces/reels.interface';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  uploadProgress: number = 0;
  private videoListSubject = new BehaviorSubject<Reel[]>([]);
  videoList$ = this.videoListSubject.asObservable();
  isLoading = false;
  isDowload$ = new Subject<boolean>();
  lastVisible: any = null;
  previewUrl$ = new Subject<string>();
  private firestore: Firestore = inject(Firestore);
  uploadedVideoUrl$ = new BehaviorSubject<string | null>(null);

  constructor(private storage: FireStorage,private auth: Auth) {
    console.log(this.auth.currentUser);
  }

  async uploadVideo(event: any, userId: string) {

    const file = event.target.files[0];
    if (!file || !userId) return;
    if (file.type !== 'video/mp4') {
      console.log('У файла не допустимое расширение');
      return;
    }
    const maxSizeInBytes = 100 * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      console.log(`Файл слишком большой! Максимальный размер 100 МБ. Ваш файл: ${(file.size / (1024 * 1024)).toFixed(2)} МБ`);
      event.target.value = '';
      return;
    }
    if (this.uploadedVideoUrl$.value) {
      await this.deleteFileFromStorage(this.uploadedVideoUrl$.value);
      this.uploadedVideoUrl$.next(null);
    }
    this.isDowload$.next(true);
    const filePath = `reels/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        // if (this.uploadProgress===100) {
        //   this.isDowload$.next(true);
        // }
        console.log(`Загрузка: ${this.uploadProgress}%`);
      },
      (error) => {
        this.isDowload$.next(true);
        console.error('Ошибка при загрузке:', error);
      },
      async () => {
        this.uploadedVideoUrl$.next(await getDownloadURL(uploadTask.snapshot.ref));
        this.isDowload$.next(false);
        console.log('Видео загружено в Storage, теперь введите описание и нажмите "Опубликовать"');
      }
      // async () => {
      //   const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      //   console.log('Файл доступен по адресу:', downloadURL);
      //
      //   this.saveToFirestore(downloadURL, userId).then();
      // }
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
        userName:this.auth.currentUser.displayName,
        description: description,
        createdAt: serverTimestamp(),
        likesCount: 0,
        likes:[],
        commentsCount: 0,
        viewsCount: 0,
      };
      this.uploadedVideoUrl$.next(null);

      const docRef = await addDoc(reelsCollection, newReel);
      const videoForUI = { id: docRef.id, ...newReel, url: this.uploadedVideoUrl$.value };

      this.videoListSubject.next([videoForUI, ...this.videoListSubject.value]);

      // this.isDowload$.next(true);
      console.log('Данные успешно сохранены в БД! ID документа:', docRef.id);
    } catch (error) {
      // this.isDowload$.next(true);
      console.error('Ошибка при сохранении в Firestore:', error);
    }
  }

  async trackView(videoId: string) {
    const reelRef = doc(this.firestore, 'reels', videoId);

    try {
      await updateDoc(reelRef, {
        viewsCount: increment(1)
      });
    } catch (e) {
      console.error("Ошибка при обновлении просмотров:", e);
    }
  }

  async loadInitialData(firestore:Firestore,count: number = 10) {
    this.isLoading = true;
    const reelsRef = collection(firestore, 'reels');
    const q = query(reelsRef, orderBy('createdAt', 'desc'), limit(count));

    const documentSnapshots = await getDocs(q);

    if (documentSnapshots.docs.length > 0) {
      this.lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];

      const data = documentSnapshots.docs.map(d => ({ id: d.id, ...d.data() }));

      this.videoListSubject.next(data as Reel[]);
    }

    this.isLoading = false;
  }

  async loadNextBatch(limit_n: number = 10) {
    if (this.isLoading || !this.lastVisible) return;

    this.isLoading = true;
    const reelsRef = collection(this.firestore, 'reels');

    const q = query(
      reelsRef,
      orderBy('createdAt', 'desc'),
      startAfter(this.lastVisible),
      limit(limit_n)
    );

    const documentSnapshots = await getDocs(q);

    if (!documentSnapshots.empty) {
      this.lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      const newVideos = documentSnapshots.docs.map(d => ({ id: d.id, ...d.data() }));
      this.videoListSubject.next([...this.videoListSubject.value, ...newVideos as Reel[]]);
    }

    this.isLoading = false;

  }

  async toggleLike(video: Reel) {
    const user = this.auth.currentUser;
    if (!user) return;
    const userId = user.uid;
    const currentVideos = [...this.videoListSubject.getValue()];

    const index = currentVideos.findIndex(v => v.id === video.id);
    if (index === -1) return;

    const updatedVideo = { ...currentVideos[index] };
    const isLiked = updatedVideo.likes?.includes(userId);

    if (!isLiked) {
      updatedVideo.likes = [...(updatedVideo.likes || []), userId];
      updatedVideo.likesCount = (updatedVideo.likesCount || 0) + 1;
    } else {
      updatedVideo.likes = updatedVideo.likes.filter(id => id !== userId);
      updatedVideo.likesCount = Math.max(0, (updatedVideo.likesCount || 0) - 1);
    }

    currentVideos[index] = updatedVideo;
    this.videoListSubject.next(currentVideos);

    const videoRef = doc(this.firestore, 'reels', video.id);
    try {
      await updateDoc(videoRef, {
        likes: !isLiked ? arrayUnion(userId) : arrayRemove(userId),
        likesCount: increment(!isLiked ? 1 : -1)
      });
    } catch (error) {
      console.error("Ошибка сохранения лайка:", error);
      this.videoListSubject.next(this.videoListSubject.getValue());
    }
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
