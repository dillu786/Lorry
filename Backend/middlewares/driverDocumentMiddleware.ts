import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { responseObj } from "../utils/response";

const prisma = new PrismaClient();

export const checkDriverDocumentVerification = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Get driver ID from request (assuming it's in req.user after authentication)
    const driverId = req.user?.user?.Id || req.body.driverId;
    
    if (!driverId) {
      res.status(400).json(responseObj(false, null, "Driver ID is required"));
      return;
    }

    const driver = await prisma.driver.findUnique({
      where: { Id: driverId },
      select: {
        IsDLFrontImageVerified: true,
        IsDLBackImageVerified: true,
        IsFSAdhaarImgVerified: true,
        IsBSAdhaarImgVerified: true,
        IsPanImgVerified: true
      }
    });

    if (!driver) {
      res.status(404).json(responseObj(false, null, "Driver not found"));
      return;
    }

    // Check if all documents are verified
    if (!driver.IsDLFrontImageVerified || 
        !driver.IsDLBackImageVerified || 
        !driver.IsFSAdhaarImgVerified || 
        !driver.IsBSAdhaarImgVerified || 
        !driver.IsPanImgVerified) {
      res.status(403).json(responseObj(false, null, "Access denied: All documents must be verified"));
      return;
    }

    // Add verification status to request for use in subsequent middleware/routes
    req.driverDocumentStatus = driver;
    next();
  } catch (error: any) {
    res.status(500).json(responseObj(false, null, "Error checking document verification: " + error.message));
  }
};

// Middleware to get document verification status without blocking
export const getDriverDocumentStatus = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const driverId = req.user?.user?.Id || req.body.driverId;
    
    if (!driverId) {
      res.status(400).json(responseObj(false, null, "Driver ID is required"));
      return;
    }

    const driver = await prisma.driver.findUnique({
      where: { Id: driverId },
      select: {
        IsDLFrontImageVerified: true,
        IsDLBackImageVerified: true,
        IsFSAdhaarImgVerified: true,
        IsBSAdhaarImgVerified: true,
        IsPanImgVerified: true
      }
    });

    if (!driver) {
      res.status(404).json(responseObj(false, null, "Driver not found"));
      return;
    }

    req.driverDocumentStatus = driver;
    next();
  } catch (error: any) {
    res.status(500).json(responseObj(false, null, "Error getting document status: " + error.message));
  }
}; 