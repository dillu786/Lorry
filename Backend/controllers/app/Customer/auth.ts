import type { Request,Response } from "express"
import { PrismaClient } from "@prisma/client"
import {z} from "zod"
import { nameSchema, phoneSchema } from "../../../types/signupTypes";
import express from "express";
import { responseObj } from "../../../utils/response";
import  jwt from "jsonwebtoken";
import { verifyOtpSchema } from "../../../types/Common/types";
const app = express();
app.use(express.json());
const prisma = new PrismaClient();

const createAccountSchema = z.object({
    Name: nameSchema,
    MobileNumber: phoneSchema,
    Gender: z.enum(["MALE","FEMALE"])
})
export const createAccount = async (req:Request, res:Response):Promise<any>=>{

    try{

        const parsedBody = createAccountSchema.safeParse(req.body);
        
        if(!parsedBody.success){
            res.status(411).json(responseObj(false,null,"Incorrect input",parsedBody.error as any))
        }
        
        const user =await prisma.user.create({
            data:{
                Name: parsedBody.data?.Name as string,
                MobileNumber: parsedBody.data?.MobileNumber as string,
                Gender: parsedBody.data?.Gender as any
            }
        })
        
        res.status(200).json(responseObj(true,null,"User successfully created"));
    }

    catch(error){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }

    
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
      message : "Something went wrong"
    })

  }
    
};