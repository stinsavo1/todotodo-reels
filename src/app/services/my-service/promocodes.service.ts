import { inject, Injectable } from "@angular/core";
import {
  addDoc,
  collection,
  collectionData, deleteDoc,
  DocumentData,
  Firestore,
  getDocs,
  query,
  where
} from "@angular/fire/firestore";
import { defer, from, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PromocodesService {
  private firestore: Firestore = inject(Firestore)

  public getPromocode(value: string): Observable<any> {
    return defer(async () => {
      const dialogsRef = collection(this.firestore, `promocode`);
      const q = query(
        dialogsRef,
        where('value', '==', value)
      );
      const querySnapshot = await getDocs(q);

      // Возвращаем первый найденный документ или null
      const doc = querySnapshot.docs[0];
      return doc ? doc.data() : null;
    });
  }

  public getPromocodes(): Observable<DocumentData[]> {
    const q = collection(this.firestore, 'promocode'); // Без сортировки на уровне Firestore
    return collectionData(q, {
      idField: 'id'
    });
  }

  public addPromocode(value: string, finishDate: string): Observable<string> {
    const promocodeRef = collection(this.firestore, 'promocode');
    const promise = addDoc(promocodeRef, {
      value,
      finishDate,
    }).then(docRef => docRef.id);

    return from(promise);
  }

  public deletePromocode(value: string): Observable<void> {
    const promise = (async () => {
      const promocodesRef = collection(this.firestore, 'promocode');
      const q = query(promocodesRef, where('value', '==', value));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Промокод с таким значением не найден');
      }

      const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
      await Promise.all(deletePromises);
    })();

    return from(promise);
  }
}
