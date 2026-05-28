import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';

export const s3 = new S3Client({
  endpoint: `http${env.MINIO_USE_SSL ? 's' : ''}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
  region: 'us-east-1', // MinIO ignore la région mais le SDK l'exige
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // obligatoire avec MinIO
});

// s'assure que le bucket existe au démarrage de l'app
export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: env.MINIO_BUCKET }));
    console.log(`Bucket "${env.MINIO_BUCKET}" créé`);
  }
}
