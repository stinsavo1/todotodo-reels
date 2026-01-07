import { Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, from, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { Reel, UserPreferences } from '../interfaces/reels.interface';

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

  constructor(private firestore: Firestore, private auth: AuthService) {
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
