import * as admin from 'firebase-admin';
import { HttpsError } from "firebase-functions/https";
import { onCall } from "firebase-functions/v2/https";

export const deleteAuthUser = onCall(async (request) => {
  const userId = request.data.userId;

  try {
    // Использование Admin SDK для удаления пользователя
    await admin.auth().deleteUser(userId);
    return { success: true };
  } catch (error) {
    console.error('Ошибка удаления пользователя из Auth:', error);
    throw new HttpsError('internal', 'Ошибка удаления пользователя');
  }
});
