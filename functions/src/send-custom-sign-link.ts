import { HttpsError } from "firebase-functions/https";
import {sendEmail} from "./send-email";
import { onCall } from "firebase-functions/v2/https";

// Callable-функция (для фронтенда)
export const sendCustomSignInLink = onCall(async (request) => {
  const { fromEmail, toEmail, subject, html } = request.data;
  try {
    await sendEmail({ fromEmail, toEmail, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Ошибка при отправке email:', error);
    throw new HttpsError('internal', 'Ошибка при отправке письма.');
  }
});
