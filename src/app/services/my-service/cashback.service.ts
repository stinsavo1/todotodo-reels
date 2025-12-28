import { collection, collectionData, doc, docData, DocumentData, Firestore, updateDoc } from '@angular/fire/firestore';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SettingCashbackInterface } from '../../interfaces/setting-cashback.interface';
import { CoreService } from '../core.service';


@Injectable({
  providedIn: 'root'
})
export class CashbackService {
  private firestore: Firestore = inject(Firestore);

  constructor(private core: CoreService) {
  }

  public getSettingCashbackId(id: string): Observable<SettingCashbackInterface> {
    const refDoc = doc(this.firestore, `settingCashback/${id}`)
    // @ts-ignore
    return docData(refDoc);
  }

  public getSettingCashbacks(): Observable<SettingCashbackInterface[]> {
    const refDoc = collection(this.firestore, 'settingCashback')
    // @ts-ignore
    return collectionData(refDoc, {
      idField: 'id'
    })
  }

  public async saveSettingCashbacks(settings: SettingCashbackInterface[]) {
    await this.core.presentLoading('Сохранение...')
    await settings.forEach(async (setting: SettingCashbackInterface) => {
      const model: any = {
        percent: setting.percent,
        expirationDate: setting.expirationDate,
      }
      if (setting.expirationDate) {
        delete model.percent;
      } else {
        delete model.expirationDate;
      }
      await updateDoc(doc(this.firestore, `settingCashback/${setting['id']}`), model)
    })
    await this.core.dismissLoading()
    this.core.presentAlert('', 'Настройки сохранены.')
  }
}
