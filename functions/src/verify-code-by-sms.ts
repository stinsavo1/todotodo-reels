import * as admin from 'firebase-admin';
import { HttpsError } from "firebase-functions/https";
import { onCall } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();

export const verifyCodeBySms = onCall(async (request) => {
  try {
    const { phoneNumber, code } = request.data;

    if (!phoneNumber || !code) {
      throw new HttpsError('invalid-argument', 'phoneNumber и code обязательны');
    }

    // 🔹 Ищем пользователя по номеру телефона
    const usersSnap = await db
      .collection('users')
      .where('phone', '==', phoneNumber)
      .limit(1)
      .get();

    const userDoc = usersSnap.docs[0];
    const userId = userDoc.id;

    // 🔹 Создаем пользователя в Auth, если его нет
    try {
      await admin.auth().createUser({
        uid: userId,
        phoneNumber: phoneNumber,
      });
    } catch {
    }

    // 🔹 Создаем кастомный токен
    const customToken = await admin.auth().createCustomToken(userId);

    return { token: customToken };

  } catch (error: any) {
    if (error instanceof HttpsError) throw error;

    throw new HttpsError(
      'internal',
      'Ошибка при подтверждении кода',
      error.message
    );
  }
});
