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
import { Subscription, UserInterface } from '../../../interfaces/user.interface';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/my-service/user.service';
import { Reel, UserPreferences } from '../interfaces/reels.interface';

export interface SubscriptionsData {
  subscriptions: string[],
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
  currentSubscribtions$ = new BehaviorSubject<SubscriptionsData | null>(null);

  constructor(private firestore: Firestore, private auth: AuthService, private usersService: UserService) {
  }

  subscribeToUser(userId: string, subscriber: Reel): Observable<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const subscriberRef = doc(this.firestore, `users/${subscriber.userId}`);

    return from(
      runTransaction(this.firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const subDoc = await transaction.get(subscriberRef);

        if (!userDoc.exists() || !subDoc.exists()) throw new Error('User does not exist');

        const data = userDoc.data() as UserInterface;

        const isAlreadySubscribed = data.subscribtionsIds?.some(
          (sub) => sub === subscriber.userId
        );

        if (isAlreadySubscribed) {
          console.log('Already subscribed');
          return;
        }

        transaction.update(userRef, {
          subscribtionsIds: arrayUnion(subscriber.userId),
          subscribtionsCount: increment(1)
        });
        transaction.update(subscriberRef, {
          subscribersIds: arrayUnion(data.id),
          subscribersCount:increment(1)
        });
      })
    ).pipe(
      tap(() => {
        const previous = { ...this.currentSubscribtions$.value };
        this.currentSubscribtions$.next({
          subscriptions: previous?.subscriptions ? [...previous.subscriptions, subscriber.userId] : [subscriber.userId],
          count: (previous?.count ?? 0) + 1
        });

      })
    );
  }

  unsubscribeFromUser(userId: string, subscriber: Reel): Observable<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const subscriberRef = doc(this.firestore, `users/${subscriber.userId}`);

    return from(
      runTransaction(this.firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const subDoc = await transaction.get(subscriberRef);
        if (!userDoc.exists() || !subDoc.exists()) throw new Error('User does not exist');

        const data = userDoc.data() as UserInterface;
        const dataSubscriber = subDoc.data() as UserInterface;
        const existingSub = data.subscribtionsIds.find(sub => sub === subscriber.userId);
        const existingSubcriber = dataSubscriber.subscribersIds.find(sub => sub === userId);

        if (!existingSub || !existingSubcriber) return;

        transaction.update(userRef, {
          subscribtionsIds: arrayRemove(existingSub),
          subscribtionsCount: increment(-1)
        });
        transaction.update(subscriberRef, {
          subscribersIds: arrayRemove(existingSubcriber),
          subscribersCount: increment(-1)
        });
      })
    ).pipe(
      tap(() => {
        const previous = { ...this.currentSubscribtions$.value };

        this.currentSubscribtions$.next({
          subscriptions: previous?.subscriptions.length>0 ? previous.subscriptions.filter((sub)=>sub !== subscriber.userId): [],
          count: previous?.count ? previous.count-1:0
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
