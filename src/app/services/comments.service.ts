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
import { BehaviorSubject, Subject } from 'rxjs';
import { CommentsWithAvatar, ReelsComment } from '../interfaces/comments.interface';
import { Reel } from '../interfaces/reels.interface';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  comments$ = new BehaviorSubject<CommentsWithAvatar[]>([]);
  private userCache: Map<string, any> = new Map();

  constructor(private firestore: Firestore, private auth: Auth, ) {
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

  async postComment(newComment:string,videoId:string) {
    if (!newComment || !videoId) return;

    const user = this.auth.currentUser;
    if (!user) return;

    const commentData = {
      reelId: videoId,
      userId: user.uid,
      username: user.displayName || 'User',
      text: newComment,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(this.firestore, 'comments'), commentData);
      const videoRef = doc(this.firestore, 'reels', videoId);
      await updateDoc(videoRef, {
        commentsCount: increment(1)
      });

    } catch (e) {
      console.error('Error adding comment: ', e);
    }
  }
}
