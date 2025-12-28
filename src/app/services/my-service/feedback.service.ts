import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  docData,
  Firestore,
  getDoc,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private firestore: Firestore = inject(Firestore);

  public async sendFeedbackService(modal: any) {
    const responsesRef = collection(this.firestore, `feedbackService`);
    await addDoc(responsesRef, {
      ...modal
    });
  }

  public getFeedbacks(id: string): Observable<any> {
    const referencesDoc = doc(this.firestore, `feedbacks/${id}`);
    return docData(referencesDoc)
  }
  public async updateFeedbacks(
    uid: string,
    model: any
  ) {
    try {
      const refDoc = doc(this.firestore, `feedbacks/${uid}`);

      // Проверяем, существует ли документ
      const snapshot = await getDoc(refDoc);

      if (snapshot.exists()) {
        // Если документ существует, обновляем его
        const data = snapshot.data();
        const currentArray = data["data"] || [];

        // Обновляем массив
        const updatedArray = [...currentArray, model];

        await updateDoc(refDoc, {
          ['data']: updatedArray,
        });
      } else {
        await setDoc(refDoc, {
          ['data']: [model],
        });
      }
    } catch (error) {
      console.error('Ошибка при добавлении в массив:', error);
    }
  }
}
