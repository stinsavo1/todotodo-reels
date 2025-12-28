import { inject, Injectable } from '@angular/core'
import {
  collection,
  collectionData,
  doc,
  docData,
  DocumentData,
  Firestore,
  updateDoc
} from '@angular/fire/firestore'
import { getFunctions, httpsCallable } from '@angular/fire/functions'
import { AuthService } from './auth.service'
import { map, Observable, of, switchMap } from 'rxjs'
import { CoreService } from './core.service'

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private firestore: Firestore = inject(Firestore)

  constructor (private authService: AuthService, private core: CoreService) {}

  getPayURL (tarif: string, userMode: string): Promise<{ [key: string]: any }> {
    const getPayURL = httpsCallable(getFunctions(), 'getPayURL')
    return getPayURL({ tarif: tarif, userMode: userMode, url: window.location.href })
  }

  getPayUrlLead(price: number, leadId: string, dialogId: string, userEmail: string): Promise<{ [key: string]: any }> {
    const getPayUrlLead = httpsCallable(getFunctions(), 'getPayUrlLead')
    return getPayUrlLead({ price, leadId, dialogId, userEmail, url: window.location.href })
  }

  getTarifs () {
    const refDoc = collection(this.firestore, 'tariffs')
    return collectionData(refDoc, {
      idField: 'id'
    })
  }

  async saveTarif(tarifs: DocumentData[]) {
    // Показываем индикатор загрузки
    await this.core.presentLoading('Сохранение...');

    try {
      // Проходим по каждому документу и обновляем поля m1, m6, m12
      for (const tarif of tarifs) {
        const docRef = doc(this.firestore, `tariffs/${tarif['id']}`);

        // Обновляем цены для m1, m6, m12
        await updateDoc(docRef, {
          'm1.price': tarif['m1']?.price,
          'm6.price': tarif['m6']?.price,
          'm12.price': tarif['m12']?.price
        });
      }

      // Скрываем индикатор загрузки
      await this.core.dismissLoading();

      // Показываем сообщение об успешном сохранении
      this.core.presentAlert('', 'Тарифы сохранены.');
    } catch (error) {
      // Обработка ошибок
      console.error('Ошибка при сохранении тарифов:', error);
      await this.core.dismissLoading();
      this.core.presentAlert('Ошибка', 'Не удалось сохранить тарифы.');
    }
  }

  getStatusPayment () {
    return this.authService.authState$.pipe(
      switchMap(authState => {
        if (!authState.user?.uid) return of({ isActive: false })
        else
          return docData(
            doc(this.firestore, 'users/' + this.authService.uid)
          ).pipe(
            map((item: { [key: string]: any } | undefined) => ({
              ...item,
              isActive: item && item['finishPeriod'] > new Date().toISOString()
            }))
          )
      })
    )
  }

  getStatusPaymentById(id: string): Observable<boolean> {
    return docData(
      doc(this.firestore, 'users/' + id)
    ).pipe(
      map((item: { [key: string]: any } | undefined) => {
        // Handle the case where `item` is undefined
        if (!item) {
          return false; // Default to `false` if `item` is undefined
        }
        // Check if `finishPeriod` exists and is greater than the current date
        const finishPeriod = item['finishPeriod'];
        return !!finishPeriod && finishPeriod > new Date().toISOString();
      })
    );
  }
}
