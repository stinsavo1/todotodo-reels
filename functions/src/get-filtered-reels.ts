import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
const db = getFirestore();

export const getFilteredReels = onCall(async (request) => {
  const { lastVisibleId, pageSize = 10 } = request.data;
  const userId = request.auth?.uid;

  try {
    let hiddenVideos = new Set<string>();
    let hiddenAuthors = new Set<string>();

    if (userId) {
      const [videosSnap, authorsSnap] = await Promise.all([
        db.collection(`users/${userId}/hiddenVideos`).get(),
        db.collection(`users/${userId}/hiddenAuthors`).get()
      ]);

      hiddenVideos = new Set(videosSnap.docs.map(doc => doc.id));
      hiddenAuthors = new Set(authorsSnap.docs.map(doc => doc.id));
    }


    const results: any[] = [];
    let currentCursorId = lastVisibleId;
    let hasMore = true;

    while (results.length < pageSize && hasMore) {
      const remainingNeeded = pageSize - results.length;

      let reelsQuery = db.collection('reels')
        .orderBy('createdAt', 'desc')
        .limit(remainingNeeded * 2);

      if (currentCursorId) {
        const lastDoc = await db.collection('reels').doc(currentCursorId).get();
        if (lastDoc.exists) {
          reelsQuery = reelsQuery.startAfter(lastDoc);
        }
      }

      const snapshot = await reelsQuery.get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      for (const doc of snapshot.docs) {
        const data = doc.data();

        if (!hiddenVideos.has(doc.id) && !hiddenAuthors.has(data.authorId)) {
          if (results.length < pageSize) {
            results.push({ id: doc.id, ...data });
          }
        }

        currentCursorId = doc.id;

        if (results.length === pageSize) break;
      }

      if (snapshot.docs.length < remainingNeeded * 2) {
        hasMore = false;
      }
    }

    return {
      reels: results,
      nextCursor: currentCursorId || null,
      hasMore: hasMore
    };

  } catch (error) {
    console.error(error);
    throw new HttpsError('internal', 'Pagination failed.');
  }
});
