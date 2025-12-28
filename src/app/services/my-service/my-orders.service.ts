import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, getDocs, QuerySnapshot, QueryConstraint } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MyOrdersService {
  private firestore: Firestore = inject(Firestore)

  public getOrders(
    conditions: QueryConstraint[]
  ): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      // Создаем ссылку на коллекцию
      const dataCollection = collection(this.firestore, 'orders');

      // Формируем запрос с переданными условиями
      const q = query(dataCollection, ...conditions);

      // Выполняем запрос и обрабатываем результаты
      getDocs(q)
        .then((querySnapshot) => {
          // Преобразуем QuerySnapshot в массив данных
          const items = this.processQuerySnapshot(querySnapshot);
          observer.next(items); // Тип данных — any[]
          observer.complete();
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          observer.error(error);
        });
    })
  }

// Общий метод для обработки QuerySnapshot
  private processQuerySnapshot(querySnapshot: QuerySnapshot): any[] {
    const result: any[] = [];
    querySnapshot.forEach((doc) => {
      // Преобразуем документы в объекты с id
      result.push({ id: doc.id, ...doc.data() });
    });
    return result;
  }
}

