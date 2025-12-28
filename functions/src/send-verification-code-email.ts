import {HttpsError} from "firebase-functions/https";
import {onCall} from "firebase-functions/v2/https";

export const sendVerificationCodeByEmail = onCall(async (request) => {
  try {
    return {success: true, message: ''};

  } catch (error: any) {
    console.error('Произошла ошибка:', error.message);
    throw new HttpsError(
      'internal',
      'Ошибка при отправке кода подтверждения',
      error.message || 'Неизвестная ошибка'
    );
  }
});
