import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3 } from 'aws-sdk';
import type { Request } from 'express';

// Initialize S3
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Define the middleware to handle file uploads
const uploadMiddleware = multer({
  storage: multerS3({
    //@ts-ignore
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    acl: 'private', // Keep the files private
    metadata: (req:Request, file: any, cb : any) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req: Request, file: Express.MulterS3.File, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
}).fields([
  { name: 'VehicleImage', maxCount: 1 },
  { name: 'VehicleInsuranceImage', maxCount: 1 },
  { name: 'PermitImage', maxCount: 1 },
]);

export default uploadMiddleware;
