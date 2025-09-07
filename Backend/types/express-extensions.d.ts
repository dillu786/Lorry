import { Driver } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: {
        Id: number;
        [key: string]: any;
      };
      driverDocumentStatus?: {
        IsDLFrontImageVerified: boolean;
        IsDLBackImageVerified: boolean;
        IsFSAdhaarImgVerified: boolean;
        IsBSAdhaarImgVerified: boolean;
        IsPanImgVerified: boolean;
      };
    }
  }
}

export {}; 