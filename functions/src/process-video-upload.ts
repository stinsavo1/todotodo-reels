import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const processVideoUpload = onObjectFinalized({
  cpu: 2,
  memory: '2GiB',
  timeoutSeconds: 540,
}, async (event) => {
  const filePath = event.data.name;
  const bucket = getStorage().bucket(event.data.bucket);

  if (!filePath || !filePath.startsWith('tmp/')) return;

  const fileName = path.basename(filePath);
  const isMov = fileName.toLowerCase().endsWith('.mov');
  const isMp4 = fileName.toLowerCase().endsWith('.mp4');

  if (!isMov && !isMp4) return;

  const fileId = fileName.replace(/\W/g, '_');

  const tempLocalFile = path.join(os.tmpdir(), fileName);
  const targetTempVideo = path.join(os.tmpdir(), `converted_${Date.now()}.mp4`);
  const targetTempThumb = path.join(os.tmpdir(), `thumb_${Date.now()}.jpg`);

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
      return;
    }

    await new Promise((resolve, reject) => {
      ffmpeg(tempLocalFile)
        .videoFilters([
          { filter: 'scale', options: '720:-2' },
          { filter: 'setsar', options: '1' }
        ])
        .outputOptions([
          '-c:v libx264',
          '-profile:v high',
          '-pix_fmt yuv420p',
          '-crf 18',
          '-preset fast',
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

    const [videoUrl, thumbUrl] = await Promise.all([
      getDownloadURL(bucket.file(videoDest)),
      getDownloadURL(bucket.file(thumbDest))
    ]);

    await getFirestore().collection('tmpReels').doc(fileId).set({
      originalName: fileName,
      videoUrl: videoUrl,
      thumbUrl: thumbUrl,
      videoPath: videoDest,
      status: 'finished',
      processedAt: FieldValue.serverTimestamp()
    });

    await bucket.file(filePath).delete();
    console.log('Cleanup complete. Original deleted.');

  } catch (error) {
    console.error('Processing Error:', error);
    try {
      await getFirestore().collection('tmpReels').doc(fileId).set({
        status: 'error',
        errorMessage: 'Failed to process video or generate thumbnail.',
        processedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (firestoreError) {
      console.error('Failed to write error to Firestore:', firestoreError);
    }
  } finally {
    // Clean local temp memory
    [tempLocalFile, targetTempVideo, targetTempThumb].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  }
});
