import { Injectable, inject } from '@angular/core'
import {
  DocumentData,
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where, deleteField, arrayUnion, FieldPath, increment, getDoc, documentId, getDocs, writeBatch
} from '@angular/fire/firestore'
import {Observable, map, share, switchMap, from, combineLatest, of, EMPTY, defer} from 'rxjs'
import { v4 as uuidv4 } from 'uuid';
import { MapService } from './map.service'
import { CoreService } from './core.service'
import { AuthService } from './auth.service'
import { Router } from '@angular/router'
import { PaymentService } from './payment.service';
import moment from 'moment/moment';
import { FeedbackService } from './my-service/feedback.service';
import { OrderStatusEnum } from '../enums/order-status.enum';
import { toMoscowDate } from '../components/utils/functions';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private firestore: Firestore = inject(Firestore)
  public payTypes: string[];
  constructor (
    private mapService: MapService,
    private core: CoreService,
    private authService: AuthService,
    private router: Router,
    private paymentService: PaymentService,
    private feedbackService: FeedbackService
  ) {
    this.payTypes = ['Любая', 'Только самозанятый', 'Только договор услуг']
  }

  regions (): Observable<DocumentData | undefined> {
    const referencesDoc = doc(this.firestore, 'references/regions')
    return docData(referencesDoc)
  }

  updateOrderDetails(id: string, updatedData: Partial<DocumentData>, key: string): Observable<void> {
    const refDoc = doc(this.firestore, `orders/${id}`);

    return from(updateDoc(refDoc, {
      [key]: arrayUnion(...updatedData[key])
    }));
  }

  updateOrder(id: string, updatedData: Partial<DocumentData>, key: string): Observable<void> {
    const refDoc = doc(this.firestore, `orders/${id}`);

    return from(updateDoc(refDoc, {
      [key]: arrayUnion(...updatedData[key])
    }));
  }

  getProductsStore(uid: string): Observable<any[]> {
      return defer(async() => {
        if (!uid) {
          return [];
        }

        const dialogsRef = collection(this.firestore, `storeProduct`);
        const q = query(
          dialogsRef,
          where('author', '==', uid),
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs
          .map(doc => doc.data())
      });
  }

  orders(isConfirm: boolean = false): Observable<DocumentData[]> {
    const baseQuery = collection(this.firestore, 'orders');
    const queryConfig = isConfirm
      ? [where('inProgress', '==', true), orderBy('orderDate', 'desc')]
      : [where('status', '==', OrderStatusEnum.NEW_ORDER), where('orderDate', '>=', new Date().toISOString().slice(0, 10))];

    const selectedQuery = query(baseQuery, ...queryConfig);
    return collectionData(selectedQuery, { idField: 'id' }).pipe(
      map(orders => {
        if (isConfirm) {
          return orders
            .filter(order => {
              return order['author'] === this.authService.uid || order['executor'] === this.authService.uid
            });
        }

        return orders;
      }),
      switchMap((items) => {
        return this.paymentService.getStatusPayment().pipe(
          switchMap((paymentStatus: any) => {
            if (paymentStatus.finishPeriod) {
              return this.mapService.getMyPossition().pipe(
                map((center) => {
                  const centerNumArray = center
                    .split(',')
                    .reverse()
                    .map(Number);

                  return items
                    .map((item) => ({
                      ...item,
                      geometry: item['geometry'] || [0, 0],
                      distance: this.mapService.getDistance(centerNumArray, item['geometry']),
                      paymentStatus: paymentStatus // добавляем статус платежа к элементу
                    }))
                    .sort((a, b) => a.distance - b.distance);
                })
              );
            } else {
              return of(
                items.map((item) => ({
                  ...item,
                  geometry: item['geometry'] || [0, 0],
                  distance: null,
                }))
              );
            }

          })
        );
      }),
      share()
    );
  }

  ordersAdmin(): Observable<DocumentData[]> {
    const q = collection(this.firestore, 'orders'); // Без сортировки на уровне Firestore
    return collectionData(q, {
      idField: 'id'
    }).pipe(
      map((orders) => {
        return orders.sort((a: any, b: any) => {
          const getTime = (order: any) => {
            if (!order.orderCreate) return 0;
            const date = new Date(order.orderCreate);
            return toMoscowDate(date).getTime();
          };

          return getTime(b) - getTime(a); // Сортировка по убыванию
        });
      }),
      share()
    );
  }

  order(id: string): Observable<any> {
    const refDoc = doc(this.firestore, `orders/${id}`);
    return docData(refDoc).pipe(
      switchMap((item) => {
        // Если заказ не найден — сразу возвращаем null
        if (!item) {
          return of(null);
        }

        return this.paymentService.getStatusPayment().pipe(
          switchMap((paymentStatus: any) => {
            if (paymentStatus.finishPeriod) {
              return this.mapService.getMyPossition().pipe(
                map(center => {
                  const centerNumArray = center
                    .split(',')
                    .reverse()
                    .map(num => Number(num));
                  return {
                    ...item,
                    centerNumArray,
                    subscription: true,
                    distance: this.mapService.getDistance(
                      centerNumArray,
                      item['geometry']
                    )
                  };
                })
              );
            } else {
              return of({
                ...item,
                subscription: false,
                distance: null
              });
            }
          })
        );
      })
    );
  }

  async removeOrder(id: string) {
    const refOrderDoc = doc(this.firestore, `orders/${id}`)
    await deleteDoc(refOrderDoc);
  }

  async hideOrder(id: string, updatedData: Partial<DocumentData>) {
    const refDoc = doc(this.firestore, `orders/${id}`);
    return from(updateDoc(refDoc, updatedData));
  }

  async sentOrder (item: { [key: string]: any }, id: string = uuidv4()) {
    let itemDetail: { [key: string]: any } = {
      ...item,
      id,
      author: item['author'] || this.authService.uid,
      confirm: item['confirm'] || false,
      createAt: item['orderDate'],
      orderCreate: new Date().toISOString().slice(0, 10),
      geometry: await this.mapService.geoCoderURI(item['uri']),
      status: OrderStatusEnum.NEW_ORDER
    }
    delete itemDetail['uri']
    this.core.presentLoading('Сохранение...')
    await setDoc(doc(this.firestore, `orders/${id}`), itemDetail).then(() => ({
      id
    }))

    this.core.dismissLoading();
  }

  async save (item: { [key: string]: any }, id: string = uuidv4()) {
    item['createAt'] = item['createAt']
      ? item['createAt']
      : new Date().toISOString().slice(0, 10)
    let itemDetail: { [key: string]: any } = {
      ...item,
      author: item['author'] || this.authService.uid
    }
    delete itemDetail['uri']

    const itemList = {
      id,
      confirm: item['confirm'] || false,
      executor: item['executor'] || '',
      createAt: item['createAt'],
      address: item['address'],
      geometry: item['geometry'],
      price: Number(item['price']) || 0,
      type: item['type'],
      author: item['author'] || this.authService.uid,
      orderCreate: new Date().toISOString().slice(0, 10)
    }

    if (item['uri'])
      itemList['geometry'] = await this.mapService.geoCoderURI(item['uri'])
    else itemList['geometry'] = await this.mapService.geoCoder(item['address'])
    itemDetail['geometry'] = itemList['geometry']

    this.core.presentLoading('Сохранение...')
    const res = await setDoc(doc(this.firestore, `orders/${id}`), itemList).then(() => ({
      id
    }))
    const ordersDetailRef = doc(
      this.firestore,
      `orders/${res.id}/ordersDetail/${res.id}`
    )
    await setDoc(ordersDetailRef, itemDetail)
    this.core.dismissLoading()
  }

  async delete (id: string) {
    const res = await this.core.presentAlert('', 'Точно удалить заказ?', [
      'Удалить',
      'Нет'
    ])
    if (res == 'Удалить') {
      await deleteDoc(doc(this.firestore, `orders/${id}`))
      this.router.navigate(['/admin/tabs/orders'])
    }
  }

  async saveResponse (id: string, userId: string) {
    this.core.presentLoading('Сохранение...');
    const responsesRef = doc(
      this.firestore,
      `orders/${id}/responses/${userId}`
    )
    await setDoc(responsesRef, {
      updateAt: new Date().toISOString()
    })
    this.core.dismissLoading();
  }

  public async updateOrderResponses(id: string, responses: string[]) {
    const responsesRef = doc(
      this.firestore,
      `orders/${id}`
    )
    await setDoc(responsesRef, {
        responses
      },
      { merge: true });
  }

  async saveResponseWithPrice (id: string, price: string) {
    this.core.presentLoading('Сохранение...')
    const responsesRef = doc(
      this.firestore,
      `orders/${id}/responses/${this.authService.uid}`
    )
    await setDoc(responsesRef, {
      price,
      updateAt: new Date().toISOString()
    })
    this.core.dismissLoading();
  }

  myResponse (id: string) {
    return this.authService.authState$.pipe(
      switchMap(authState =>
        docData(
          doc(this.firestore, `orders/${id}/responses/${authState.user?.uid}`)
        )
      ),
      map(item => (item ? item : {}))
    )
  }

  responses (id: string) {
    return this.authService.authState$.pipe(
      switchMap(authState =>
        collectionData(collection(this.firestore, `orders/${id}/responses`), {
          idField: 'id'
        })
      )
    )
  }

  async selectResponse (id: string, uid: string) {
    this.core.presentLoading('Сохранение...');
    const refDoc = doc(this.firestore, `orders/${id}`)
    await updateDoc(refDoc, {
      executor: uid,
      status: OrderStatusEnum.CONFIRM
    })
    this.core.dismissLoading();
  }


  async orderCancel (id: string, body: any) {
    this.core.presentLoading('Сохранение...');
    const refDocList = doc(this.firestore, `orders/${id}`);
    await updateDoc(refDocList, body)
    this.core.dismissLoading();
  }

  async orderRejection (id: string) {
    this.core.presentLoading('Сохранение...')
    const refDoc = doc(this.firestore, `orders/${id}/ordersDetail/${id}`)
    await updateDoc(refDoc, {
      rejection: true
    })
    const refDocList = doc(this.firestore, `orders/${id}`)
    await updateDoc(refDocList, {
      inProgress: false
    })
    this.core.dismissLoading()
  }

  public async doneOrderCustomer(
    id: string,
    doneCustomer: boolean,
    doneInstaller: boolean,
  ): Promise<void> {
    await this.core.presentLoading('Сохранение...')
    let model: any = {
      doneCustomer: doneCustomer,
      customerFeedbackDate: moment(new Date(), 'DD.MM.YYYY HH:mm:ss').toISOString()
    }
    if (doneCustomer && doneInstaller) {
      model.status = OrderStatusEnum.COMPLETED;
    }

    const refDocList = doc(this.firestore, `orders/${id}`)
    await updateDoc(refDocList, model);
    // await updateDoc(refDocList, 'inProgress', false)
    await this.core.dismissLoading();
  }

  public async doneOrderExecutor(
    id: string,
    doneCustomer: boolean,
    doneInstaller: boolean,
  ): Promise<void> {
    await this.core.presentLoading('Сохранение...')
    const model: any = {
      doneExecutor: doneInstaller,
      executorFeedbackDate: moment(new Date(), 'DD.MM.YYYY HH:mm:ss').toISOString(),
    }
    if (doneCustomer && doneInstaller) {
      model.status = OrderStatusEnum.COMPLETED;
    }

    const refDocList = doc(this.firestore, `orders/${id}`)
    await updateDoc(refDocList, model)
    await this.core.dismissLoading();
  }

  async orderSuccess (
    id: string,
    uid: string = '',
    reportPhotos: string[] = []
  ) {
    await this.core.presentLoading('Сохранение...')
    const refDoc = doc(this.firestore, `orders/${id}/ordersDetail/${id}`)
    await updateDoc(refDoc, {
      success: true
    })
    const refDocList = doc(this.firestore, `orders/${id}`)
    await updateDoc(refDocList, 'inProgress', false)
    const refUser = doc(this.firestore, `users/${uid}`)
    await runTransaction(this.firestore, async transaction => {
      const userProfile = await transaction.get(refUser)
      let photos = userProfile.get('photo') || []
      photos = [...photos, ...reportPhotos]
      return transaction.update(refUser, 'photo', photos)
    })
    await this.core.dismissLoading()
  }


  async sentFeedback(
    uid: string,
    id: string,
    type: 'Client' | 'Executor' | 'Lead',
    model: any
  ) {
    this.core.presentLoading('Сохранение...');

    try {
      let url = '';
      if (type === 'Client' ) {
        url = `dialogs/${this.authService.uid}_${uid}_${model.orderId}`;
      } else if (type === 'Executor' ) {
        url = `dialogs/${uid}_${this.authService.uid}_${model.orderId}`;
      }
      // 1️⃣ Обновление фидбэка (остаётся отдельным запросом — 1-й)
      await this.feedbackService.updateFeedbacks(uid, model);

      // 2️⃣ Подготавливаем batch для двух документов — 2-й запрос (batch commit)
      const batch = writeBatch(this.firestore);

      const fieldKey = `isRate${type}` as const;
      const updateData = { [fieldKey]: true };

      batch.update(doc(this.firestore, `orders/${id}`), updateData);
      batch.update(
        doc(this.firestore, url),
        updateData
      );

      await batch.commit(); // ✅ один сетевой запрос вместо двух

    } finally {
      this.core.dismissLoading();
    }
  }

  async sentFeedbackLead(
    uid: string,
    id: string,
    type: 'Client' | 'Executor' | 'Lead',
    model: any
  ) {
    this.core.presentLoading('Сохранение...');

    try {
      let url = '';
      if (type === 'Client') {
        url = `dialogs/${this.authService.uid}_${uid}_${model.orderId}`;
      } else if (type === 'Executor' ) {
        url = `dialogs/${uid}_${this.authService.uid}_${model.orderId}`;
      }
      // 1️⃣ Обновление фидбэка (остаётся отдельным запросом — 1-й)
      await this.feedbackService.updateFeedbacks(uid, model);

      // 2️⃣ Подготавливаем batch для двух документов — 2-й запрос (batch commit)
      const batch = writeBatch(this.firestore);

      const fieldKey = `isRate${type}` as const;
      const updateData = { [fieldKey]: true };

      batch.update(doc(this.firestore, `bitrixDeals/${id}`), updateData);
      batch.update(
        doc(this.firestore, url),
        {
          ...updateData,
          status: 'COMPLETED'
        }
      );

      await batch.commit(); // ✅ один сетевой запрос вместо двух

    } finally {
      this.core.dismissLoading();
    }
  }

  users (): Observable<DocumentData[]> {
    return collectionData(
      query(collection(this.firestore, 'users'), orderBy('fio')),
      {
        idField: 'id'
      }
    ).pipe(share())
  }

  generateChatId (item: DocumentData) {
    return [item['author'], item['executor']].sort().join('_')
  }
}


