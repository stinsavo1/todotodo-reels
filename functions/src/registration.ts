import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from "firebase-functions/https";
import { onCall } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();

// Регистрация
export const registration = onCall(
  async (request) => {
  try {
    const { email, fio, phone, region, idReferral, promocode } = request.data

    if (!phone) {
      throw new HttpsError(
        'invalid-argument',
        'Номер телефона обязателен для регистрации.'
      )
    }

    // Проверяем телефон
    const userSnapshot = await db.collection('users')
      .where('phone', '==', phone)
      .get()

    if (!userSnapshot.empty) {
      throw new HttpsError(
        'already-exists',
        'Пользователь с таким номером телефона уже зарегистрирован. Пожалуйста, авторизируйтесь.'
      )
    }

    // Проверяем email
    if (email) {
      const userSnapshotEmail = await db.collection('users')
        .where('email', '==', email)
        .get()

      if (!userSnapshotEmail.empty) {
        throw new HttpsError(
          'already-exists',
          'Пользователь с таким email уже зарегистрирован. Пожалуйста, измените email.'
        )
      }
    }
    const serverTimestamp = Timestamp.now()

    const notifications = {
      callNotificationMessage: true,
      callNotificationNewLead: true,
      callNotificationNewOrder: true
    }

    // Данные пользователя
    const userData: any = {
      email,
      fio,
      phone,
      id: '',
      isVerified: false,
      createdAt: serverTimestamp,
      region,
      notifications
    }

    if (idReferral) {
      userData.idReferral = idReferral
    } else {
      userData.callNotification = true
    }

    if (promocode) {
      const now = new Date()
      const finishDate = new Date(now)
      finishDate.setMonth(finishDate.getMonth() + 1) // +1 месяц
      userData.finishPeriod = finishDate.toISOString()
    }

    const newUserRef = db.collection('users').doc(); // генерируем новый ID
    const userId = newUserRef.id;

    await newUserRef.set({
      ...userData,
      id: userId
    });


    const newUserPushRef = db.collection('usersPush').doc(userId); // ← используем тот же ID как ID документа

    await newUserPushRef.create({
      id: userId,
      notifications
    });

    return {
      success: true,
      data: newUserRef.id,
      message: 'Код подтверждения отправлен на указанный номер телефона.',
    }
  } catch (error: any) {
    throw new HttpsError(
      'internal',
      'Ошибка при регистрации',
      error.message || 'Неизвестная ошибка'
    )
  }
})
