import type{Request,Response} from "express"
import { resetPasswordSchema } from "../../../types/resetPasswordType";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"
import { responseObj } from "../../../utils/response";

const prisma = new PrismaClient();

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
        MobileNumber :parsedBody.data.MobileNumber
      }
    });
  
    if(driver){
       await prisma.driver.update({
        where:{
          MobileNumber:parsedBody.data.MobileNumber
        },
        data:{
          Password : await bcrypt.hash(parsedBody.data.Password,2) 
        }
       })
       res.status(200).json(responseObj(true,null,"Password has been successfully reset"));
    }
  }

  catch(error: any){
    res.status(500).json(responseObj(false,null,"Something went wrong"));
  }


}