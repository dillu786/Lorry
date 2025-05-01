// src/controllers/app/auth/signupController.ts
import type { NextFunction, Request, Response } from 'express';
import express from "express";
import { date, unknown, z } from 'zod';
import { marked } from 'marked';
import { PrismaClient } from '@prisma/client';
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
      res.status(411).json({
        message: "Incorrect input"
      });
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
      return  res.status(411).json({
        message: "Incorrect Input"+parsedBody.error
      })
    }
  
    const userData = await prisma.user.findFirst({
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
    
    const user = await prisma.owner.create({
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
    const token = jwt.sign(user,process.env.JWT_SECRET_OWNER as string);
  
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
  
  // If the body is invalid, return a 411 error
  if (!parsedBody.success) {
    return res.status(411).json({
      message: "Incorrect Input"
    });
  }

  // Generate a one-time password (OTP)
  const verificationToken = generateOTP();

  // Email content for the OTP message
  const content = `
    Hello,
    Thank you for signing in. To verify your mobile number, please use the following OTP code:
    
    OTP: **${verificationToken}**

    If you did not request this verification, please ignore this message.

    Thank you,  
    Your App Team
  `;

  // Convert the message content to markdown (if needed)
  const markedDownContent = marked(content);

  // Prepare the message data to send via SMS (msg91 API)
  const data = JSON.stringify({
    templateId: "671b7af8d6fc05545e7f4d52", // Your template ID
    short_url: "0", // Adjust according to your API documentation
    route: 4, // Adjust according to your API documentation
    sender: "VIBELS", // Sender name
    mobiles: `91${parsedBody.data.MobileNumber}`, // Mobile number with country code
    variables: {
      var1: verificationToken, // OTP variable
    },
  });

  // OTP data to save in the database
  const otpData = {
    mobileNumber: parsedBody.data.MobileNumber , // OTP mobile number
    Otp: verificationToken , // OTP code
    //expiresAt: new Date(Date.now() + 5 * 60 * 1000) // Expiry time set to 5 minutes from now
  };

  try {
    // Save OTP to the database
    await prisma.otp.create({
      //@ts-ignore
      data: otpData,
    });

    // Send OTP via msg91 API
    const config = {
      method: 'post',
      url: 'https://control.msg91.com/api/v5/sms/sendSms', // Msg91 API endpoint
      headers: {
        authKey: '433247AmIdZ5My671b8140P1', // Your Msg91 auth key
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: data,
    };

    // Make the request to send the SMS
    const msgReq = await axios.request(config);
    const msgResp = msgReq.data; // The response from msg91
    console.log(JSON.stringify(msgResp));
    // Check if the response is successful and return a response
    if (msgResp.type) {
      return res.status(200).json({
        message: "OTP sent successfully",
        otp: verificationToken, // You might want to remove this in production for security reasons
      });
    } else {
      // If message sending failed
      return res.status(500).json({
        message: "Failed to send OTP",
        error: msgResp.message,
      });
    }
  } catch (error:any) {
    console.error("Error while sending OTP:", error);
    return res.status(500).json({
      message: "An error occurred while sending the OTP.",
      error: error.message,
    });
  }
};

export const uploadDocument = async (req:Request, res:Response):Promise<any>=>{

  try{
    console.log("control reached 248");
    const parsedBody = uploadDocSchema.safeParse(req.body);
    if(!parsedBody.success){
     return  res.status(411).json({
       message: "Incorrect Input"
     })
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
    return res.status(411).json({
      message: "Aadhar Card Number and Pan Number already Exist"
    });

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
           BackSideAdhaarImage: aadharFrontName,
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

export const signup = async (req:Request, res:Response):Promise<any> =>{
  const parsedBody = signupSchema.safeParse(req.body)
}
export const verifyOTP = async (req:Request, res:Response):Promise<any> => {
  const { otp, mobile_number } = req.body;

  try
  {
    const parsedBody = verifyOtpSchema.safeParse(req.body);
    if (!parsedBody.success){
  
      return res.status(411).json({
        message : "Invalid Body"
      })
    }
  
  
    const savedOtp = await  prisma.otp.findFirst({
      where:{
        MobileNumber: parsedBody.data.MobileNumber
      }
    })
  
    if(!savedOtp){
      return res.status(411).json({
        message : "Incorrect body"
      })
    }
  
    if(savedOtp?.Otp === parsedBody.data.Otp){
     const user = await prisma.otp.findFirst({
        where:{
          MobileNumber: parsedBody.data.MobileNumber
        }
      })
  
      if(!user){
         
        return res.status(400).json({
          message : "user not founnd"
        })
  
      }
  
      await prisma.owner.update({
        where:{
          MobileNumber: parsedBody.data.MobileNumber
        },
        data:{
          LastLoggedIn: new Date()
        }
      })
  
      await prisma.otp.delete({
        where:{
          MobileNumber:parsedBody.data.MobileNumber
        }
      })

      const accesstoken = jwt.sign({
        user
      },process.env.JWT_SECRET as unknown as string)

      return res.status(200).json({
        message:"Successfully loggedIn",
        accessToken: accesstoken
      })
    }

    else{

      return res.status(411).json({
        message : "Entered Wrong OTP"
      })
    }

   
   
  }
  catch(Exception:any){
    return res.status(500).json({
      message : "Something went wrong"
    })

  }
    
};


export const resetPassword = async (req:Request, res: Response): Promise<any>=> {

  try{
    const parsedBody = resetPasswordSchema.safeParse(req.body);
    if(!parsedBody.success){
      return res.status(411).json({
        message : "Incorrect Input"
      });
    }
    const owner = await prisma.owner.findFirst({
      where:{
        MobileNumber :req.user.MobileNumber
      }
    });
  
    if(owner){
       await prisma.owner.update({
        where:{
          MobileNumber:req.user.MobileNumber
        },
        data:{
          Password : await bcrypt.hash(parsedBody.data.password,2) 
        }
       })
       res.status(200).json(responseObj(true,null,"Password has been successfully reset"));
    }
  }

  catch(error: any){
    res.status(500).json(responseObj(false,null,"Something went wrong"));
  }


}
// Declaring the handleSignup function as a const
// export const register = async (req: Request, res: Response): Promise<any> => {
//   const { name, phoneNumber } = req.body;

//   try {
//     // Validate the incoming data with Zod
//     const parsedBody = signupSchema.safeParse(req.body);
//     if(!parsedBody.success){
//       return res.status(411).json({
//         message: "Incorrect Input"
//       });
//     }
//     //@ts-ignore
//    if(req.user.mobileNumber!= parsedBody.data.phoneNumber){
//     return res.status(411).json({
//       message:"Use the same mobile number which was used to receive Opt"
//     })
//    }
//    const user =await prisma.owner.create({
//       data:{
//         Name: parsedBody.data.name as string,
//         MobileNumber: parsedBody.data.mobileNumber,
//         DOB:parsedBody.data.Dob ,
//         AdhaarCardNumber : parsedBody.data.aadharCardNo as unknown as string,
//         LastLoggedIn: Date.now() as unknown as string
//       }
//     })

//     // If validation passes, respond with a success message
//     res.status(200).json({ user: user, message: "Signup successful!" });
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       // If validation fails, return the error details
//       return res.status(400).json({
//         message: "Validation failed",
//         errors: error.errors,
//       });
//     }
//     // Handle other types of errors
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


