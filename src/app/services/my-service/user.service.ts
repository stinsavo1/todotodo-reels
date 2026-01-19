import { from, Observable, of, tap } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import {
  doc,
  setDoc,
  Firestore,
  collection,
  query,
  getDocs,
  QuerySnapshot,
  QueryConstraint,
  getDoc, updateDoc, deleteField, onSnapshot, deleteDoc, increment
} from '@angular/fire/firestore';
import {where} from "firebase/firestore";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore)

  public async updateUser(id: string, data: any) {
    const responsesRef = doc(
      this.firestore,
      `users/${id}`
    )
    await setDoc(responsesRef, data, { merge: true })
  }

  public updateLastInactiveTime(userId: string, lastInactiveTime: string): void {
    const userRef = doc(this.firestore, `users/${userId}`);
    setDoc(userRef, { lastInactiveTime }, { merge: true })
      .then(() => {
        // успешно обновлено — можно логировать или триггерить что-то
        console.log(`lastInactiveTime updated for user ${userId}`);
      })
      .catch(err => {
        console.error('Failed to update lastInactiveTime:', err);
        // обработка ошибки — по вашему предпочтению: безопасно, явно
      });
  }


// Метод для получения данных из Firestore с динамическими условиями
  public getUsers(
    conditions: QueryConstraint[]
  ): Observable<any[]> {
    return new Observable((observer) => {
      // Создаем ссылку на коллекцию
      const dataCollection = collection(this.firestore, 'users');

      // Формируем запрос с переданными условиями
      const q = query(dataCollection, ...conditions);

      // Выполняем запрос и обрабатываем результаты
      getDocs(q)
        .then((querySnapshot) => {
          // Вызываем общий метод для обработки QuerySnapshot
          const result = this.processQuerySnapshot(querySnapshot);
          observer.next(result);
          observer.complete();
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          observer.error(error); // Передаем ошибку в поток
        });
    });
  }

  // Получить всех пользователей без фильтров
  public getAllUsers(): Observable<any[]> {
    return new Observable((observer) => {
      const dataCollection = collection(this.firestore, 'users');

      // Просто получаем все документы из коллекции
      getDocs(dataCollection)
        .then((querySnapshot) => {
          const result = this.processQuerySnapshot(querySnapshot);
          observer.next(result);
          observer.complete();
        })
        .catch((error) => {
          console.error("Error fetching all users:", error);
          observer.error(error);
        });
    });
  }

  public async updateUserEmail(userId: string, email: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { email });
  }

  public async deleteUserLinkByUserId(userId: string): Promise<void> {
    const userLinksRef = collection(this.firestore, 'link-users');
    const q = query(userLinksRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No matching documents found for userId:', userId);
      return;
    }

    // Удаляем все найденные записи
    const deletePromises = snapshot.docs.map((docSnapshot) => {
      const docRef = doc(this.firestore, 'link-users', docSnapshot.id);
      return deleteDoc(docRef);
    });

    await Promise.all(deletePromises);
    console.log(`Deleted ${deletePromises.length} document(s) for userId: ${userId}`);
  }

  public async updateUserPhoto(userId: string, photoUrl: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { photo: [photoUrl] });
  }

  public getUserById(userId: string): Observable<any | null> {
    if (!userId) {
      return of(null)
    }
    return new Observable((observer) => {
      const userDocRef = doc(this.firestore, `users/${userId}`);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            observer.next({ id: docSnapshot.id, ...docSnapshot.data() });
          } else {
            observer.next(null); // Пользователь не найден
          }
        },
        (error) => {
          console.error("Error fetching user by ID:", error);
          observer.error(error);
        }
      );

      // Отписываемся от слушателя при завершении Observable
      return () => unsubscribe();
    });
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


  public async incrementCount(userId: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userRef, { count: increment(1) });
  }
}
