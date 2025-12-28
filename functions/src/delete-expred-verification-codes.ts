
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from "firebase-functions/scheduler";

admin.initializeApp();
const db = admin.firestore();
// Удаление кодов через 5 мин
export const deleteExpiredVerificationCodes = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'UTC' // или 'Europe/Moscow', если нужно
  },
  async () => {
    const now = Timestamp.now();
    const verificationCodesRef = db.collection('verificationCodes');

    const expiredCodes = await verificationCodesRef
      .where('expirationTime', '<=', now)
      .get();

    if (expiredCodes.empty) {
      return;
    }

    const batch = db.batch();
    expiredCodes.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
);
