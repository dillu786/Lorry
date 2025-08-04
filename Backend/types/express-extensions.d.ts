import { Driver } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        user: Driver;
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