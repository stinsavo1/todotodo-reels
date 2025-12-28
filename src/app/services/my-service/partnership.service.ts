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
import { PartnershipInterface } from '../../interfaces/partnership.interface';
import moment from 'moment/moment';

@Injectable({
  providedIn: 'root'
})
export class PartnershipService {
  private firestore: Firestore = inject(Firestore)

  public async sendPartnership(id: string, modal: any) {
    const responsesRef = doc(
      this.firestore,
      `partnership/${id}`
    )
    await setDoc(responsesRef, {
      ...modal
    })
  }

  public getIdPartnership(uid: string): Observable<any[]> {
    return defer(async() => {
      if (!uid) {
        return [];
      }

      const dialogsRef = collection(this.firestore, `partnership`);
      const q = query(
        dialogsRef,
        where('idPartnership', '==', uid),
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs
        .map(doc => doc.data())
    });
  }

  public getIdByKeyPartnership(uid: string, key: string, value: string): Observable<any | null> {
    return defer(async () => {
      if (!uid) {
        return null;
      }

      try {
        const dialogsRef = collection(this.firestore, `partnership`);
        const q = query(
          dialogsRef,
          where('idPartnership', '==', uid),
          where(key, '==', value)
        );

        const querySnapshot = await getDocs(q);

        // Если найден хотя бы один документ - вернуть первый
        if (!querySnapshot.empty) {
          // Если нужно убедиться, что документ только один
          if (querySnapshot.size > 1) {
            console.warn('Multiple documents found, returning first');
          }
          return querySnapshot.docs[0].data();
        }

        return null; // Если документов нет
      } catch (error) {
        console.error('Firestore error:', error);
        return null;
      }
    });
  }

  public deletePartnershipByEmail(email: string | null): Observable<void> {
    return defer(async () => {
      if (!email) {
        return;
      }

      const dialogsRef = collection(this.firestore, 'partnership');
      const q = query(dialogsRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(this.firestore);
      querySnapshot.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
    });
  }

  public deletePartnershipByPhone(phone: string | null): Observable<void> {
    return defer(async () => {
      if (!phone) {
        return;
      }

      const dialogsRef = collection(this.firestore, 'partnership');
      const q = query(dialogsRef, where('phoneNumber', '==', phone));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(this.firestore);
      querySnapshot.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
    });
  }

  public getAdminPartnerships(): Observable<PartnershipInterface[]> {
    const refDoc = collection(this.firestore, 'partnership');
    return collectionData(refDoc) as Observable<PartnershipInterface[]>;
  }
}

