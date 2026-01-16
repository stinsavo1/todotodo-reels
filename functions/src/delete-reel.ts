import * as admin from 'firebase-admin';
import { https } from 'firebase-functions';

export const deleteReel = https.onCall({
  memory: '256MiB',
}, async (request) => {

  const { reelId } = request.data;

  if (!request.auth) {
    throw new https.HttpsError('unauthenticated', 'Нужно войти в систему');
  }

  if (!reelId) {
    throw new https.HttpsError('invalid-argument', 'Missing reelId');
  }

  const callerUid = request.auth.uid;

  const bucket = admin.storage().bucket();
  const db = admin.firestore();

  try {
    let reelDoc = await db.collection('reels').doc(reelId).get();

    if (!reelDoc.exists) {
      reelDoc = await db.collection('tmpReels').doc(reelId).get();
    }

    if (!reelDoc.exists) {
      throw new https.HttpsError('not-found', 'Видео не найдено');
    }

    const reelData = reelDoc.data();

    if (reelData?.userId !== callerUid) {
      throw new https.HttpsError('permission-denied', 'Вы не можете удалять чужие видео');
    }

    const commentsSnapshot = await db.collection('comments')
      .where('reelId', '==', reelId)
      .get();

    const videoPath = `reels/${reelId}.mp4`;
    const thumbPath = `thumbnails/${reelId}.jpg`;

    await Promise.all([
      bucket.file(videoPath).delete({ ignoreNotFound: true }),
      bucket.file(thumbPath).delete({ ignoreNotFound: true }),
      bucket.deleteFiles({
        prefix: `tmp/${reelId}_original`
      })
    ]);

    const batch = db.batch();
    commentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(db.collection('reels').doc(reelId));
    batch.delete(db.collection('tmpReels').doc(reelId));

    await batch.commit();

    return { status: 'success', message: 'Reel and files deleted' };
  } catch (error: any) {
    console.error('Delete Error:', error);
    if (error instanceof https.HttpsError) {
      throw error;
    }
    throw new https.HttpsError('internal', 'Ошибка при удалении');
  }
});
