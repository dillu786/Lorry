// src/controllers/app/auth/signupController.ts
import type { NextFunction, Request, Response } from 'express';
import express from "express";
import { date, unknown, z } from 'zod';
import { marked } from 'marked';
import { Gender, PrismaClient } from '@prisma/client';
import generateOTP from "../../../utils/generateOtp";
import axios from 'axios';
import jwt from "jsonwebtoken";
import { uploadDocSchema } from '../../../types/uploadDocTypes';
import  sharp from 'sharp';
import { generateFileName, uploadFile } from '../../../utils/s3utils';
import { signupSchema } from '../../../types/signupTypes';
import { signInSechema } from '../../../types/signInTypes';
import bcrypt from "bcrypt"
import { resetPasswordSchema } from '../../../types/resetPasswordType';
import { responseObj } from '../../../utils/response';
import { registerSchema } from '../../../types/Owner/register';
import moment from 'moment';
const app =express();

app.use(express.json());

const prisma = new PrismaClient();
// Zod validation schemas for name and phone number


const phoneSchema = z.string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be valid (e.g., +1234567890)");



const otpSchema = z.object({
  MobileNumber : phoneSchema
})

const verifyOtpSchema = z.object({
  MobileNumber: phoneSchema,
  Otp: z.string()
})

const vehicleSchema = z.object({
  Model: z.string(),
  Year: z.date(),
  Category: z.string(),
  VehicleImage: z.string(),
  VehicleInsuranceImage: z.string(),
  PermitImage: z.string(),
});


export const signIn = async (req:Request, res:Response):Promise<any>=>{
  try{
    
    const parsedBody = signInSechema.safeParse(req.body);
    if(!parsedBody.success){
      return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(error => error.message) as any));
    }
  
    const owner = await prisma.owner.findFirst({
      where:{
        MobileNumber: parsedBody.data?.mobileNumber
      }
    });
  
    if(!owner){
      return res.status(401).json({
        message : "Incorrect credentials"
      })
    }
  
    console.log("owner",owner);
  
    const decoded = await bcrypt.compare(parsedBody.data?.password as string, owner.Password as string);
    if(decoded){
      const token = jwt.sign(owner,process.env.JWT_SECRET_OWNER as string)
     res.status(200).json({
      message:"Successfully loggedIn",
      token: token
     }) 
    }
    else{
      res.status(401).json({
        message: "Incorrect Credentials"
      })
    }
  }
  catch(error:any){
    res.status(500).json({
      message : "Something went wrong"+error
    })
  }
  
}
export const signUp = async (req:Request,res:Response): Promise<any>=>{

  try{
    const parsedBody = signupSchema.safeParse(req.body);
    if(!parsedBody.success){
      return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(error => error.message) as any));
    }
  
    const userData = await prisma.owner.findFirst({
      where:{
        MobileNumber:parsedBody.data.mobileNumber
      }
    });
  
    if(userData){
      return res.status(400).json({
        message: "Mobile number already exists"
      })
    }
    const encryptedPassword = await bcrypt.hash(parsedBody.data?.password as string,2);
    
    const owner = await prisma.owner.create({
      data:{
        Name: parsedBody.data.name as string,
        MobileNumber: parsedBody.data.mobileNumber,
        DOB:parsedBody.data.dob ,
        Password: encryptedPassword,
        AdhaarCardNumber : parsedBody.data.aadharCardNo as unknown as string,
        Gender:parsedBody.data.gender
     
        
  
      }
    })
  
    console.log("secret",process.env.JWT_SECRET_OWNER);
    const token = jwt.sign(owner,process.env.JWT_SECRET_OWNER as string);
  
    res.status(200).json({
      message : "User Successfully Signed Up",
      token: token
    })
  }

  catch(error:any){
   res.status(500).json({
    message: "Something went wrong"+error
   })
  }
  
}


export const sendOtp = async (req: Request, res: Response): Promise<any> => {
  // Validate the request body using your schema
  const parsedBody = otpSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(a=>a.message)as any));
  }
  const otp = generateOTP();
  const otpExists = await prisma.otp.findFirst({
    where:{
      MobileNumber: parsedBody.data.MobileNumber
    }
  });
  if(otpExists){
    await prisma.otp.delete({
      where:{
        MobileNumber: parsedBody.data.MobileNumber
      }
    })
  }
  await prisma.otp.create({
    data:{
      MobileNumber: parsedBody.data.MobileNumber,
      Otp: otp
    }
  }).then(()=>{
    console.log("OTP sent successfully");
  }).catch((error:any)=>{
    console.log("Error sending OTP",error);
  })  
  
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "dlt",
        sender_id: "RELRDR",        // Replace with your actual DLT sender ID
        message: "189050",          // Replace with your DLT template ID
        variables_values: otp,
        flash: 0,
        numbers: parsedBody.data.MobileNumber
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY || "",
          "Content-Type": "application/json"
        }
      }
    );

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    console.error("Fast2SMS Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.response?.data || error.message
    });
  }
  
};

export const uploadDocument = async (req:Request, res:Response):Promise<any>=>{

  try{
    console.log("control reached 248");
    const parsedBody = uploadDocSchema.safeParse(req.body);
    if(!parsedBody.success){
     return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(a=>a.message) as any));
    }
   console.log("control reached here");
   const ownerExist = await prisma.owner.findMany({
    where:{
      OR:[
        {AdhaarCardNumber: parsedBody.data.AadharNumber},
        {PanNumber: parsedBody.data.PanNumber}

      ]
  
    }
   });
   console.log("ownerExist",ownerExist);
   if( ownerExist.length>0){
    return res.status(409).json(responseObj(false, null, "Aadhar Card Number or Pan Number already exists"));

   }
    //@ts-ignore
    if (!req.files || !req.files['FrontAadhar'] || !req.files['BackAadhar'] || !req.files['Pan']) {
     return res.status(400).json({ error: 'Missing required image files' });
   }
        // @ts-ignore
        const adharFrontBuffer = await sharp(req.files['FrontAadhar'][0].buffer)
        .resize({ height: 1920, width: 1080, fit: "contain" })
        .toBuffer();
        //@ts-ignore
        const aadharBackBuffer = await sharp(req.files['BackAadhar'][0].buffer)
        .resize({ height: 1920, width: 1080, fit: "contain" })
        .toBuffer();
        //@ts-ignore
        const panBuffer = await sharp(req.files['Pan'][0].buffer)
        .resize({ height: 1920, width: 1080, fit: "contain" })
        .toBuffer();
   
        const aadharFrontName= generateFileName();
        const aadharBackName = generateFileName();
        const panName = generateFileName();
        //@ts-ignore
        await uploadFile(adharFrontBuffer,aadharFrontName,req.files['FrontAadhar'][0].mimetype);
        //@ts-ignore
        await uploadFile(aadharBackBuffer,aadharBackName,req.files['BackAadhar'][0].mimetype);
        //@ts-ignore
        await uploadFile(panBuffer,panName,req.files['Pan'][0].mimetype);
   
        await prisma.owner.update({
         where:{
           //@ts-ignore
           MobileNumber: req.user.MobileNumber
         },
         data:{
           AdhaarCardNumber: parsedBody.data.AadharNumber as string,
           BackSideAdhaarImage: aadharBackName,
           FrontSideAdhaarImage: aadharFrontName,
           PanImage: panName,
           PanNumber: parsedBody.data.PanNumber
         }
        })
   res.status(200).json({
    message: "Document Successfully uploaded"
   })
        
  }

  catch(error: any){

    res.status(500).json({
      message: "Something went wrong"+error
      
    });

  }    
 
}

export const verifyOTP = async (req:Request, res:Response):Promise<any> => {
  const { otp, mobile_number } = req.body;
  try
  {
    const parsedBody = verifyOtpSchema.safeParse(req.body);
    if (!parsedBody.success){
  
      return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(error => error.message) as any));
    } 
    const savedOtp = await  prisma.otp.findFirst({
      where:{
        MobileNumber: parsedBody.data.MobileNumber
      }
    })
  
    if(!savedOtp){
      return res.status(404).json(responseObj(false, null, "OTP not found or expired"));
    }
    if(savedOtp?.Otp === parsedBody.data.Otp){
      await prisma.otp.delete({
        where:{
          MobileNumber:parsedBody.data.MobileNumber
        }
      })
      return res.status(200).json({
        message:"Otp verified successfully"
      })
    }

    else{

      return res.status(401).json(responseObj(false, null, "Invalid OTP"));
    }

   
   
  }
  catch(Exception:any){
    return res.status(500).json({
      message : "Something went wrong"+Exception.message
    })

  }
    
};

export const verifyOtpOnPasswordReset = async (req:Request, res:Response):Promise<any> => {
  const { otp, mobile_number } = req.body;

  try
  {
    const parsedBody = verifyOtpSchema.safeParse(req.body);
    if (!parsedBody.success){
  
      return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(error => error.message) as any));
    }
  
    const savedOtp = await  prisma.otp.findFirst({
      where:{
        MobileNumber: parsedBody.data.MobileNumber
      }
    })
  
    if(!savedOtp){
      return res.status(404).json(responseObj(false, null, "OTP not found or expired"));
    }
  
    if(savedOtp?.Otp === parsedBody.data.Otp){
     const user = await prisma.owner.findFirst({
        where:{
          MobileNumber: parsedBody.data.MobileNumber
        }
      })
  
      if(!user){       
        return res.status(400).json({
          message : "Owner not found"
        })
  
      }
      await prisma.otp.delete({
        where:{
          MobileNumber:parsedBody.data.MobileNumber
        }
      })

      const accesstoken = jwt.sign({
        user
      },process.env.JWT_SECRET_OWNER as unknown as string)

      return res.status(200).json({
        message:"Successfully loggedIn",
        accessToken: accesstoken
      })
    }
    else{
      return res.status(401).json(responseObj(false, null, "Invalid OTP"));
    }
      
  }
  catch(Exception:any){
    return res.status(500).json({
      message : "Something went wrong"+Exception.message
    })

  }
    
};

export const resetPassword = async (req:Request, res: Response): Promise<any>=> {

  try{
    const parsedBody = resetPasswordSchema.safeParse(req.body);
    if(!parsedBody.success){
      return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(error => error.message) as any));
    }
    const owner = await prisma.owner.findFirst({
      where:{
        MobileNumber: req.user.user.MobileNumber
      }
    });

    console.log(`owner ${JSON.stringify(owner)}`);
    if(owner){
       await prisma.owner.update({  
        where:{
          MobileNumber: req.user.user.MobileNumber
        },
        data:{
          Password : await bcrypt.hash(parsedBody.data.password,2) 
        }
       })
       return res.status(200).json(responseObj(true,null,"Password has been successfully reset"));
    }
    else{
      return res.status(400).json(responseObj(false,null, "Owner not found"));
    }

  }

  catch(error: any){
    return res.status(500).json(responseObj(false,null,"Something went wrong"+error));
  }


}
// Declaring the handleSignup function as a const
export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    // Validate the incoming data with Zod
    console.log(req.file);
    const parsedBody = registerSchema.safeParse(req.body);
    if(!parsedBody.success){
      return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(error => error.message) as any));
    }
    //@ts-ignore
   if(req.user.mobileNumber!= parsedBody.data.phoneNumber){
    return res.status(400).json(responseObj(false, null, "Mobile number mismatch with OTP verification"));
   }
   //@ts-ignore
   if(!req.file){
    return res.status(400).json({
      message: "Owner Image is required"
    });

  

   }
  //@ts-ignore
   const ownerImage = req.file

   const ownerImageName =  generateFileName();

   await uploadFile(ownerImage.buffer,ownerImageName,ownerImage.mimetype);

   const owner =await prisma.owner.update({
     where:{
      MobileNumber: req.user.MobileNumber

     },
     data:{
      Name: parsedBody.data.Name,
      DOB: moment(parsedBody.data.Dob, "DD-MM-YYYY").toDate(),
      Email: parsedBody.data.Email,
      Gender: parsedBody.data.Gender,
      OwnerImage: ownerImageName ,
      AdhaarCardNumber: parsedBody.data.AdhaarCardNumber
     }
    });

    // If validation passes, respond with a success message
    res.status(200).json({  message: "registered successfully" });
  } catch (error) {
    
      // If validation fails, return the error details
      return res.status(500).json({
        message: "Something went wrong"+error,
        
      });
    
    // Handle other types of errors

  }
};


export const deleteAccount = async (req: Request, res: Response): Promise<any> => {
  try {
    const { deletionReason } = req.body;

    if (!deletionReason) {
      return res.status(400).json(responseObj(false, null, "Deletion reason is required"));
    }

    //@ts-ignore
    const authPayload = req.user || {};
    const ownerId: number | undefined = authPayload?.Id || authPayload?.user?.Id;
    const ownerMobile: string | undefined = authPayload?.MobileNumber || authPayload?.user?.MobileNumber;

    if (!ownerId) {
      return res.status(400).json(responseObj(false, null, "Unable to determine owner from token"));
    }

    const owner = await prisma.owner.findUnique({ where: { Id: ownerId } });

    if (!owner) {
      return res.status(404).json(responseObj(false, null, "Owner not found"));
    }

    await prisma.$transaction(async (tx) => {
      // Store deletion audit record
      await tx.accountDeletionAudit.create({
        data: {
          userType: "OWNER",
          userId: owner.Id,
          mobileNumber: owner.MobileNumber,
          deletionReason: deletionReason,
          deletedBy: "SYSTEM" // You can modify this to capture admin info if needed
        }
      });

      // Remove negotiations for this owner
      await tx.fareNegotiation.deleteMany({ where: { OwnerId: owner.Id } });

      // Find vehicles owned by this owner
      const ownerVehicles = await tx.ownerVehicle.findMany({
        where: { OwnerId: owner.Id },
        select: { VehicleId: true }
      });
      const vehicleIds = ownerVehicles.map((ov) => ov.VehicleId);

      if (vehicleIds.length > 0) {
        // Clear bookings referencing these vehicles
        await tx.bookings.updateMany({ where: { VehicleId: { in: vehicleIds } }, data: { VehicleId: null, DriverId: null } });
        // Remove driver assignments to these vehicles
        await tx.driverVehicle.deleteMany({ where: { VehicleId: { in: vehicleIds } } });
        // Remove owner-vehicle links
        await tx.ownerVehicle.deleteMany({ where: { VehicleId: { in: vehicleIds } } });
        // Finally delete vehicles themselves
        await tx.vehicle.deleteMany({ where: { Id: { in: vehicleIds } } });
      }

      // Remove owner-driver links
      await tx.ownerDriver.deleteMany({ where: { OwnerId: owner.Id } });

      // Remove wallet
      await tx.ownerWallet.deleteMany({ where: { OwnerId: owner.Id } });

      // Remove OTPs
      await tx.otp.deleteMany({ where: { MobileNumber: owner.MobileNumber } });

      // Delete owner
      await tx.owner.delete({ where: { Id: owner.Id } });
    });

    return res.status(200).json(responseObj(true, null, "Owner account and related data deleted"));
  } catch (error: any) {
    return res.status(500).json(responseObj(false, null, "Something went wrong" + error));
  }
}
