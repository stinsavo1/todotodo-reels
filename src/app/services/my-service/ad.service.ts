import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AdService {
  private firestore: Firestore = inject(Firestore);


  public async setAd(): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    // Создаем ссылку на документ в Firestore
    const adRef = doc(this.firestore, `ad/${date}`);

    // Получаем текущий документ (если он существует)
    const adSnapshot = await getDoc(adRef);

    if (adSnapshot.exists()) {
      // Если документ существует, получаем текущее значение count и увеличиваем его на 1
      const currentData = adSnapshot.data();
      const currentCount = currentData['count'] || 0; // Убедимся, что count существует

      // Обновляем документ, увеличивая count
      await updateDoc(adRef, {
        count: currentCount + 1
      });
    } else {
      // Если документ не существует, создаем новый с начальным значением count = 1
      await setDoc(adRef, {
        date: date,
        count: 1
      });
    }
  }

  // Метод для получения данных о кликах по дням
  public async getClicksByDays(): Promise<any[]> {
    const adCollection = collection(this.firestore, 'ad');
    const q = query(adCollection, orderBy('date')); // Сортируем по дате
    const querySnapshot = await getDocs(q);

    const data: any[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      data.push({
        name: docData['date'], // Дата
        value: docData['count'] // Количество кликов
      });
    });

    return data;
  }
}
