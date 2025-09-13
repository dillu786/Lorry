import { addDriverSchema } from "../../../types/Owner/addDriverType"
import type { Request, Response } from 'express';
import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import z from 'zod';
import { uploadFile } from "../../../utils/s3utils";
import bcrypt from "bcrypt"
import crypto from "crypto"
import sharp from 'sharp';
import {PrismaClient} from "@prisma/client";
import { generateFileName } from '../../../utils/s3utils';
import { generatePassword } from "../../../utils/generatePassword";
import { assignVehicleToDriverSchema } from "../../../types/Owner/assignVehicleToDriverType";
import { responseObj } from "../../../utils/response";
import { getObjectSignedUrl } from "../../../utils/s3utils";
const prisma= new PrismaClient();
const app = express();
app.use(express.json());
export const addDriver = async (req: Request, res: Response): Promise<any> => {
  console.log("reached addDriver");
  console.log(req.files);
  console.log(req.body);

  try {
    const parsedBody = addDriverSchema.safeParse(req.body);
    if (!parsedBody.success) {
      const formattedErrors = parsedBody.error.errors.map(error => {
        const fieldName = error.path.join('.');
        return `${fieldName}: ${error.message}`;
      });
      return res.status(400).json(responseObj(false, null, "Please check the following fields", formattedErrors as any));
    }

    // Check if driver already exists
    const driverExist = await prisma.driver.findMany({
      where: {
        OR: [
          { AdhaarCardNumber: parsedBody.data?.AadharNumber },
          { PanNumber: parsedBody.data?.PanNumber },
          { MobileNumber: parsedBody.data?.MobileNumber },
        ],
      },
    });

    if (driverExist.length > 0) {
      return res.status(409).json(responseObj(false, null, "Aadhar/Pan/MobileNumber already exists"));
    }

    // Check only required files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (
      !files ||
      !files["licenseImageFront"] ||
      !files["licenseImageBack"] ||
      !files["driverImage"]
    ) {
      return res.status(400).json(responseObj(false, null, "Missing required image files"));
    }

    // Required files
    const driverImage = files["driverImage"][0];
    const licenseImageFront = files["licenseImageFront"][0];
    const licenseImageBack = files["licenseImageBack"][0];

    // File names
    const driverImageName = generateFileName();
    const licenseImageFrontName = generateFileName();
    const licenseImageBackName = generateFileName();

    // Upload required
    await uploadFile(driverImage.buffer, driverImageName, driverImage.mimetype);
    await uploadFile(
      licenseImageFront.buffer,
      licenseImageFrontName,
      licenseImageFront.mimetype
    );
    await uploadFile(
      licenseImageBack.buffer,
      licenseImageBackName,
      licenseImageBack.mimetype
    );

    // Optional Aadhaar images
    let aadharImageFrontName: string | null = null;
    let aadharImageBackName: string | null = null;

    if (files["aadharImageFront"]) {
      const aadharFront = files["aadharImageFront"][0];
      aadharImageFrontName = generateFileName();
      await uploadFile(
        aadharFront.buffer,
        aadharImageFrontName,
        aadharFront.mimetype
      );
    }

    if (files["aadharImageBack"]) {
      const aadharBack = files["aadharImageBack"][0];
      aadharImageBackName = generateFileName();
      await uploadFile(
        aadharBack.buffer,
        aadharImageBackName,
        aadharBack.mimetype
      );
    }

    // Optional Pan image
    let panImageName: string | null = null;
    if (files["panImage"]) {
      const panImage = files["panImage"][0];
      panImageName = generateFileName();
      await uploadFile(panImage.buffer, panImageName, panImage.mimetype);
    }

    // Password encrypt
    const encryptedPassword = await bcrypt.hash(
      parsedBody.data?.Password as string,
      2
    );

    // Save driver
    const driver = await prisma.driver.create({
      data: {
        Name: parsedBody.data?.Name,
        DrivingLicenceNumber: parsedBody.data?.DrivingLicense as string,
        DriverImage: driverImageName,
        Password: encryptedPassword,
        PanNumber: parsedBody.data?.PanNumber as string,
        AdhaarCardNumber: parsedBody.data?.AadharNumber as string,
        FrontSideAdhaarImage: aadharImageFrontName as any, // can be null
        BackSideAdhaarImage: aadharImageBackName as any, // can be null
        DrivingLicenceBackImage: licenseImageBackName,
        DrivingLicenceFrontImage: licenseImageFrontName,
        Gender: parsedBody.data?.Gender as unknown as any,
        PanImage: panImageName as any, // can be null
        MobileNumber: parsedBody.data?.MobileNumber as any,
      },
    });

    // Link driver to owner
    await prisma.ownerDriver.create({
      data: {
        //@ts-ignore
        OwnerId: req.user.Id,
        DriverId: driver.Id,
      },
    });

    res.status(200).json(responseObj(true, null, "Driver added successfully"));
  } catch (error: any) {
    res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
};


export const assignVehicleToDriver = async (req: Request, res: Response): Promise<any> => {
    try {
      const parsedBody = assignVehicleToDriverSchema.safeParse(req.body);
      if (!parsedBody.success) {
        const formattedErrors = parsedBody.error.errors.map(error => {
        const fieldName = error.path.join('.');
        return `${fieldName}: ${error.message}`;
      });
      return res.status(400).json(responseObj(false, null, "Please check the following fields", formattedErrors as any));
      }
  
      const { driverId, vehicleId } = parsedBody.data;
  
      const [vehicleExists, driverExists, existingAssignment, vehicleAssignedToOtherDriver] = await Promise.all([
        prisma.vehicle.findFirst({ where: { Id: vehicleId } }),
        prisma.driver.findFirst({ where: { Id: driverId } }),
        prisma.driverVehicle.findFirst({ 
          where: { 
            DriverId: driverId,
            VehicleId: vehicleId
          } 
        }),
        prisma.driverVehicle.findFirst({
          where: {
            VehicleId: vehicleId,
            DriverId: {
              not: driverId
            }
          },
          include: {
            Driver: {
              select: {
                Name: true
              }
            }
          }
        })
      ]);
  
      if (!vehicleExists) {
        return res.status(400).json(responseObj(false, null, "vehicleId does not exist"));
      }
  
      if (!driverExists) {
        return res.status(400).json(responseObj(false, null, "driverId does not exist"));
      }
  
      // Check if vehicle is already assigned to this driver
      if (existingAssignment) {
        return res.status(400).json(responseObj(false, null, "Vehicle is already assigned to this driver"));
      }

      // Check if vehicle is already assigned to another driver
      if (vehicleAssignedToOtherDriver) {
        return res.status(400).json(responseObj(false, null, `Vehicle is already assigned to driver: ${vehicleAssignedToOtherDriver.Driver.Name}`));
      }
  
      await prisma.driverVehicle.create({
        data: {
          DriverId: driverId,
          VehicleId: vehicleId
        }
      });
  
      return res.status(200).json(responseObj(true, null, "Vehicle successfully assigned to driver"));
    } catch (error: any) {
      return res.status(500).json(responseObj(false, null, `Something went wrong: ${error.message}`));
    }
  };
      

export const getAllDriverByOwnerId = async (req:Request,res: Response):Promise<any>=>{

    try{

        const ownerId = req.user.Id;
    
        const drivers = await prisma.ownerDriver.findMany({
            where: {
                OwnerId: ownerId,
            },
            include: {
                Driver: {
                    select: {
                        Name: true,
                        MobileNumber: true,
                        DrivingLicenceNumber: true,
                        DriverImage: true,                       
                        DriverVehicles: {
                            include: {
                                Vehicle: {
                                    select: {
                                        Model: true,
                                        Year: true,
                                        VehicleNumber: true,
                                        Category: true,
                                        VehicleImage: true,
                                    },
                                },
                            },
                        },
                    }

                }
               
            },
        });

    
        for(let driver of drivers){
            driver.Driver.DriverImage = await getObjectSignedUrl(driver.Driver.DriverImage)
        }
       return  res.status(200).json(drivers);
    }
    catch(error:any){
        res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
    }
}

