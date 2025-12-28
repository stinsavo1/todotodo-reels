import {Injectable} from "@angular/core";
import {collection, deleteField, doc, Firestore, getDocs, updateDoc, writeBatch} from "@angular/fire/firestore";
import {AuthService} from "../auth.service";

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private firestore: Firestore,
              private authService: AuthService) {
  }


  /**
   * Сохраняет настройки уведомлений для текущего пользователя.
   * Обновляет ТОЛЬКО поле `notification`.
   */
  public async saveNotificationSettings(notifications: Record<string, any>): Promise<void> {
    const uid = this.authService.uid;

    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userPushDocRef = doc(this.firestore, `usersPush/${uid}`);

    // Обновляем оба документа параллельно для повышения производительности
    await Promise.all([
      updateDoc(userDocRef, { notifications }),
      updateDoc(userPushDocRef, { notifications })
    ]);
  }
}
