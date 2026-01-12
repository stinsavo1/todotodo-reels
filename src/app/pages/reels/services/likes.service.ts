import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { arrayRemove, arrayUnion, doc, Firestore, increment, updateDoc } from '@angular/fire/firestore';
import { catchError, from, of, switchMap, take, tap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reel } from '../interfaces/reels.interface';

@Injectable()
export class LikesService {
  constructor(private firestore:Firestore) {
  }


  toggleLike(video: Reel, userId:string) {
    if (!userId) return of(undefined);
    const videoRef = doc(this.firestore, 'reels', video.id);
    const isLiked = video.likes?.includes(userId);
    const updatedReel: Reel = {
      ...video,
      likes: isLiked
        ? video.likes.filter(id => id !== userId)
        : [...(video.likes || []), userId],
      likesCount: Math.max(0, (video.likesCount || 0) + (isLiked ? -1 : 1))
    };

    return from(updateDoc(videoRef, {
      likes: !isLiked ? arrayUnion(userId) : arrayRemove(userId),
      likesCount: increment(!isLiked ? 1 : -1)
    })).pipe(
      map(() => {
        return updatedReel;
      }),
      catchError(error => {
        console.error("Error saving like, rolling back:", error);
        return throwError(() => error);
      })
    );
  }
}
