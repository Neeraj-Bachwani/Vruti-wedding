// api/upload-url.js
// Requires: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
//
// Generates a short-lived presigned URL that the browser uses to PUT the
// file straight into R2. The file never touches this function, so Vercel's
// 4.5MB body limit doesn't apply — this works for videos of any reasonable size.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType, uploader } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType required' });
    }

    // Sanitize + namespace the key so files never collide and stay organized
    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const safeUploader = (uploader || 'guest').replace(/[^a-zA-Z0-9\-_]/g, '_').slice(0, 40);
    const key = `wedding-photos/${Date.now()}-${safeUploader}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min window

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return res.status(200).json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error('Presign error:', err);
    return res.status(500).json({ error: 'Could not generate upload URL' });
  }
}
