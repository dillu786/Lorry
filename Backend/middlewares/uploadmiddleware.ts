import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { Request } from 'express';

// Initialize S3 Client from AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Define the middleware to handle file uploads
const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3Client,  // Use S3Client for AWS SDK v3
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    acl: 'private',
    metadata: (req: Request, file: Express.Multer.File, cb: Function) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req: Request, file: Express.Multer.File, cb: Function) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Only allow certain file types, for example, only images
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(file.originalname.toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extname && mimeType) {
      return cb(null, true);
    } else {
      //@ts-ignore
      return cb(new Error('Only image files are allowed!'), false);
    }
  },
}).fields([
  { name: 'VehicleImage', maxCount: 1 },
  // Other fields...
]);


export default uploadMiddleware;
