// api/photos.js
// Lists everything guests have uploaded so far, newest first.

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  try {
    const data = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'wedding-photos/',
    }));

    const items = (data.Contents || [])
      .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
      .map((obj) => {
        const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(obj.Key);
        return {
          url: `${process.env.R2_PUBLIC_URL}/${obj.Key}`,
          uploadedAt: obj.LastModified,
          type: isVideo ? 'video' : 'image',
        };
      });

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
    return res.status(200).json({ items });
  } catch (err) {
    console.error('List error:', err);
    return res.status(500).json({ error: 'Could not load photos' });
  }
}
