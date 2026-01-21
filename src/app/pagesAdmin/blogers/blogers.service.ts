import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore, query } from '@angular/fire/firestore';
import { ref } from '@angular/fire/storage';
import { where } from 'firebase/firestore';
import { getDownloadURL, getStorage } from 'firebase/storage';
import { from, Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserById, UserInterface, UserWithRegion } from '../../interfaces/user.interface';

@Injectable()
export class BlogersService {
  usersById: UserById | null;
  private urlCache = new Map<string, Observable<string>>();

  constructor(private firestore: Firestore) {
    this.transformUserById();
  }



  transformUserById(){

      const usersRef = collection(this.firestore, 'users');

      collectionData(usersRef, { idField: 'id' }).pipe(
        map((usersArray: any[]) => {
          return usersArray.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as UserById);
        })
      ).subscribe({
        next: (data) => {
          this.usersById=data
        }
      });
  }

  getBlogerReels$(id:string):Observable<any> {
    const reelsRef = collection(this.firestore,'reels');
    const q = query(reelsRef, where('userId', '==', id));
    return collectionData(q, { idField: 'id' });
  }

  getReelsComments$(id:string):Observable<any> {
    const reelsRef = collection(this.firestore,'comments');
    const q = query(reelsRef, where('reelId', '==', id));
    return collectionData(q, { idField: 'id' });
  }

  getImageUrl(imgName:string, type:'video'|'poster'):Observable<string>{
    if (this.urlCache.has(imgName)) {
      return this.urlCache.get(imgName)!;
    }

    const storage = getStorage();

    const refStorage = type === 'poster' ? ref(storage, `thumbnails/${imgName}`) : ref(storage, `reels/${imgName}`);

    const url$ = from(getDownloadURL(refStorage)).pipe(
      shareReplay(1)
    );

    this.urlCache.set(imgName, url$);
    return url$;
  }
}
