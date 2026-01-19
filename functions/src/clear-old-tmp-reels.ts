import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

export const clearOldTmpReels = onSchedule("0 3 * * *", async (event) => {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  const threshold = new Date();
  threshold.setHours(threshold.getHours() - 24);

  const oldReelsQuery = await db.collection("tmpReels")
    .where("processedAt", "<", threshold)
    .get();

  if (oldReelsQuery.empty) {
    console.log("No old temporary reels to clean up.");
    return;
  }

  const batch = db.batch();

  for (const doc of oldReelsQuery.docs) {
    const reelId = doc.id;


    await Promise.all([
      bucket.file(`tmp/${reelId}_original`).delete({ ignoreNotFound: true }),
      bucket.file(`thumbs/${reelId}.jpg`).delete({ ignoreNotFound: true })
    ]);

    batch.delete(doc.ref);
  }

  await batch.commit();
  console.log(`Successfully cleaned up ${oldReelsQuery.size} documents.`);
});
