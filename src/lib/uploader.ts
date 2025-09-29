// lib/services/uploader.ts
import { S3 } from 'aws-sdk';

export interface Uploader {
  save(file: File, root?: Record<string, string | null>): Promise<string>; // returns public URL
  delete(fileUrl: string): Promise<void>;
}

// Konfigurasi S3 client
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT, // untuk IDCloudHost / MinIO
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const PROJECT_NAME = process.env.PROJECT_NAME as string;
const BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;

export class S3Uploader implements Uploader {
  async save(file: File, root: Record<string, string | null> = {}): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;

    // Ambil value dari object root → filter kosong/null
    const pathParts = Object.values(root).filter(Boolean);

    // Kalau kosong → fallback ke "other"
    const folderPath = pathParts.length > 0 ? pathParts.join('/') : 'other';

    const fileKey = `${PROJECT_NAME}/${folderPath}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    return uploadResult.Location; // URL publik
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const key = decodeURIComponent(url.pathname.substring(1)); // remove leading "/"

      await s3
        .deleteObject({
          Bucket: BUCKET_NAME,
          Key: key,
        })
        .promise();
    } catch (err) {
      console.error("Failed to delete file from S3:", err);
    }
  }
}

export const uploadService = new S3Uploader();
