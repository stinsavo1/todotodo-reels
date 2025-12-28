import { inject, Injectable } from '@angular/core'
import {
  addDoc,
  collection,
  collectionData,
  doc,
  DocumentData,
  Firestore,
  setDoc,
  updateDoc
} from '@angular/fire/firestore'
import { map, Observable, switchMap } from 'rxjs'
import { AuthService } from './auth.service'
import { OrderStatusEnum } from '../enums/order-status.enum';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private firestore: Firestore = inject(Firestore)

  constructor(private authService: AuthService) {
  }

  async add(id: string, text: string, photos: string[], status?: OrderStatusEnum) {
    const createdAt = new Date().toISOString()
    const ref = collection(this.firestore, `dialogs/${id}/messages`)
    await addDoc(ref, {
      author: this.authService.uid,
      createdAt,
      text,
      photos
    })
    const item: DocumentData = {
      author: this.authService.uid,
      createdAt,
      text: text.length > 50 ? text.slice(0, 50) + '...' : text
    }
    id.split('_').slice(0, 2).forEach(key => {
      item[key] = true
      item[key + '_isNew'] = key != this.authService.uid
    })

    if (status) {
      item['status'] = status;
    }
    return await setDoc(doc(this.firestore, `dialogs/${id}`), item, {
      merge: true
    })
  }

  dialogs() {
    return this.authService.authState$.pipe(
      map(authState => authState.user?.uid || ''),
      switchMap(uid =>
        uid
          ? collectionData(collection(this.firestore, `dialogs`))
          : []
      )
    )
  }

  public async updateStatusDialog(id: string, status: OrderStatusEnum) {
    const responsesRef = doc(
      this.firestore,
      `dialogs/${id}`
    )
    await setDoc(responsesRef, {
      status: status
    }, { merge: true })
  }

  addDialogExecutor(uid: string, order: any): Observable<any> {
    const userId = this.authService.uid;
    return this.authService.user(userId)
      .pipe(
        switchMap(async (user: any) => {
          const id: string = `${uid}_${userId}_${order.id}`;
          return await setDoc(doc(this.firestore, `dialogs/${id}`), {
            GiaBb13A05Sg8s5X0kPY3QLtBP53: true,
            GiaBb13A05Sg8s5X0kPY3QLtBP53_isNew: false,
            authorId: userId,
            createdAt: new Date()?.toISOString() || null,
            text: null,
            id,
            orderId: order.id,
            orderDate: order.orderDate,
            orderAddress: order.address,
            status: order.status
          }, {
            merge: true
          })
        })
      )
  }

}
