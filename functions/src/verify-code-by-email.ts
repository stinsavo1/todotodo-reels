import * as admin from 'firebase-admin';
import { HttpsError } from "firebase-functions/https";
import { getAuth } from 'firebase-admin/auth';
import { onCall } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

export const verifyCodeByEmail = onCall(async (request) => {
  try {
    // @ts-ignore
    const { phoneNumber, code } = request.data;

      const userRef = db.collection('users').where('phone', '==', phoneNumber);
      const userSnapshot = await userRef.get();
      const uid = userSnapshot.docs[0].id;

      // Обновляем статус верификации (на всякий случай)
      await db.collection('users').doc(uid).update({ isVerified: true });

      // Генерируем кастомный токен
      const customToken = await getAuth().createCustomToken(uid);

      return { token: customToken };

  } catch (error) {
    console.error('Ошибка при проверке кода:', error);

    // Если ошибка уже является HttpsError, пробрасываем её дальше
    if (error instanceof HttpsError) {
      throw error;
    }

    // В противном случае генерируем новую ошибку с общим сообщением
    throw new HttpsError('internal', 'Произошла внутренняя ошибка сервера');
  }
});
