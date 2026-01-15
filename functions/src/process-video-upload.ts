import * as admin from 'firebase-admin';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { https } from 'firebase-functions';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

admin.initializeApp();

export const processVideoUpload = https.onCall({
  memory: "2GiB",
  timeoutSeconds: 500,
},async (data: any, context) => {

  const filePath = data.data.filePath;

  if (!filePath || !filePath.startsWith('tmp/')) {
    return { status: 'failed', reason: 'Invalid file path' };
  }

  const bucket = admin.storage().bucket();
  const fileName = path.basename(filePath);
  const fileId = fileName.replace(/\W/g, '_');

  const isMov = fileName.toLowerCase().endsWith('.mov');
  const isMp4 = fileName.toLowerCase().endsWith('.mp4');

  if (!isMov && !isMp4) return { status: 'failed', reason: 'Недопустимый формат файла' };

  const tempLocalFile = path.join(os.tmpdir(), fileName);
  const targetTempVideo = path.join(os.tmpdir(), `converted_${Date.now()}.mp4`);
  const targetTempThumb = path.join(os.tmpdir(), `thumb_${Date.now()}.jpg`);
  const docRef = getFirestore().collection('tmpReels').doc(fileId);
  try {
    await bucket.file(filePath).download({ destination: tempLocalFile });
    const duration: number = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempLocalFile, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration || 0);
      });
    });

    if (duration < 2) {
      console.log(`Video ${fileName} is too short (${duration}s). Deleting...`);
      await getFirestore().collection('tmpReels').doc(fileId).set({
        status: 'failed',
        reason: 'Video duration must be at least 2 seconds',
        processedAt: FieldValue.serverTimestamp()
      });

      await bucket.file(filePath).delete();
      return { status: 'failed', reason: 'Video too short' };
    }

    await new Promise((resolve, reject) => {
      ffmpeg(tempLocalFile)
        .videoFilters([
          { filter: 'scale', options: '720:1280:force_original_aspect_ratio=decrease' },
          {
            filter: 'pad',
            options: '720:1280:(ow-iw)/2:(oh-ih)/2:black'
          },
          { filter: 'setsar', options: '1' }
        ])
        .outputOptions([
          '-c:v libx264',
          '-profile:v main',
          '-pix_fmt yuv420p',
          '-crf 24',
          '-level 3.1',
          '-preset superfast',
          '-movflags +faststart',
          '-c:a aac',
          '-b:a 128k'
        ])
        .on('start', (cmd) => console.log('FFmpeg Video Command:', cmd))
        .on('end', resolve)
        .on('error', reject)
        .save(targetTempVideo);
    });

    await new Promise((resolve, reject) => {
      ffmpeg(targetTempVideo)
        .screenshots({
          timestamps: [1],
          filename: path.basename(targetTempThumb),
          folder: os.tmpdir(),
          size: '640x1138'
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const videoDest = `reels/${fileId}.mp4`;
    const thumbDest = `thumbnails/${fileId}.jpg`;

    await Promise.all([
      bucket.upload(targetTempVideo, { destination: videoDest }),
      bucket.upload(targetTempThumb, { destination: thumbDest })
    ]);

    const [videoUrl] = await bucket.file(videoDest).getSignedUrl({ action: 'read', expires: '01-01-2099' });
    const [thumbUrl] = await bucket.file(thumbDest).getSignedUrl({ action: 'read', expires: '01-01-2099' });
    await docRef.set({
      originalName: fileName,
      videoUrl: videoUrl,
      thumbUrl: thumbUrl,
      videoPath: videoDest,
      status: 'finished',
      processedAt: FieldValue.serverTimestamp()
    });

    await bucket.file(filePath).delete();
    console.log('Cleanup complete. Original deleted.');
    return { status: 'success', videoUrl: videoUrl, thumbUrl: thumbUrl, filePath:videoDest };
  } catch (error) {
    console.error('Processing Error:', error);
    try {
      await docRef.delete();
      console.log(`Deleted record ${fileId} due to processing error.`);
    } catch (dbError) {
      console.error('Failed to delete Firestore record:', dbError);
    }
    throw new https.HttpsError('internal', 'Произощел сбой в обработке видео');
  } finally {
    [tempLocalFile, targetTempVideo, targetTempThumb].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  }
});
