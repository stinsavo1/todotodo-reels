import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export async function sendPushNotification(
  uid: string,
  title: string,
  body: string,
  link?: string
): Promise<{ success: number; failure: number; details: any[] }> {
  const userDoc = await db.doc(`usersPush/${uid}`).get();
  if (!userDoc.exists) {
    return { success: 0, failure: 1, details: [{ error: 'User not found', platform: null }] };
  }

  const userData = userDoc.data();
  const tokens: Array<{ token: string; platform: string }> = [];

  if (userData?.webToken) {
    tokens.push({ token: userData.webToken, platform: 'web' });
  }
  if (userData?.nativeToken) {
    tokens.push({ token: userData.nativeToken, platform: 'native' });
  }

  if (tokens.length === 0) {
    return { success: 0, failure: 1, details: [{ error: 'No tokens', platform: null }] };
  }

  const messaging = admin.messaging();

  const sendPromises = tokens.map(async ({ token, platform }) => {
    let message;

    if (platform === 'web') {
      message = {
        notification: { title, body },
        token,
        webpush: {
          fcmOptions: { link: link || 'https://your-pwa.com' },
          notification: {
            icon: '/assets/icons/icon-96x96.png',
            click_action: link || 'https://your-pwa.com'
          }
        }
      };
    } else {
      message = {
        notification: { title, body },
        token,
        data: {
          link: link || '/tabs/home',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      };
    }

    try {
      const response = await messaging.send(message);
      return { success: true, platform, token, messageId: response };
    } catch (error: any) {
      console.error(`Failed to send to ${platform} token:`, error.message);
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        const update: any = {};
        if (platform === 'web') update.webToken = null;
        if (platform === 'native') update.nativeToken = null;
        await db.doc(`usersPush/${uid}`).update(update);
      }
      return { success: false, platform, token, error: error.message };
    }
  });

  const results = await Promise.all(sendPromises);
  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;

  return { success: successes, failure: failures, details: results };
}
