import type{Request,Response} from "express"
import { resetPasswordSchema } from "../../../types/resetPasswordType";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"
import { responseObj } from "../../../utils/response";
import { signInSechema } from "../../../types/signInTypes";
import jwt from "jsonwebtoken";
import { otpSchema, verifyOtpSchema } from "../../../types/Common/types";
import generateOTP from "../../../utils/generateOtp";
import axios from "axios";


const prisma = new PrismaClient();
export const signIn = async (req:Request, res: Response): Promise<any> =>{
  try{

    const parsedBody = signInSechema.safeParse(req.body);
    if(!parsedBody.success){
      res.status(411).json(responseObj(false,null,"Incorrect input",parsedBody.error as any))
    }

    const driver = await prisma.driver.findFirst({
      where:{
        MobileNumber: parsedBody.data?.mobileNumber
      }
    })

    if(!driver){
      return res.status(411).json(responseObj(false,null,"Mobile number does not exist"));
    }

    const passwordMatched = await bcrypt.compare(parsedBody.data?.password as string ,driver.Password as string);
    if (passwordMatched){
        const token = jwt.sign(driver,process.env.JWT_SECRET_DRIVER as string);

        return res.status(200).json(responseObj(true,token,"Successfully Logged In"));

    }
    return res.status(401).json(responseObj(false,null,"Incorrect Credentials"));

  }
  catch(error:any){
    res.status(500).json(responseObj(false,null,"Something went wrong"+error));

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

export const resetPassword = async (req:Request, res: Response): Promise<any>=> {

  try{
    const parsedBody = resetPasswordSchema.safeParse(req.body);
    if(!parsedBody.success){
      return res.status(411).json({
        message : "Incorrect Input"
      });
    }
    const driver = await prisma.driver.findFirst({
      where:{
        MobileNumber :req.user.MobileNumber
      }
    });
  
    if(driver){
       await prisma.driver.update({
        where:{
          MobileNumber:req.user.MobileNumber
        },
        data:{
          Password : await bcrypt.hash(parsedBody.data.password,2) 
        }
       })
       return res.status(200).json(responseObj(true,null,"Password has been successfully reset"));
    }
    else{
      return res.status(400).json({
        message: "Driver not found"
      })
    }
  }

  catch(error: any){
    return res.status(500).json(responseObj(false,null,"Something went wrong"+error,error));
  }


}