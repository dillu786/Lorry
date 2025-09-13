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
      return res.status(400).json(responseObj(false,null,"Invalid input data",parsedBody.error.errors.map(error => error.message) as any))
    }

    const driver = await prisma.driver.findFirst({
      where:{
        MobileNumber: parsedBody.data?.mobileNumber
      }
    })
    if(driver?.IsActive === false){
      return res.status(403).json(responseObj(false,null,"Driver is not active"));
    }

    if(!driver){
      return res.status(404).json(responseObj(false,null,"Mobile number does not exist"));
    }

    // Check if all documents are verified
    if (!driver.IsDLFrontImageVerified || 
        !driver.IsDLBackImageVerified || 
        !driver.IsFSAdhaarImgVerified || 
        !driver.IsBSAdhaarImgVerified || 
        !driver.IsPanImgVerified) {
      return res.status(403).json(responseObj(false, null, "Login failed: All documents must be verified before login"));
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
    return res.status(400).json(responseObj(false, null, "Invalid input data", parsedBody.error.errors.map(error => error.message) as any));
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
     const user = await prisma.driver.findFirst({
        where:{
          MobileNumber: parsedBody.data.MobileNumber
        }
      })
  
      if(!user){       
        return res.status(400).json({
          message : "Driver not founnd"
        })
  
      }

      // Check if all documents are verified
      if (!user.IsDLFrontImageVerified || 
          !user.IsDLBackImageVerified || 
          !user.IsFSAdhaarImgVerified || 
          !user.IsBSAdhaarImgVerified || 
          !user.IsPanImgVerified) {
        return res.status(403).json({
          message: "Login failed: All documents must be verified before login"
        });
      }

      await prisma.otp.delete({
        where:{
          MobileNumber:parsedBody.data.MobileNumber
        }
      })

      const accesstoken = jwt.sign({
        user
      },process.env.JWT_SECRET_DRIVER as unknown as string)

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
    const driver = await prisma.driver.findFirst({
      where:{
        MobileNumber :req.user.user.MobileNumber
      }
    });
  
    if(driver){
       await prisma.driver.update({
        where:{
          MobileNumber:req.user.user.MobileNumber
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

// Get driver document verification status
export const getDocumentVerificationStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const driverId = req.user?.user?.Id;
    
    if (!driverId) {
      return res.status(400).json(responseObj(false, null, "Driver ID is required"));
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
      return res.status(404).json(responseObj(false, null, "Driver not found"));
    }

    const verificationStatus = {
      drivingLicenseFront: driver.IsDLFrontImageVerified,
      drivingLicenseBack: driver.IsDLBackImageVerified,
      frontSideAdhaar: driver.IsFSAdhaarImgVerified,
      backSideAdhaar: driver.IsBSAdhaarImgVerified,
      panImage: driver.IsPanImgVerified,
      allVerified: driver.IsDLFrontImageVerified && 
                   driver.IsDLBackImageVerified && 
                   driver.IsFSAdhaarImgVerified && 
                   driver.IsBSAdhaarImgVerified && 
                   driver.IsPanImgVerified
    };

    return res.status(200).json(responseObj(true, verificationStatus, "Document verification status retrieved successfully"));
  } catch (error: any) {
    return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
  }
}

export const deleteAccount = async (req: Request, res: Response): Promise<any> => {
  try {
    const { deletionReason } = req.body;

    if (!deletionReason) {
      return res.status(400).json(responseObj(false, null, "Deletion reason is required"));
    }

    //@ts-ignore
    const authPayload = req.user || {};
    const driverId: number | undefined = authPayload?.Id || authPayload?.user?.Id;
    const driverMobile: string | undefined = authPayload?.MobileNumber || authPayload?.user?.MobileNumber;

    if (!driverId) {
      return res.status(400).json(responseObj(false, null, "Unable to determine driver from token"));
    }

    const driver = await prisma.driver.findUnique({ where: { Id: driverId } });

    if (!driver) {
      return res.status(404).json(responseObj(false, null, "Driver not found"));
    }

    await prisma.$transaction(async (tx) => {
      // Store deletion audit record
      await tx.accountDeletionAudit.create({
        data: {
          userType: "DRIVER",
          userId: driver.Id,
          mobileNumber: driver.MobileNumber,
          deletionReason: deletionReason,
          deletedBy: "SYSTEM" // You can modify this to capture admin info if needed
        }
      });

      const driverBookings = await tx.bookings.findMany({
        where: { DriverId: driver.Id },
        select: { Id: true }
      });
      const bookingIds = driverBookings.map((b) => b.Id);
      if (bookingIds.length > 0) {
        await tx.fareNegotiation.deleteMany({ where: { BookingId: { in: bookingIds } } });
      }

      await tx.bookings.updateMany({ where: { DriverId: driver.Id }, data: { DriverId: null } });
      await tx.driverVehicle.deleteMany({ where: { DriverId: driver.Id } });
      await tx.ownerDriver.deleteMany({ where: { DriverId: driver.Id } });
      await tx.driverWallet.deleteMany({ where: { DriverId: driver.Id } });
      await tx.otp.deleteMany({ where: { MobileNumber: driver.MobileNumber } });
      await tx.driver.delete({ where: { Id: driver.Id } });
    });

    return res.status(200).json(responseObj(true, null, "Driver account and related data deleted"));
  } catch (error: any) {
    return res.status(500).json(responseObj(false, null, "Something went wrong" + error));
  }
}