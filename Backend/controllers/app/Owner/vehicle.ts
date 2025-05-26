import type { Request, Response } from 'express';
import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { updateVehicleSchema, vehicleSchema } from '../../../types/vehicletypes';
import z from 'zod';
import { getObjectSignedUrl, uploadFile } from '../../../utils/s3utils';
import crypto from "crypto"
import sharp from 'sharp';
import {PrismaClient} from "@prisma/client";
import { generateFileName } from '../../../utils/s3utils';
import { responseObj } from '../../../utils/response';
import { VehicleTypes } from '../../../types/Common/types';
const prisma= new PrismaClient();

const app = express();
app.use(express.json());

// Vehicle data structure
interface VehicleData {
  Model: string;
  Year: string;
  VehicleNumber: string;
  Category: string;
  VehicleImage?: string;
  VehicleInsuranceImage?:string;
  PermitImage?:string;
 
}

// Controller to add a vehicle
export const addVehicle = async (req: Request, res: Response): Promise<any> => {
  try {
    // Check for file presence
    //@ts-ignore
    console.log("Hi"+JSON.stringify(req.user));
    //@ts-ignore
    console.log(JSON.stringify(req.files));
    //@ts-ignore
  
   
    //@ts-ignore
   
  // Prepare the vehicle data
  console.log(JSON.stringify(req.body));

  // Validate the input data using Zod schema
  const parsedBody = vehicleSchema.safeParse(req.body);

  if(!parsedBody.success){
    return res.status(411).json({
      message: "Incorrect Input"+parsedBody.error
    })
  }


  let  vehicleImageKey;
  let vehicleInsuranceImageKey;
  let permitImageKey;
    // Now upload the files to S3 (You need to have file content like Buffer, Stream, etc.)
   
  console.log("req.files",req.files);

    // Upload files to S3 (assuming req.files contains valid file objects)
    //@ts-ignore
    if(req.files['VehicleImage']){
      //@ts-ignore
      const vehicleImage =req.files['VehicleImage'][0];
       //@ts-ignore
    const vehicleImageBuffer = await sharp(vehicleImage.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer()
      console.log("vehicle2412341",vehicleImage);
     vehicleImageKey = generateFileName();
      await uploadFile(vehicleImageBuffer, vehicleImageKey,vehicleImage.mimeType);
    }
    //@ts-ignore
    if(req.files['VehicleInsuranceImage']){
      //@ts-ignore
      const vehicleInsuranceImage =req.files['VehicleInsuranceImage'][0];
       //@ts-ignore
    const vehicleInsuranceImageBuffer = await sharp(vehicleInsuranceImage.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer();
     vehicleInsuranceImageKey = generateFileName();
      await uploadFile(vehicleInsuranceImageBuffer,vehicleInsuranceImageKey,vehicleInsuranceImage.mimeType)
    }
   //@ts-ignore
    if(req.files['PermitImage']){
         //@ts-ignore
      const permitImage =req.files['PermitImage'][0];
         //@ts-ignore
      const permitImageBuffer = await sharp(permitImage.buffer)
      .resize({ height: 1920, width: 1080, fit: "contain" })
      .toBuffer()
       permitImageKey = generateFileName();
      await uploadFile(permitImageBuffer,permitImageKey,permitImage.mimeType)
    }
    const vehicleData: VehicleData = {
      ...req.body,
      VehicleImage:vehicleImageKey,
      VehicleInsuranceImage:vehicleInsuranceImageKey,
      PermitImage:permitImageKey
      
    };

    const vehicle = await prisma.vehicle.create({
      data:{
       ...vehicleData
      }
     });
    
     await prisma.ownerVehicle.create({
      data:{
        //@ts-ignore
        OwnerId:req.user.Id,
        VehicleId: vehicle.Id
      }
     });

    // Simulate saving to a database (replace with actual DB logic)
    // await VehicleModel.create(vehicleData);

    // Send a response
    res.status(200).json({
      message: 'Vehicle added successfully!',
      vehicleData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If there's a validation error, send the validation error details
      res.status(400).json({ error: 'Invalid input data', details: error.errors });
    } else {
      // If it's another error, send a generic server error response
      console.error('Internal Server Error:', error); // Log the error for debugging
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getAllVehiclesByOwnerId = async (req:Request, res:Response): Promise<any> =>{

  try{

    const ownerId = req.user.Id as number;
    if(ownerId == null || ownerId == undefined){
      return res.status(411).json(responseObj(false,null,"Incorrect Input"));
    }
  
    const vehicles = await prisma.ownerVehicle.findMany({
      where:{
        OwnerId: ownerId
      },
      include:{
        Vehicle:{
          select:{
            Id: true,
            Model:true,
            Year:true,
            VehicleNumber: true,
            Category: true
          
            
          }
        }
      }
    })


    res.status(200).json(responseObj(true,vehicles,"Succesfully fetched"));
  }
  catch(error: any){
    return res.status(500).json(responseObj(false,null,"Something went wrong"))
  }
}

export const getVehicleByVehicleId = async (req:Request, res: Response):Promise<any>=>{

  try{

    const vehicleId = req.query.vehicleId as string;
    console.log("req.query",req.query);
    console.log("vehicleId",vehicleId);
    if (vehicleId == null || vehicleId == undefined || vehicleId == ""){
      return res.status(411).json(responseObj(false,null,"Incorrect Input"))
    }
  
    const vehicleDetails = await prisma.vehicle.findFirst({
      where:{
        Id: parseInt(vehicleId)
      },
      select:{
        Model:true,
        Year:true,
        VehicleImage: true,
        PermitImage: true,
        VehicleInsuranceImage: true,
        VehicleNumber: true,
        Category:true
    }
  });
  
  if(vehicleDetails){
    vehicleDetails.PermitImage = await getObjectSignedUrl(vehicleDetails.PermitImage as string);
    vehicleDetails.VehicleImage = await getObjectSignedUrl(vehicleDetails.VehicleImage as string);
    vehicleDetails.VehicleInsuranceImage = await getObjectSignedUrl(vehicleDetails.VehicleInsuranceImage as string);
  
  }
  
  res.status(200).json(responseObj(true,vehicleDetails,"Successfully fetched"));
  }
  catch(err:any){
    res.status(500).json(responseObj(true,null,"Something went wrong"));
  }

}

export const updateVehicleByVehicleId = async (req: Request, res: Response): Promise<any> => {
  try {
    const parsedBody = updateVehicleSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(411).json(responseObj(false, null, "Incorrect input", parsedBody.error as any));
    }

    const vehicleDetails = await prisma.vehicle.findFirst({
      where: {
        Id: parseInt(parsedBody.data.Id),
      },
    });

    if (!vehicleDetails) {
      return res.status(404).json(responseObj(false, null, "Vehicle not found"));
    }

    // Safely access files using optional chaining
    //@ts-ignore
    const vehicleImageData = req.files?.['VehicleImage']?.[0];
    //@ts-ignore
    const vehicleInsuranceImageData = req.files?.['VehicleInsuranceImage']?.[0];
    //@ts-ignore
    const vehiclePermitImageData = req.files?.['PermitImage']?.[0];

    if (vehicleImageData) {
      await uploadFile(vehicleImageData.buffer, vehicleDetails.VehicleImage as string, vehicleImageData.mimetype);
    }

    if (vehicleInsuranceImageData) {
      await uploadFile(vehicleInsuranceImageData.buffer, vehicleDetails.VehicleInsuranceImage as string, vehicleInsuranceImageData.mimetype);
    }

    if (vehiclePermitImageData) {
      await uploadFile(vehiclePermitImageData.buffer, vehicleDetails.PermitImage as string, vehiclePermitImageData.mimetype);
    }

    await prisma.vehicle.update({
      where: {
        Id: parseInt(parsedBody.data.Id),
      },
      data: {
        Model: parsedBody.data.Model,
        Year: parsedBody.data.Year,
        VehicleNumber: parsedBody.data.VehicleNumber,
      },
    });

    res.status(200).json(responseObj(true, null, "Successfully Updated"));
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
    res.status(500).json(responseObj(false, null, "Internal Server Error"));
  }
};

export const getVehicleTypes = async(req:Request, res: Response): Promise<any> =>{
  return res.status(200).json({ vehicleTypes: VehicleTypes })
}
