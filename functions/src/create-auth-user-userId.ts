import * as admin from 'firebase-admin';
import { HttpsError } from "firebase-functions/https";
import { onCall } from "firebase-functions/v2/https";

admin.initializeApp();

/**
 * Создает пользователя в Firebase Authentication с указанным UID и номером телефона.
 * Используется для создания тестовых аккаунтов (например, для Apple Review).
 * @param {string} phoneNumber - Номер телефона в формате +7XXXXXXXXXX
 * @param {string} customUid - Желаемый UID пользователя
 * @returns {Promise<{ success: boolean, uid: string }>}
 */
export const createAuthUserWithCustomUid = onCall(async (request) => {
  const { phoneNumber, customUid } = request.data;

  if (!phoneNumber || !customUid) {
    throw new HttpsError(
      'invalid-argument',
      'Требуются параметры phoneNumber и customUid'
    );
  }

  try {
    // Проверяем, не существует ли уже пользователь с таким UID
    try {
      await admin.auth().getUser(customUid);
      throw new HttpsError(
        'already-exists',
        `Пользователь с UID ${customUid} уже существует`
      );
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      // Пользователь не найден — это нормально, продолжаем создание
    }

    // Создаем пользователя в Firebase Auth
    const userRecord = await admin.auth().createUser({
      uid: customUid,
      phoneNumber: phoneNumber,
    });

    console.log(`✅ Пользователь создан в Auth: UID=${userRecord.uid}, Phone=${userRecord.phoneNumber}`);

    return {
      success: true,
      uid: userRecord.uid,
      message: 'Пользователь успешно создан в Firebase Authentication'
    };

  } catch (error: any) {
    console.error('Ошибка создания пользователя:', error);
    throw new HttpsError(
      'internal',
      'Ошибка при создании пользователя в Authentication',
      error.message
    );
  }
});
