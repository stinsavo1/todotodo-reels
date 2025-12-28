import { Injectable } from '@angular/core';
import {
  addDoc, arrayUnion,
  collection,
  doc, DocumentData,
  documentId,
  Firestore, getDoc,
  getDocs,
  onSnapshot, or,
  orderBy,
  query,
  setDoc, updateDoc,
  where
} from '@angular/fire/firestore';
import {
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  from,
  map,
  Observable,
  of, switchMap,
} from 'rxjs';
import { AuthService } from "./auth.service";
import { toMoscowDate } from "../components/utils/functions";
import { OrderStatusEnum } from "../enums/order-status.enum";
import moment from "moment";
import { DialogParserService } from "./dialog-parser.service";

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private orderStatus = OrderStatusEnum;

  constructor(private firestore: Firestore, private dialogParserService: DialogParserService,
              private authService: AuthService) {}

  public getDialogWithMessagesLive$(orderId: string): Observable<any | null> {
    return new Observable<any | null>(subscriber => {
      // 1. Сначала получаем документ чата (он редко меняется, можно кэшировать или тоже подписаться)
      const dialogRef = doc(this.firestore, `dialogs/${orderId}`);

      let dialogCache: any | null = null;

      // Подписка на изменения документа чата (опционально — можно оставить getDoc один раз)
      const unsubscribeDialog = onSnapshot(dialogRef, docSnap => {
        if (docSnap.exists()) {
          dialogCache = { id: docSnap.id, ...docSnap.data() } as any;
        } else {
          dialogCache = null;
          subscriber.next(null); // чат удалён → эмитим null
        }

        // Если чата нет — не слушаем сообщения
        if (!dialogCache) return;
      }, error => subscriber.error(error));

      // 2. Подписка на сообщения (основная реактивность)
      const messagesRef = collection(this.firestore, `dialogs/${orderId}/messages`);
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsubscribeMessages = onSnapshot(q, msgSnap => {
        // Если чат ещё не загружен — ждём (или можно стартовать с null)
        if (!dialogCache) return;

        const messages: any[] = msgSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            author: data['author'] ?? '',
            text: data['text'] ?? '',
            createdAt: data['createdAt'] ?? '',
            photos: Array.isArray(data['photos']) ? data['photos'] : [],
          } as any;
        });

        subscriber.next({ ...dialogCache, messages });
      }, error => subscriber.error(error));

      // Отписка при unsubscribe
      return () => {
        unsubscribeDialog();
        unsubscribeMessages();
      };
    });
  }

  public getDialogsOrderChats(uid: string, orderId?: string): Observable<any[]> {
    return new Observable<any[]>(subscriber => {
      if (!uid) {
        subscriber.next([]);
        subscriber.complete();
        // 🔧 важно: вернуть функцию, чтобы удовлетворить сигнатуру Observable
        return () => {};
      }
      const dialogsRef = collection(this.firestore, 'dialogs');
      const q = query(
        dialogsRef,
        where(uid, '==', true),
        where('orderId', '==', orderId)
      );


      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const dialogs = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))

          subscriber.next(dialogs);
        },
        error => subscriber.error(error)
      );

      // ✅ возвращаем функцию отписки — теперь все пути возвращают значение
      return () => unsubscribe();
    });
  }

  public getDialogsAddressArchive(uid: string): Observable<any[]> {
    return new Observable<any[]>(subscriber => {
      if (!uid) {
        subscriber.next([]);
        subscriber.complete();
        return () => {};
      }

      const dialogsRef = collection(this.firestore, 'dialogs');
      const q = query(dialogsRef, where(uid, '==', true));

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const dialogs = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter((dialog: any) => dialog.status === this.orderStatus.COMPLETED ||
              dialog?.typeLead && dialog.status === this.orderStatus.CONFIRM_EXECUTOR
              || dialog.status === this.orderStatus.REJECTION_WITHOUT_START
              || dialog.status === this.orderStatus.TRANSFERRED)
          //   .filter((dialog: any) => {
          //     if (dialog.orderId === 'de883051-bff4-40db-902b-ce57bddffea8') {
          //       console.log(dialog, uid);
          //     }
          //     debugger;
          //   if (dialog.author !== uid && dialog?.isRateClient === true) {
          //     return true;
          //   }
          //   return dialog.author === uid && dialog?.isRateExecutor === true;
          // });

          subscriber.next(dialogs);
        },
        error => subscriber.error(error)
      );

      return () => unsubscribe();
    });
  }

  public getDialogsAddressChats(uid: string, isManager?: boolean): Observable<any[]> {
    return new Observable<any[]>(subscriber => {
      if (!uid) {
        subscriber.next([]);
        subscriber.complete();
        // 🔧 важно: вернуть функцию, чтобы удовлетворить сигнатуру Observable
        return () => {};
      }

      const dialogsRef = collection(this.firestore, 'dialogs');
      let q;
      if (isManager) {
        q = query(
          dialogsRef,
          or(
            where(uid, '==', true),
            where('typeLead', '==', true)
          )
        );
      } else {
        q = query(
          dialogsRef,
          where(uid, '==', true)
        );
      }

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const dialogs: any = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter((dialog: any) =>
              ![this.orderStatus.REJECTION_WITHOUT_START, this.orderStatus.TRANSFERRED].includes(dialog.status)
            )
            .filter((dialog: any) => {
              const dialogParts = this.dialogParserService.parseDialogId(dialog.id);
              let author = uid;
                if (dialogParts.userId !== uid && dialogParts.authorId !== uid) {
                  author = 'xfROU1CUVVoJa6qBsZmO';
                }
                  if (dialog.author !== author && dialog?.isRateClient !== true) {
                    return true;
                  }
                  return dialog.author === author && dialog?.isRateExecutor !== true;
            });

          subscriber.next(dialogs);
        },
        error => subscriber.error(error)
      );

      // ✅ возвращаем функцию отписки — теперь все пути возвращают значение
      return () => unsubscribe();
    });
  }

  public async rejectdOrderIds(
    id: string,
    rejectedUserId: string
  ): Promise<void> {
    const orderRef = doc(this.firestore, `orders/${id}`);

    await updateDoc(orderRef, {
      rejectedIds: arrayUnion(rejectedUserId)
    });
  }

  public async updateStatusOrder(
    id: string,
    status: OrderStatusEnum
  ) {
    await setDoc(doc(this.firestore, `orders/${id}`), {status: status}, {merge: true});
  }

  public async updateDialogRefuse(
    id: string,
    params: any
  ) {
    await setDoc(doc(this.firestore, `dialogs/${id}`), {...params}, {merge: true});
  }

  public async updateStatusLead(
    id: string,
    status: OrderStatusEnum,
    executor?: string
  ) {
    const updateData: { status: OrderStatusEnum; executor?: string } = { status };

    if (executor !== undefined && executor !== null && executor.trim() !== '') {
      updateData.executor = executor;
    }

    await setDoc(
      doc(this.firestore, `bitrixDeals/${id}`),
      {
        ...updateData,
        doneGaveLead: this.authService.uid
      },
      { merge: true }
    );
  }

  public async updateLeadChatDone(
    id: string
  ) {

    const updateData: any = {
      doneExecutor: true,
      doneCustomer: true,
      isRateClient: true,
      doneGaveLead: this.authService.uid,
      customerFeedbackDate: moment(new Date(), 'DD.MM.YYYY HH:mm:ss').toISOString(),
      executorFeedbackDate: moment(new Date(), 'DD.MM.YYYY HH:mm:ss').toISOString(),
      status: this.orderStatus.COMPLETED
    };

    await setDoc(
      doc(this.firestore, `dialogs/${id}`),
      updateData,
      { merge: true }
    );
  }

  public async addUserIdToWrittenOnce(
    orderId: string,
    userId: string
  ): Promise<void> {
    if (!userId?.trim()) {
      throw new Error('userId is required and must be non-empty');
    }

    const orderRef = doc(this.firestore, `orders/${orderId}`);
    await updateDoc(orderRef, {
      written: arrayUnion(userId)
    });
  }

  public async addUserIdToWrittenOnceBitrix(
    orderId: string,
    userId: string
  ): Promise<void> {
    if (!userId?.trim()) {
      throw new Error('userId is required and must be non-empty');
    }

    const orderRef = doc(this.firestore, `bitrixDeals/${orderId}`);
    await updateDoc(orderRef, {
      written: arrayUnion(userId)
    });
  }

  public async doneDialogCustomer(
    id: string,
    doneCustomer: boolean,
    doneInstaller: boolean,
  ): Promise<void> {
    let model: any = {
      doneCustomer: doneCustomer,
      customerFeedbackDate: moment(new Date(), 'DD.MM.YYYY HH:mm:ss').toISOString()
    }
    if (doneCustomer && doneInstaller) {
      model.status = OrderStatusEnum.COMPLETED;
    }

    const refDocList = doc(this.firestore, `dialogs/${id}`)
    await updateDoc(refDocList, model);
  }

  public async dialogExists(id: string): Promise<boolean> {
    if (!id?.trim()) return false;

    const docRef = doc(this.firestore, `dialogs/${id}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  public async doneDialogExecutor(
    id: string,
    doneCustomer: boolean,
    doneInstaller: boolean,
  ): Promise<void> {
    const model: any = {
      doneExecutor: doneInstaller,
      executorFeedbackDate: moment(new Date(), 'DD.MM.YYYY HH:mm:ss').toISOString(),
    }
    if (doneCustomer && doneInstaller) {
      model.status = OrderStatusEnum.COMPLETED;
    }

    const refDocList = doc(this.firestore, `dialogs/${id}`)
    await updateDoc(refDocList, model)
  }

  public async add(
    id: string,
    text: string,
    photos: any[],
    order: any,
    isFirstMessage = false,
    status?: OrderStatusEnum,
    isManager = false
  ) {
    const createdAt = new Date().toISOString();

    // Базовые данные для документа диалога
    const dialogData: any = {
      createdAt,
      text,
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      dialogData.status = status;
    }

    const dialogParts = this.dialogParserService.parseDialogId(id);

    // Добавляем флаги для участников
    id.split('_').slice(0, 2).forEach(key => {
      dialogData[key] = true;
      const author = isManager ? dialogParts.authorId : this.authService.uid;
      if (key !== author) {
        dialogData[key + '_isNew'] = true;
      }
    });
    // Если это первое сообщение — добавляем данные о заказе
    if (isFirstMessage) {
      dialogData.id = id;
      dialogData.author = this.authService.uid;
      dialogData.orderId = order.id;
      if (order.type === 'Лид') {
        const orderDate = this.addDays(order.date, 2);
        dialogData.orderDate = this.formatDateISO(orderDate);
        dialogData.typeLead = true;
        dialogData.name = order.name;
        dialogData.phoneLead = order.phoneLead;
        dialogData.description = order.description;
        this.addUserIdToWrittenOnceBitrix(order.id, this.authService.uid).then();
      } else {
        this.addUserIdToWrittenOnce(order.id, this.authService.uid).then();
        dialogData.orderDate = order.orderDate;
      }
      dialogData.orderAddress = order.address;
      dialogData.orderType = order.type;
      dialogData.status = this.orderStatus.NEW_ORDER;
    }
    await setDoc(doc(this.firestore, `dialogs/${id}`), dialogData, { merge: true });

    const messagesRef = collection(this.firestore, `dialogs/${id}/messages`);
    await addDoc(messagesRef, {
      author: isManager ? dialogParts.authorId : this.authService.uid,
      createdAt,
      text,
      photos,
    });
  }

  public getCountNew(userId: string): Observable<number> {
    if (!userId) return of(0);

    const fieldName = `${userId}_isNew`;
    const q = query(collection(this.firestore, 'dialogs'), where(fieldName, '==', true));

    return new Observable<number>(subscriber => {
      const unsubscribe = onSnapshot(q, snap => subscriber.next(snap.size));
      return () => unsubscribe();
    }).pipe(
      distinctUntilChanged(), // ← игнорировать одинаковые значения: 2 → 2 → не эмитить
      debounceTime(150),     // ← объединять быстрые изменения: 1 → 2 → 1 за <150 мс → эмитим только 1
      // или: debounce(() => timer(150)) — если нужно debounce *на каждое изменение*
    );
  }

  private addDays(date: string | Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  public getUsersMapByIds(ids: string[]): Observable<Record<string, any>> {
    if (!ids || ids.length === 0) {
      return of({});
    }

    // Уникальные непустые ID
    const uniqueIds = Array.from(new Set(ids)).filter(id => id && typeof id === 'string');

    if (uniqueIds.length === 0) {
      return of({});
    }

    // Firestore 'in' query supports max 10 items → batch by 10
    const batches: string[][] = [];
    for (let i = 0; i < uniqueIds.length; i += 10) {
      batches.push(uniqueIds.slice(i, i + 10));
    }

    const batchObservables = batches.map(batch =>
      from(getDocs(query(collection(this.firestore, 'users'), where(documentId(), 'in', batch)))).pipe(
        map(snapshot =>
          snapshot.docs.reduce((acc, docSnap) => {
            acc[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
            return acc;
          }, {} as Record<string, any>)
        )
      )
    );

    return forkJoin(batchObservables).pipe(
      map(results => Object.assign({}, ...results))
    );
  }

  public async getManagersRaw(): Promise<DocumentData[]> {
    const q = query(collection(this.firestore, 'users'), where('isManager', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  public async markReadDialog(id: string, order: any): Promise<void> {
    const dialogParts = this.dialogParserService.parseDialogId(id);
    const item: DocumentData = {};

    if (dialogParts.userId === this.authService.uid || dialogParts.authorId === this.authService.uid) {
      // Участник диалога: снимаем isNew только для себя
      item[this.authService.uid + '_isNew'] = false;
    } else {
      // Менеджер: снимаем isNew для автора + отмечаем себя в managerRead
      item[dialogParts.authorId + '_isNew'] = false;
      item['managerRead'] = arrayUnion(this.authService.uid); // ← скобочная нотация
    }

    const dialogRef = doc(this.firestore, `dialogs/${id}`);
    await updateDoc(dialogRef, item);

    if (order?.typeLead && (dialogParts.userId !== this.authService.uid || dialogParts.authorId !== this.authService.uid)) {
      const dealRef = doc(this.firestore, `bitrixDeals/${dialogParts.orderId}`);
      const dealUpdate: DocumentData = {};
      dealUpdate['managerRead'] = arrayUnion(this.authService.uid); // ← скобочная нотация

      await updateDoc(dealRef, dealUpdate);
    }
  }

  public formatDateISO(date: Date | string | null): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  //
  // addPrivateDialog(uid: string, order: any, status?: OrderStatusEnum): Observable<any> {
  //   const userId = this.authService.uid;
  //   return this.authService.user(userId)
  //     .pipe(
  //       switchMap(async (user: any) => {
  //         const id: string = `${userId}_${uid}_${order.id}`;
  //         return await setDoc(doc(this.firestore, `dialogs/${id}`), {
  //           GiaBb13A05Sg8s5X0kPY3QLtBP53: true,
  //           GiaBb13A05Sg8s5X0kPY3QLtBP53_isNew: false,
  //           authorId: userId,
  //           createdAt: new Date()?.toISOString() || null,
  //           text: null,
  //           id,
  //           orderId: order.id,
  //           orderDate: order.orderDate,
  //           status: status ?? order.status
  //         }, {
  //           merge: true
  //         })
  //       })
  //     )
  // }

  public async fetchAndMarkExpiredAsRejected(): Promise<{ updated: any[]; errors: string[] }> {
    const today = moment().startOf('day');
    const errors: string[] = [];
    const updated: any[] = [];

    try {
      // 1️⃣ Получаем ВСЕ диалоги с orderDate
      const q = query(
        collection(this.firestore, 'dialogs'),
        where('orderDate', '!=', null)
      );

      const snapshot = await getDocs(q);

      const expiredDialogs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((dialog: any) => {
          if (dialog.status === OrderStatusEnum.REJECTION_WITHOUT_START || dialog.status === OrderStatusEnum.COMPLETED) return true;
          if (!dialog.orderDate || typeof dialog.orderDate !== 'string') return false;
          const date = moment(dialog.orderDate, 'YYYY-MM-DD', true);
          return date.isValid() && date.isBefore(today);
        });

      if (expiredDialogs.length === 0) {
        return { updated: [], errors };
      }

      console.log(`[fetchAndMarkExpiredAsRejected] Найдено просроченных диалогов: ${expiredDialogs.length}`);

      // 2️⃣ Обновляем пачками по 10
      const batchSize = 10;
      for (let i = 0; i < expiredDialogs.length; i += batchSize) {
        const batch = expiredDialogs.slice(i, i + batchSize);
        console.log(`Обрабатываю пачку ${i / batchSize + 1}: диалоги ${i + 1}–${i + batch.length}`);

        const batchPromises = batch.map(dialog => {
          const ref = doc(this.firestore, `dialogs/${dialog.id}`);
          return updateDoc(ref, {
            status: OrderStatusEnum.REJECTION_WITHOUT_START,
            isRateClient: true,
            isRateExecutor: true,
          })
            .then(() => {
              updated.push({ ...dialog, status: OrderStatusEnum.REJECTION_WITHOUT_START });
            })
            .catch(err => {
              const msg = `Ошибка обновления dialog/${dialog.id}: ${err.message}`;
              console.error(msg, err);
              errors.push(msg);
            });
        });

        await Promise.all(batchPromises);
      }

      console.log(`✅ Завершено: обновлено ${updated.length}, ошибок ${errors.length}`);
      return { updated, errors };

    } catch (err: any) {
      const msg = `Критическая ошибка в fetchAndMarkExpiredAsRejected: ${err.message}`;
      console.error(msg, err);
      return { updated: [], errors: [msg] };
    }
  }
}
