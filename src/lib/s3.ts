import { S3 } from 'aws-sdk';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT, 
  s3ForcePathStyle: true,
});

export default s3;

export async function uploadFileToS3(file: File, folder: string, userId: string) {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}-${folder}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
  const fileKey = `${folder}/${userId}/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: fileKey,
    Body: buffer,
    ContentType: file.type,
    ACL: 'public-read',
  };
  const uploadResult = await s3.upload(uploadParams).promise();
  return uploadResult.Location;
}
