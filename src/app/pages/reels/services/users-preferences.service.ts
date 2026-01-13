import { Injectable } from '@angular/core';
import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  doc,
  Firestore,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc
} from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, from, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/my-service/user.service';
import { Reel, UserPreferences } from '../interfaces/reels.interface';

export interface Subscriptions {
  subscribers: string[],
  count: number
}

@Injectable({
  providedIn: 'root'
})
export class UsersPreferencesService {
  private hiddenAuthors = new Set<string>();
  private hiddenVideos = new Set<string>();
  prefs$ = new BehaviorSubject<UserPreferences>({
    blockedAuthors: new Set(),
    hiddenVideos: new Set()
  });
  currentSubscribtions$ = new BehaviorSubject<Subscriptions | null>(null);

  constructor(private firestore: Firestore, private auth: AuthService, private usersService: UserService) {
  }

  // trackSubscription(targetUserId: string, myUserId: string) {
  //   const userRef = doc(this.firestore, "users", targetUserId);
  //
  //   // onSnapshot listens for real-time changes
  //   onSnapshot(userRef, (doc) => {
  //     const data = doc.data();
  //     if (data && data.subscriberIds) {
  //       // Check if MY ID is in THEIR list
  //       this.isSubscribed = data.subscriberIds.includes(myUserId);
  //     } else {
  //       this.isSubscribed = false;
  //     }
  //   });}

  getDataUser(userId) {

  }

  subscribeToUser(userId: string, subscriberId: string): Observable<void> {
    const userRef = doc(this.firestore, `users/${userId}`);

    return from(
      runTransaction(this.firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) throw new Error('User does not exist');

        const data = userDoc.data() as any;

        if (data.subscribersIds?.includes(subscriberId)) {
          console.log('Already subscribed');
          return;
        }

        transaction.update(userRef, {
          subscribersIds: arrayUnion(subscriberId),
          subscribersCount: increment(1)
        });
      })
    ).pipe(
      tap(()=>{
        const previos = {...this.currentSubscribtions$.value};
        this.currentSubscribtions$.next({
          subscribers:previos?.subscribers ?[...previos.subscribers, subscriberId] : [subscriberId],
          count:previos?.count ? previos.count+1 : 0})
      })
    );
  }

  unsubscribeFromUser(userId: string, subscriberId: string): Observable<void> {
    const userRef = doc(this.firestore, `users/${userId}`);

    return from(
      runTransaction(this.firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) throw new Error('User does not exist');

        const data = userDoc.data() as any;

        if (!data.subscribersIds?.includes(subscriberId)) return;

        transaction.update(userRef, {
          subscribersIds: arrayRemove(subscriberId),
          subscribersCount: increment(-1)
        });
      })
    ).pipe(
      tap(()=>{
        const previos = {...this.currentSubscribtions$.value};

        this.currentSubscribtions$.next({
          subscribers: previos?.subscribers ? previos.subscribers.filter(id => id !== subscriberId) : [],
          count: previos.count ? previos.count - 1 : 0
        });
      }));
  }

  loadPreferences(uid: string): Observable<{
    blockedAuthors: Set<string>;
    hiddenVideos: Set<string>;
  }> {
    const hiddenAuthors$ = collectionData(
      collection(this.firestore, `users/${uid}/hiddenAuthors`),
      { idField: 'id' }
    );

    const hiddenVideos$ = collectionData(
      collection(this.firestore, `users/${uid}/hiddenVideos`),
      { idField: 'id' }
    );

    return combineLatest([hiddenAuthors$, hiddenVideos$]).pipe(
      map(([authors, videos]) => ({
        blockedAuthors: new Set(authors.map(a => a.id)),
        hiddenVideos: new Set(videos.map(v => v.id))
      })),
      tap(prefs => this.prefs$.next(prefs))
    );
  }

  shouldHide(videoId: string, authorId: string): boolean {
    return this.hiddenVideos.has(videoId) || this.hiddenAuthors.has(authorId);
  }

  applyFilter(videos: Reel[]): Reel[] {
    return videos.filter(video =>
      !this.shouldHide(video.id, video.userId)
    );
  }

  hideContent(type: 'video' | 'author', targetId: string): Observable<void> {
    const collectionName =
      type === 'author' ? 'hiddenAuthors' : 'hiddenVideos';

    const docRef = doc(
      this.firestore,
      `users/${this.auth.uid}/${collectionName}/${targetId}`
    );

    const current = this.prefs$.value;
    const updated: UserPreferences = {
      blockedAuthors: new Set(current.blockedAuthors),
      hiddenVideos: new Set(current.hiddenVideos)
    };

    if (type === 'author') {
      updated.blockedAuthors.add(targetId);
    } else {
      updated.hiddenVideos.add(targetId);
    }

    return from(
      setDoc(docRef, { createdAt: serverTimestamp() })
    );

  }

  addToLocalCache(type: 'video' | 'author', id: string) {
    if (type === 'author') {
      this.hiddenAuthors.add(id);
    } else {
      this.hiddenVideos.add(id);
    }

  }
}
