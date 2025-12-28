import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  getDoc,
  doc,
  deleteDoc,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { where } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { CoreService } from "../core.service";
import { AuthService } from "../auth.service";

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  constructor(private core: CoreService,
              private authService: AuthService) {
  }

  private firestore: Firestore = inject(Firestore)

  public getStoreProductByAuthor(authorId: string): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      const dataCollection = collection(this.firestore, 'storeProduct');

      // Добавляем условие where — authorId == указанному значению
      const q = query(dataCollection, where('author', '==', authorId));

      getDocs(q)
        .then((querySnapshot) => {
          const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          observer.next(items);
          observer.complete();
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          observer.error(error);
        });
    });
  }

  async sentItemStore(item: { [key: string]: any }, id: string = uuidv4()) {
    let itemDetail: { [key: string]: any } = {
      ...item,
      id,
      author: this.authService.uid,
      date: new Date().toISOString().slice(0, 10),
    }
    delete itemDetail['uri']
    this.core.presentLoading('Сохранение...')
    await setDoc(doc(this.firestore, `storeProduct/${id}`), itemDetail).then(() => ({
      id
    }))

    this.core.dismissLoading();
  }

  async updateItemStore(id: string, updateData: { [key: string]: any }) {
    // Добавляем автоматическое обновление даты (если нужно)
    const updatedFields = {
      ...updateData
    };

    // Убираем лишние поля, если нужно (например 'uri')
    delete updatedFields['uri'];

    this.core.presentLoading('Обновление...');

    try {
      await updateDoc(doc(this.firestore, `storeProduct/${id}`), updatedFields);
      console.log('Документ успешно обновлен');
    } catch (error) {
      console.error('Ошибка при обновлении документа:', error);
    } finally {
      this.core.dismissLoading();
    }
  }

  public getStoreProductById(productId: string): Observable<any> {
    return new Observable<any>((observer) => {
      const productDocRef = doc(this.firestore, 'storeProduct', productId);

      getDoc(productDocRef)
        .then((docSnapshot) => {
          if (docSnapshot.exists()) {
            // Возвращаем объект с данными и id
            const productData = {
              id: docSnapshot.id,
              ...docSnapshot.data()
            };
            observer.next(productData);
            observer.complete();
          } else {
            observer.next(null); // Документ не найден
            observer.complete();
          }
        })
        .catch((error) => {
          console.error("Error fetching document:", error);
          observer.error(error);
        });
    });
  }

  public deleteProduct(productId: string): Observable<void> {
    return new Observable<void>((observer) => {
      const orderDocRef = doc(this.firestore, 'storeProduct', productId);

      deleteDoc(orderDocRef)
        .then(() => {
          console.log('Order successfully deleted!');
          observer.next();
          observer.complete();
        })
        .catch((error) => {
          console.error('Error deleting order:', error);
          observer.error(error);
        });
    });
  }
}

