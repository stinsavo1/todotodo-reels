import { HttpsError } from 'firebase-functions/https';
import { onCall } from 'firebase-functions/v2/https';

export const  sendToTelegram = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const token = "7586206242:AAHSMBVvOkYmkKr1xMGY-4KXqNdvl9Qi8Vo";
  const chatId = "";
  const { reason, videoId, phone } = request.data;

  const message = `
    <b>🚨 Жалоба из приложения</b>
    <b>Причина:</b> ${reason}
    <b>ID видео:</b> ${videoId}
    <b>От пользователя:</b> ${phone}
  `;
  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("Fetch Error:", error);
    throw new HttpsError("internal", "Failed to send message");
  }

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Telegram API Logic Error:", errorData);
    throw new HttpsError('internal', `Telegram error: ${errorData.description}`);
  }

  return { success: true };
});
