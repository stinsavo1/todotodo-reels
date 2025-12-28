import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendPushNotification } from './send-push-notification';

admin.initializeApp();
const db = admin.firestore();

export const createOrder = onDocumentCreated(
  'orders/{id}',
  async (event) => {
    const newOrder = event.data?.data() || {};
    const orderId = event.params.id;

    // Формат даты
    const date = new Date(newOrder.orderDate).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    /* ========= Firestore ========= */

    const orderDate = new Date().toISOString();
    const text = `${newOrder.type} на ${date} по адресу ${newOrder.address}`;

    const dialogRef = db.doc(`dialogs/QVM1xPONVdCB3ipHND9t`);
    const messagesRef = db.collection(
      `dialogs/QVM1xPONVdCB3ipHND9t/messages`
    );

    const firestoreUpdate = messagesRef
      .add({
        author: newOrder.author,
        orderDate,
        photos: [],
        text,
        order: orderId,
        type: newOrder.type,
      })
      .then(() =>
        dialogRef.set(
          {
            author: newOrder.author,
            orderDate,
            text: text.length > 50 ? text.slice(0, 50) + '...' : text,
          },
          { merge: true }
        )
      );


    const pushUpdate = (async () => {
      const title = '🆕 Новый заказ';
      const body = `Категория: ${newOrder.type}
Адрес: ${newOrder.address}
Желаемая дата: ${date}
Желаемая цена: ${newOrder.price}*`;

      const usersSnapshot = await db.collection('usersPush').get();
      const notifyPromises: Promise<any>[] = [];

      for (const doc of usersSnapshot.docs) {
        const user = doc.data();
        const uid = doc.id;

        if (
          !user.webToken &&
          !user.nativeToken &&
          !user?.notifications?.callNotificationNewOrder
        ) {
          return;
        }

        notifyPromises.push(
          sendPushNotification(
            uid,
            title,
            body,
            `https://montaz.todotodo.ru/tabs/map/order-detail/${orderId}`
          )
        );
      }

      const results = await Promise.allSettled(notifyPromises);
      const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
      const rejected = results.filter((r) => r.status === 'rejected').length;

      console.log(`📣 Push sent: ${fulfilled}, failed: ${rejected}`);
    })();

    return Promise.all([
      firestoreUpdate,
      pushUpdate,
    ])
      .then(() => true)
      .catch((err) => {
        console.error('⚠️ Partial failure in createOrder:', err);
        return true;
      });
  }
);
