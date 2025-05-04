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
export const addDriver = async (req:Request,res:Response):Promise<any>=>{
     console.log("reached addDriver");
     console.log(req.files);
     console.log(req.body);
    try{
        const parsedBody = addDriverSchema.safeParse(req.body);
        if(!parsedBody.success){
            res.status(411).json({
                message: "Incorrect Input"+parsedBody.error,
            })
        }
       const driverExist =await prisma.driver.findMany({
        where:{
            OR:[
                {AdhaarCardNumber: parsedBody.data?.AadharNumber},
                {PanNumber: parsedBody.data?.PanNumber},
                {MobileNumber: parsedBody.data?.MobileNumber}
            ]
        }
       })
       if(driverExist.length>0){
        return res.status(411).json({
            message: "Aadhar/Pan/MobileNumber already exist"
        });
       }
     //@ts-ignore
     if (!req.files || !req.files['aadharImageFront'] || !req.files['aadharImageBack'] || !req.files['panImage'] || !req.files["licenseImageFront"]|| !req.files["licenseImageBack"]|| !req.files["driverImage"]) {
        return res.status(400).json({ error: 'Missing required image files' });
      }
      //@ts-ignore
      const aadharImageFront = req.files["aadharImageFront"][0];
      //@ts-ignore
      const aadharImageBack = req.files["aadharImageBack"][0];
      //@ts-ignore
      const driverIamge = req.files["driverImage"][0];
      //@ts-ignore
      const licenseImageFront = req.files["licenseImageFront"][0];
      //@ts-ignore
      const licenseImageBack = req.files["licenseImageBack"][0];
      //@ts-ignore
      const panImage = req.files["panImage"][0];
    
      const aadharImageFrontName = generateFileName();
      const aadharImageBackName = generateFileName();
      const licenseImageBackName = generateFileName();
      const licenseImageFrontName = generateFileName();
      const driverIamgeName = generateFileName();
      const panImageName = generateFileName();
    
      await uploadFile(aadharImageFront.buffer,aadharImageFrontName,aadharImageFront.mimetype);
      await uploadFile(aadharImageBack.buffer,aadharImageBackName,aadharImageBack.mimetype);
      await uploadFile(licenseImageFront.buffer,licenseImageFrontName,licenseImageFront.mimetype);
      await uploadFile(licenseImageBack.buffer,licenseImageBackName,licenseImageBack.mimetype);
      await uploadFile(driverIamge.buffer,driverIamgeName,driverIamge.mimetype);
      await uploadFile(panImage.buffer,panImageName,panImage.mimetype);

      const driverPassword = generatePassword();
      const encryptedPassword = await bcrypt.hash(driverPassword,2);
      
      const driver = await prisma.driver.create({
        data:{
            Name: parsedBody.data?.Name,
            DrivingLicenceNumber: parsedBody.data?.DrivingLicense as string,
            DriverImage: driverIamgeName,
            Password: encryptedPassword,
            PanNumber: parsedBody.data?.PanNumber as string,
            AdhaarCardNumber: parsedBody.data?.AadharNumber as string,
            FrontSideAdhaarImage: aadharImageFrontName,
            BackSideAdhaarImage: aadharImageBackName,
            DrivingLicenceBackImage: licenseImageBackName,
            DrivingLicenceFrontImage: licenseImageFrontName,
            Gender: parsedBody.data?.Gender as unknown as any,
            PanImage: panImageName,
            MobileNumber: parsedBody.data?.MobileNumber as any
        }
      })
    
      await prisma.ownerDriver.create({
        data:{
            //@ts-ignore
            OwnerId: req.user.Id,
            DriverId: driver.Id
        }
      })

      res.status(200).json({
        message :"Driver added successfully"
      })
    }

    catch(error:any){
        res.status(500).json({
            message: "Something went wrong"+error
            
        })
    }
    
}

export const assignVehicleToDriver = async (req:Request, res:Response): Promise<any>=>{
    try{
         const parsedBody = assignVehicleToDriverSchema.safeParse(req.body);
         if(!parsedBody.success){
            return res.status(411).json(responseObj(false,null,"Incorrect Input"));
         }
            const vehicleAlreadyAssignedToDriver = await prisma.driverVehicle.findMany({
                where:{
                    DriverId: parsedBody.data.driverId,
                    VehicleId: parsedBody.data.vehicleId
                }
               
             })

             if(vehicleAlreadyAssignedToDriver){
               return res.status(411).json({
                    message: "Vehicle Already assigned to Driver"
                })
             }
             await prisma.driverVehicle.create({
                data:{
                    DriverId: parsedBody.data?.driverId,
                    VehicleId: parsedBody.data?.vehicleId
                }
             });

        res.status(200).json(responseObj(true,null,"Vehicle Successfully assigned to Driver"));
         

    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}

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
        res.status(500).json({
            message : "Something went wrong"+error
        })
    }
}

