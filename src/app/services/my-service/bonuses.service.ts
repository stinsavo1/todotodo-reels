import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch
} from '@angular/fire/firestore';
import { defer, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BonusesService {
  private firestore: Firestore = inject(Firestore);

  public async setBonuses(id: string, modal: any) {
    const responsesRef = doc(
      this.firestore,
      `bonuses/${id}`
    )
    await setDoc(responsesRef, {
      ...modal
    })
  }

  public getBonusesById(uid: string): Observable<any[]> {
    return defer(async() => {
      if (!uid) {
        return [];
      }

      const dialogsRef = collection(this.firestore, `bonuses`);
      const q = query(
        dialogsRef,
        where('idReferral', '==', uid),
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs
        .map(doc => doc.data())
    });
  }
}

