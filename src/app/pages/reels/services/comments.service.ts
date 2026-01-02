import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  addDoc,
  collection, doc,
  Firestore, getDoc, increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp, updateDoc,
  where
} from '@angular/fire/firestore';
import { BehaviorSubject, catchError, concatMap, from, of, Subject, switchMap, take, tap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommentsWithAvatar, ReelsComment } from '../interfaces/comments.interface';
import { Reel } from '../interfaces/reels.interface';
import { VideoService } from './video.service';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  comments$ = new BehaviorSubject<CommentsWithAvatar[]>([]);
  private userCache: Map<string, any> = new Map();

  constructor(private firestore: Firestore, private videoService:VideoService) {
  }



  async loadComments(videoId: string) {

    const commentsRef = collection(this.firestore, 'comments');
    const q = query(
      commentsRef,
      where('reelId', '==', videoId),
      orderBy('createdAt', 'asc')
    );

    onSnapshot(q, async (snapshot) => {
      const newComments =snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ReelsComment[];
      for (let comment of newComments) {
        comment['avatar'] = await this.getUserAvatar(comment.userId);
      }
      console.log('comments next');
      this.comments$.next(newComments as CommentsWithAvatar[]);
    });
  }


  async getUserAvatar(userId: string): Promise<string> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId).photoURL;
    }

    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userCache.set(userId, userData);
        return userData['photo'] || 'assets/avatar.svg';
      }
    } catch (e) {
      console.error("Error fetching user:", e);
    }

    return 'assets/avatar.svg';
  }


  postComment(newComment: string, videoId: string,user:any) {


    const commentData = {
      reelId: videoId,
      userId: user.uid,
      username: user.displayName || 'User',
      text: newComment,
      createdAt: serverTimestamp()
    };
    let index = 0;

    const videoRef = doc(this.firestore, 'reels', videoId);
    const commentsCol = collection(this.firestore, 'comments');

   return of(this.videoService.videoListSubject.getValue()).pipe(
      take(1),
      map(currentVideos => {
        index = currentVideos.findIndex(v => v.id === videoId);
        if (index === -1) return { videos: currentVideos, original: currentVideos };

        const updatedVideos = [...currentVideos];
        updatedVideos[index] = {
          ...updatedVideos[index],
          commentsCount: (updatedVideos[index].commentsCount || 0) + 1
        };

        return { updatedVideos, originalVideos: currentVideos };
      }),
      tap(({ updatedVideos }) => {
        if (updatedVideos) {
          this.videoService.videoListSubject.next(updatedVideos);
          this.videoService.currentReels$.next(updatedVideos[index]);
          // this.videoService.updateSwiper(this.videoService.swiper,updatedVideos);
        }
      }),
      concatMap(() =>
        from(addDoc(commentsCol, commentData)).pipe(
          switchMap(() => from(updateDoc(videoRef, { commentsCount: increment(1) }))),
          catchError(err => {
            console.error('Firestore Error:', err);
            return throwError(() => err);
          })
        )
      ),
      catchError(err => {
        const original = this.videoService.videoListSubject.getValue();
        this.videoService.videoListSubject.next(original);
        console.log("Rolling back comment count...");
        return of(null);
      })
    )
  }
}
