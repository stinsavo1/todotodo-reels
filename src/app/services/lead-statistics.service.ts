import {
  collection,
  query,
  getDocs,
  Firestore, updateDoc, doc, getDoc, deleteField
} from '@angular/fire/firestore';
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class LeadStatisticsService {
  private itemsCollection = collection(this.firestore, 'bitrixDeals');
  private usersCollection = collection(this.firestore, 'users');

  constructor(private firestore: Firestore) {}

  async getPage(): Promise<any[]> {
    const q = query(this.itemsCollection);
    const snapshot = await getDocs(q);

    const enrichedItemsPromises = snapshot.docs.map(async (docSnapshot) => {
      const dealData = docSnapshot.data();
      const { status, ...cleanData } = dealData;

      const item: any = {
        id: docSnapshot.id,
        ...cleanData
      };

      // ——————————————————————————
      // Вспомогательная функция: получает ФИО и телефон по ID пользователя
      // ——————————————————————————
      const getUserDisplayInfo = async (userId: string): Promise<string> => {
        if (!userId?.trim()) return '-';
        try {
          const userDoc = await getDoc(doc(this.usersCollection, userId));
          if (!userDoc.exists()) return '-';

          const userData = userDoc.data() as { fio?: string; phone?: string } | undefined;
          const fio = (userData?.fio || '').trim();
          const phone = (userData?.phone || '').trim();

          if (fio && phone) return `${fio} (${phone})`;
          if (fio) return fio;
          if (phone) return `(${phone})`;
          return '-';
        } catch (err) {
          console.error(`Ошибка при получении пользователя "${userId}"`, err);
          return '[ошибка загрузки]';
        }
      };

      // ——————————————————————————
      // buyInfo — как было (сохраняем логику)
      // ——————————————————————————
      item.buyInfo = '-';
      if (item.buy && typeof item.buy === 'string') {
        item.buyInfo = await getUserDisplayInfo(item.buy);
      }

      // ——————————————————————————
      // managerReadInfo — новый параметр (массив ID → строка)
      // ——————————————————————————
      item.managerReadInfo = '-';
      if (Array.isArray(item.managerRead) && item.managerRead.length > 0) {
        const managerInfos = await Promise.all(
          item.managerRead.map((id: string) => getUserDisplayInfo(id))
        );
        // Фильтруем пустые/дефолтные значения, если нужно — можно убрать этот фильтр
        const nonEmpty = managerInfos.filter(info => info && info !== '-' && !info.includes('[ошибка'));
        item.managerReadInfo = nonEmpty.length ? nonEmpty.join(', ') : '-';
      }

      // ——————————————————————————
      // doneGaveLeadInfo — новый параметр (строка)
      // ——————————————————————————
      item.doneGaveLeadInfo = '-';
      if (item.doneGaveLead && typeof item.doneGaveLead === 'string') {
        item.doneGaveLeadInfo = await getUserDisplayInfo(item.doneGaveLead);
      }
      return item;
    });

    const items = await Promise.all(enrichedItemsPromises);

    // Сортировка (ваша логика)
    items.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return items;
  }

  async updateCommentsAdmin(itemId: string, commentsAdmin: string): Promise<void> {
    if (!itemId) {
      console.warn('updateCommentsAdmin: itemId is required');
      return;
    }

    try {
      const docRef = doc(this.itemsCollection, itemId);

      // Обновляем ТОЛЬКО commentsAdmin
      await updateDoc(docRef, {
        commentAdmin: commentsAdmin
      });

    } catch (error) {
      console.error('Failed to update commentsAdmin:', error);
      throw error; // чтобы обработать выше, если нужно
    }
  }

  async deleteCommentsAdmin(itemId: string): Promise<void> {
    if (!itemId) {
      console.warn('deleteCommentsAdmin: itemId is required');
      return;
    }

    try {
      const docRef = doc(this.itemsCollection, itemId);

      // Удаляем поле commentAdmin из документа
      await updateDoc(docRef, {
        commentAdmin: deleteField()
      });

    } catch (error) {
      console.error('Failed to delete commentAdmin:', error);
      throw error;
    }
  }

  async syncDialogLeadFieldsToDeals(): Promise<void> {
    const dialogsCollection = collection(this.firestore, 'dialogs');
    const dialogsSnapshot = await getDocs(query(dialogsCollection));

    const updatePromises: Promise<void>[] = [];

    for (const dialogDoc of dialogsSnapshot.docs) {
      const dialogData = dialogDoc.data() as {
        orderId?: string;
        doneGaveLead?: string;
        managerRead?: string[];
      };

      const { orderId, doneGaveLead, managerRead } = dialogData;

      // Пропускаем, если нет orderId или оба поля отсутствуют/пусты
      if (!orderId) {
        console.debug(`Пропущен dialog ${dialogDoc.id}: нет orderId`);
        continue;
      }

      const fieldsToUpdate: { doneGaveLead?: string; managerRead?: string[] } = {};

      if (doneGaveLead !== undefined) {
        fieldsToUpdate.doneGaveLead = doneGaveLead;
      }
      if (Array.isArray(managerRead)) {
        fieldsToUpdate.managerRead = managerRead;
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        // Нечего синхронизировать — пропускаем
        continue;
      }

      // Обновляем deal по orderId
      const dealDocRef = doc(this.itemsCollection, orderId); // itemsCollection = bitrixDeals

      updatePromises.push(
        updateDoc(dealDocRef, fieldsToUpdate)
          .then(() => {
            console.log(`✅ Обновлён deal ${orderId} из dialog ${dialogDoc.id}`, fieldsToUpdate);
          })
          .catch((err) => {
            console.error(`❌ Ошибка обновления deal ${orderId} из dialog ${dialogDoc.id}:`, err);
          })
      );
    }

    // Дожидаемся всех обновлений
    await Promise.all(updatePromises);
    console.log(`🏁 Синхронизация завершена: обновлено ${updatePromises.length} записей`);
  }
}
