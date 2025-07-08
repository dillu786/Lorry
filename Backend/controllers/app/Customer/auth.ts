import type { Request,Response } from "express"
import { PrismaClient } from "@prisma/client"
import {z} from "zod"
import { nameSchema, phoneSchema } from "../../../types/signupTypes";
import express from "express";
import { responseObj } from "../../../utils/response";
import  jwt from "jsonwebtoken";
import { otpSchema, verifyOtpSchema } from "../../../types/Common/types";
import bcrypt from "bcrypt";
import { signupSchema } from "../../../types/signupTypes";
import {  signInSechema } from "../../../types/signInTypes";
import generateOTP from "../../../utils/generateOtp";
import axios from "axios";
const app = express();
app.use(express.json());
const prisma = new PrismaClient();

const createAccountSchema = z.object({
    Name: nameSchema,
    MobileNumber: phoneSchema,
    Gender: z.enum(["MALE","FEMALE"])
})

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
    
    const owner = await prisma.user.create({
      data:{
        Name: parsedBody.data.name as string,
        MobileNumber: parsedBody.data.mobileNumber,
        //DOB:parsedBody.data.dob ,
        Password: encryptedPassword,
        //AdhaarCardNumber : parsedBody.data.aadharCardNo as unknown as string,
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

export const signIn = async (req:Request, res:Response):Promise<any>=>{
  try{
    
    const parsedBody =  signInSechema.safeParse(req.body);
    if(!parsedBody.success){
      res.status(411).json({
        message: "Incorrect input"
      });
    }
  
    const user = await prisma.user.findFirst({
      where:{
        MobileNumber: parsedBody.data?.mobileNumber
      }
    });
  
    if(!user){
      return res.status(401).json({
        message : "Incorrect credentials"
      })
    }
  
   
    const decoded = await bcrypt.compare(parsedBody.data?.password as string, user.Password as string);
    if(decoded){
      const token = jwt.sign(user,process.env.JWT_SECRET_CUSTOMER as string)
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

export const createAccount = async (req:Request, res:Response):Promise<any>=>{
    try{

        const parsedBody = createAccountSchema.safeParse(req.body);
        
        if(!parsedBody.success){
            res.status(411).json(responseObj(false,null,"Incorrect input",parsedBody.error as any))
        }
        
        const userExist = await prisma.user.findFirst({
          where:{
            MobileNumber: parsedBody.data?.MobileNumber
          }
        });
        if(userExist){
          return res.status(411).json(responseObj(false,"Mobile Number already registered",parsedBody.error as any))
        }
        const user =await prisma.user.create({
            data:{
                Name: parsedBody.data?.Name as string,
                MobileNumber: parsedBody.data?.MobileNumber as string,
                Gender: parsedBody.data?.Gender as any,
                //Password: await bcrypt.hash(parsedBody.data?.Password as string,2)
            }
        })
        
        res.status(200).json(responseObj(true,null,"User successfully created"));
    }

    catch(error){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }

    
}
export const sendOtp = async (req: Request, res: Response): Promise<any> => {
  // Validate the request body using your schema
  const parsedBody = otpSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(411).json({
      message: "Incorrect Input"+parsedBody.error.message
    });
  }
  const otp =   generateOTP();
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

export const verifyOTP = async (req:Request, res:Response):Promise<any> => {
  const { otp, mobile_number } = req.body;
  try
  {
    const parsedBody = verifyOtpSchema.safeParse(req.body);
    if (!parsedBody.success){
  
      return res.status(411).json({
        message : "Invalid Body"+parsedBody.error.message
      })
    } 
    const savedOtp = await  prisma.otp.findFirst({
      where:{
        MobileNumber: parsedBody.data.MobileNumber
      },
      orderBy: {
        CreatedAt:'desc'
      }
    })
  
    if(!savedOtp){
      return res.status(411).json({
        message : "Incorrect body"
      })
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

      return res.status(411).json({
        message : "Entered Wrong OTP"
      })
    }

   
   
  }
  catch(Exception:any){
    return res.status(500).json({
      message : "Something went wrong"+Exception.message
    })

  }
    
};

export const verifyOtpOnSignIn = async (req:Request, res:Response):Promise<any> => {
  const { otp, mobile_number } = req.body;

  try
  {
    const parsedBody = verifyOtpSchema.safeParse(req.body);
    if (!parsedBody.success){
  
      return res.status(411).json({
        message : "Invalid Body"+parsedBody.error.message
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
     const user = await prisma.user.findFirst({
        where:{
          MobileNumber: parsedBody.data.MobileNumber
        }
      })
  
      if(!user){       
        return res.status(400).json({
          message : "user not founnd"
        })
  
      }
      await prisma.otp.delete({
        where:{
          MobileNumber:parsedBody.data.MobileNumber
        }
      })

      const accesstoken = jwt.sign({
        user
      },process.env.JWT_SECRET_CUSTOMER as unknown as string)

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
      message : "Something went wrong"+Exception.message
    })

  }
    
};
