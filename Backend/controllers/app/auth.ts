// src/controllers/app/auth/signupController.ts
import type { Request, Response } from 'express';
import { date, unknown, z } from 'zod';
import { marked } from 'marked';
import { PrismaClient } from '@prisma/client';
import generateOTP from "../../utils/generateOtp";
import axios from 'axios';
const prisma = new PrismaClient();
// Zod validation schemas for name and phone number
const nameSchema = z.string().min(1, "Name is required").regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces");

const phoneSchema = z.string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be valid (e.g., +1234567890)");

const signupSchema = z.object({
  name: nameSchema,
  phoneNumber: phoneSchema,
});

const otpSchema = z.object({
  MobileNumber : phoneSchema
})

const verifyOtpSchema = z.object({
  MobileNumber: phoneSchema,
  Otp: z.string()
})

const sendOtp = async (req: Request, res: Response) => {
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

export { sendOtp };


const verifyOTP = async (req:Request, res:Response) => {
  const { otp, mobile_number } = req.body;

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

    await prisma.user.update({
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
  }
  Otp.findOne({ otp: otp, mobile_number: mobile_number })
    .then((otpDoc) => {
      if (!otpDoc) {
        return res.json(responseObj(false, null, "Invalid OTP"));
      }

      User.findOne({ mobile_number: otpDoc.mobile_number })
        .then(async (user) => {
          if (!user) {
            return res.json(responseObj(false, otpDoc.mobile_number, "User not found"));
          }
          await User.updateOne({
            $set: {
              lastLoginDate: moment().format("YYYY-MM-DDTHH:mm:ss"),
            },
          });
          // Generate a new access token with user details
          
          await Otp.deleteOne({
            otp: otp,
          });
          // Return the new access token in the response
          return res.json(
            responseObj(true, { accessToken: newAccessToken, user: user }, "Successful Login")
          );
        })
        .catch((error) => {
          console.error("Error finding OTP:", error);
          return res.json(responseObj(false, null, "Internal server error"));
        });
    })
    .catch((error) => {
      console.error("Error finding user:", error);
      return res.status(500).json({ message: "Internal server error" });
    });
};
// Declaring the handleSignup function as a const
export const signup = async (req: Request, res: Response): Promise<any> => {
  const { name, phoneNumber } = req.body;

  try {
    // Validate the incoming data with Zod
    signupSchema.parse({ name, phoneNumber });

    // If validation passes, respond with a success message
    res.status(200).json({ message: "Signup successful!" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If validation fails, return the error details
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }
    // Handle other types of errors
    res.status(500).json({ message: "Internal server error" });
  }
};
