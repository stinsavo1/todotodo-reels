import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { arrayRemove, arrayUnion, doc, Firestore, increment, updateDoc } from '@angular/fire/firestore';
import { catchError, from, of, switchMap, take, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reel } from '../interfaces/reels.interface';
import { VideoService } from './video.service';

@Injectable({
  providedIn: 'root'
})
export class LikesService {
  constructor(private firestore:Firestore,
              private auth:Auth,
              private videoService:VideoService) {
  }


  toggleLike(video: Reel) {
    const user = this.auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const videoRef = doc(this.firestore, 'reels', video.id);

    of(this.videoService.videoListSubject.getValue()).pipe(
      take(1),
      map(currentVideos => {
        const index = currentVideos.findIndex(v => v.id === video.id);
        if (index === -1) return { currentVideos, updatedVideo: null, isLiked: false };

        const updatedVideo = { ...currentVideos[index] };
        const isLiked = updatedVideo.likes?.includes(userId);

        if (!isLiked) {
          updatedVideo.likes = [...(updatedVideo.likes || []), userId];
          updatedVideo.likesCount = (updatedVideo.likesCount || 0) + 1;
        } else {
          updatedVideo.likes = updatedVideo.likes.filter(id => id !== userId);
          updatedVideo.likesCount = Math.max(0, (updatedVideo.likesCount || 0) - 1);
        }

        const newVideos = [...currentVideos];
        newVideos[index] = updatedVideo;
        this.videoService.currentReels$.next(updatedVideo);
        return { newVideos, isLiked, originalVideos: currentVideos };
      }),
      tap(({ newVideos }) => {
        //todo delete
        this.videoService.videoListSubject.next(newVideos);

      }),
      switchMap(({ isLiked, originalVideos }) =>
        from(updateDoc(videoRef, {
          likes: !isLiked ? arrayUnion(userId) : arrayRemove(userId),
          likesCount: increment(!isLiked ? 1 : -1)
        })).pipe(
          catchError(error => {
            console.error("Error saving like:", error);
            this.videoService.videoListSubject.next(originalVideos);
            return of(null);
          })
        )
      )
    ).subscribe();
  }
}
