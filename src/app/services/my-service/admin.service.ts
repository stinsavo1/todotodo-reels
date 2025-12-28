import { inject, Injectable } from "@angular/core";
import { collection, doc, Firestore, getDoc, getDocs, query } from "@angular/fire/firestore";
import { where } from "firebase/firestore";

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private firestore: Firestore = inject(Firestore);

  public async getAllUsers(): Promise<any[]> {
    const usersCollection = collection(this.firestore, "users");
    const snapshot = await getDocs(usersCollection);

    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
  }

  public async getUsersByIds(userIds: string[]): Promise<any[]> {
    const validUserIds = userIds.filter(id => id && typeof id === 'string');

    const promises = validUserIds.map(async (userId) => {
      try {
        const userDoc = doc(this.firestore, "users", userId);
        const snapshot = await getDoc(userDoc);

        if (snapshot.exists()) {
          return {
            id: snapshot.id,
            ...snapshot.data()
          };
        }

        return null;
      } catch (error) {
        console.error("Error fetching user with ID:", userId, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((user): user is any => user !== null);
  }

// Вспомогательная функция для разбивки массива на чанки
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  public async getUsersByPhone(phoneArray: string[]): Promise<any[]> {
    if (!phoneArray || phoneArray.length === 0) return [];

    const cleanedPhones = phoneArray
      .filter(phone => typeof phone === 'string' && phone.trim() !== '');

    if (cleanedPhones.length === 0) return [];

    const chunks = this.chunkArray(cleanedPhones, 30); // по 30 штук

    // Создаем массив промисов для всех чанков
    const promises = chunks.map(async (chunk) => {
      const usersCollection = collection(this.firestore, "users");
      const q = query(usersCollection, where("phone", "in", chunk));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
    });

    // Ждем завершения всех промисов
    const resultsArray = await Promise.all(promises);

    // Объединяем все результаты в один массив и удаляем дубликаты по id
    const uniqueUsers = new Map<string, any>();
    resultsArray.flat().forEach(user => {
      uniqueUsers.set(user.id, user); // заменит повторяющиеся записи
    });

    return Array.from(uniqueUsers.values());
  }
}
