import { S3 } from 'aws-sdk';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

// Function to generate a pre-signed URL for an image
export const generatePresignedUrl = (key: string): string => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Expires: 3600, // URL expires in 1 hour
  };
  return s3.getSignedUrl('getObject', params);
};
