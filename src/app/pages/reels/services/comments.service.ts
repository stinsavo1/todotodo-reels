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
import { UserStoreService } from '../../../services/store-service/user-store.service';
import { CommentsWithAvatar, ReelsComment } from '../interfaces/comments.interface';
import { Reel } from '../interfaces/reels.interface';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  comments$ = new BehaviorSubject<CommentsWithAvatar[]>([]);
  private userCache: Map<string, any> = new Map();

  constructor(private firestore: Firestore, private userService:UserStoreService) {
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


  postComment(newComment: string, reel: Reel,user:any) {
    const userStore = this.userService.getUserValue();
    const commentData = {
      reelId: reel.id,
      userId: user.uid,
      username: userStore.fio || 'User',
      text: newComment,
      createdAt: serverTimestamp()
    };

    const videoRef = doc(this.firestore, 'reels', reel.id);
    const commentsCol = collection(this.firestore, 'comments');

   return from(addDoc(commentsCol, commentData)).pipe(
     switchMap(() => from(updateDoc(videoRef, { commentsCount: increment(1) }))),
     map(()=>commentData),
     catchError(err => {
       console.error('Firestore Error:', err);
       return throwError(() => err);
     })
   )

  }
}
