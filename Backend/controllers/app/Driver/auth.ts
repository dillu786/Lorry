import type{Request,Response} from "express"
import { resetPasswordSchema } from "../../../types/resetPasswordType";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"
import { responseObj } from "../../../utils/response";
import { signInSechema } from "../../../types/signInTypes";
import jwt from "jsonwebtoken";


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
       res.status(200).json(responseObj(true,null,"Password has been successfully reset"));
    }
  }

  catch(error: any){
    res.status(500).json(responseObj(false,null,"Something went wrong"+error,error));
  }


}