import { onCall } from "firebase-functions/v2/https";
import {sendPushNotification} from "./send-push-notification";

export const sendNotificationAll = onCall(async (request) => {
  const { title, body, uid, link } = request.data;

  const result = await sendPushNotification(uid, title, body, link);

  return {
    success: true,
    sent: result.success,
    failed: result.failure,
    results: result.details
  };
});
